"use client";

import { useState, Fragment } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Check, Copy } from "lucide-react";

const FENCE_RE = /```([\w+-]*)\n([\s\S]*?)```/g;

type Segment = { kind: "text"; content: string } | { kind: "code"; lang: string; content: string };

/** Splits a message on ```lang fences and renders code blocks with syntax
 *  highlighting + a copy button, leaving everything else as plain text.
 *  No message schema change needed — this is purely how existing `text`
 *  gets rendered. */
function parseSegments(text: string): Segment[] {
  const segments: Segment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  FENCE_RE.lastIndex = 0;
  while ((match = FENCE_RE.exec(text))) {
    if (match.index > lastIndex) segments.push({ kind: "text", content: text.slice(lastIndex, match.index) });
    segments.push({ kind: "code", lang: match[1] || "text", content: match[2].replace(/\n$/, "") });
    lastIndex = FENCE_RE.lastIndex;
  }
  if (lastIndex < text.length) segments.push({ kind: "text", content: text.slice(lastIndex) });
  return segments.length ? segments : [{ kind: "text", content: text }];
}

function CodeBlock({ lang, content }: { lang: string; content: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard API unavailable — silently no-op, copy button just won't confirm
    }
  };

  return (
    <div className="my-1.5 overflow-hidden rounded border border-white/10 bg-[#161616] text-left">
      <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.04] px-2.5 py-1">
        <span className="font-mono text-[10px] uppercase tracking-wide text-slate-400">{lang}</span>
        <button
          onClick={copy}
          className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-slate-400 transition hover:bg-white/10 hover:text-white"
        >
          {copied ? <Check className="h-3 w-3 text-neon-lime" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <SyntaxHighlighter
        language={lang}
        style={vscDarkPlus}
        customStyle={{ margin: 0, padding: "10px 12px", background: "transparent", fontSize: "12.5px" }}
        wrapLongLines
      >
        {content}
      </SyntaxHighlighter>
    </div>
  );
}

export function MessageBody({ text }: { text: string }) {
  const segments = parseSegments(text);
  return (
    <>
      {segments.map((seg, i) => (
        <Fragment key={i}>
          {seg.kind === "text"
            ? seg.content && <span className="whitespace-pre-wrap">{seg.content}</span>
            : <CodeBlock lang={seg.lang} content={seg.content} />}
        </Fragment>
      ))}
    </>
  );
}
