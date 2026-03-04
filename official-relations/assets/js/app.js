import UI from './ui-language.js'
const [nasasData, activity, workplan] = await Promise.all([
  fetchJson('./assets/database/nsa.json'),
  fetchJson('./assets/database/activity.json'), // Collaboration with PAHO
  fetchJson('./assets/database/workplan.json'),
])
/* === ONLY COMPLETED NAS === */
const nasas = []
for (let i = 0, len = nasasData.length; i < len; i += 1) {
  const item = nasasData[i]
  if (item && item.Status === 'Completed') nasas.push(item)
}

/* === State === */
let currentLang = 'en'
let currentId = 51 // 51 default value or fallback is first
let barChart = null
const MIN_SEARCH_CHARS = 1
const DEBUG = true // modo dev

const filters = {
  term: '',
  typeOfSubmission: '',
  organizationType: '',
  period: '',
}

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
  financialnav: document.querySelector('.financialnav'),
  typeOfSubmissionTypeInput: document.getElementById('typeOfSubmission-type-input'),
  organizationTypeInput: document.getElementById('organization-type-input'),
  collabWPActHealthAgendaObj: document.getElementById('collabWPActHealthAgendaObj'),
  strategicPlan: document.getElementById('strategicPlan'),
}

init()

/**
 * ELEMENTOS INICIAIS
 */
function init() {
  buildPeriodSelect()
  buildTypeOfSubmissionTypeInput(nasas)

  // toggle language
  const langToggle = document.querySelectorAll('.lang-toggle')
  langToggle.forEach((val) => {
    val.addEventListener('click', (e) => {
      const clickLang = e.target.dataset.lan
      currentLang = clickLang
      render()
    })
  })

  el.searchInput.addEventListener('input', handleSearchInput)
  el.searchInput.addEventListener('focus', showSearchResults)
  el.searchInput.addEventListener('click', onSearchInputClick)
  el.searchResults.addEventListener('click', onSearchResultClick)
  document.addEventListener('pointerdown', handleOutsideSearchClick)
  window.addEventListener('resize', setSearchResultsPosition)

  el.periodSelect.addEventListener('change', () => {
    clearSearchResults()
  })

  // default no select
  setSearchResultsPosition()
  render()
}

/**
 * Apply Filters
 */
function applyFilters() {
  const term = filters.term

  const matches = nasas
    .filter((n) => {
      /* === FILTER typeOfSubmission === */
      if (filters.typeOfSubmission && String(n.TypeOfSubmission || '') !== filters.typeOfSubmission) {
        return false
      }

      /* === FILTER organizationType (includes) === */
      if (filters.organizationType) {
        const orgType = String(n.NSAOrganizationType || '').toLowerCase()

        if (!orgType.includes(filters.organizationType.toLowerCase())) {
          return false
        }
      }

      /* === FILTER term === */
      if (filters.period && String(n.CollaborationPeriod || '') !== filters.period) {
        return false
      }
      if (term.length >= MIN_SEARCH_CHARS) {
        const titleEng = String(n.TitleENG || '').toLowerCase()
        const titleSpa = String(n.TitleENGSPA || '').toLowerCase()

        return titleEng.includes(term) || titleSpa.includes(term)
      }

      return true
    })
    .sort((a, b) => String(a.TitleENG || '').localeCompare(String(b.TitleENG || '')))
    .slice(0, 30)

  renderSearchResults(matches)
}

/*  =================  SELECT FILTER EVENTS ====================== */

// search input
el.searchInput.addEventListener('input', (e) => {
  filters.term = String(e.target.value || '')
    .trim()
    .toLowerCase()
  applyFilters()
})

el.typeOfSubmissionTypeInput.addEventListener('change', (e) => {
  const value = String(e.target.value || '').trim()
  if (DEBUG) console.log(`typeOfSubmissionTypeInput`, value)
  filters.typeOfSubmission = value.toLowerCase() === 'all' ? '' : value
  if (!value.toLowerCase().includes('Progress Report - Reporte de Progreso')) {
    el.financialnav.classList.remove('none')
  } else {
    el.financialnav.classList.add('none')
  }
  applyFilters()
})

el.organizationTypeInput.addEventListener('change', (e) => {
  const value = String(e.target.value || '').trim()
  filters.organizationType = value.toLowerCase() === 'all' ? '' : value
  applyFilters()
})

el.periodSelect.addEventListener('change', (e) => {
  const selectedPeriod = String(e.target.value || '').trim()
  filters.period = selectedPeriod.toLowerCase() === 'all' ? '' : selectedPeriod
  applyFilters()
})

/* RESET DOS FILTERS AND SELECT */
el.clear.addEventListener('click', () => {
  filters.term = ''
  filters.typeOfSubmission = ''
  filters.organizationType = ''
  filters.period = ''

  el.typeOfSubmissionTypeInput.selectedIndex = 0
  el.organizationTypeInput.selectedIndex = 0
  el.periodSelect.selectedIndex = 0

  render()
})

/* ================= Renders  ================= */
/**
 * Render the selecte NSA
 */
function render() {
  if (!currentId) currentId = nasas[0].id // se nao foi definido current id pega o first do array
  const nsa = nasas.find((n) => Number(n.id) === Number(currentId))

  if (!nsa) {
    el.nsaTitle.innerText = 'NSA not found'
    el.nsaSubtitle.innerText = ''
    el.nsaInfo.innerHTML = ''
    el.activities.innerHTML = ''
    el.workplans.innerHTML = ''
    //  el.disclaimer.innerText = DISCLAIMER[currentLang]
    return
  }
  const allActivities = activity.filter((a) => String(a.ParentID) === String(currentId))
  const allWorkplans = workplan.filter((w) => String(w.ParentID) === String(currentId))

  // if necessary add aqui tratativa se todos os 3 relacionamentos foram encontrados
  if (DEBUG) {
    console.groupCollapsed('DEBUG ')
    console.log('nsa', nsa)
    console.log('nsa', nasas)
    console.log('Collaboration with PAHO activities', allActivities)
    console.log('Workplans', allWorkplans)
    console.groupEnd()
  }

  /**
   * =============================================  NSA Profile =============================================
   * Find NSAFocalpoint from allActivities || Find allWorkplans
   */
  const firstActivityWithNSAFocalpoint = allActivities.find((item) => item && item.NSAFocalpoint)
  const segundActivityWithNSAFocalpoint = allWorkplans.find((item) => item && item.NSAFocalpoint)
  let nsaFocalpoint = firstActivityWithNSAFocalpoint?.NSAFocalpoint || segundActivityWithNSAFocalpoint?.NSAFocalpoint || null
  renderNSAProfile(nsa, nsaFocalpoint)

  /* === NSA is Process ReportType  */
  const isProcessReportType = nsa.TypeOfSubmission.includes('Progress Report - Reporte de Progreso')
  const isNewAppType = nsa.TypeOfSubmission.includes('New Application - Nueva Aplicación')
  if (isNewAppType) {
  }

  if (isProcessReportType) {
    // when is progress report the title is different
    setText('collabSubtitle', UI[currentLang].collabSubtitleProgresReport)
  } else if (isNewAppType) {
    setText('collabSubtitle', UI[currentLang].collabSubtitleNewApp)
  } else {
    setText('collabSubtitle', UI[currentLang].collabSubtitle)
  }

  /**
   * ===================================  Financial information ===================================
   * @see when is Progress Report:
   * not show financial report card - Workplan for the next three years hide tudo
   */
  if (isProcessReportType) {
    if (DEBUG) console.log(`isProcessReportType`, isProcessReportType)

    el.financialCard.classList.add('none')
    el.workplansCard.classList.add('none')
    el.financialnav.classList.add('none')
  } else {
    el.financialCard.classList.remove('none')
    el.financialnav.classList.remove('none')
    el.workplansCard.classList.remove('none')
    renderFinancialCharts(nsa)
  }

  /**
   * =================  Collaboration with PAHO - activities ======================
   * Find CollabWPActHealthAgenda from nsa || Find HealthAgenda from allWorkplans (Goals - Metas)
   */
  const preferredAgendaFromNsa = currentLang === 'en' ? nsa.CollabWPActHealthAgenda_txtENG : nsa.CollabWPActHealthAgenda_txtSPA
  const preferredAgendaFromWorkplan = currentLang === 'en' ? allWorkplans?.HealthAgendaENG : allWorkplans?.HealthAgendaSPA
  const collabWPActHealthAgendaSource = preferredAgendaFromNsa || preferredAgendaFromWorkplan

  let collabWPActHealthAgendaObj = collabWPActHealthAgendaSource ? (Array.isArray(collabWPActHealthAgendaSource) ? collabWPActHealthAgendaSource : [collabWPActHealthAgendaSource]) : []

  collabWPActHealthAgendaObj = collabWPActHealthAgendaObj.flatMap((item) => {
    if (typeof item !== 'string') return [item]
    if (item.includes(';')) {
      return item
        .split(';')
        .map((part) => part.trim())
        .filter(Boolean)
    }

    if ((item.match(/Goal\s+\d+:/g) || []).length > 1) {
      return item
        .split(/(?=Goal\s+\d+:)/)
        .map((part) => part.trim())
        .filter(Boolean)
    }

    return [item]
  })
  rendercollabWPActHealthAgendaObj(collabWPActHealthAgendaObj)
  if (DEBUG) {
    console.groupCollapsed('CollabWPActHealthAgenda ')
    console.log(`Goals preferredAgendaFromNsa`, preferredAgendaFromNsa)
    console.log(`Goals preferredAgendaFromWorkplan`, preferredAgendaFromWorkplan)
    console.warn(`collabWPActHealthAgendaObj`, collabWPActHealthAgendaObj)
    console.groupEnd()
  }

  /**
   * @section Collaboration with PAHO - activities
   * when is progress report get activities from workplan
   */
  if (isProcessReportType) {
    renderActivitiesFromWorkplan(allWorkplans)
  } else {
    renderActivities(allActivities)
  }

  /**
   * @section Collaboration with PAHO - strategic Plans
   * Find CollabWPActStrategicPlan from nsa || StrategicPlanENG from allWorkplans
   */
  const strategicPlanFromNSA = currentLang == 'en' ? nsa.CollabWPActStrategicPlan_txtENG : nsa.CollabWPActStrategicPlan_txtSPA // vem como string
  const strategicPlanFromWork = currentLang == 'en' ? allWorkplans[0].StrategicPlanENG : allWorkplans[0].StrategicPlanSPA // pode vim como um array mas so é preciso do first index

  let renderStrategicPlanOBJ = [strategicPlanFromNSA] || strategicPlanFromWork || null

  renderStrategicPlanOBJ = renderStrategicPlanOBJ.flatMap((item) => {
    if (typeof item !== 'string') return [item]
    if (item.includes(';')) {
      return item
        .split(';')
        .map((part) => part.trim())
        .filter(Boolean)
    }

    if ((item.match(/Goal\s+\d+:/g) || []).length > 1) {
      return item
        .split(/(?=Goal\s+\d+:)/)
        .map((part) => part.trim())
        .filter(Boolean)
    }

    return [item]
  })

  if (DEBUG) {
    console.log(`strategicPlanFromNSA =>`, strategicPlanFromNSA)
    console.log(`strategicPlanFromWork =>`, strategicPlanFromWork)
    console.log(`renderStrategicPlanOBJ final`, renderStrategicPlanOBJ)
  }

  renderStrategicPlan(renderStrategicPlanOBJ)

  /* === NSA workplans children === */
  renderWorkplans(allWorkplans)

  applyLanguage()
}

/**
 * Render renderActivities from @activities
 * @return html
 */
function renderActivities(list) {
  if (!list.length) {
    el.activities.innerHTML = `<p class="meta">No activities found for this nas.</p>`
    return
  }

  el.activities.innerHTML = list
    .map((w) => {
      const directResults = currentLang === 'en' ? w.DirectResultsENG : w.DirectResultsSPA
      const DescriptionENG = currentLang === 'en' ? w.DescriptionENG : w.DescriptionSPA

      /*  return `
        <div class="item">
          <p><strong>${UI[currentLang].descTitle}:</strong> ${DescriptionENG} </p>           
          <p><strong>${UI[currentLang].thResults}:</strong> ${directResults}</p>
          <p><strong>${UI[currentLang].thResp}:</strong> : ${w.Entity}</p>          
        </div>
      ` */
      return `
      <div class="item">
        <p><strong>${UI[currentLang].descTitle}:</strong>  ${DescriptionENG}</p>
        <p><strong>${UI[currentLang].thResults}:</strong> ${directResults}</p>
        <p><strong>${UI[currentLang].thResp}:</strong> ${w.Entity}</p>
      </div>
      `
    })
    .join('')
}

/**
 * Render Activities from workplan when is Progress Report - Reporte de Progreso
 * @return html
 */
function renderActivitiesFromWorkplan(list) {
  if (!list.length) {
    el.activities.innerHTML = `<p class="meta">No activities found for this nas.</p>`
    return
  }

  el.activities.innerHTML = list
    .map((w) => {
      const directResults = currentLang === 'en' ? w.StrategicPlanENG : w.StrategicPlanSPA
      const ProgressReport = currentLang === 'en' ? w.ProgressReport : w.ProgressReport
      //console.log(`ProgressReport to cut`, ProgressReport)

      /*    return `
        <div class="item">
          <h4>${UI[currentLang].thEntity}: ${w.ResponsibleEntity}</h4>           
          <p><span class="lead">${UI[currentLang].thResults}:</span> ${directResults}</p>          
          <p><span class="lead">ProgressReport:</span> ${ProgressReport}</p>
        </div>
      ` */
      return `
      <div class="item">
        <p><strong>${UI[currentLang].descTitle}:</strong>  ${ProgressReport}</p>
        <p><strong>${UI[currentLang].thResults}:</strong> ${directResults}</p>
        <p><strong>${UI[currentLang].thResp}:</strong> ${w.ResponsibleEntity}</p>
      </div>
      `
    })
    .join('')
}

/**
 * Render workplans
 * @return html
 */
function renderWorkplans(list) {
  if (!list.length) {
    el.workplans.innerHTML = `<p class="meta">No workplans found for this nas.</p>`
    return
  }

  el.workplans.innerHTML = list
    .map((w) => {
      const desc = currentLang === 'en' ? w.DescriptionENG : w.DescriptionSPA
      const duration = currentLang === 'en' ? w.DurationENG : w.DurationSPA
      const HealthAgenda = currentLang === 'en' ? w.HealthAgendaENG : w.HealthAgendaSPA
      const ExpectedResults = currentLang === 'en' ? w.ExpectedResultsENG : w.ExpectedResultsSPA
      /* 
      return `
        <div class="item">         
          <h4>${UI[currentLang].thEntity}: ${w.ResponsibleEntity}</h4>
          ${dur ? `<p class="meta"><strong>${UI[currentLang].Duration}:</strong> ${escapeHtml(dur)}</p>` : ''}
          <p>${escapeHtml(desc || '').replace(/\n/g, '<br/>')}</p>
          <p>${UI[currentLang].HealthAgenda}: ${HealthAgenda ? HealthAgenda : '-'}</p>
        </div>
      ` */

      return `
      <div class="item">
        <p><strong>${UI[currentLang].descTitle}:</strong>  ${escapeHtml(desc || '').replace(/\n/g, '<br/>')}</p>
        <p><strong>${UI[currentLang].thResults}:</strong> ${ExpectedResults}</p>
        <p><strong>${UI[currentLang].thResp}:</strong> ${w.ResponsibleEntity}</p>
      </div>
      `
    })
    .join('')
}

/**
 * Render rendercollabWPActHealthAgendaObj (Collaboration with PAHO card)
 * @return html
 */
function rendercollabWPActHealthAgendaObj(list) {
  if (!list) {
    el.collabWPActHealthAgendaObj.innerHTML = `<p class="meta">No Health Agenda found for this nas.</p>`
    return
  }

  el.collabWPActHealthAgendaObj.innerHTML = `
    <h3>${UI[currentLang].Goal}</h3>
    ${list
      ?.map((val) => {
        return `
      <ul class="list-tag">
          <li  class="tag">${val}</li>
      </ul>`
      })
      .join('')}
  `
}

/**
 * Render strategicPlan (Collaboration with PAHO card)
 * @return html
 */
function renderStrategicPlan(list) {
  if (!list) {
    el.strategicPlan.innerHTML = `<p class="meta">No strategicPlan  found for this nas.</p>`
    return
  }

  el.strategicPlan.innerHTML = `
    <h3>${UI[currentLang].StrategicPlan}</h3>
    ${list
      ?.map((val) => {
        return `
      <ul class="list-tag">
        <li class="tag">${val}</li>
      </ul>`
      })
      .join('')}
  `
}

/**
 * Financial information - echarts
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
          backgroundColor: ['#3498db', '#236192', '#ff671f'],
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

function renderNSAProfile(nsa, nsafocalPoint) {
  const infoEl = document.getElementById('nsa-info')
  el.nsaTitle.innerText = currentLang === 'en' ? nsa.TitleENG || '-' : nsa.TitleENGSPA || '-'
  el.nsaSubtitle.innerText = `${nsa.TypeOfSubmission}`

  if (!infoEl) return

  /** Normaliza URL (fallback para https://) */
  const websiteLabel = String(nsa.NSAWebsite || '').trim()
  const websiteHref = websiteLabel ? (/^https?:\/\//i.test(websiteLabel) ? websiteLabel : `https://${websiteLabel}`) : ''

  // infoIdentity
  const infoIdentity = `
  <div class="field">
    <h3 id="uiIdentityTitle">${UI[currentLang].identityTitle}</h3>
  
    <dl class="kv">
      <dt>${UI[currentLang].website}</dt>
      
      <dd>${websiteHref ? `<a href="${websiteHref}" target="_blank" rel="noopener noreferrer">${websiteLabel}</a>` : '-'}</dd>
  
      <dt>${UI[currentLang].foundationYear}</dt>
      <dd>${nsa.NSAYearOfEstablishment || '-'}</dd>
  
      <dt>${UI[currentLang].orgType}</dt>
      <dd>${currentLang === 'en' ? nsa.NSAOrganizationType || '-' : nsa.NSAOrganizationType || '-'}</dd>
  
      <dt>${UI[currentLang].period}</dt>
      <dd>${nsa.CollaborationPeriod || '-'}</dd>
  
      <dt>${UI[currentLang].typeOfSubmission}</dt>
      <dd>${currentLang === 'en' ? nsa.TypeOfSubmission || '-' : nsa.TypeOfSubmission || '-'}</dd>
    </dl>
  </div>`

  // Focal points
  const infoPoints = `
  <div class="field">
    <h3>${UI[currentLang].focalTitle}</h3>
  
    <dl class="kv">
      <dt>${UI[currentLang].pahoFocal}</dt>
      <dd>${nsa.PAHOFocalPoint[0]?.LookupValue || '-'}</dd>
  
      <dt>${UI[currentLang].nsaFocal}</dt>
      <dd>${currentLang === 'en' ? nsafocalPoint || '-' : nsafocalPoint || '-'}</dd>  
      
      <dt>${UI[currentLang].nsaFocalRole}</dt>       
      <dd>${currentLang === 'en' ? nsa.NSAFocalpointRoleENG : nsa.NSAFocalpointRoleSPA}</dd>
     
    </dl>
  </div>`

  /*  email removed
   <dt>${UI[currentLang].contactEmail}</dt>
      <dd>${nsa.NSAContactEmail || '-'}</dd>
  */

  // objectives and main work activities
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
  infoEl.innerHTML = `
    <div class="nsa-grid">
    ${infoIdentity}
    ${infoPoints}
    ${description}
    ${formalRelations}
    </div>
  `
}

/* ================= Select Builds ================= */

// Build Collaboration period select options
function buildPeriodSelect() {
  const periods = nasas.map((n) => n.CollaborationPeriod).filter(Boolean) // removes null
  const unique = [...new Set(periods)].sort() // unique values
  if (DEBUG) console.log(`buildPeriodSelect`, unique)

  el.periodSelect.innerHTML = `
    <option value="all" id="buildperiodall">All</option>
    ${unique.map((p) => `<option value="${p}">${p}</option>`).join('')}
  `
}

// Build typeOfSubmissionTypeInput select options
function buildTypeOfSubmissionTypeInput(nasas) {
  const values = nasas.map((nsa) => nsa.TypeOfSubmission).filter(Boolean)
  const uniqueValues = [...new Set(values)]

  if (DEBUG) console.log(`buildTypeOfSubmissionTypeInput`, uniqueValues)

  // ordenar (opcional)
  uniqueValues.sort()

  el.typeOfSubmissionTypeInput.innerHTML = '<option value="">Select...</option>'
  el.typeOfSubmissionTypeInput.innerHTML = '<option value="all" id="typeOfSubmissionTypeInputAll">All</option>'

  uniqueValues.forEach((val) => {
    const option = document.createElement('option')
    option.value = val
    option.textContent = val
    el.typeOfSubmissionTypeInput.appendChild(option)
  })
}

/* ================= Functions - UI Functions  ================= */
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
  //setText('profileSubtitle', t.wpSubtitle)
  setText('uiFinSubtitle', t.finSubtitle)
  setText('collabTitle', t.collabTitle)

  // navigation
  setText('profileTitlenav', t.navProfile)
  setText('financialnav', t.navFinancials)
  setText('CollaborationNav', t.navCollaboration)
  /*   setText('WorkplansNav', t.navWorkplan) */
  setText('navTitle', t.navTitle)
  setText('organization-type', t.orgType)
  setText('organization-all', t.all)
  setText('typeOfSubmissionTypeInputAll', t.all)
  setText('TypeOfSubmission-type', t.typeOfSubmission)
  setText('buildperiodall', t.all)
  setText('clear-filters', t.clear)

  el.searchInput.placeholder = t.searchPh

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

// dropdown de busca sempre logo abaixo do #searchInput, mesmo com mudanças de layout/resize.
function setSearchResultsPosition() {
  if (!el.searchInput || !el.searchResults) return
  const top = el.searchInput.offsetTop + el.searchInput.offsetHeight
  el.searchResults.style.setProperty('--search-results-top', `${top}px`)
}

function clearSearchResults() {
  el.searchResults.innerHTML = ''
}

/**
 * Handler the filter nasas
 */
function handleSearchInput(event) {
  const term = String(event.target.value || '')
    .trim()
    .toLowerCase()

  if (term.length < MIN_SEARCH_CHARS) {
    if (DEBUG) console.log(`input is clean`)
    showSearchResults()
    return
  }
  const matches = nasas
    .filter((n) => {
      const titleEng = String(n.TitleENG || '').toLowerCase()
      const titleEngSpa = String(n.TitleENGSPA || '').toLowerCase()
      return titleEng.includes(term) || titleEngSpa.includes(term)
    })
    .sort((a, b) => String(a.TitleENG || '').localeCompare(String(b.TitleENG || '')))

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

function showSearchResults() {
  setSearchResultsPosition()
  const term = String(el.searchInput.value || '')
    .trim()
    .toLowerCase()
  const periodFilter = typeof filters.period === 'object' && filters.period !== null ? String(filters.period.CollaborationPeriod || filters.period.value || '') : String(filters.period || '')
  const normalizedPeriodFilter = periodFilter.trim().toLowerCase()

  const matches = nasas
    .filter((n) => {
      if (filters.typeOfSubmission && String(n.TypeOfSubmission || '') !== filters.typeOfSubmission) {
        return false
      }

      if (filters.organizationType) {
        const orgType = String(n.NSAOrganizationType || '').toLowerCase()
        if (!orgType.includes(filters.organizationType.toLowerCase())) {
          return false
        }
      }

      if (
        normalizedPeriodFilter &&
        String(n.CollaborationPeriod || '')
          .trim()
          .toLowerCase() !== normalizedPeriodFilter
      ) {
        return false
      }

      if (!term) return true

      const titleEng = String(n.TitleENG || '').toLowerCase()
      const titleEngSpa = String(n.TitleENGSPA || '').toLowerCase()
      return titleEng.includes(term) || titleEngSpa.includes(term)
    })
    .sort((a, b) => String(a.TitleENG || '').localeCompare(String(b.TitleENG || '')))

  renderSearchResults(matches)
}

function onSearchInputClick(event) {
  event.stopPropagation()
  showSearchResults()
}

function onSearchResultClick(event) {
  const item = event.target.closest('li[data-id]')
  if (!item) return

  currentId = Number(item.dataset.id)
  clearSearchResults()
  el.searchInput.value = ''
  render()
}

function handleOutsideSearchClick(event) {
  const target = event.target
  if (!(target instanceof Element)) return

  const clickedInsideInput = target.closest('#searchInput')
  const clickedInsideResults = target.closest('#search-results')

  if (clickedInsideInput || clickedInsideResults) return

  el.searchInput.value = ''
  filters.term = ''
  clearSearchResults()
}

/**
 * Busca dados JSON de uma URL com tratamento completo de erros
 * @param {string} url - Endpoint ou arquivo JSON
 * @returns {Promise<object|null>} - Retorna dados ou null em caso de erro
 */
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

    // HTTP errors (404, 500…)
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Recurso não encontrado (404): ${url}`)
      }

      if (response.status >= 500) {
        throw new Error(`Erro interno do servidor (${response.status})`)
      }

      throw new Error(`Erro HTTP: ${response.status}`)
    }
    // JSON válido
    const contentType = response.headers.get('content-type')

    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Resposta não é um JSON válido')
    }

    const data = await response.json()

    return data
  } catch (error) {
    console.error('fetchJson erro:', error.message)
  }
}
