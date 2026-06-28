"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Bot, X, Send, FileText, Download, Loader2 } from "lucide-react";
import { useStorage, useOthers, useSelf, useMutation } from "@liveblocks/react/suspense";
import { ClientSideSuspense } from "@liveblocks/react";
import { LiveList } from "@liveblocks/client";
import { validateAiStatusMessage, validateAiChatMessage } from "@/types/tasks";
import type { AiStatusMessage, AiChatMessage } from "@/types/tasks";
import { useRealtimeRun } from "@trigger.dev/react-hooks";
import type { designAgentTask } from "@/trigger/design-agent";
import type { generateSpec } from "@/trigger/generate-spec";
import { SimpleMarkdown } from "./simple-markdown";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AiSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  projectId: string;
}

interface ChatMessage {
  role: "user" | "assistant" | "status";
  content: string;
}

type AgentStatus =
  | "starting"
  | "generating-design"
  | "applying-nodes"
  | "applying-edges"
  | "complete"
  | "error"
  | null;

const STARTER_CHIPS = [
  "Design an e-commerce backend",
  "Create a chat app architecture",
  "Build a CI/CD pipeline",
];

const STATUS_LABELS: Record<string, string> = {
  starting: "🔄 Starting design generation…",
  "generating-design": "🤖 Generating architecture with AI…",
  "applying-nodes": "📦 Adding nodes to canvas…",
  "applying-edges": "🔗 Connecting nodes…",
  complete: "✅ Design applied to canvas!",
  error: "❌ Something went wrong. Please try again.",
};

// ---------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------

export function AiSidebar({ isOpen, onClose, roomId, projectId }: AiSidebarProps) {
  return (
    <div
      inert={!isOpen ? true : undefined}
      className={cn(
        "fixed top-14 bottom-0 right-0 z-50 flex w-96 flex-col rounded-l-2xl border-l border-border-default bg-base/95 backdrop-blur-md shadow-2xl transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}
    >
      <SidebarHeader onClose={onClose} />

      <Tabs defaultValue="ai-architect" className="flex flex-1 flex-col overflow-hidden">
        <div className="border-b border-border-default px-4 pt-4">
          <TabsList variant="line" className="w-full">
            <TabsTrigger value="ai-architect" className="flex-1 data-active:bg-accent data-active:text-brand text-copy-muted">
              AI Architect
            </TabsTrigger>
            <TabsTrigger value="specs" className="flex-1 data-active:bg-accent data-active:text-brand text-copy-muted">
              Specs
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="ai-architect" className="flex flex-1 flex-col overflow-hidden">
          <ClientSideSuspense fallback={<SidebarTabLoading />}>
            <AiArchitectTab roomId={roomId} projectId={projectId} />
          </ClientSideSuspense>
        </TabsContent>

        <TabsContent value="specs" className="flex flex-1 flex-col overflow-hidden">
          <ClientSideSuspense fallback={<SidebarTabLoading />}>
            <SpecsTab roomId={roomId} projectId={projectId} />
          </ClientSideSuspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SidebarTabLoading() {
  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <Loader2 className="h-6 w-6 animate-spin text-copy-muted" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

function SidebarHeader({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex h-14 items-center justify-between border-b border-border-default px-4">
      <div className="flex items-center gap-2">
        <Bot className="h-5 w-5 text-ai-text" />
        <div>
          <h2 className="text-sm font-medium text-copy-primary">AI Workspace</h2>
          <p className="text-xs text-copy-muted">Collaborate with Ghost AI</p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        aria-label="Close AI sidebar"
      >
        <X className="h-5 w-5 text-copy-secondary" />
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// AI Architect Tab (with real API integration)
// ---------------------------------------------------------------------------

const AI_SENDER = {
  id: "ghost-ai",
  name: "Ghost AI",
  avatar: "",
};

function AiArchitectTab({ roomId, projectId }: { roomId: string; projectId: string }) {
  const [input, setInput] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Local state to track the active run and its public token
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [publicToken, setPublicToken] = useState<string | null>(null);

  // Subscribe to the shared AI status feed in Liveblocks storage
  const statusFeed = useStorage((root: any) => root["ai-status-feed"]);
  const latestMessage = statusFeed && statusFeed.length > 0 ? statusFeed[statusFeed.length - 1] : null;
  const isValid = latestMessage ? validateAiStatusMessage(latestMessage) : false;
  const validatedStatusMessage = isValid ? (latestMessage as AiStatusMessage) : null;

  // Subscribe to the shared AI chat feed in Liveblocks storage
  const chatFeed = useStorage((root: any) => root["ai-chat"]);
  const rawChatMessages = chatFeed ?? [];
  const validatedMessages = (rawChatMessages as unknown[]).filter(validateAiChatMessage);

  // Fetch current user details via Liveblocks presence
  const self = useSelf();
  const currentUserId = self?.id;

  // Check if any other participant has thinking: true in their presence
  const others = useOthers();
  const isAiWorking = others.some((other) => other.presence?.thinking === true);

  // Active generation state is true if AI is active globally or locally
  const isGenerationActive = isAiWorking || !!activeRunId;

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [validatedMessages, validatedStatusMessage, isGenerationActive]);

  const pushChatMessage = useMutation(({ storage }, {
    role,
    content,
    sender,
  }: {
    role: "user" | "assistant";
    content: string;
    sender: { id: string; name: string; avatar: string };
  }) => {
    let chat = storage.get("ai-chat");
    if (!chat) {
      storage.set("ai-chat", new LiveList<AiChatMessage>([]));
      chat = storage.get("ai-chat");
    }
    if (!chat) {
      throw new Error("Failed to initialize chat storage.");
    }
    chat.push({
      id: `${sender.id}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      sender,
      role,
      content,
      timestamp: Date.now(),
    });
  }, []);

  // Realtime run tracking hook
  useRealtimeRun<typeof designAgentTask>(activeRunId ?? undefined, {
    accessToken: publicToken ?? undefined,
    enabled: !!activeRunId && !!publicToken,
    onComplete: (completedRun, err) => {
      let messageText = "";

      if (err || completedRun.status === "FAILED" || completedRun.status === "CANCELED") {
        const errMsg = err?.message || (completedRun.output as any)?.error || "Unknown error occurred";
        messageText = `Failed to generate architecture: ${errMsg}`;
      } else {
        const output = completedRun.output as { success: boolean; nodesCount?: number; edgesCount?: number } | undefined;
        const nodes = output?.nodesCount ?? 0;
        const edges = output?.edgesCount ?? 0;
        messageText = `I have generated and applied the architecture to the canvas! Added ${nodes} nodes and ${edges} edges.`;
      }

      // Push final AI message to ai-chat
      pushChatMessage({
        role: "assistant",
        content: messageText,
        sender: AI_SENDER,
      });

      // Reset loading + run state
      setActiveRunId(null);
      setPublicToken(null);
    },
  });

  const handleSend = useCallback(
    async (promptText?: string) => {
      const text = (promptText ?? input).trim();
      if (!text || isGenerationActive) return;

      setSendError(null);
      try {
        if (!self) {
          throw new Error("Cannot send message: Not connected to room.");
        }

        // Push the user message to the ai-chat feed
        pushChatMessage({
          role: "user",
          content: text,
          sender: {
            id: self.id,
            name: self.info.name,
            avatar: self.info.avatar,
          },
        });

        setInput("");
        if (textareaRef.current) {
          textareaRef.current.style.height = "72px";
        }

        // Call design API endpoint
        const res = await fetch("/api/ai/design", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: text,
            roomId,
            projectId,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `HTTP error ${res.status}`);
        }

        const data = await res.json();
        const { runId, publicToken: token } = data;

        if (!runId || !token) {
          throw new Error("Invalid response from design API: missing runId or token");
        }

        // Store active run details in local state
        setActiveRunId(runId);
        setPublicToken(token);

      } catch (err) {
        const errMsg = err instanceof Error ? err.message : "Failed to send message.";
        setSendError(errMsg);
        
        // Show errors as messages in ai-chat feed
        pushChatMessage({
          role: "assistant",
          content: `Error starting design generation: ${errMsg}`,
          sender: AI_SENDER,
        });
      }
    },
    [input, isGenerationActive, pushChatMessage, self, roomId, projectId]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "72px";
    const scrollHeight = el.scrollHeight;
    const clamped = Math.min(Math.max(scrollHeight, 72), 160);
    el.style.height = `${clamped}px`;
    setSendError(null);
  }, []);

  return (
    <>
      <ScrollArea className="flex-1 px-4 py-4" ref={scrollRef}>
        <div className="flex flex-col gap-3">
          {validatedMessages.length === 0 && !isGenerationActive ? (
            <EmptyState onChipClick={(chip) => handleSend(chip)} />
          ) : (
            <>
              {validatedMessages.map((msg) => (
                <ChatMessageItem
                  key={msg.id}
                  message={msg}
                  isOwn={msg.sender.id === currentUserId}
                />
              ))}
            </>
          )}
        </div>
      </ScrollArea>

      {/* Status Strip */}
      {isGenerationActive && (
        <div className="flex items-center gap-2 border-t border-border-default bg-[#080809] px-4 py-2.5 text-xs text-[#62C073]">
          <span className="relative flex h-1.5 w-1.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#62C073] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#62C073]"></span>
          </span>
          <span className="truncate">
            {validatedStatusMessage?.text || "Ghost AI is starting..."}
          </span>
        </div>
      )}

      <div className="border-t border-border-default p-4">
        {sendError && (
          <p className="mb-2 text-xs text-state-error animate-pulse">{sendError}</p>
        )}
        <div className="flex items-end gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Ask Ghost AI…"
            disabled={isGenerationActive}
            className="min-h-[72px] max-h-[160px] resize-none bg-subtle border-border-default text-copy-primary placeholder:text-copy-faint focus-visible:border-brand focus-visible:ring-brand/30 disabled:opacity-50"
            rows={1}
          />
          <Button
            size="icon"
            className={cn(
              "mb-0.5 shrink-0 transition-colors duration-200",
              input.trim() && !isGenerationActive
                ? "bg-[#62C073] text-[#080809] hover:bg-[#62C073]/90"
                : "bg-subtle text-copy-faint border border-border-default opacity-50 cursor-not-allowed"
            )}
            onClick={() => handleSend()}
            disabled={!input.trim() || isGenerationActive}
            aria-label="Send message"
          >
            {isGenerationActive ? (
              <Loader2 className="h-4 w-4 animate-spin text-[#080809]" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Status indicator — shows the current step with animation
// ---------------------------------------------------------------------------

function StatusIndicator({ status, text }: { status: AgentStatus; text?: string }) {
  if (!status) return null;
  const label = text || (STATUS_LABELS[status] ?? status);
  const isTerminal = status === "complete" || status === "error";

  return (
    <div className="flex justify-start">
      <div
        className={cn(
          "flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm",
          status === "error"
            ? "border-state-error/30 bg-state-error/10 text-state-error"
            : status === "complete"
              ? "border-state-success/30 bg-state-success/10 text-state-success"
              : "border-ai/30 bg-ai/10 text-ai-text"
        )}
      >
        {!isTerminal && <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />}
        <span>{label}</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState({ onChipClick }: { onChipClick: (content: string) => void }) {
  return (
    <div className="flex flex-col items-center gap-3 py-8">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ai/20">
        <Bot className="h-6 w-6 text-ai-text" />
      </div>
      <p className="text-sm text-copy-muted text-center">
        Ask questions about your architecture or start with a prompt below
      </p>
      <div className="flex flex-wrap justify-center gap-2 pt-2">
        {STARTER_CHIPS.map((chip) => (
          <button
            key={chip}
            className="rounded-full bg-subtle px-3 py-1.5 text-xs text-ai-text transition-colors hover:bg-brand-dim"
            onClick={() => onChipClick(chip)}
          >
            {chip}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chat message bubble
// ---------------------------------------------------------------------------

function ChatMessageItem({
  message,
  isOwn,
}: {
  message: AiChatMessage;
  isOwn: boolean;
}) {
  const isAssistant = message.role === "assistant";
  const formattedTime = new Date(message.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className={cn("flex flex-col gap-1", isOwn ? "items-end" : "items-start")}>
      <div className="flex items-center gap-1.5 px-1">
        {!isOwn && (
          <>
            {isAssistant ? (
              <Bot className="h-3.5 w-3.5 text-ai-text" />
            ) : message.sender.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={message.sender.avatar}
                alt=""
                className="h-4 w-4 rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex h-4 w-4 items-center justify-center rounded-full bg-subtle text-[8px] font-medium text-copy-secondary">
                {message.sender.name[0]?.toUpperCase() || "?"}
              </div>
            )}
            <span
              className={cn(
                "text-[11px] font-medium",
                isAssistant ? "text-ai-text" : "text-copy-secondary"
              )}
            >
              {isAssistant ? "Ghost AI" : message.sender.name}
            </span>
          </>
        )}
        <span className="text-[10px] text-copy-muted">{formattedTime}</span>
      </div>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3 py-2 text-sm break-words",
          message.role === "user"
            ? "bg-[#62C073] text-[#080809] font-medium"
            : "bg-elevated border border-border-default text-copy-primary",
          isOwn ? "rounded-tr-none" : "rounded-tl-none"
        )}
      >
        {message.content}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Specs tab
// ---------------------------------------------------------------------------

interface SpecItem {
  id: string;
  projectId: string;
  createdAt: string;
  filename: string;
}

function SpecsTab({ roomId, projectId }: { roomId: string; projectId: string }) {
  const [specs, setSpecs] = useState<SpecItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Spec generation run state
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [publicToken, setPublicToken] = useState<string | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);

  // Preview Modal state
  const [previewSpec, setPreviewSpec] = useState<SpecItem | null>(null);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Liveblocks storage/chat state for triggering spec generation
  const chatFeed = useStorage((root: any) => root["ai-chat"]);
  const rawChatMessages = chatFeed ?? [];
  const chatHistory = (rawChatMessages as unknown[]).filter(validateAiChatMessage);

  const flow = useStorage((root: any) => root.flow);
  // Liveblocks stores nodes/edges as LiveMap (key-value objects), not arrays.
  // Convert them to arrays for the spec generation API which expects array format.
  const nodesMap = flow?.nodes ?? {};
  const edgesMap = flow?.edges ?? {};
  const nodes = Array.isArray(nodesMap) ? nodesMap : Object.values(nodesMap);
  const edges = Array.isArray(edgesMap) ? edgesMap : Object.values(edgesMap);

  // Fetch all specs for the project
  const fetchSpecs = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/specs`);
      if (!res.ok) {
        throw new Error("Failed to load specifications");
      }
      const data = await res.json();
      setSpecs(data.specs || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load specs");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Load specs list on mount
  useEffect(() => {
    fetchSpecs();
  }, [fetchSpecs]);

  // Real-time run tracking for spec generation
  useRealtimeRun<typeof generateSpec>(activeRunId ?? undefined, {
    accessToken: publicToken ?? undefined,
    enabled: !!activeRunId && !!publicToken,
    onComplete: async (completedRun, err) => {
      if (err || completedRun.status === "FAILED" || completedRun.status === "CANCELED") {
        const errMsg = err?.message || (completedRun.output as any)?.error || "Specification generation failed";
        setGenerateError(errMsg);
      }
      
      // Reset run state
      setActiveRunId(null);
      setPublicToken(null);
      // Reload specs list
      await fetchSpecs();
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle triggering spec generation
  const handleGenerateSpec = useCallback(async () => {
    if (activeRunId || isSubmitting) return;
    setGenerateError(null);
    setIsSubmitting(true);

    try {
      // 1. Post to spec trigger API
      const res = await fetch("/api/ai/spec", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roomId,
          chatHistory,
          nodes,
          edges,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP error ${res.status}`);
      }

      const data = await res.json();
      const { runId } = data;

      if (!runId) {
        throw new Error("Invalid response: missing runId");
      }

      // 2. Fetch scoped public token for the run
      const tokenRes = await fetch("/api/ai/spec/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ runId }),
      });

      if (!tokenRes.ok) {
        const errData = await tokenRes.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP error ${tokenRes.status}`);
      }

      const tokenData = await tokenRes.json();
      const { token } = tokenData;

      if (!token) {
        throw new Error("Invalid response: missing token");
      }

      setActiveRunId(runId);
      setPublicToken(token);
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : "Failed to generate spec");
    } finally {
      setIsSubmitting(false);
    }
  }, [roomId, activeRunId, isSubmitting, chatHistory, nodes, edges]);

  // Load preview content when previewSpec is set
  useEffect(() => {
    if (!previewSpec) {
      setPreviewContent(null);
      setPreviewError(null);
      return;
    }

    let active = true;
    const fetchContent = async () => {
      setPreviewLoading(true);
      setPreviewError(null);
      try {
        const res = await fetch(`/api/projects/${projectId}/specs/${previewSpec.id}`);
        if (!res.ok) {
          throw new Error("Failed to load specification content");
        }
        const data = await res.json();
        if (active) {
          setPreviewContent(data.content);
        }
      } catch (err) {
        if (active) {
          setPreviewError(err instanceof Error ? err.message : "An error occurred");
        }
      } finally {
        if (active) {
          setPreviewLoading(false);
        }
      }
    };

    fetchContent();

    return () => {
      active = false;
    };
  }, [projectId, previewSpec]);

  const handleDownload = (e: React.MouseEvent, specId: string) => {
    e.stopPropagation(); // prevent opening preview modal
    window.location.href = `/api/projects/${projectId}/specs/${specId}/download`;
  };

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-hidden p-4">
      {/* Generate Spec Action */}
      <Button
        className="w-full bg-[#62C073] text-[#080809] font-medium hover:bg-[#62C073]/90 disabled:opacity-50 flex items-center justify-center gap-2 shrink-0"
        onClick={handleGenerateSpec}
        disabled={!!activeRunId || loading || isSubmitting}
      >
        {activeRunId || isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin text-[#080809]" />
            Generating Spec...
          </>
        ) : (
          "Generate Spec"
        )}
      </Button>

      {generateError && (
        <p className="text-xs text-state-error animate-pulse shrink-0">{generateError}</p>
      )}

      {/* Specifications list */}
      <ScrollArea className="flex-1 -mx-4 px-4">
        <div className="flex flex-col gap-3 pb-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-copy-muted" />
            </div>
          ) : error ? (
            <div className="text-center text-xs text-state-error py-8">{error}</div>
          ) : specs.length === 0 ? (
            <div className="text-center text-xs text-copy-faint py-8">
              No specifications generated yet.
            </div>
          ) : (
            specs.map((spec) => {
              const formattedDate = new Date(spec.createdAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div
                  key={spec.id}
                  onClick={() => setPreviewSpec(spec)}
                  className="group flex items-start gap-3 rounded-xl border border-border-default bg-elevated p-3 cursor-pointer transition-all hover:border-[#62C073]/50 hover:bg-[#121316]"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-subtle group-hover:bg-[#62C073]/10 transition-colors">
                    <FileText className="h-4 w-4 text-copy-muted group-hover:text-[#62C073] transition-colors" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-copy-primary truncate group-hover:text-copy-primary transition-colors">
                      {spec.filename}
                    </p>
                    <p className="mt-0.5 text-[10px] text-copy-muted">
                      {formattedDate}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="opacity-0 group-hover:opacity-100 hover:bg-subtle text-copy-secondary transition-all"
                    onClick={(e) => handleDownload(e, spec.id)}
                    aria-label="Download specification"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Preview Modal */}
      <Dialog open={!!previewSpec} onOpenChange={(open) => !open && setPreviewSpec(null)}>
        <DialogContent className="sm:max-w-3xl max-h-[85vh] flex flex-col p-6 overflow-hidden">
          <DialogHeader className="shrink-0 pr-6">
            <DialogTitle className="text-lg font-semibold text-copy-primary truncate">
              {previewSpec?.filename}
            </DialogTitle>
            <DialogDescription className="text-xs text-copy-muted mt-1">
              Generated on {previewSpec && new Date(previewSpec.createdAt).toLocaleString()}
            </DialogDescription>
          </DialogHeader>

          {/* Dialog Content Area */}
          <div className="flex-1 overflow-y-auto min-h-0 border-y border-border-default my-4 py-4 pr-2">
            {previewLoading ? (
              <div className="flex h-full w-full items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-6 w-6 animate-spin text-brand" />
                  <p className="text-xs text-copy-faint">Loading specification details…</p>
                </div>
              </div>
            ) : previewError ? (
              <div className="flex h-full w-full items-center justify-center text-center p-4">
                <p className="text-sm text-state-error">{previewError}</p>
              </div>
            ) : previewContent ? (
              <div className="select-text">
                <SimpleMarkdown content={previewContent} />
              </div>
            ) : null}
          </div>

          <DialogFooter className="shrink-0 flex items-center justify-between sm:justify-between w-full">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2 hover:bg-[#62C073]/10 hover:text-[#62C073] hover:border-[#62C073]/30"
              onClick={(e) => previewSpec && handleDownload(e, previewSpec.id)}
              disabled={!previewContent}
            >
              <Download className="h-4 w-4" />
              Download Markdown
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPreviewSpec(null)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
