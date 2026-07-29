const FILES = {
  profiles: './src/database/nsa-profiles.json',
  nsas: './src/database/nsa.json',
  activities: './src/database/activity.json',
  workplans: './src/database/workplan.json',
}

const DEFAULT_PROFILE_ID = '44'
const state = { profiles: [], nsas: [], activities: [], workplans: [] }

const ui = {
  select: document.querySelector('#profile-select'),
  reload: document.querySelector('#reload-button'),
  status: document.querySelector('#status'),
  profileSection: document.querySelector('#profile-section'),
  cyclesSection: document.querySelector('#cycles-section'),
  childrenSection: document.querySelector('#children-section'),
  orphansSection: document.querySelector('#orphans-section'),
  profileFlow: document.querySelector('#profile-flow'),
  summary: document.querySelector('#summary'),
  cyclesTable: document.querySelector('#cycles-table'),
  children: document.querySelector('#children'),
  orphans: document.querySelector('#orphans'),
}

const id = (value) => String(value ?? '').trim()
const escapeHtml = (value) =>
  String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')

function isEligible(nsa) {
  return ['Pending', 'Approved'].includes(nsa.GovBodies_Status)
}

async function fetchJson(url) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`)
  return response.json()
}

async function loadData() {
  ui.select.disabled = true
  ui.status.className = 'muted'
  ui.status.textContent = 'Carregando os quatro JSONs…'

  try {
    const [profiles, nsas, activities, workplans] = await Promise.all(Object.values(FILES).map(fetchJson))
    Object.assign(state, { profiles, nsas, activities, workplans })
    fillProfileSelect()
    renderProfile(ui.select.value)
    ui.status.textContent = 'Dados carregados com sucesso.'
  } catch (error) {
    ui.status.className = 'error'
    ui.status.innerHTML = `Não foi possível carregar os JSONs: ${escapeHtml(error.message)}. ` + 'Abra esta pasta por um servidor HTTP local; não abra o HTML diretamente como file://.'
  } finally {
    ui.select.disabled = false
  }
}

function fillProfileSelect() {
  const usedProfileIds = new Set([...state.nsas.map((row) => id(row.NSAProfileID)), ...state.activities.map((row) => id(row.NSAProfileID)), ...state.workplans.map((row) => id(row.NSAProfileID))])

  const profiles = [...state.profiles].filter((profile) => usedProfileIds.has(id(profile.ID))).sort((a, b) => Number(a.ID) - Number(b.ID))

  ui.select.innerHTML = profiles.map((profile) => `<option value="${escapeHtml(id(profile.ID))}">` + `${escapeHtml(id(profile.ID))} — ${escapeHtml(profile.Title)}` + '</option>').join('')

  ui.select.value = profiles.some((profile) => id(profile.ID) === DEFAULT_PROFILE_ID) ? DEFAULT_PROFILE_ID : id(profiles[0]?.ID)
}

function getJoinedData(profileId) {
  const profile = state.profiles.find((row) => id(row.ID) === profileId)

  // Primeiro join: a organização pode ter vários ciclos/submissões.
  const nsas = state.nsas.filter((row) => id(row.NSAProfileID) === profileId)
  const nsaIds = new Set(nsas.map((row) => id(row.ID)))

  // Join correto dos filhos: ParentID aponta para o ID do ciclo.
  const activitiesByCycle = state.activities.filter((row) => nsaIds.has(id(row.ParentID)))
  const workplansByCycle = state.workplans.filter((row) => nsaIds.has(id(row.ParentID)))

  // Busca organizacional auxiliar: permite detectar filhos cujo pai não veio no export.
  const allProfileActivities = state.activities.filter((row) => id(row.NSAProfileID) === profileId)
  const allProfileWorkplans = state.workplans.filter((row) => id(row.NSAProfileID) === profileId)

  return {
    profile,
    nsas,
    activitiesByCycle,
    workplansByCycle,
    orphanActivities: allProfileActivities.filter((row) => !nsaIds.has(id(row.ParentID))),
    orphanWorkplans: allProfileWorkplans.filter((row) => !nsaIds.has(id(row.ParentID))),
  }
}

function renderProfile(profileId) {
  if (!profileId) return
  const joined = getJoinedData(profileId)
  if (!joined.profile) {
    ui.status.className = 'error'
    ui.status.textContent = `Profile ${profileId} não encontrado.`
    return
  }

  ui.profileSection.hidden = false
  ui.cyclesSection.hidden = false
  ui.childrenSection.hidden = false

  ui.profileFlow.innerHTML =
    `<strong>NSA Profiles.ID = ${escapeHtml(profileId)}</strong>` +
    `<span class="arrow">→</span>` +
    `<span>${escapeHtml(joined.profile.Title)}</span>` +
    `<span class="arrow">→</span>` +
    `<code>NSAs.NSAProfileID = ${escapeHtml(profileId)}</code>`

  ui.summary.innerHTML = [
    ['Ciclos NSAs', joined.nsas.length],
    ['Activities com pai', joined.activitiesByCycle.length],
    ['Workplans com pai', joined.workplansByCycle.length],
    ['Filhos sem pai exportado', joined.orphanActivities.length + joined.orphanWorkplans.length],
  ]
    .map(([label, value]) => `<div class="metric">${escapeHtml(label)}<strong>${value}</strong></div>`)
    .join('')

  renderCycles(joined.nsas)
  renderChildren(joined)
  renderOrphans(joined)
}

function renderCycles(nsas) {
  if (!nsas.length) {
    ui.cyclesTable.innerHTML = '<div class="empty">Nenhum ciclo encontrado.</div>'
    return
  }

  ui.cyclesTable.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>NSAs.ID</th>
          <th>NSAProfileID</th>
          <th>NSA_Status</th>
          <th>GovBodies_Status</th>
          <th>Workflow Status</th>
          <th>Elegível</th>
        </tr>
      </thead>
      <tbody>
        ${nsas
          .map(
            (nsa) => `
              <tr>
                <td><strong>${escapeHtml(nsa.ID)}</strong></td>
                <td>${escapeHtml(nsa.NSAProfileID)}</td>
                <td>${escapeHtml(nsa.NSA_Status)}</td>
                <td>${escapeHtml(nsa.GovBodies_Status || '—')}</td>
                <td>${escapeHtml(nsa.Status || '—')}</td>
                <td><span class="badge ${isEligible(nsa) ? 'ok' : ''}">
                  ${isEligible(nsa) ? 'Sim' : 'Não'}
                </span></td>
              </tr>`,
          )
          .join('')}
      </tbody>
    </table>`
}

function renderChildren(joined) {
  if (!joined.nsas.length) {
    ui.children.innerHTML = '<div class="empty">Não há ciclos para consultar.</div>'
    return
  }

  ui.children.innerHTML = joined.nsas
    .map((nsa) => {
      const cycleId = id(nsa.ID)
      const activities = joined.activitiesByCycle.filter((row) => id(row.ParentID) === cycleId)
      const workplans = joined.workplansByCycle.filter((row) => id(row.ParentID) === cycleId)
      return `
        <article class="cycle">
          <h3>NSAs.ID = ${escapeHtml(cycleId)}
            <span class="badge ${isEligible(nsa) ? 'ok' : ''}">
              ${isEligible(nsa) ? 'elegível' : 'não elegível'}
            </span>
          </h3>
          <p><code>filho.ParentID = ${escapeHtml(cycleId)}</code></p>
          ${childrenTable('Activities', activities, 'ActivityID', id(nsa.NSAProfileID))}
          ${childrenTable('Workplans', workplans, 'Reference', id(nsa.NSAProfileID))}
        </article>`
    })
    .join('')
}

function childrenTable(title, rows, referenceField, expectedProfileId = '') {
  if (!rows.length) {
    return `<h3>${title}</h3><div class="empty">Nenhum registro para este ciclo.</div>`
  }

  return `
    <h3>${title}</h3>
    <div class="table-wrap">
      <table>
        <thead><tr><th>ID</th><th>Referência</th><th>ParentID</th><th>NSAProfileID</th><th>Validação</th></tr></thead>
        <tbody>
          ${rows
            .map((row) => {
              const relationshipIsValid = !expectedProfileId || id(row.NSAProfileID) === expectedProfileId
              return `
                <tr>
                  <td>${escapeHtml(row.ID)}</td>
                  <td>${escapeHtml(row[referenceField])}</td>
                  <td>${escapeHtml(row.ParentID)}</td>
                  <td>${escapeHtml(row.NSAProfileID)}</td>
                  <td><span class="badge ${relationshipIsValid ? 'ok' : 'warn'}">
                    ${relationshipIsValid ? 'mesma organização' : 'NSAProfileID divergente'}
                  </span></td>
                </tr>`
            })
            .join('')}
        </tbody>
      </table>
    </div>`
}

function renderOrphans(joined) {
  const count = joined.orphanActivities.length + joined.orphanWorkplans.length
  ui.orphansSection.hidden = count === 0
  if (!count) {
    ui.orphans.innerHTML = ''
    return
  }

  ui.orphans.innerHTML = childrenTable('Activities sem pai exportado', joined.orphanActivities, 'ActivityID') + childrenTable('Workplans sem pai exportado', joined.orphanWorkplans, 'Reference')
}

ui.select.addEventListener('change', () => renderProfile(ui.select.value))
ui.reload.addEventListener('click', loadData)
loadData()
