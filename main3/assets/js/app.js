import UI from './ui-language.js'
const nasas = await fetchJson('./assets/database/nsa.json')
const activity = await fetchJson('./assets/database/activity.json') // Collaboration with PAHO
const workplan = await fetchJson('./assets/database/workplan.json')

/* === State === */
let currentLang = 'en'
let currentId = 62 // 6
let barChart = null
const MIN_SEARCH_CHARS = 1
const DEBUG = true

/* == UI - Elements == */
const el = {
  langToggle: document.getElementById('lang-toggle'),
  searchInput: document.getElementById('searchInput'),
  searchResults: document.getElementById('search-results'),
  nsaSelect: document.getElementById('nsa-select'),
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
  workplansCard: document.getElementById('workplans-card'),
  financialCard: document.getElementById('financial_card'),
}

init()

/**
 * ELEMENTOS INICIAIS
 */
function init() {
  // buildNSASelect()
  buildPeriodSelect()

  const langToggle = document.querySelectorAll('.lang-toggle')

  langToggle.forEach((val) => {
    val.addEventListener('click', (e) => {
      const clickLang = e.target.dataset.lan
      // console.log(clickLang)
      //  currentLang = currentLang === 'en' ? 'es' : 'en'
      currentLang = clickLang
      //  el.langToggle.innerText = currentLang === 'en' ? 'ES' : 'EN'
      render()
    })
  })

  el.searchInput.addEventListener('input', handleSearchInput)
  el.searchResults.addEventListener('click', onSearchResultClick)

  el.periodSelect.addEventListener('change', () => {
      buildNSASelect()
    clearSearchResults()
  })

  el.clear.addEventListener('click', () => {
    el.filterActivities.checked = true
    el.filterWorkplans.checked = true
    render()
  })

  // seta default no select
  render()
}

/**
 * FILTER SELECTED NSA
 */

function buildNSASelect() {
  const sorted = getFilteredNasas().sort((a, b) => String(a.TitleENG || '').localeCompare(String(b.TitleENG || '')))

  el.nsaSelect.innerHTML = sorted
    .map((n) => {
      const label = `${n.TitleENG || n.TitleSPA || 'Untitled'}`
      return `<option value="${n.id}">${escapeHtml(label)}</option>`
    })
    .join('')

  // se o atual não existir mais no filtro, seleciona o primeiro
  if (!sorted.find((n) => Number(n.id) === Number(currentId))) {
    currentId = sorted.length ? sorted[0].id : ''
  }

  el.nsaSelect.value = String(currentId)
  render()
}
 

function getFilteredNasas() {
  const selectedPeriod = el.periodSelect.value
  let filtered = [...nasas]

  if (selectedPeriod) {
    filtered = filtered.filter((n) => n.CollaborationPeriod === selectedPeriod)
  }

  return filtered
}

function handleSearchInput(event) {
  const term = String(event.target.value || '')
    .trim()
    .toLowerCase()

  if (term.length < MIN_SEARCH_CHARS) {
    clearSearchResults()
    return
  }

  const matches = getFilteredNasas()
    .filter((n) => {
      const titleEng = String(n.TitleENG || '').toLowerCase()
      const titleEngSpa = String(n.TitleENGSPA || '').toLowerCase()
      return titleEng.includes(term) || titleEngSpa.includes(term)
    })
    .sort((a, b) => String(a.TitleENG || '').localeCompare(String(b.TitleENG || '')))
    .slice(0, 30)

  renderSearchResults(matches)
}

function renderSearchResults(results) {
  if (!results.length) {
    el.searchResults.innerHTML = `<li>No results found</li>`
    return
  }

  el.searchResults.innerHTML = results
    .map((n) => {
      const label = n.TitleENG || n.TitleENGSPA || n.Title || 'Untitled'
      return `<li data-id="${n.id}">${escapeHtml(label)}</li>`
    })
    .join('')
}

function clearSearchResults() {
  el.searchResults.innerHTML = ''
}

function onSearchResultClick(event) {
  const item = event.target.closest('li[data-id]')
  if (!item) return

  currentId = Number(item.dataset.id)
  clearSearchResults()
  el.searchInput.value = ''
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
    console.log('Collaboration with PAHO activities', allActivities)
    console.log('Workplans', allWorkplans)
    console.log(`========================`)
  }
  /*   if (allWorkplans.length === 0) {
    alert('sem allWorkplans')
  } */

  /* === NSA PROFILE === */
  renderNSAProfile(nsa)
  const isProcessReportType = nsa.TypeOfSubmission.includes('Progress Report - Reporte de Progreso')

  /**
   * @see when is Progress Report:
   * not show financial report card
   * Workplan for the next three years hide tudo
   * só mostrar o ano mais recente
   */
  if (isProcessReportType) {
    el.financialCard.classList.add('none')
    el.workplansCard.classList.add('none')
  } else {
    el.financialCard.classList.remove('none')
    el.workplansCard.classList.add('none')
    renderFinancialCharts(nsa) // Financial information
  }

  /* === NSA Collaboration with PAHO === */
  renderActivities(allActivities)

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

/**
 * FINANCIAL  information - ECHARTS
 */
function renderFinancialCharts(nsa) {
  const canvas = document.getElementById('financialBarChart')
  const FinAnnualIncomeYear = document.getElementById('FinAnnualIncomeYear')
  if (!canvas) return
  FinAnnualIncomeYear.innerHTML = `<div class="field_fiscal">
    <h3>${UI[currentLang].fiscalYear}</h3>
    <p>${nsa.FinAnnualIncomeYear}</p>
    </div>`
  const wrapper = canvas.closest('.chart-wrapper') || canvas.parentElement

  // remove msg antiga sempre que renderizar
  const oldMsg = wrapper.querySelector('.no-financial-data')
  if (oldMsg) oldMsg.remove()

  const income = toNumber(nsa.FinAnnualIncome)
  const expenses = toNumber(nsa.FinAnnualExpenses)
  const assets = toNumber(nsa.FinAssets)

  const values = [income, expenses, assets]

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
      maintainAspectRatio: false,
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
  el.nsaTitle.innerText = currentLang === 'en' ? nsa.TitleENG || '-' : nsa.TitleENGSPA || '-'

  /*   el.nsaSubtitle.innerText = `${currentLang === 'en' ? nsa.NSAOrganizationTypeENG : nsa.NSAOrganizationTypeSPA} ${nsa.CollaborationPeriod || '-'}` */
  //el.nsaSubtitle.innerText = `${nsa.NSAOrganizationType}`
  el.nsaSubtitle.innerText = `${nsa.TypeOfSubmission}`

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
     <dt>${currentLang === 'en' ? nsa.NSAObjetivesENG : nsa.NSAObjectives}</dt>
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
     <dt>${currentLang === 'en' ? nsa.NSAOrganizationBodiesENG : nsa.NSAOrganizationBodiesSPA}</dt>
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

  // navigation
  setText('profileTitlenav', t.navProfile)
  setText('financialnav', t.navFinancials)
  setText('CollaborationNav', t.navCollaboration)
  setText('WorkplansNav', t.navWorkplan)
  setText('navTitle', t.navTitle)

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
    console.error('fetchJson erro:', error.message)
    return null
  }
}
