async function fetchJson(url) {
  try {
    if (!url || typeof url !== 'string') {
      throw new Error('URL inválida ou não informada')
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Recurso não encontrado (404): ${url}`)
      }

      if (response.status >= 500) {
        throw new Error(`Erro interno do servidor (${response.status})`)
      }

      throw new Error(`Erro HTTP: ${response.status}`)
    }

    const contentType = response.headers.get('content-type')

    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Resposta não é um JSON válido')
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('fetchJson erro:', error.message)
    return null
  }
}

function setText(id, text) {
  const node = document.getElementById(id)
  if (node) node.textContent = text
}

function hello() {
  return 'ok'
}

function getTextAfterLastBold(str) {
  const tag = '</b>'
  const index = String(str).lastIndexOf(tag)

  if (index === -1) return String(str || '')

  let text = String(str).slice(index + tag.length)
  text = text.replace(/<[^>]*>/g, '')

  return text.trim()
}

function toNumber(value) {
  if (!value) return 0
  return Number(String(value).replace(/[^\d.-]/g, '')) || 0
}

function formatNumber(n) {
  return Number(n || 0).toLocaleString('en-US')
}

function escapeHtml(str) {
  return String(str).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;')
}

function normalizeObjects(value) {
  if (value == null) return []

  const items = Array.isArray(value) ? value : [value]

  return items
    .flatMap((item) => {
      if (item == null) return []

      if (typeof item === 'object' && item.Label) {
        return [{ Label: String(item.Label).trim() }].filter((x) => x.Label)
      }

      if (typeof item !== 'string') {
        return [{ Label: String(item).trim() }].filter((x) => x.Label)
      }

      const text = item.trim()
      if (!text) return []

      if (text.includes(';')) {
        return text
          .split(';')
          .map((part) => part.trim())
          .filter(Boolean)
          .map((part) => ({ Label: part }))
      }

      return [{ Label: text }]
    })
    .filter((item) => item.Label)
}

function getFirstNonEmpty(values) {
  for (const value of values) {
    if (Array.isArray(value) && value.length > 0) return value
    if (typeof value === 'string' && value.trim()) return value
    if (value && typeof value === 'object') return value
  }
  return null
}

function clearSearchResults() {
  el.searchResults.innerHTML = ''
}

export { fetchJson, hello, setText, getTextAfterLastBold, toNumber, formatNumber, escapeHtml, normalizeObjects, getFirstNonEmpty, clearSearchResults }
export default fetchJson
