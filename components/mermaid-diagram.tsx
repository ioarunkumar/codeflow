'use client'

import { useEffect, useRef, useState } from 'react'
import mermaid from 'mermaid'

export function MermaidDiagram({ chart, dark }: { chart: string; dark: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [renderError, setRenderError] = useState('')

  useEffect(() => {
    let active = true
    const render = async () => {
      try {
        mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: dark ? 'dark' : 'base', themeVariables: { primaryColor: '#e6f0ff', primaryTextColor: dark ? '#eff6ff' : '#10233f', primaryBorderColor: '#1677ee', lineColor: '#6c7f97', fontFamily: 'ui-sans-serif, system-ui' } })
        const id = `codeflow-${Date.now()}`
        const { svg } = await mermaid.render(id, chart)
        if (active && containerRef.current) { containerRef.current.innerHTML = svg; setRenderError('') }
      } catch { if (active) { setRenderError('Preview unavailable. Copy the Mermaid source below to inspect it.'); if (containerRef.current) containerRef.current.innerHTML = '' } }
    }
    render()
    return () => { active = false }
  }, [chart, dark])

  return renderError ? <div className="diagram-error" role="status">{renderError}</div> : <div className="mermaid-output" ref={containerRef} aria-label="Generated flowchart" />
}
