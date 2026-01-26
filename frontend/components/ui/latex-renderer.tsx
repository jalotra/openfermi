"use client"

import { useEffect, useRef } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'

interface LatexRendererProps {
  content: string
  displayMode?: boolean
  className?: string
}

/**
 * Renders LaTeX content using KaTeX
 * Supports both inline ($...$) and display ($$...$$) math
 */
export function LatexRenderer({ 
  content, 
  displayMode = false,
  className = '' 
}: LatexRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Clear previous content
    containerRef.current.innerHTML = ''

    try {
      // Check if content contains LaTeX delimiters
      const hasInlineMath = /\$[^$]+\$/.test(content)
      const hasDisplayMath = /\$\$[^$]+\$\$/.test(content)

      if (hasInlineMath || hasDisplayMath) {
        // Parse and render LaTeX with mixed content
        let html = content

        // Render display math ($$...$$)
        html = html.replace(/\$\$([^$]+)\$\$/g, (_, math) => {
          try {
            return katex.renderToString(math.trim(), { displayMode: true, throwOnError: false })
          } catch {
            return `$$${math}$$`
          }
        })

        // Render inline math ($...$)
        html = html.replace(/\$([^$]+)\$/g, (_, math) => {
          try {
            return katex.renderToString(math.trim(), { displayMode: false, throwOnError: false })
          } catch {
            return `$${math}$`
          }
        })

        containerRef.current.innerHTML = html
      } else {
        // No LaTeX delimiters, render as plain text or try to render entire content
        if (displayMode) {
          try {
            containerRef.current.innerHTML = katex.renderToString(content, { 
              displayMode: true, 
              throwOnError: false 
            })
          } catch {
            containerRef.current.textContent = content
          }
        } else {
          try {
            containerRef.current.innerHTML = katex.renderToString(content, { 
              displayMode: false, 
              throwOnError: false 
            })
          } catch {
            containerRef.current.textContent = content
          }
        }
      }
    } catch (error) {
      // Fallback to plain text if rendering fails
      if (containerRef.current) {
        containerRef.current.textContent = content
      }
    }
  }, [content, displayMode])

  return (
    <div 
      ref={containerRef} 
      className={className}
      style={{ 
        lineHeight: displayMode ? '1.6' : 'inherit',
        overflowX: 'auto'
      }}
    />
  )
}

/**
 * Simple inline LaTeX renderer for short math expressions
 */
export function InlineLatex({ content, className = '' }: { content: string; className?: string }) {
  return <LatexRenderer content={content} displayMode={false} className={className} />
}

/**
 * Display LaTeX renderer for equations and formulas
 */
export function DisplayLatex({ content, className = '' }: { content: string; className?: string }) {
  return <LatexRenderer content={content} displayMode={true} className={className} />
}
