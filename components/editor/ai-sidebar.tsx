"use client";

import { useState, useRef, useCallback } from "react";
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
import { Bot, X, Send, FileText, Download } from "lucide-react";

interface AiSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const STARTER_CHIPS = [
  "Design an e-commerce backend",
  "Create a chat app architecture",
  "Build a CI/CD pipeline",
];

export function AiSidebar({ isOpen, onClose }: AiSidebarProps) {
  return (
    <div
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
          <AiArchitectTab />
        </TabsContent>

        <TabsContent value="specs" className="flex flex-1 flex-col overflow-hidden">
          <SpecsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

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

function AiArchitectTab() {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(() => {
    if (!input.trim()) return;
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "72px";
    }
  }, [input]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const handleInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "72px";
    const scrollHeight = el.scrollHeight;
    const clamped = Math.min(Math.max(scrollHeight, 72), 160);
    el.style.height = `${clamped}px`;
  }, []);

  return (
    <>
      <ScrollArea className="flex-1 px-4 py-4">
        <EmptyState />
      </ScrollArea>

      <div className="border-t border-border-default p-4">
        <div className="flex items-end gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Ask Ghost AI..."
            className="min-h-[72px] max-h-[160px] resize-none bg-subtle border-border-default text-copy-primary placeholder:text-copy-faint focus-visible:border-brand focus-visible:ring-brand/30"
            rows={1}
          />
          <Button
            size="icon"
            className="mb-0.5 shrink-0 bg-brand text-white hover:bg-brand/80"
            onClick={handleSubmit}
            disabled={!input.trim()}
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  );
}

function EmptyState() {
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);

  return (
    <div className="flex flex-col gap-4">
      {messages.length === 0 ? (
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
                onClick={() => {
                  setMessages((prev) => [...prev, { role: "user", content: chip }]);
                  setTimeout(() => {
                    setMessages((prev) => [
                      ...prev,
                      { role: "assistant", content: "I'll help you with that. This feature is coming soon!" },
                    ]);
                  }, 500);
                }}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {messages.map((msg, i) => (
            <ChatMessage key={i} role={msg.role} content={msg.content} />
          ))}
        </div>
      )}
    </div>
  );
}

function ChatMessage({ role, content }: { role: "user" | "assistant"; content: string }) {
  if (role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl border-2 border-brand/50 bg-brand-dim px-3 py-2 text-sm text-copy-primary">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[80%] rounded-2xl border border-border-default bg-elevated px-3 py-2 text-sm text-ai-text">
        {content}
      </div>
    </div>
  );
}

function SpecsTab() {
  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
      <Button className="w-full bg-brand text-white hover:bg-brand/80">
        Generate Spec
      </Button>

      <div className="rounded-xl border border-border-default bg-elevated p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-subtle">
            <FileText className="h-4 w-4 text-copy-muted" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-copy-primary">api-spec.md</p>
            <p className="mt-1 line-clamp-2 text-xs text-copy-muted">
              # API Specification&#10;Endpoints for user authentication, project CRUD, and real-time collaboration...
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon-xs"
            disabled
            aria-label="Download spec"
          >
            <Download className="h-3.5 w-3.5 text-copy-faint" />
          </Button>
        </div>
      </div>
    </div>
  );
}
