'use client'

import { useMemo, useState } from 'react'
import { Download, FileCode2, KeyRound, Maximize2, Minus, Moon, Plus, Search, Share2, Sparkles, Sun, X } from 'lucide-react'
import { MermaidDiagram } from '@/components/mermaid-diagram'

const EXAMPLES = {
  Python: `def calculate_total(items):
    total = 0
    for item in items:
        if item.is_available:
            total += item.price
    return total`,
  'C / C++': `int calculateTotal(Item items[], int count) {
    int total = 0;
    for (int i = 0; i < count; i++) {
        if (items[i].available) {
            total += items[i].price;
        }
    }
    return total;
  }`,
}

const SAMPLE_DIAGRAM = `flowchart TD
    A([Start]) --> B[Initialize total = 0]
    B --> C{More items?}
    C -->|Yes| D[Read next item]
    D --> E{Available?}
    E -->|Yes| F[Add price to total]
    E -->|No| C
    F --> C
    C -->|No| G([Return total])`

export default function Page() {
  const [language, setLanguage] = useState<'Python' | 'C / C++'>('Python')
  const [code, setCode] = useState(EXAMPLES.Python)
  const [diagram, setDiagram] = useState(SAMPLE_DIAGRAM)
  const [explanation, setExplanation] = useState('This flowchart shows a simple loop over a list of items. Each item is checked for availability before its price is added to the running total. Once all items have been evaluated, the total is returned.')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [userKey, setUserKey] = useState('')
  const [zoom, setZoom] = useState(1)
  const [dark, setDark] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  const lineCount = useMemo(() => code.split('\n').length, [code])
  const canAnalyze = code.trim().length > 0 && code.length <= 6000 && lineCount <= 150 && !loading && cooldown === 0

  const analyze = async () => {
    if (!canAnalyze) return
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language, userApiKey: userKey || undefined }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to analyze code.')
      setDiagram(data.mermaid)
      setExplanation(data.explanation)
      setCooldown(10)
      const timer = window.setInterval(() => setCooldown((value) => {
        if (value <= 1) { window.clearInterval(timer); return 0 }
        return value - 1
      }), 1000)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const switchLanguage = (next: 'Python' | 'C / C++') => {
    setLanguage(next)
    setCode(EXAMPLES[next])
    setError('')
  }

  const downloadDiagram = () => {
    const blob = new Blob([diagram], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'flowchart.mmd'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <main className={dark ? 'app-shell dark' : 'app-shell'}>
      <header className="topbar">
        <div className="brand" aria-label="CodeFlow home"><span className="brand-mark"><FileCode2 size={18} /></span><span>CodeFlow</span></div>
        <nav className="topnav" aria-label="Primary navigation"><a href="#workspace">Workspace</a><a href="#how-it-works">How it works</a><a href="#security">Security</a></nav>
        <div className="top-actions"><button className="icon-button" aria-label="Toggle color theme" onClick={() => setDark(!dark)}>{dark ? <Sun size={17} /> : <Moon size={17} />}</button><button className="ghost-button">Sign in</button><button className="primary-button small">Get started</button></div>
      </header>

      <section className="hero" id="workspace">
        <div><p className="eyebrow"><Sparkles size={14} /> AI-powered code mapping</p><h1>Turn code into clarity.</h1><p className="hero-copy">Paste your code. See the logic.</p></div>
        <div className="hero-note"><span className="status-dot" /> Secure by default<br /><small>Your code is analyzed, never executed.</small></div>
      </section>

      <section className="workspace-grid">
        <div className="workspace-panel diagram-panel">
          <div className="panel-header"><div><p className="panel-kicker">01 / VISUAL MAP</p><h2>Flowchart canvas</h2></div><div className="panel-tools"><button className="icon-button" aria-label="Share diagram"><Share2 size={16} /></button><button className="icon-button" aria-label="Download Mermaid file" onClick={downloadDiagram}><Download size={16} /></button><button className="icon-button" aria-label="Fullscreen"><Maximize2 size={16} /></button></div></div>
          <div className="canvas-wrap"><div className="canvas-grid" /><div className="diagram-stage" style={{ transform: `scale(${zoom})` }}><MermaidDiagram chart={diagram} dark={dark} /></div><div className="zoom-controls"><button onClick={() => setZoom(Math.min(1.5, zoom + 0.1))} aria-label="Zoom in"><Plus size={16} /></button><span>{Math.round(zoom * 100)}%</span><button onClick={() => setZoom(Math.max(0.7, zoom - 0.1))} aria-label="Zoom out"><Minus size={16} /></button></div></div>
          <div className="canvas-footer"><span><span className="live-dot" /> Preview ready</span><span>Mermaid syntax · {diagram.split('\n').length} lines</span></div>
        </div>

        <div className="workspace-panel code-panel">
          <div className="panel-header"><div><p className="panel-kicker">02 / YOUR INPUT</p><h2>Code editor</h2></div><div className="language-tabs" role="tablist" aria-label="Programming language"><button className={language === 'Python' ? 'active' : ''} onClick={() => switchLanguage('Python')}>Python</button><button className={language === 'C / C++' ? 'active' : ''} onClick={() => switchLanguage('C / C++')}>C / C++</button></div></div>
          <div className="editor"><div className="line-numbers" aria-hidden="true">{code.split('\n').map((_, index) => <span key={index}>{String(index + 1).padStart(2, '0')}</span>)}</div><textarea value={code} onChange={(event) => setCode(event.target.value)} spellCheck={false} aria-label="Code input" /></div>
          <div className="editor-meta"><span>{code.length.toLocaleString()} / 6,000 characters</span><span>{lineCount} / 150 lines</span></div>
          {code.length > 6000 || lineCount > 150 ? <p className="error-text">Keep your input under 6,000 characters and 150 lines.</p> : null}
          <div className="key-row"><button className="key-button" onClick={() => setShowKey(!showKey)}><KeyRound size={15} /> {showKey ? 'Hide API key' : 'Use your own API key'} <span className="optional">optional</span></button>{showKey ? <div className="key-input"><input type="password" placeholder="sk-..." value={userKey} onChange={(event) => setUserKey(event.target.value)} aria-label="Optional API key" /><button onClick={() => setUserKey('')} aria-label="Clear API key"><X size={14} /></button></div> : null}</div>
          <button className="analyze-button" onClick={analyze} disabled={!canAnalyze}>{loading ? <><span className="spinner" /> Mapping logic...</> : cooldown ? `Ready again in ${cooldown}s` : <>Analyze code <span>→</span></>}</button>
          {error ? <p className="error-text" role="alert">{error}</p> : null}
          <p className="security-copy"><KeyRound size={13} /> Hosted mode keeps the provider key on the server. A personal key is sent only over HTTPS and never bundled into an .exe.</p>
        </div>
      </section>

      <section className="explanation-section" id="how-it-works"><div className="explanation-heading"><p className="panel-kicker">03 / PLAIN-ENGLISH EXPLANATION</p><h2>What your code is doing</h2></div><div className="explanation-card"><div className="explanation-index">AI</div><p>{explanation}</p></div><p className="disclaimer">AI-generated analysis · Always review the result against your source code.</p></section>

      <footer id="security"><span>CodeFlow <span className="muted">/ Built for understanding, not executing.</span></span><span className="footer-links"><a href="#security">Privacy</a><a href="#security">Security notes</a></span></footer>
    </main>
  )
}
