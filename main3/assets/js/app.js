import UI from './ui-language.js'
const nasas = await fetchJson('./assets/database/nsa.json')
const activity = await fetchJson('./assets/database/activity.json') // Collaboration with PAHO
const workplan = await fetchJson('./assets/database/workplan.json')


/* === State === */
let currentLang = 'en'
let currentId = 6;
let barChart = null
const MIN_SEARCH_CHARS = 1
const DEBUG = true

/* == UI - Elements == */
const el = {
  langToggle: document.getElementById('lang-toggle'),
  nsaSelect: document.getElementById('nsa-select'),
  searchOpen: document.getElementById('search-open'),
  searchModal: document.getElementById('search-modal'),
  searchModalInput: document.getElementById('search-modal-input'),
  searchModalResults: document.getElementById('search-modal-results'),
  searchClose: document.getElementById('search-close'),
  filterActivities: document.getElementById('filter-activities'),
  filterWorkplans: document.getElementById('filter-workplans'),
  clear: document.getElementById('clear-filters'),
  nsaTitle: document.getElementById('nsa-title'),
  nsaSubtitle: document.getElementById('nsa-subtitle'),
  nsaInfo: document.getElementById('nsa-info'),
  workplans: document.getElementById('workplans'),
  disclaimer: document.getElementById('disclaimer-text'),
  periodSelect: document.getElementById('period-select'),
  activities: document.getElementById('nsa-activities'),
}

init()

/**
 * ELEMENTOS INICIAIS
 */
function init() {
  buildNSASelect()
  buildPeriodSelect()
  updateSearchTriggerLabel()

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
  el.searchOpen.addEventListener('click', openSearchModal)
  el.searchClose.addEventListener('click', closeSearchModal)
  el.searchModal.addEventListener('click', (event) => {
    if (event.target.hasAttribute('data-close-search')) closeSearchModal()
  })
  el.searchModalInput.addEventListener('input', onSearchModalInput)
  el.searchModalResults.addEventListener('click', onSearchResultClick)
  document.addEventListener('keydown', onSearchGlobalKeys)

  el.clear.addEventListener('click', () => {
    el.filterActivities.checked = true
    el.filterWorkplans.checked = true
    render()
  })

  // seta default no select
  el.nsaSelect.value = currentId
  // render()
}

/**
 * FILTER SELECTED NSA
 */
function buildNSASelect() {
  const selectedPeriod = el.periodSelect.value

  let filtered = [...nasas]

  if (selectedPeriod) {
    filtered = filtered.filter((n) => n.CollaborationPeriod === selectedPeriod)
  }

  const sorted = filtered.sort((a, b) => String(a.TitleENG || '').localeCompare(String(b.TitleENG || '')))

  el.nsaSelect.innerHTML = sorted
    .map((n) => {
      const label = `${n.TitleENG || n.TitleSPA || 'Untitled'}`
      return `<option value="${n.id}">${escapeHtml(label)}</option>`
    })
    .join('')

  // se o atual não existir mais no filtro, seleciona o primeiro
  if (!sorted.find((n) => n.id === currentId)) {
    currentId = sorted.length ? sorted[0].id : ''
  }

  el.nsaSelect.value = currentId
  updateSearchTriggerLabel()
  render()
}

/**
 * RENDER THE NSA
 */
function render() {
 // console.log(nasas.find(v => v.id == 6))
  const nsa = nasas.find((n) => Number(n.id) === Number(currentId))

  // se nao encontrar a NSA nao filtra os demais
  if (!nsa) {
    el.nsaTitle.innerText = 'NSA not found'
    el.nsaSubtitle.innerText = ''
    el.nsaInfo.innerHTML = ''
    el.activities.innerHTML = ''
    el.workplans.innerHTML = ''
  //  el.disclaimer.innerText = DISCLAIMER[currentLang]
    return
  }
  const showWps = true // el.filterWorkplans.checked
  const allActivities = activity.filter((a) => String(a.ParentID) === String(currentId))
  const allWorkplans = workplan.filter((w) => String(w.ParentID) === String(currentId))
  // const filteredActivities = showActs ? allActivities : []
  const filteredWorkplans = showWps ? allWorkplans : []

  // add aqui tratativa se todos os 3 relacionamentos foram encontrados
  if (DEBUG) {
    console.log(`========================`)
    console.log('nsa', nsa)
    console.log('allActivities', allActivities)
    console.log('allWorkplans', allWorkplans)
    console.log(`========================`)
  }
/*   if (allWorkplans.length === 0) {
    alert('sem allWorkplans')
  } */

  /* === NSA PROFILE === */
  renderNSAProfile(nsa)
  renderFinancialCharts(nsa) // financial

  /* === NSA Activities === */
  renderActivities(allActivities) // activities

  /* === NSA workplans === */
  renderWorkplans(filteredWorkplans, true)

  applyLanguage()
}

/**
 * RENDER WORKPLANS
 * @return html
 */
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
      const HealthAgenda = currentLang === 'en' ? w.HealthAgendaENG : w.HealthAgendaSPA

      return `
        <div class="item">
          <h3>${escapeHtml(w.Title || '-')}</h3>
          <p>${escapeHtml(desc || '').replace(/\n/g, '<br/>')}</p>
          ${dur ? `<p class="meta"><strong>Duration:</strong> ${escapeHtml(dur)}</p>` : ''}
          <p>${UI[currentLang].thResp}: ${w.ResponsibleEntity}</p>
          <p>HealthAgenda: ${HealthAgenda ?? ''}</p>
        </div>
      `
    })
    .join('')
}

/**
 * RENDER renderActivities
 * @return html
 */
function renderActivities(list) {
  if (!list.length) {
    el.activities.innerHTML = `<p class="meta">No workplans found for this filter.</p>`
    return
  }

  el.activities.innerHTML = list
    .map((w) => {
      const desc = currentLang === 'en' ? w.DescriptionENG : w.DescriptionSPA
      const directResults = currentLang === 'en' ? w.DirectResultsENG : w.DirectResultsSPA

      return `
        <div class="item">
          <h3>${escapeHtml(w.Title || '-')}</h3>         
          <h5>${UI[currentLang].thEntity}</h5> 
          <p>${w.Entity}</p>         
          <h5>${UI[currentLang].thResults}</h5>
          <p>${directResults}</p>          
        </div>
      `
    })
    .join('')
}

/**
 * BUILD PERIODS TO SELECT
 */
function buildPeriodSelect() {
  const periods = nasas.map((n) => n.CollaborationPeriod).filter(Boolean) // removes null
  const unique = [...new Set(periods)].sort() // unique values

  el.periodSelect.innerHTML = `
    <option value="">All Periods</option>
    ${unique.map((p) => `<option value="${p}">${p}</option>`).join('')}
  `
}

function openSearchModal() {
  el.searchModal.classList.remove('hidden')
  el.searchModal.setAttribute('aria-hidden', 'false')
  el.searchModalInput.value = ''
  renderSearchModalResults([], '')
  el.searchModalInput.focus()
}

function closeSearchModal() {
  el.searchModal.classList.add('hidden')
  el.searchModal.setAttribute('aria-hidden', 'true')
}

function onSearchModalInput(event) {
  const query = String(event.target.value || '')
    .trim()
    .toLowerCase()
  const results = findNSAsByQuery(query)
  renderSearchModalResults(results, query)
}

function onSearchResultClick(event) {
  const button = event.target.closest('button[data-id]')
  if (!button) return

  currentId = button.dataset.id
  buildNSASelect()
  closeSearchModal()
}

function onSearchGlobalKeys(event) {
  if (event.key !== 'Escape') return
  if (el.searchModal.classList.contains('hidden')) return
  closeSearchModal()
}

/**
 * FIND NSA QUERY
 * @return array list
 */
function findNSAsByQuery(query) {
  if (!query || query.length < MIN_SEARCH_CHARS) return []

  const period = el.periodSelect.value
  let pool = [...nasas]

  if (period) {
    pool = pool.filter((n) => n.CollaborationPeriod === period)
  }

  return pool
    .filter((n) => {
      const id = String(n.id || '').toLowerCase()
      const titleEng = String(n.TitleENG || '').toLowerCase()
      const titleSpa = String(n.TitleSPA || '').toLowerCase()
      return id.includes(query) || titleEng.includes(query) || titleSpa.includes(query)
    })
    .sort((a, b) => String(a.TitleENG || '').localeCompare(String(b.TitleENG || '')))
}

/**
 * LIST MODAL SEARCH RESULTS
 */
function renderSearchModalResults(results, query) {
  const t = UI[currentLang]
  if (!query || query.length < MIN_SEARCH_CHARS) {
    // el.searchModalResults.innerHTML = `<div class="search-message">${escapeHtml(t.searchMinChars)}</div>`
    el.searchModalResults.innerHTML = `<div class="search-message"></div>`
    return
  }

  if (!results.length) {
    el.searchModalResults.innerHTML = `<div class="search-message">${escapeHtml(t.searchNoResults)}</div>`
    return
  }

  el.searchModalResults.innerHTML = results
    .map((n) => {
      const title = currentLang === 'en' ? n.TitleENG || n.TitleSPA || '-' : n.TitleSPA || n.TitleENG || '-'
      return `
        <button class="search-result-item" type="button" data-id="${escapeHtml(String(n.id))}">
          <span class="search-result-id">#${escapeHtml(String(n.id))}</span>${escapeHtml(title)}
          <span class="search-result-sub">${escapeHtml(n.CollaborationPeriod || '-')}</span>
        </button>
      `
    })
    .join('')
}

function updateSearchTriggerLabel() {
  const t = UI[currentLang]
  const nsa = nasas.find((n) => String(n.id) === String(currentId))
  if (!nsa) {
    el.searchOpen.textContent = t.searchOpen
    return
  }

  const title = currentLang === 'en' ? nsa.TitleENG || nsa.TitleSPA || '-' : nsa.TitleSPA || nsa.TitleENG || '-'
  el.searchOpen.textContent = `${title}`
}

/**
 * FINANCIAL ECHARTS
 */
function renderFinancialCharts(nsa) {
  const canvas = document.getElementById('financialBarChart')
  if (!canvas) return

  const wrapper = canvas.closest('.chart-wrapper') || canvas.parentElement

  // remove msg antiga sempre que renderizar
  const oldMsg = wrapper.querySelector('.no-financial-data')
  if (oldMsg) oldMsg.remove()

  const income = toNumber(nsa.FinAnnualIncome)
  const expenses = toNumber(nsa.FinAnnualExpenses)
  const assets = toNumber(nsa.FinAssets)

  const values = [income, expenses, assets]

  // 👇 IMPORTANTE: evite “fingir 0” quando o dado vem vazio
  // Se teu toNumber("") retorna 0, isso engana. Então detecta vazio aqui:
  const raw = [nsa.FinAnnualIncome, nsa.FinAnnualExpenses, nsa.FinAssets]
  const hasAnyRaw = raw.some((v) => String(v ?? '').trim() !== '')

  if (!hasAnyRaw) {
    if (barChart) barChart.destroy()
    barChart = null

    const msg = document.createElement('div')
    msg.className = 'no-financial-data'
    msg.textContent = 'No financial data reported.'
    wrapper.appendChild(msg)
    return
  }

  // plugin e charts (seu plugin, só com guarda pra não escrever "undefined")
  const valueLabelsPlugin = {
    id: 'valueLabelsPlugin',
    afterDatasetsDraw(chart) {
      const { ctx } = chart
      ctx.save()
      ctx.font = '12px Arial'
      ctx.fillStyle = '#333'
      ctx.textAlign = 'center'

      chart.data.datasets.forEach((dataset, di) => {
        const meta = chart.getDatasetMeta(di)
        meta.data.forEach((bar, i) => {
          const value = dataset.data[i]
          if (value === null || value === undefined) return
          const label = formatNumber(value)
          ctx.fillText(label, bar.x, bar.y - 8)
        })
      })

      ctx.restore()
    },
  }

  if (barChart) barChart.destroy()

  barChart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: [UI[currentLang].annualIncome, UI[currentLang].annualExpenses, UI[currentLang].assets],
      datasets: [
        {
          label: 'USD',
          data: values,
          backgroundColor: ['#2ecc71', '#e74c3c', '#3498db'],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false, // 👈 ajuda muito em layout com wrapper alto
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => `USD ${formatNumber(ctx.raw)}`,
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { callback: (v) => formatNumber(v) },
        },
      },
    },
    plugins: [valueLabelsPlugin],
  })
}

function renderNSAProfile(nsa) {
  const infoEl = document.getElementById('nsa-info')
  el.nsaTitle.innerText = currentLang === 'en' ? nsa.TitleENG || '-' : nsa.TitleSPA || '-'

  el.nsaSubtitle.innerText = `ID: ${nsa.id} • ${currentLang === 'en' ? nsa.NSAOrganizationTypeENG : nsa.NSAOrganizationTypeSPA} ${nsa.CollaborationPeriod || '-'}`

  if (!infoEl) return

  // infoIdentity
  const infoIdentity = `
  <div class="field">
    <h3 id="uiIdentityTitle">${UI[currentLang].identityTitle}</h3>
  
    <dl class="kv">
      <dt>${UI[currentLang].website}</dt>
      <dd><a href="${nsa.NSAWebsite}" target="_blank" >${nsa.NSAWebsite}</a></dd>
  
      <dt>${UI[currentLang].foundationYear}</dt>
      <dd>${nsa.NSAYearOfEstablishment || '-'}</dd>
  
      <dt>${UI[currentLang].orgType}</dt>
      <dd>${currentLang === 'en' ? nsa.NSAOrganizationTypeENG || '-' : nsa.NSAOrganizationTypeSPA || '-'}</dd>
  
      <dt>${UI[currentLang].period}</dt>
      <dd>${nsa.CollaborationPeriod || '-'}</dd>
  
      <dt>${UI[currentLang].typeOfSubmission}</dt>
      <dd>${currentLang === 'en' ? nsa.TypeOfSubmissionENG || '-' : nsa.TypeOfSubmissionSPA || '-'}</dd>
    </dl>
  </div>`

  // infoPoints
  const infoPoints = `
  <div class="field">
    <h3>${UI[currentLang].focalTitle}</h3>
  
    <dl class="kv">
      <dt>${UI[currentLang].pahoFocal}</dt>
      <dd>${nsa.PAHOFocalPoint || '-'}</dd>
  
      <dt>${UI[currentLang].nsaFocal}</dt>
      <dd>${nsa.NSAFocalpoint || '-'}</dd>
  
      <dt>${UI[currentLang].nsaFocalRole}</dt>
      <dd>${currentLang === 'en' ? nsa.NSAFocalpointRoleENG || '-' : nsa.NSAFocalpointRoleSPA || '-'}</dd>  
      <dt>${UI[currentLang].contactEmail}</dt>
      <dd>${nsa.NSAContactEmail || '-'}</dd>
    </dl>
  </div>`

  // Objectives and Main work activities
  const description = `
  <div class="field">
    <h3>${UI[currentLang].descTitle}</h3>
    <h5>${UI[currentLang].objectives}</h5>
    <p class="kv">
     <dt>${currentLang === 'en' ? nsa.NSAObjectivesENG : nsa.NSAObjectivesSPA}</dt>
    </p>

    <h5>${UI[currentLang].workFields}</h5>
      <p class="kv">
     <dt>${currentLang === 'en' ? nsa.NSAWorkFieldsENG : nsa.NSAWorkFieldsSPA}</dt>
    </p>
  </div>
  `
  // Governance & formal relations
  const formalRelations = `
  <div class="field">
    <h3>${UI[currentLang].governanceTitle}</h3>
    <h5>${UI[currentLang].board}</h5>

    <p class="kv">
     <dt>${currentLang === 'en' ? nsa.NSABoardMembersENG : nsa.NSABoardMembersSPA}</dt>
    </p>

    <h5>${UI[currentLang].bodies}</h5>
      <p class="kv">
     <dt>${currentLang === 'en' ? nsa.NSAOrganizationBodiesENG : nsa.NSAOrganizationBodiesENG}</dt>
    </p>
  </div>
  `

  // injecta os cars n DOM
  infoEl.innerHTML = `
    <div class="nsa-grid">
    ${infoIdentity}
    ${infoPoints}
    ${description}
    ${formalRelations}
    </div>
  `
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
  setText('searchNSA', t.search)
  setText('nsa-select-input', t.selectInput)
  setText('brand-title', t.brandTitle)
  setText('profileTitle', t.profileTitle)
  setText('uiFinTitle', t.navFinancials)
  setText('wpTitle', t.wpTitle)
  setText('profileSubtitle', t.wpSubtitle)
  setText('uiFinSubtitle', t.finSubtitle)
  setText('collabTitle', t.collabTitle)
  setText('collabSubtitle', t.collabSubtitle)
  el.searchModalInput.placeholder = t.searchMinChars

  updateSearchTriggerLabel()
  updateBrandLogo()
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

function updateBrandLogo() {
  const logo = document.getElementById('logobrand')
  if (!logo) return

  const map = {
    en: './assets/img/logo-en.png',
    es: './assets/img/logo-esp.png',
  }

  logo.src = map[currentLang] || map.en
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


/**
 * Busca dados JSON de uma URL com tratamento completo de erros
 * @param {string} url - Endpoint ou arquivo JSON
 * @returns {Promise<object|null>} - Retorna dados ou null em caso de erro
 */
async function fetchJson(url) {
  try {
    // Validação básica de URL
    if (!url || typeof url !== 'string') {
      throw new Error('URL inválida ou não informada')
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    })

    // Trata HTTP errors (404, 500…)
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Recurso não encontrado (404): ${url}`)
      }

      if (response.status >= 500) {
        throw new Error(`Erro interno do servidor (${response.status})`)
      }

      throw new Error(`Erro HTTP: ${response.status}`)
    }

    // Verifica se é JSON válido
    const contentType = response.headers.get('content-type')

    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Resposta não é um JSON válido')
    }

    const data = await response.json()

    return data
  } catch (error) {
    console.error('❌ fetchJson erro:', error.message)
    return null
  }
}
