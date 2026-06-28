import { task, metadata } from "@trigger.dev/sdk";
import { z } from "zod";
import OpenAI from "openai";
import { setAiPresence, patchStorage } from "@/lib/liveblocks-agent";
import { AiChatMessageSchema } from "@/types/tasks";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";

// Zod schemas for input validation
const NodePositionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

const NodeDataSchema = z.object({
  label: z.string(),
  color: z.string().optional(),
  shape: z.string().optional(),
}).passthrough();

const NodeSchema = z.object({
  id: z.string(),
  type: z.string().optional(),
  position: NodePositionSchema,
  data: NodeDataSchema,
  width: z.number().optional(),
  height: z.number().optional(),
}).passthrough();

const EdgeDataSchema = z.object({
  label: z.string().optional(),
}).passthrough();

const EdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  type: z.string().optional(),
  data: EdgeDataSchema.optional(),
}).passthrough();

export const GenerateSpecPayloadSchema = z.object({
  projectId: z.string(),
  roomId: z.string(),
  chatHistory: z.array(AiChatMessageSchema),
  nodes: z.array(NodeSchema),
  edges: z.array(EdgeSchema),
});

export type GenerateSpecPayload = z.infer<typeof GenerateSpecPayloadSchema>;

// Shared Status Feed Helper
async function addStatusMessage(roomId: string, status: string, text?: string) {
  const msgId = typeof crypto?.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

  const message = {
    id: msgId,
    status,
    text,
    timestamp: Date.now(),
  };

  try {
    await patchStorage(roomId, [
      {
        op: "add",
        path: "/ai-status-feed/-",
        value: message,
      },
    ]);
  } catch (error) {
    console.error("Failed to add status message to Liveblocks feed:", error);
  }
}

export const generateSpec = task({
  id: "generate-spec",
  maxDuration: 300, // 5 minutes
  run: async (payload: GenerateSpecPayload) => {
    const { projectId, roomId, chatHistory, nodes, edges } = GenerateSpecPayloadSchema.parse(payload);

    try {
      // 1. Set starting presence and status
      await setAiPresence(roomId, { cursor: null, thinking: true }, 60);
      metadata.set("status", "starting");
      await addStatusMessage(roomId, "starting", "Starting spec generation…");

      // 2. Set generating status
      metadata.set("status", "generating-spec");
      await addStatusMessage(roomId, "generating-spec", "Generating technical specification with AI…");

      // 3. Prepare AI model — use raw OpenAI SDK pointed at NVIDIA NIM endpoint
      const openai = new OpenAI({
        apiKey: process.env.NVIDIA_API_KEY,
        baseURL: "https://integrate.api.nvidia.com/v1",
        timeout: 4 * 60 * 1000, // 4-minute timeout for NVIDIA API
      });

      // Construct a clean, structured representation of the architecture graph
      const nodesSummary = nodes.map(n => {
        return `- Component ID: ${n.id}
  Label: ${n.data.label}
  Type/Shape: ${n.data.shape || "rectangle"}
  Color: ${n.data.color || "neutral"}`;
      }).join("\n");

      const edgesSummary = edges.map(e => {
        return `- Connection: ${e.source} -> ${e.target}${e.data?.label ? ` (Label: ${e.data.label})` : ""}`;
      }).join("\n");

      const messagesSummary = chatHistory.map(m => `[${m.role === "user" ? "User" : "AI"}]: ${m.content}`).join("\n");

      const systemPrompt = `You are an expert system architect and technical writer.
Your goal is to generate a comprehensive, highly professional Markdown technical specification for the architecture design presented to you.

You are given:
1. Active components (nodes) in the architecture.
2. Connections (edges) between these components.
3. The conversation history showing the design discussions and requirements.

Generate a structured Markdown document including:
- **Title**: A professional project specification title based on the context.
- **Executive Summary / Overview**: What this system does, its purpose, and high-level goals.
- **Architecture Diagram Breakdown**: Walk through each component (node) and connection (edge), explaining their purpose, integration, and role in the system.
- **API & Interface Design**: Details of communication protocols, APIs, message payloads, or endpoints where applicable.
- **Database / Storage Schema**: Outline of the database structure, tables/collections, and data models based on the cylinder/database nodes.
- **Security & Reliability Considerations**: Security mechanisms (authentication, encryption, roles) and system reliability/scalability patterns.

Be thorough, precise, and professional. Write the entire document in clean Markdown. Avoid meta-commentary (e.g. "Here is the spec..."). Start directly with the document title.`;

      const prompt = `Here is the current system architecture:

### Components (Nodes):
${nodesSummary || "No components defined yet."}

### Connections (Edges):
${edgesSummary || "No connections defined yet."}

### Conversation History / Context:
${messagesSummary || "No conversation history."}

Please generate the Markdown technical specification.`;

      // 4. Call NVIDIA NIM API with DeepSeek V4 Pro
      // Disable reasoning/thinking stream to prevent hangs and timeouts.
      const completion = await openai.chat.completions.create({
        model: "meta/llama-3.1-70b-instruct",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 8192,
        stream: false,
      });

      const text = completion.choices[0]?.message?.content;
      if (!text) {
        throw new Error("AI returned empty content");
      }

      // 5. Create ProjectSpec record in database (with placeholder filePath to generate CUID)
      const specRecord = await prisma.projectSpec.create({
        data: {
          projectId: projectId,
          filePath: "",
        },
      });

      // 6. Upload Markdown content to Vercel Blob using the specRecord id
      const blobPath = `specs/${projectId}/${specRecord.id}.md`;
      const blob = await put(blobPath, text, {
        access: "private",
        contentType: "text/markdown",
        addRandomSuffix: false,
        allowOverwrite: true,
      });

      // 7. Update ProjectSpec record with the Vercel Blob URL
      await prisma.projectSpec.update({
        where: { id: specRecord.id },
        data: { filePath: blob.url },
      });

      // 8. Set complete status
      metadata.set("status", "complete");
      await setAiPresence(roomId, { cursor: null, thinking: false }, 5);
      await addStatusMessage(roomId, "complete", "Specification generated!");

      // 9. Return generated spec content
      return {
        spec: text,
        specId: specRecord.id,
        filePath: blob.url,
      };

    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error occurred";
      metadata.set("status", "error");
      metadata.set("error", message);
      await addStatusMessage(roomId, "error", `Failed to generate specification: ${message}`);
      
      try {
        await setAiPresence(roomId, { cursor: null, thinking: false }, 5);
      } catch {
        // ignore presence cleanup errors
      }

      throw error;
    }
  }
});
