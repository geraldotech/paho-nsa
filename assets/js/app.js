/**
 * @timestamp 06/03/2025 10:17
 */

import UI from './ui-language.js'

const [nasasData, activity, workplan] = await Promise.all([
  fetchJson('./assets/database/nsa.json'),
  fetchJson('./assets/database/activity.json'),
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
let currentId = 18
let barChart = null
const MIN_SEARCH_CHARS = 1
const DEBUG = true

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
  card03: document.getElementById('card03'),
  card04: document.getElementById('card04'),
  landingDisclaimer2: document.getElementById('landingDisclaimer2'),
  landingDisclaimer: document.getElementById('landingDisclaimer'),
  landingDisclaimerTop: document.getElementById('landingDisclaimerTop'),
}

init()

function init() {
  buildPeriodSelect()
  buildTypeOfSubmissionTypeInput(nasas)

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

  setSearchResultsPosition()
  render()
}

function applyFilters() {
  const term = filters.term

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

/* ================= SELECT FILTER EVENTS ================= */

el.searchInput.addEventListener('input', (e) => {
  filters.term = String(e.target.value || '')
    .trim()
    .toLowerCase()
  applyFilters()
})

el.typeOfSubmissionTypeInput.addEventListener('change', (e) => {
  const value = String(e.target.value || '').trim()
  if (DEBUG) console.log('typeOfSubmissionTypeInput', value)
  filters.typeOfSubmission = value.toLowerCase() === 'all' ? '' : value

  if (!value.toLowerCase().includes('progress report - reporte de progreso')) {
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

/* ================= Renders ================= */

function render() {
  if (!currentId) currentId = nasas[0]?.id
  const nsa = nasas.find((n) => Number(n.id) === Number(currentId))

  if (!nsa) {
    el.nsaTitle.innerText = 'NSA not found'
    el.nsaSubtitle.innerText = ''
    el.nsaInfo.innerHTML = ''
    el.activities.innerHTML = ''
    el.workplans.innerHTML = ''
    el.collabWPActHealthAgendaObj.innerHTML = ''
    el.strategicPlan.innerHTML = ''
    if (el.card03) el.card03.innerHTML = ''
    if (el.card04) el.card04.innerHTML = ''
    el.landingDisclaimerTop?.classList.add('none')
    el.landingDisclaimer2?.classList.add('none')
    el.landingDisclaimer?.classList.add('none')
    return
  }

  const allActivities = activity.filter((a) => String(a.ParentID) === String(currentId))
  const allWorkplans = workplan.filter((w) => String(w.ParentID) === String(currentId))
  const firstWorkplan = allWorkplans[0] || null

  if (DEBUG) {
    console.groupCollapsed('DEBUG')
    console.log('nsa', nsa)
    console.log('allActivities', allActivities)
    console.log('allWorkplans', allWorkplans)
    console.groupEnd()
  }

  const firstActivityWithNSAFocalpoint = allActivities.find((item) => item && item.NSAFocalpoint)
  const secondActivityWithNSAFocalpoint = allWorkplans.find((item) => item && item.NSAFocalpoint)
  const nsaFocalpoint =
    firstActivityWithNSAFocalpoint?.NSAFocalpoint || secondActivityWithNSAFocalpoint?.NSAFocalpoint || null

  const submissionType = String(nsa.TypeOfSubmission || '')
  const isProcessReportType = submissionType.includes('Progress Report - Reporte de Progreso')
  const isNewAppType = submissionType.includes('New Application - Nueva Aplicación')

  renderNSAProfile(nsa, nsaFocalpoint, isProcessReportType)

  /* disclaimer behavior */
  el.landingDisclaimerTop?.classList.add('none')
  el.landingDisclaimer2?.classList.remove('none')
  el.landingDisclaimer?.classList.remove('none')

  if (isProcessReportType) {
    setText('collabSubtitle', UI[currentLang].collabSubtitleProgresReport)
    el.landingDisclaimerTop?.classList.remove('none')
    el.landingDisclaimer2?.classList.add('none')
    el.landingDisclaimer?.classList.add('none')
  } else if (isNewAppType) {
    setText('collabSubtitle', UI[currentLang].collabSubtitleNewApp)
  } else {
    setText('collabSubtitle', UI[currentLang].collabSubtitle)
  }

  if (isProcessReportType) {
    if (DEBUG) console.log('isProcessReportType', isProcessReportType)
    el.financialCard.classList.add('none')
    el.workplansCard.classList.add('none')
    el.financialnav.classList.add('none')
  } else {
    el.financialCard.classList.remove('none')
    el.financialnav.classList.remove('none')
    el.workplansCard.classList.remove('none')
    renderFinancialCharts(nsa)
  }

  const collaborationHealthAgendaSource = getFirstNonEmpty(
    isProcessReportType
      ? [
          nsa.CollabWPActHealthAgenda,
          currentLang === 'en' ? nsa.CollabWPActHealthAgenda_txtENG : nsa.CollabWPActHealthAgenda_txtSPA,
          currentLang === 'en' ? firstWorkplan?.HealthAgendaENG : firstWorkplan?.HealthAgendaSPA,
        ]
      : [
          nsa.CollabActHealthAgenda,
          currentLang === 'en' ? nsa.CollabActHealthAgenda_txtENG : nsa.CollabActHealthAgenda_txtSPA,
          nsa.CollabWPActHealthAgenda,
          currentLang === 'en' ? firstWorkplan?.HealthAgendaENG : firstWorkplan?.HealthAgendaSPA,
        ],
  )

  const collaborationStrategicPlanSource = getFirstNonEmpty(
    isProcessReportType
      ? [
          nsa.CollabWPActStrategicPlan,
          currentLang === 'en' ? nsa.CollabWPActStrategicPlan_txtENG : nsa.CollabWPActStrategicPlan_txtSPA,
          currentLang === 'en' ? firstWorkplan?.StrategicPlanENG : firstWorkplan?.StrategicPlanSPA,
        ]
      : [
          nsa.CollabActStrategicPlan,
          currentLang === 'en' ? nsa.CollabActStrategicPlan_txtENG : nsa.CollabActStrategicPlan_txtSPA,
          nsa.CollabWPActStrategicPlan,
          currentLang === 'en' ? firstWorkplan?.StrategicPlanENG : firstWorkplan?.StrategicPlanSPA,
        ],
  )

  const healthAgendaNormalized = normalizeObjects(collaborationHealthAgendaSource)
  const strategicPlansNormalized = normalizeObjects(collaborationStrategicPlanSource)

  rendercollabWPActHealthAgendaObj(healthAgendaNormalized)
  renderStrategicPlan(strategicPlansNormalized)

  if (isProcessReportType) {
    renderActivitiesFromWorkplan(allWorkplans)
  } else {
    renderActivities(allActivities)
  }

  const preferredAgendaFromNsa1 = getFirstNonEmpty([
    nsa.CollabWPActHealthAgenda,
    currentLang === 'en' ? nsa.CollabWPActHealthAgenda_txtENG : nsa.CollabWPActHealthAgenda_txtSPA,
    currentLang === 'en' ? firstWorkplan?.HealthAgendaENG : firstWorkplan?.HealthAgendaSPA,
  ])

  const preferredStrategicNsa1 = getFirstNonEmpty([
    nsa.CollabWPActStrategicPlan,
    currentLang === 'en' ? nsa.CollabWPActStrategicPlan_txtENG : nsa.CollabWPActStrategicPlan_txtSPA,
    currentLang === 'en' ? firstWorkplan?.StrategicPlanENG : firstWorkplan?.StrategicPlanSPA,
  ])

  renderCard03(normalizeObjects(preferredAgendaFromNsa1))
  renderCard04(normalizeObjects(preferredStrategicNsa1))

  renderWorkplans(allWorkplans)
  applyLanguage()
}

function renderYearlyResults(w) {
  let html = ''

  // YEAR 1
  const year1Date = w.Year1_Date
  const year1Results =
    currentLang === 'en' ? w.Year1_ResultsENG : w.Year1_ResultsSPA

  if (
    year1Date &&
    String(year1Date).trim() !== '' &&
    year1Results &&
    String(year1Results).trim() !== ''
  ) {
    html += `
      <div class="year-block">
        <p><strong>${UI[currentLang].year1} (${year1Date})</strong></p>
        <p>${year1Results.replace(/\n/g, '<br/>')}</p>
      </div>
    `
  }

  // YEAR 2
  const year2Date = w.Year2_Date
  const year2Results =
    currentLang === 'en' ? w.Year2_ResultsENG : w.Year2_ResultsSPA

  if (
    year2Date &&
    String(year2Date).trim() !== '' &&
    year2Results &&
    String(year2Results).trim() !== ''
  ) {
    html += `
      <div class="year-block">
        <p><strong>${UI[currentLang].year2} (${year2Date})</strong></p>
        <p>${year2Results.replace(/\n/g, '<br/>')}</p>
      </div>
    `
  }

  return html
}

function renderActivities(list) {
  if (!list.length) {
    el.activities.innerHTML = '<p class="meta">No activities found for this nas.</p>'
    return
  }

  el.activities.innerHTML = list
    .map((w) => {
      const description = currentLang === 'en'
        ? w.DescriptionENG ?? '-'
        : w.DescriptionSPA ?? '-'

      const directResults = currentLang === 'en'
        ? w.DirectResultsENG ?? '-'
        : w.DirectResultsSPA ?? '-'

      return `
      <div class="item">
        <p><strong>${UI[currentLang].descTitle}:</strong> ${description || '-'}</p>
        <p><strong>${UI[currentLang].thResults}:</strong> ${directResults || '-'}</p>
        <p><strong>${UI[currentLang].thResp}:</strong> ${w.Entity || '-'}</p>
      </div>
      `
    })
    .join('')
}

function renderActivitiesFromWorkplan(list) {
  if (!list.length) {
    el.activities.innerHTML = `<p class="meta">No activities found for this nas.</p>`
    return
  }

  el.activities.innerHTML = list
    .map((w) => {
      const description =
        currentLang === 'en'
          ? w.DescriptionENG ?? '-'
          : w.DescriptionSPA ?? '-'

      const directResults =
        currentLang === 'en'
          ? getTextAfterLastBold(w.ProgressReportENG || '')
          : getTextAfterLastBold(w.ProgressReportSPA || '')

      const yearly = renderYearlyResults(w)

      return `
        <div class="item">
          <p><strong>${UI[currentLang].descTitle}:</strong> ${description}</p>
          <p><strong>${UI[currentLang].thResults}:</strong> ${directResults || '-'}</p>
          <p><strong>${UI[currentLang].thResp}:</strong> ${w.ResponsibleEntity || '-'}</p>
          
          ${yearly}
        </div>
      `
    })
    .join('')
}

function getTextAfterLastBold(str) {
  const tag = '</b>'
  const index = String(str).lastIndexOf(tag)

  if (index === -1) return String(str || '')

  let text = String(str).slice(index + tag.length)
  text = text.replace(/<[^>]*>/g, '')

  return text.trim()
}

function renderWorkplans(list) {
  if (!list.length) {
    el.workplans.innerHTML = '<p class="meta">No workplans found for this nas.</p>'
    return
  }

  el.workplans.innerHTML = list
    .map((w) => {
      const descENG = w.DescriptionENG ?? '-'
      const descSPA = w.DescriptionSPA ?? '-'
      const description = currentLang === 'en' ? descENG : descSPA
      const expectedResults = currentLang === 'en' ? w.ExpectedResultsENG ?? '' : w.ExpectedResultsSPA ?? ''

      return `
      <div class="item">
        <p><strong>${UI[currentLang].descTitle}:</strong> ${escapeHtml(description || '-').replace(/\n/g, '<br/>')}</p>
        <p><strong>${UI[currentLang].thExpectResults}:</strong> ${expectedResults || '-'}</p>
        <p><strong>${UI[currentLang].thResp}:</strong> ${w.ResponsibleEntity || '-'}</p>
      </div>
      `
    })
    .join('')
}

function renderCard03(list) {
  if (!list || !list.length) {
    el.card03.innerHTML = '<p class="meta">No Health Agenda found for this nas.</p>'
    return
  }

  el.card03.innerHTML = `
    <h3>${UI[currentLang].Goal}</h3>
    ${list
      .map((val) => {
        return `
        <ul class="list-tag">
          <li class="tag">${escapeHtml(val.Label || '-')}</li>
        </ul>`
      })
      .join('')}
  `
}

function renderCard04(list) {
  if (!list || !list.length) {
    el.card04.innerHTML = '<p class="meta">No strategicPlan found for this nas.</p>'
    return
  }

  el.card04.innerHTML = `
    <h3>${UI[currentLang].StrategicPlan}</h3>
    ${list
      .map((val) => {
        return `
        <ul class="list-tag">
          <li class="tag">${escapeHtml(val.Label || '-')}</li>
        </ul>`
      })
      .join('')}
  `
}

function rendercollabWPActHealthAgendaObj(list) {
  if (!list || !list.length) {
    el.collabWPActHealthAgendaObj.innerHTML = '<p class="meta">No Health Agenda found for this nas.</p>'
    return
  }

  el.collabWPActHealthAgendaObj.innerHTML = `
    <h3>${UI[currentLang].Goal}</h3>
    ${list
      .map((val) => {
        return `
        <ul class="list-tag">
          <li class="tag">${escapeHtml(val.Label || '-')}</li>
        </ul>`
      })
      .join('')}
  `
}

function renderStrategicPlan(list) {
  if (!list || !list.length) {
    el.strategicPlan.innerHTML = '<p class="meta">No strategicPlan found for this nas.</p>'
    return
  }

  el.strategicPlan.innerHTML = `
    <h3>${UI[currentLang].StrategicPlan}</h3>
    ${list
      .map((val) => {
        return `
        <ul class="list-tag">
          <li class="tag">${escapeHtml(val.Label || '-')}</li>
        </ul>`
      })
      .join('')}
  `
}

function renderFinancialCharts(nsa) {
  const canvas = document.getElementById('financialBarChart')
  const FinAnnualIncomeYear = document.getElementById('FinAnnualIncomeYear')
  if (!canvas) return

  FinAnnualIncomeYear.innerHTML = `<div class="field_fiscal">
    <h3>${UI[currentLang].fiscalYear}</h3>
    <p>${nsa.FinAnnualIncomeYear || '-'}</p>
  </div>`

  const wrapper = canvas.closest('.chart-wrapper') || canvas.parentElement
  const oldMsg = wrapper.querySelector('.no-financial-data')
  if (oldMsg) oldMsg.remove()

  const income = toNumber(nsa.FinAnnualIncome)
  const expenses = toNumber(nsa.FinAnnualExpenses)
  const assets = toNumber(nsa.FinAssets)
  const values = [income, expenses, assets]

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
      layout: {
        padding: {
          top: 20,
        },
      },
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
          grace: '8%',
          ticks: { callback: (v) => formatNumber(v) },
        },
      },
    },
    plugins: [valueLabelsPlugin],
  })
}

function renderNSAProfile(nsa, nsafocalPoint, isProcessReportType) {
  const infoEl = document.getElementById('nsa-info')
  el.nsaTitle.innerText = currentLang === 'en' ? nsa.TitleENG || '-' : nsa.TitleENGSPA || '-'
  el.nsaSubtitle.innerText = `${nsa.TypeOfSubmission || '-'}`

  if (!infoEl) return

  const websiteLabel = String(nsa.NSAWebsite || '').trim()
  const websiteHref = websiteLabel ? (/^https?:\/\//i.test(websiteLabel) ? websiteLabel : `https://${websiteLabel}`) : ''

  const infoIdentity = `
    <div class="field">
      <h3 id="uiIdentityTitle">${UI[currentLang].identityTitle}</h3>
      <dl class="kv">
        <dt>${UI[currentLang].website}</dt>
        <dd>${websiteHref ? `<a href="${websiteHref}" target="_blank" rel="noopener noreferrer">${escapeHtml(websiteLabel)}</a>` : '-'}</dd>

        <dt>${UI[currentLang].foundationYear}</dt>
        <dd>${nsa.NSAYearOfEstablishment || '-'}</dd>

        <dt>${UI[currentLang].orgType}</dt>
        <dd>${nsa.NSAOrganizationType || '-'}</dd>

        <dt>${UI[currentLang].period}</dt>
        <dd>${nsa.CollaborationPeriod || '-'}</dd>

        <dt>${UI[currentLang].typeOfSubmission}</dt>
        <dd>${nsa.TypeOfSubmission || '-'}</dd>
      </dl>
    </div>`

  const infoPoints = `
    <div class="field">
      <h3>${UI[currentLang].focalTitle}</h3>
      <dl class="kv">
        <dt>${UI[currentLang].pahoFocal}</dt>
        <dd>${
          Array.isArray(nsa.PAHOFocalPoint) && nsa.PAHOFocalPoint.length
            ? nsa.PAHOFocalPoint
                .map((item) => item?.LookupValue)
                .filter(Boolean)
                .join('<br>')
            : '-'
        }</dd>

        <dt>${UI[currentLang].nsaFocal}</dt>
        <dd>${nsafocalPoint || '-'}</dd>

        <dt>${UI[currentLang].nsaFocalRole}</dt>
        <dd>${currentLang === 'en' ? nsa.NSAFocalpointRoleENG || nsa.NSAFocalpointRole || '-' : nsa.NSAFocalpointRoleSPA || nsa.NSAFocalpointRole || '-'}</dd>
      </dl>
    </div>`

  const description = `
    <div class="field">
      <h3>${UI[currentLang].descTitle}</h3>
      <h5>${UI[currentLang].objectives}</h5>
      <p class="kv">
        <dt>${currentLang === 'en' ? nsa.NSAObjetivesENG || nsa.NSAObjectives || '-' : nsa.NSAObjectives || '-'}</dt>
      </p>

      <h5>${UI[currentLang].workFields}</h5>
      <p class="kv">
        <dt>${currentLang === 'en' ? nsa.NSAWorkFieldsENG || nsa.NSAWorkFieldsSPA || '-' : nsa.NSAWorkFieldsSPA || '-'}</dt>
      </p>
    </div>
  `

  const formalRelations = `
    <div class="field">
      <h3>${UI[currentLang].governanceTitle}</h3>
      <h5>${UI[currentLang].board}</h5>
      <p class="kv">
        <dt>${currentLang === 'en' ? nsa.NSABoardMembersENG || nsa.NSABoardMembersSPA || '-' : nsa.NSABoardMembersSPA || '-'}</dt>
      </p>

      <h5>${UI[currentLang].bodies}</h5>
      <p class="kv">
        <dt>${currentLang === 'en' ? nsa.NSAOrganizationBodiesENG || nsa.NSAOrganizationBodiesSPA || '-' : nsa.NSAOrganizationBodiesSPA || '-'}</dt>
      </p>
    </div>
  `

  infoEl.innerHTML = `
    <div class="nsa-grid">
      ${infoIdentity}
      ${infoPoints}
      ${!isProcessReportType ? description : ''}
      ${!isProcessReportType ? formalRelations : ''}
    </div>
  `
}

function buildPeriodSelect() {
  const periods = nasas.map((n) => n.CollaborationPeriod).filter(Boolean)
  const unique = [...new Set(periods)].sort()
  if (DEBUG) console.log('buildPeriodSelect', unique)

  el.periodSelect.innerHTML = `
    <option value="all" id="buildperiodall">All</option>
    ${unique.map((p) => `<option value="${p}">${p}</option>`).join('')}
  `
}

function buildTypeOfSubmissionTypeInput(nasas) {
  const values = nasas.map((nsa) => nsa.TypeOfSubmission).filter(Boolean)
  const uniqueValues = [...new Set(values)].sort()

  if (DEBUG) console.log('buildTypeOfSubmissionTypeInput', uniqueValues)

  el.typeOfSubmissionTypeInput.innerHTML = '<option value="all" id="typeOfSubmissionTypeInputAll">All</option>'

  uniqueValues.forEach((val) => {
    const option = document.createElement('option')
    option.value = val
    option.textContent = val
    el.typeOfSubmissionTypeInput.appendChild(option)
  })
}

function setText(id, text) {
  const node = document.getElementById(id)
  if (node) node.textContent = text
}

function applyLanguage() {
  const t = UI[currentLang]
  setText('uiLanguageLabel', t.language)
  setText('uiPeriodLabel', t.period)
  setText('uiDisclaimerText', t.disclaimer)
  setText('uiDisclaimerText2', t.disclaimer)
  setText('uiDisclaimerTitle', t.disclaimerTitle)
  setText('uiDisclaimerTitle2', t.disclaimerTitle)
  setText('uiDisclaimerTextTop', t.disclaimer)
  setText('uiDisclaimerTitleTop', t.disclaimerTitle)
  setText('searchNSA', t.search)
  setText('nsa-select-input', t.selectInput)
  setText('brand-title', t.brandTitle)
  setText('profileTitle', t.profileTitle)
  setText('uiFinTitle', t.navFinancials)
  setText('wpTitle', t.wpTitle)
  setText('uiFinSubtitle', t.finSubtitle)
  setText('collabTitle', t.collabTitle)

  setText('profileTitlenav', t.navProfile)
  setText('financialnav', t.navFinancials)
  setText('CollaborationNav', t.navCollaboration)
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

function formatNumber(n) {
  return Number(n || 0).toLocaleString('en-US')
}

function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
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

function setSearchResultsPosition() {
  if (!el.searchInput || !el.searchResults) return
  const top = el.searchInput.offsetTop + el.searchInput.offsetHeight
  el.searchResults.style.setProperty('--search-results-top', `${top}px`)
}

function clearSearchResults() {
  el.searchResults.innerHTML = ''
}

function handleSearchInput(event) {
  const term = String(event.target.value || '')
    .trim()
    .toLowerCase()

  if (term.length < MIN_SEARCH_CHARS) {
    if (DEBUG) console.log('input is clean')
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
      const label =
        currentLang === 'es'
          ? n.TitleENGSPA || n.TitleENG || n.Title || 'Untitled'
          : n.TitleENG || n.TitleENGSPA || n.Title || 'Untitled'

      return `<li data-id="${n.id}">${escapeHtml(label)}</li>`
    })
    .join('')
}

function showSearchResults() {
  setSearchResultsPosition()

  const term = String(el.searchInput.value || '')
    .trim()
    .toLowerCase()

  const periodFilter =
    typeof filters.period === 'object' && filters.period !== null
      ? String(filters.period.CollaborationPeriod || filters.period.value || '')
      : String(filters.period || '')

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

function getNsaDisplayTitle(n) {
  if (currentLang === 'es') {
    return n.TitleENGSPA || n.TitleENG || n.Title || 'Untitled'
  }
  return n.TitleENG || n.TitleENGSPA || n.Title || 'Untitled'
}