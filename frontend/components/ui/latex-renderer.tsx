"use client";

import { useEffect, useRef } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import { cn } from "@/lib/utils";

interface LatexRendererProps {
  content: string;
  className?: string;
}

export function LatexRenderer({ content, className }: LatexRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = "";

    try {
      const hasInlineMath = /\$[^$]+\$/.test(content);
      const hasDisplayMath = /\$\$[^$]+\$\$/.test(content);

      if (hasInlineMath || hasDisplayMath) {
        let html = content;
        html = html.replace(/\$\$([^$]+)\$\$/g, (_, math) => {
          try {
            return katex.renderToString(math.trim(), {
              displayMode: true,
              throwOnError: false,
            });
          } catch {
            return `$$${math}$$`;
          }
        });

        html = html.replace(/\$([^$]+)\$/g, (_, math) => {
          try {
            return katex.renderToString(math.trim(), {
              displayMode: false,
              throwOnError: false,
            });
          } catch {
            return `$${math}$`;
          }
        });
        containerRef.current.innerHTML = html;
      } else {
        containerRef.current.textContent = content;
      }
    } catch {
      if (containerRef.current) {
        containerRef.current.textContent = content;
      }
    }
  }, [content]);

  return (
    <div
      ref={containerRef}
      className={cn("leading-relaxed overflow-x-auto", className)}
    />
  );
}
