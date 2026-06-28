import React from "react";

interface SimpleMarkdownProps {
  content: string;
}

export function SimpleMarkdown({ content }: SimpleMarkdownProps) {
  const lines = content.split("\n");
  let inCodeBlock = false;
  let codeLines: string[] = [];
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Handle code blocks
    if (line.trim().startsWith("```")) {
      if (inCodeBlock) {
        // End of code block
        elements.push(
          <pre
            key={`code-${i}`}
            className="bg-[#0b0c0e] p-3 rounded-lg text-xs font-mono my-3 overflow-x-auto border border-border-default max-w-full text-[#c9d1d9]"
          >
            <code>{codeLines.join("\n")}</code>
          </pre>
        );
        codeLines = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    // Handle headers
    if (line.startsWith("# ")) {
      elements.push(
        <h1 key={`h1-${i}`} className="text-xl font-semibold text-copy-primary mt-6 mb-3 border-b border-border-default pb-1">
          {line.substring(2)}
        </h1>
      );
      continue;
    }
    if (line.startsWith("## ")) {
      elements.push(
        <h2 key={`h2-${i}`} className="text-lg font-semibold text-copy-primary mt-5 mb-2.5">
          {line.substring(3)}
        </h2>
      );
      continue;
    }
    if (line.startsWith("### ")) {
      elements.push(
        <h3 key={`h3-${i}`} className="text-base font-semibold text-copy-primary mt-4 mb-2">
          {line.substring(4)}
        </h3>
      );
      continue;
    }

    // Handle blockquotes
    if (line.startsWith("> ")) {
      elements.push(
        <blockquote
          key={`bq-${i}`}
          className="border-l-4 border-brand bg-subtle/40 px-3 py-2 my-3 text-sm text-copy-secondary italic rounded-r"
        >
          {line.substring(2)}
        </blockquote>
      );
      continue;
    }

    // Handle list items (both unordered - / * and ordered 1. )
    const trimmed = line.trim();
    const isUnorderedList = trimmed.startsWith("- ") || trimmed.startsWith("* ");
    const isOrderedList = /^\d+\.\s/.test(trimmed);

    if (isUnorderedList || isOrderedList) {
      const bulletContent = isUnorderedList
        ? trimmed.substring(2)
        : trimmed.replace(/^\d+\.\s/, "");

      elements.push(
        <div key={`li-${i}`} className="flex items-start gap-2.5 text-sm text-copy-secondary my-1.5 pl-4">
          <span className="text-brand shrink-0 mt-2 w-1.5 h-1.5 rounded-full bg-brand" />
          <span className="flex-1">{parseInline(bulletContent)}</span>
        </div>
      );
      continue;
    }

    // Paragraphs
    if (line.trim()) {
      elements.push(
        <p key={`p-${i}`} className="text-sm text-copy-secondary my-2.5 leading-relaxed">
          {parseInline(line)}
        </p>
      );
    }
  }

  return <div className="space-y-1 select-text">{elements}</div>;
}

function parseInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining) {
    const boldIndex = remaining.indexOf("**");
    const codeIndex = remaining.indexOf("`");

    if (boldIndex === -1 && codeIndex === -1) {
      parts.push(<span key={key++}>{remaining}</span>);
      break;
    }

    if (boldIndex !== -1 && (codeIndex === -1 || boldIndex < codeIndex)) {
      // Bold markup is first
      if (boldIndex > 0) {
        parts.push(<span key={key++}>{remaining.substring(0, boldIndex)}</span>);
      }
      const rest = remaining.substring(boldIndex + 2);
      const endBoldIndex = rest.indexOf("**");
      if (endBoldIndex === -1) {
        parts.push(
          <strong key={key++} className="font-semibold text-copy-primary">
            **{rest}
          </strong>
        );
        break;
      }
      parts.push(
        <strong key={key++} className="font-semibold text-copy-primary">
          {rest.substring(0, endBoldIndex)}
        </strong>
      );
      remaining = rest.substring(endBoldIndex + 2);
    } else {
      // Code markup is first
      if (codeIndex > 0) {
        parts.push(<span key={key++}>{remaining.substring(0, codeIndex)}</span>);
      }
      const rest = remaining.substring(codeIndex + 1);
      const endCodeIndex = rest.indexOf("`");
      if (endCodeIndex === -1) {
        parts.push(
          <code key={key++} className="bg-subtle px-1 rounded font-mono text-xs text-brand">
            `{rest}
          </code>
        );
        break;
      }
      parts.push(
        <code
          key={key++}
          className="bg-subtle px-1.5 py-0.5 rounded font-mono text-xs text-brand border border-border-default"
        >
          {rest.substring(0, endCodeIndex)}
        </code>
      );
      remaining = rest.substring(endCodeIndex + 1);
    }
  }

  return parts;
}
