/* === Imports === */
import nasas from '../database/nsas.js' // ID
import activity from '../database/activity.js' // ParentID
import workplan from '../database/workplan.js' // ParentID
import UI from './ui-language.js'

/* === State === */
let currentLang = 'en'
let currentId = null // '62'
let barChart = null

// plugin: escreve o valor acima de cada barra
const valueLabelsPlugin = {
  id: 'valueLabelsPlugin',
  afterDatasetsDraw(chart, args, pluginOptions) {
    const { ctx } = chart
    ctx.save()
    ctx.font = '12px Arial'
    ctx.fillStyle = '#333'
    ctx.textAlign = 'center'

    chart.data.datasets.forEach((dataset, di) => {
      const meta = chart.getDatasetMeta(di)
      meta.data.forEach((bar, i) => {
        const value = dataset.data[i]
        const label = formatNumber(value)
        ctx.fillText(label, bar.x, bar.y - 8) // 8px acima da barra
      })
    })

    ctx.restore()
  },
}

/* == UI - Elements == */
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

/**
 * ELEMENTOS INICIAIS
 */
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

  applyLanguage()
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

  // título
  el.nsaTitle.innerText = currentLang === 'en' ? nsa.TitleENG || '-' : nsa.TitleSPA || '-'
  el.nsaSubtitle.innerText = `ID: ${nsa.ID} • ${nsa.CollaborationPeriod || '-'}`

  const metricsEl = document.getElementById('nsa-metrics')
  const infoEl = document.getElementById('nsa-info')
  if (!metricsEl || !infoEl) return

  // base métricas
  const baseMetrics = [
    ['FinAnnualIncomeYear', nsa.FinAnnualIncomeYear],
    ['FinAnnualIncome', nsa.FinAnnualIncome],
    ['FinAnnualExpenses', nsa.FinAnnualExpenses],
    ['FinAssets', nsa.FinAssets],
  ]

  //  mini-cards (fallback = 0)
  metricsEl.innerHTML = `
    <div class="metrics-grid">
      ${baseMetrics
        .map(
          ([k, v]) => `
        <div class="metric-card">
          <div class="k">${k}</div>
          <div class="v">${formatMetric(v)}</div>
        </div>
      `
        )
        .join('')}
    </div>
  `

  // demais campos respeitando idioma
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

  infoEl.innerHTML = entries
    .map(
      ([k, v]) => `
    <div class="block">
      <h3>${k}</h3>
      <div class="pre">${v}</div>
    </div>
  `
    )
    .join('')

  renderFinancialCharts(nsa)
  renderInfo(nsa)
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

/**
 * FINANCIAL CHARTS
 */
function renderFinancialCharts(nsa) {
  const income = toNumber(nsa.FinAnnualIncome)
  const expenses = toNumber(nsa.FinAnnualExpenses)
  const assets = toNumber(nsa.FinAssets)

  const canvas = document.getElementById('financialBarChart')
  if (!canvas) return

  if (barChart) barChart.destroy()

  barChart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: ['Income', 'Expenses', 'Assets'],
      datasets: [
        {
          label: 'USD',
          data: [income, expenses, assets],
          backgroundColor: ['#2ecc71', '#e74c3c', '#3498db'],
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
      },
    },
    plugins: [valueLabelsPlugin],
  })
}

function renderInfo(nsa) {
  const infoEl = document.getElementById('nsa-info')
  if (!infoEl) return

  // chaves que são “textão” (colapsáveis)
  const longKeys = new Set(['NSAObjectives', 'NSAWorkFields', 'NSABoardMembers', 'NSAOrganizationBodies'])

  const entries = Object.entries(nsa)
    .filter(([k]) => {
      if (k.endsWith('ENG') && currentLang !== 'en') return false
      if (k.endsWith('SPA') && currentLang !== 'es') return false
      return true
    })
    .map(([k, v]) => [k.replace(/ENG|SPA$/, ''), v])
    .filter(([, v]) => v && String(v).trim() !== '')
    // não repetir os financeiros aqui
    .filter(([k]) => !k.startsWith('Fin'))

  const shortFields = entries.filter(([k]) => !longKeys.has(k))
  const longFields = entries.filter(([k]) => longKeys.has(k))

  infoEl.innerHTML = `
    <div class="nsa-grid">
      ${shortFields
        .map(
          ([k, v]) => `
        <div class="field">
          <div class="label">${k}</div>
          <div class="value">${escapeHtml(String(v))}</div>
        </div>
      `
        )
        .join('')}
    </div>

    <div style="height:12px"></div>

    ${longFields
      .map(
        ([k, v]) => `
      <details class="section" open>
        <summary>${k}</summary>
        <div class="content clamp" data-full="0">${escapeHtml(String(v))}</div>
        <button class="btn btn-ghost" type="button" onclick="toggleClamp(this)">Ver mais</button>
      </details>
    `
      )
      .join('')}
  `
}

// botão “ver mais / ver menos”
window.toggleClamp = function (btn) {
  const content = btn.parentElement.querySelector('.content')
  const isFull = content.getAttribute('data-full') === '1'
  if (isFull) {
    content.classList.add('clamp')
    content.setAttribute('data-full', '0')
    btn.textContent = 'Ver mais'
  } else {
    content.classList.remove('clamp')
    content.setAttribute('data-full', '1')
    btn.textContent = 'Ver menos'
  }
}

/* == Functions - UI Functions  == */
function setText(id, text) {
  const el = document.getElementById(id)
  if (el) el.textContent = text
}

function applyLanguage() {
  const t = UI[currentLang]
  setText('uiLanguageLabel', t.language)
  setText('uiPeriodLabel', t.period)
  setText('uiDisclaimerText', t.disclaimer)
  setText('uiDisclaimerTitle', t.disclaimerTitle)
}

function formatMetric(v) {
  if (!v || String(v).trim() === '') return '0'
  return v
}

function toNumber(value) {
  if (!value) return 0
  return Number(String(value).replace(/[^\d.-]/g, '')) || 0
}

// formata 1305930 -> 1,305,930
function formatNumber(n) {
  return Number(n || 0).toLocaleString('en-US')
}

/** evita quebrar HTML / XSS */
function escapeHtml(str) {
  return String(str).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;')
}
