import { supabase } from './supabase'

const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY

export async function searchChunks(query, courseId = null, limit = 8) {
  try {
    const { data, error } = await supabase.rpc('search_chunks_text', {
      query_text: query,
      match_count: limit,
      filter_course_id: courseId || null
    })
    if (error) throw error
    return data || []
  } catch {
    return []
  }
}

export async function searchPubMed(query, maxResults = 5) {
  try {
    const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=${maxResults}&retmode=json&sort=relevance`
    const searchRes = await fetch(searchUrl)
    const searchData = await searchRes.json()
    const ids = searchData.esearchresult?.idlist || []
    if (!ids.length) return []
    const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids.join(',')}&retmode=json`
    const summaryRes = await fetch(summaryUrl)
    const summaryData = await summaryRes.json()
    const result = summaryData.result || {}
    return ids.map(id => ({
      id,
      title: result[id]?.title || '',
      authors: result[id]?.authors?.map(a => a.name).slice(0, 3).join(', ') || '',
      journal: result[id]?.fulljournalname || '',
      year: result[id]?.pubdate?.split(' ')[0] || '',
      url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`
    })).filter(a => a.title)
  } catch {
    return []
  }
}

function isClinicalQuery(message) {
  const keywords = ['studie','forskning','evidens','behandling','diagnos','prognos','prevalens','incidens','klinisk','effekt','resultat','rön','litteratur','artikel','pubmed','senaste','ny forskning','myopi','glaukom','katarakt','makuladegeneration','keratokonus','kontaktlins','ortokera','refraktion','synfel','torra ögon']
  const lower = message.toLowerCase()
  return keywords.some(k => lower.includes(k))
}

export async function* streamChat(messages, courseId = null) {
  const lastMessage = messages[messages.length - 1]?.content || ''
  const chunks = await searchChunks(lastMessage, courseId)
  const shouldSearchPubMed = isClinicalQuery(lastMessage)
  const pubmedResults = shouldSearchPubMed ? await searchPubMed(lastMessage, 4) : []

  let contextBlock = ''
  if (chunks.length > 0) {
    contextBlock += '\n\n## Kursmaterial (KI)\n'
    chunks.forEach((c, i) => { contextBlock += `[Källa ${i + 1}]: ${c.content}\n` })
  }
  if (pubmedResults.length > 0) {
    contextBlock += '\n\n## Aktuell forskning (PubMed)\n'
    pubmedResults.forEach((p, i) => { contextBlock += `[PubMed ${i + 1}]: ${p.title} – ${p.authors} (${p.year}), ${p.journal}\n` })
  }

  const systemPrompt = `Du är Opta, en klinisk kunskapsassistent för optometri byggd på Hannes Isakssons kursmaterial från Karolinska Institutet. Svara alltid på svenska. Var kliniskt precis och pedagogisk.${contextBlock ? '\n\nAnvänd nedanstående kontext:\n' + contextBlock : ''}`

  const response = await fetch('https://opta-proxy.gymbanan.workers.dev/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      stream: true,
      messages: messages.map(m => ({ role: m.role, content: m.content }))
    })
  })

  const reader = response.body.getReader()
  const decoder = new TextDecoder()

  yield { type: 'sources', chunks, pubmed: pubmedResults }

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const text = decoder.decode(value)
    const lines = text.split('\n').filter(l => l.startsWith('data: '))
    for (const line of lines) {
      try {
        const data = JSON.parse(line.slice(6))
        if (data.type === 'content_block_delta' && data.delta?.text) {
          yield { type: 'text', text: data.delta.text }
        }
      } catch { }
    }
  }
}
