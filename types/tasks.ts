import { z } from "zod";

export interface AiStatusMessage {
  [key: string]: string | number | undefined;
  id: string;
  status: string;
  text?: string;
  timestamp: number;
}

export function validateAiStatusMessage(message: unknown): message is AiStatusMessage {
  if (!message || typeof message !== "object") return false;
  const m = message as Record<string, unknown>;
  return (
    typeof m.id === "string" &&
    typeof m.status === "string" &&
    (m.text === undefined || typeof m.text === "string") &&
    typeof m.timestamp === "number"
  );
}

export const AiChatMessageSchema = z.object({
  id: z.string(),
  sender: z.object({
    id: z.string(),
    name: z.string(),
    avatar: z.string(),
  }),
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  timestamp: z.number(),
});

export type AiChatMessage = z.infer<typeof AiChatMessageSchema>;

export function validateAiChatMessage(message: unknown): message is AiChatMessage {
  const result = AiChatMessageSchema.safeParse(message);
  return result.success;
}

