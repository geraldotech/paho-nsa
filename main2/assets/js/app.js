import nasas from '../database/nsas.js' // ID :contentReference[oaicite:3]{index=3}
import activity from '../database/activity.js' // ParentID :contentReference[oaicite:4]{index=4}
import workplan from '../database/workplan.js' // ParentID :contentReference[oaicite:5]{index=5}

const DISCLAIMER = {
  en: 'The information has been provided directly by Non-State Actors (NSAs) as part of their reporting obligations within the framework of official relations. In accordance with the consent granted by each NSA, the data is declarative in nature and may be published for transparency purposes. PAHO is not responsible for verifying, auditing, or editing the information provided.',
  es: 'La información ha sido proporcionada directamente por los Agentes No Estatales (ANE) como parte de sus obligaciones de reporte en el marco de las relaciones oficiales. De conformidad con el consentimiento otorgado por cada ANE/NSA, los datos son de carácter declarativo y podrán ser publicados para fines de transparencia. La OPS no es responsable de verificar, auditar ni editar la información proporcionada.',
}

let currentLang = 'en'
let currentId = null // '62'

const el = {
  langToggle: document.getElementById('lang-toggle'),
  nsaSelect: document.getElementById('nsa-select'),
  searchTitle: document.getElementById('search-title'),
  filterActivities: document.getElementById('filter-activities'),
  filterWorkplans: document.getElementById('filter-workplans'),
  clear: document.getElementById('clear-filters'),

  nsaTitle: document.getElementById('nsa-title'),
  nsaSubtitle: document.getElementById('nsa-subtitle'),
  nsaInfo: document.getElementById('nsa-info'),
  activities: document.getElementById('activities'),
  workplans: document.getElementById('workplans'),
  disclaimer: document.getElementById('disclaimer-text'),
  periodSelect: document.getElementById('period-select'),
}

init()

function init() {
  buildNSASelect()

  buildPeriodSelect()

  el.langToggle.addEventListener('click', () => {
    currentLang = currentLang === 'en' ? 'es' : 'en'
    el.langToggle.innerText = currentLang === 'en' ? 'ES' : 'EN'
    render()
  })

  el.nsaSelect.addEventListener('change', (e) => {
    currentId = e.target.value
    render()
  })

  el.periodSelect.addEventListener('change', () => {
    buildNSASelect()
  })

  // search / filtros
  el.searchTitle.addEventListener('input', buildNSASelect)
  el.filterActivities.addEventListener('change', render)
  el.filterWorkplans.addEventListener('change', render)

  el.clear.addEventListener('click', () => {
    el.searchTitle.value = ''
    el.filterActivities.checked = true
    el.filterWorkplans.checked = true
    render()
  })

  // seta default no select
  el.nsaSelect.value = currentId
  render()
}

function buildNSASelect() {
  const selectedPeriod = el.periodSelect.value
  const query = (el.searchTitle.value || '').trim().toLowerCase()

  let filtered = [...nasas]

  if (selectedPeriod) {
    filtered = filtered.filter((n) => n.CollaborationPeriod === selectedPeriod)
  }

  if (query) {
    filtered = filtered.filter((n) => {
      const titleEng = String(n.TitleENG || '').toLowerCase()
      const titleSpa = String(n.TitleSPA || '').toLowerCase()
      return titleEng.includes(query) || titleSpa.includes(query)
    })
  }

  const sorted = filtered.sort((a, b) => String(a.TitleENG || '').localeCompare(String(b.TitleENG || '')))

  el.nsaSelect.innerHTML = sorted
    .map((n) => {
      const label = `${n.ID} — ${n.TitleENG || n.TitleSPA || 'Untitled'}`
      return `<option value="${n.ID}">${escapeHtml(label)}</option>`
    })
    .join('')

  // se o atual não existir mais no filtro, seleciona o primeiro
  if (!sorted.find((n) => n.ID === currentId)) {
    currentId = sorted.length ? sorted[0].ID : ''
  }

  el.nsaSelect.value = currentId
  render()
}

function render() {
  const nsa = nasas.find((n) => String(n.ID) === String(currentId))

  // Segurança: se não existir ID, limpa tudo
  if (!nsa) {
    el.nsaTitle.innerText = 'NSA not found'
    el.nsaSubtitle.innerText = ''
    el.nsaInfo.innerHTML = ''
    el.activities.innerHTML = ''
    el.workplans.innerHTML = ''
    el.disclaimer.innerText = DISCLAIMER[currentLang]
    return
  }

  const query = (el.searchTitle.value || '').trim().toLowerCase()
  const showActs = el.filterActivities.checked
  const showWps = el.filterWorkplans.checked

  const allActivities = activity.filter((a) => String(a.ParentID) === String(currentId))
  const allWorkplans = workplan.filter((w) => String(w.ParentID) === String(currentId))

  const filteredActivities = showActs ? filterByTitle(allActivities, query) : []
  const filteredWorkplans = showWps ? filterByTitle(allWorkplans, query) : []

  renderNSA(nsa, allActivities.length, allWorkplans.length)
  renderActivities(filteredActivities, showActs)
  renderWorkplans(filteredWorkplans, showWps)
  renderDisclaimer()
}

function filterByTitle(list, query) {
  if (!query) return list
  return list.filter((x) =>
    String(x.Title || '')
      .toLowerCase()
      .includes(query)
  )
}

function renderNSA(nsa) {
  if (!nsa) return

  // 🔹 Título
  el.nsaTitle.innerText =
    currentLang === 'en' ? (nsa.TitleENG || '-') : (nsa.TitleSPA || '-')

  el.nsaSubtitle.innerText =
    `ID: ${nsa.ID} • ${nsa.CollaborationPeriod || '-'}`

  const metricsEl = document.getElementById('nsa-metrics')
  const infoEl = document.getElementById('nsa-info')
  if (!metricsEl || !infoEl) return

  // 🔹 Métricas base (sempre existirão)
  const baseMetrics = [
    ['FinAnnualIncomeYear', nsa.FinAnnualIncomeYear],
    ['FinAnnualIncome', nsa.FinAnnualIncome],
    ['FinAnnualExpenses', nsa.FinAnnualExpenses],
    ['FinAssets', nsa.FinAssets],
  ]

  // 🔹 Render mini-cards (fallback = 0)
  metricsEl.innerHTML = `
    <div class="metrics-grid">
      ${baseMetrics.map(([k, v]) => `
        <div class="metric-card">
          <div class="k">${k}</div>
          <div class="v">${formatMetric(v)}</div>
        </div>
      `).join('')}
    </div>
  `

  // 🔹 Demais campos respeitando idioma
  const entries = Object.entries(nsa)
    .filter(([k]) => {
      if (k.endsWith('ENG') && currentLang !== 'en') return false
      if (k.endsWith('SPA') && currentLang !== 'es') return false

      // evita duplicar métricas
      if (k.startsWith('Fin')) return false

      return true
    })
    .map(([k, v]) => [k.replace(/ENG|SPA$/, ''), v])
    .filter(([, v]) => v && String(v).trim() !== '')

  infoEl.innerHTML = entries.map(([k, v]) => `
    <div class="block">
      <h3>${k}</h3>
      <div class="pre">${v}</div>
    </div>
  `).join('')
}

// 🔹 Se não tiver valor → 0
function formatMetric(v) {
  if (!v || String(v).trim() === '') return '0'
  return v
}
function isNumberLike(v) {
  const s = String(v).trim()
  return s !== '' && !Number.isNaN(Number(s))
}

function renderActivities(list, enabled) {
  if (!enabled) {
    el.activities.innerHTML = `<p class="meta">Activities filter is off.</p>`
    return
  }

  if (!list.length) {
    el.activities.innerHTML = `<p class="meta">No activities found for this filter.</p>`
    return
  }

  el.activities.innerHTML = list
    .map((a) => {
      const desc = currentLang === 'en' ? a.DescriptionENG : a.DescriptionSPA
      const res = currentLang === 'en' ? a.DirectResultsENG : a.DirectResultsSPA
      return `
        <div class="item">
          <h3>${escapeHtml(a.Title || '-')}</h3>
          <p>${escapeHtml(desc || '').replace(/\n/g, '<br/>')}</p>
          ${res ? `<p class="meta"><strong>Results:</strong> ${escapeHtml(res).replace(/\n/g, '<br/>')}</p>` : ''}
        </div>
      `
    })
    .join('')
}

function renderWorkplans(list, enabled) {
  if (!enabled) {
    el.workplans.innerHTML = `<p class="meta">Workplans filter is off.</p>`
    return
  }

  if (!list.length) {
    el.workplans.innerHTML = `<p class="meta">No workplans found for this filter.</p>`
    return
  }

  el.workplans.innerHTML = list
    .map((w) => {
      const desc = currentLang === 'en' ? w.DescriptionENG : w.DescriptionSPA
      const dur = currentLang === 'en' ? w.DurationENG : w.DurationSPA

      return `
        <div class="item">
          <h3>${escapeHtml(w.Title || '-')}</h3>
          <p>${escapeHtml(desc || '').replace(/\n/g, '<br/>')}</p>
          ${dur ? `<p class="meta"><strong>Duration:</strong> ${escapeHtml(dur)}</p>` : ''}
          <p>${w.ResponsibleEntity}</p>
        </div>
      `
    })
    .join('')
}

function renderDisclaimer() {
  el.disclaimer.innerText = DISCLAIMER[currentLang]
}

/** evita quebrar HTML / XSS */
function escapeHtml(str) {
  return String(str).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;')
}

/**
 * RETORNAR OS PEDIDOS PARA SER USADO NO SELECT
 */
function buildPeriodSelect() {
  const periods = nasas.map((n) => n.CollaborationPeriod).filter(Boolean) // remove null / vazio  
  const unique = [...new Set(periods)].sort() // remove duplicados

  el.periodSelect.innerHTML = `
    <option value="">All Periods</option>
    ${unique.map((p) => `<option value="${p}">${p}</option>`).join('')}
  `
}
