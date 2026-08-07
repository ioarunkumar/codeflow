'use client'

import { useEffect, useRef, useState } from 'react'
import mermaid from 'mermaid'

function normalizeChart(source: string) {
  return source
    .replace(/^```(?:mermaid)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .replace(/^\s*mermaid\s*\n/i, '')
    .trim()
}

export function MermaidDiagram({ chart, dark, onRenderingChange }: { chart: string; dark: boolean; onRenderingChange?: (rendering: boolean) => void }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [renderError, setRenderError] = useState('')
  const [rendering, setRendering] = useState(false)

  useEffect(() => {
    let active = true
    const render = async () => {
      const normalized = normalizeChart(chart)
      if (!normalized) return
      setRendering(true)
      onRenderingChange?.(true)
      try {
        mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: dark ? 'dark' : 'base', flowchart: { useMaxWidth: false, htmlLabels: true }, themeVariables: { primaryColor: '#e6f0ff', primaryTextColor: dark ? '#eff6ff' : '#10233f', primaryBorderColor: '#1677ee', lineColor: '#6c7f97', fontFamily: 'ui-sans-serif, system-ui' } })
        const id = `codeflow-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
        const { svg } = await mermaid.render(id, normalized)
        if (active && containerRef.current) { containerRef.current.innerHTML = svg; setRenderError('') }
      } catch (error) {
        console.log('[v0] Mermaid preview render failed:', error)
        if (active) { setRenderError('Preview unavailable for this diagram. The Mermaid source is still available below.') }
      } finally {
        if (active) { setRendering(false); onRenderingChange?.(false) }
      }
    }
    render()
    return () => { active = false }
  }, [chart, dark, onRenderingChange])

  return <div className="mermaid-render-shell">
    {rendering ? <div className="diagram-progress" role="status"><div className="progress-track"><div className="progress-bar" /></div><span>Rendering flowchart…</span></div> : null}
    {renderError ? <div className="diagram-error" role="status">{renderError}</div> : <div className="mermaid-output" ref={containerRef} aria-label="Generated flowchart" />}
  </div>
}
