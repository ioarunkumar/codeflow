import { generateText, gateway } from 'ai'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

const MAX_CHARS = 6000
const MAX_LINES = 150
const SYSTEM_PROMPT = `You convert source code into a Mermaid flowchart and a concise plain-English explanation. Return ONLY valid JSON with this exact shape: {"mermaid":"flowchart TD\\n...","explanation":"..."}. Mermaid must use flowchart TD, simple node labels, and quoted labels when needed. Do not execute code. Do not include markdown fences or extra keys.`

function parseModelResponse(text: string) {
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
  const parsed = JSON.parse(cleaned) as { mermaid?: unknown; explanation?: unknown }
  if (typeof parsed.mermaid !== 'string' || typeof parsed.explanation !== 'string') throw new Error('The model returned an incomplete result.')
  const mermaid = parsed.mermaid.replace(/^```mermaid\s*/i, '').replace(/\s*```$/i, '').trim()
  if (!mermaid.startsWith('flowchart')) throw new Error('The model returned invalid Mermaid syntax.')
  return { mermaid: mermaid.slice(0, 12000), explanation: parsed.explanation.slice(0, 1800) }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { code?: unknown; language?: unknown; userApiKey?: unknown }
    const code = typeof body.code === 'string' ? body.code : ''
    const language = body.language === 'C / C++' ? 'C / C++' : 'Python'
    if (!code.trim()) return NextResponse.json({ error: 'Add some code before analyzing.' }, { status: 400 })
    if (code.length > MAX_CHARS || code.split('\n').length > MAX_LINES) return NextResponse.json({ error: 'Keep input under 6,000 characters and 150 lines.' }, { status: 413 })

    const userApiKey = typeof body.userApiKey === 'string' ? body.userApiKey.trim() : ''
    const serverKey = process.env.AI_GATEWAY_API_KEY
    if (!serverKey && !userApiKey) return NextResponse.json({ error: 'Hosted AI is not configured yet. Add AI_GATEWAY_API_KEY in project variables, or use your own API key.' }, { status: 503 })

    const result = await generateText({
      model: gateway('openai/gpt-5.4-mini'),
      system: SYSTEM_PROMPT,
      prompt: `Language: ${language}\n\nSource code:\n${code}`,
      maxOutputTokens: 1400,
      temperature: 0.2,
      ...(userApiKey ? { providerOptions: { gateway: { apiKey: userApiKey } } } : {}),
    })
    return NextResponse.json(parseModelResponse(result.text))
  } catch (error) {
    if (error instanceof SyntaxError) return NextResponse.json({ error: 'The AI response was not valid JSON. Please try again.' }, { status: 502 })
    return NextResponse.json({ error: 'Could not analyze this code right now. Please try again.' }, { status: 500 })
  }
}
