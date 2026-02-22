// ============================
// PAHO NSA Portal (clean CSV -> UI)
// Only EN + ES (Spanish) retained
// ============================

const FILES = {
  nsas: "./nsas_clean.csv", // pai
  activity: "./collab_activity_clean.csv",
  workplan: "./collab_workplan_clean.csv",
};

const DISCLAIMER = {
  en: "The information has been provided directly by Non-State Actors (NSAs) as part of their reporting obligations within the framework of official relations. In accordance with the consent granted by each NSA, the data is declarative in nature and may be published for transparency purposes. PAHO is not responsible for verifying, auditing, or editing the information provided.",
  es: "La información ha sido proporcionada directamente por los Agentes No Estatales (ANE) como parte de sus obligaciones de reporte en el marco de las relaciones oficiales. De conformidad con el consentimiento otorgado por cada ANE/NSA, los datos son de carácter declarativo y podrán ser publicados para fines de transparencia. La OPS no es responsable de verificar, auditar ni editar la información proporcionada.",
};

const UI = {
  en: {
    kicker: "Non-State Actors",
    subtitle: "Official Relations Portal",
    language: "Language",
    search: "Search NSA",
    searchPh: "Type a name...",
    period: "Collaboration period",
    orgType: "Organization type",
    listTitle: "Organizations",
    navTitle: "On this page",
    navProfile: "Profile",
    navFinancials: "Financial information",
    navCollaboration: "Collaboration with PAHO",
    navWorkplan: "Workplan (next 3 years)",
    disclaimerTitle: "Note:",
    profileTitle: "NSA Profile",
    profileSubtitle: "Identity, focal points, and declared description.",
    identityTitle: "Identity",
    focalTitle: "Focal points",
    descTitle: "Description",
    governanceTitle: "Governance & formal relations",
    finTitle: "Financial information",
    finSubtitle: "Income, expenses and assets for the latest fiscal year (US$).",
    fiscalYear: "Fiscal year",
    annualIncome: "Annual income",
    annualExpenses: "Annual expenses",
    assets: "Assets",
    finNotes: "Notes",
    finNotesBody: "Financing source breakdowns are intentionally not shown in this public view.",
    collabTitle: "Collaboration with PAHO",
    collabSubtitle: "Activities performed within the selected triennial cycle.",
    thEntity: "Entity",
    thDesc: "Activity description",
    thResults: "Direct results",
    wpTitle: "Workplan for the next three years",
    wpSubtitle: "Planned activities and expected results for the selected cycle.",
    thAgenda: "Health Agenda objectives",
    thSP: "Strategic Plan results",
    thResp: "Responsible entity",
    thWpDesc: "Activity description",
    thExpected: "Expected results",
    hint: "Public, self-reported information • prototype UI",
    footer: "Prototype web layout • Data mapped from clean CSVs",
    selectOrg: "Select an organization",
    selectOrgHelp: "Use the filters or the list on the left.",
    copyLink: "Copy link",
    workplanSuppressed: "For annual progress reports, no prospective workplan is shown in this period.",
    noCollab: "No collaboration activity to display for this selection.",
    noWorkplan: "No workplan to display for this selection.",
    all: "All",
    typeOfSubmission: "Type of submission",
    orgTypeLabel: "Organization type",
    website: "Website",
    foundationYear: "Foundation year",
    collabPeriod: "Collaboration period",
    nsaFocal: "NSA focal point",
    nsaFocalRole: "Focal point role",
    contactEmail: "Contact email",
    pahoFocal: "PAHO focal point",
    objectives: "Objectives",
    workFields: "Main work activities",
    board: "Governing body members",
    bodies: "Organization bodies & affiliations",
  },
  es: {
    kicker: "Agentes No Estatales",
    subtitle: "Portal de Relaciones Oficiales",
    language: "Idioma",
    search: "Buscar ANE/NSA",
    searchPh: "Escriba un nombre...",
    period: "Período de colaboración",
    orgType: "Tipo de organización",
    listTitle: "Organizaciones",
    navTitle: "En esta página",
    navProfile: "Perfil",
    navFinancials: "Información financiera",
    navCollaboration: "Colaboración con la OPS",
    navWorkplan: "Plan de trabajo (próximos 3 años)",
    disclaimerTitle: "Nota:",
    profileTitle: "Perfil del ANE/NSA",
    profileSubtitle: "Identidad, puntos focales y descripción declarada.",
    identityTitle: "Identidad",
    focalTitle: "Puntos focales",
    descTitle: "Descripción",
    governanceTitle: "Gobernanza y relaciones formales",
    finTitle: "Información financiera",
    finSubtitle: "Ingresos, gastos y activos para el último año fiscal (US$).",
    fiscalYear: "Año fiscal",
    annualIncome: "Ingresos anuales",
    annualExpenses: "Gastos anuales",
    assets: "Activos",
    finNotes: "Notas",
    finNotesBody: "El desglose de fuentes de financiamiento no se muestra en esta vista pública.",
    collabTitle: "Colaboración con la OPS",
    collabSubtitle: "Actividades realizadas dentro del ciclo trienal seleccionado.",
    thEntity: "Entidad",
    thDesc: "Descripción de la actividad",
    thResults: "Resultados directos",
    wpTitle: "Plan de trabajo para los próximos tres años",
    wpSubtitle: "Actividades planificadas y resultados esperados para el ciclo seleccionado.",
    thAgenda: "Objetivos de la Agenda de Salud",
    thSP: "Resultados del Plan Estratégico",
    thResp: "Entidad responsable",
    thWpDesc: "Descripción de la actividad",
    thExpected: "Resultados esperados",
    hint: "Información pública y auto-reportada • prototipo",
    footer: "Diseño web prototipo • Datos mapeados desde CSVs limpios",
    selectOrg: "Seleccione una organización",
    selectOrgHelp: "Use los filtros o la lista a la izquierda.",
    copyLink: "Copiar enlace",
    workplanSuppressed: "Para reportes anuales de progreso, no se muestra un plan de trabajo prospectivo en este período.",
    noCollab: "No hay actividades de colaboración para mostrar con esta selección.",
    noWorkplan: "No hay plan de trabajo para mostrar con esta selección.",
    all: "Todos",
    typeOfSubmission: "Tipo de formulario",
    orgTypeLabel: "Tipo de organización",
    website: "Sitio web",
    foundationYear: "Año de fundación",
    collabPeriod: "Período de colaboración",
    nsaFocal: "Punto focal ANE/NSA",
    nsaFocalRole: "Rol del punto focal",
    contactEmail: "Correo de contacto",
    pahoFocal: "Punto focal OPS",
    objectives: "Objetivos",
    workFields: "Áreas de trabajo",
    board: "Miembros del órgano de gobernanza",
    bodies: "Órganos y afiliaciones",
  },
};

let state = {
  lang: "en",
  nsas: [],
  activity: [],
  workplan: [],
  byId: new Map(),
  selectedId: null,
  period: "ALL",
  orgType: "ALL",
  search: "",
};

console.log(state)

function $(id){ return document.getElementById(id); }
function setText(id, text){ const el=$(id); if(el) el.textContent = text; }

function safeText(raw){
  if(raw == null) return "";
  const s = String(raw);
  const tmp = document.createElement("div");
  tmp.innerHTML = s;
  return (tmp.textContent || tmp.innerText || "").trim();
}

function fmtUSD(x){
  const n = Number(String(x ?? "").replace(/[^0-9.-]/g, ""));
  if(!isFinite(n)) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function uniqSorted(arr){
  return Array.from(new Set(arr.map(v => safeText(v)).filter(Boolean))).sort((a,b)=>a.localeCompare(b));
}

function getSelectedNSA(){
  if(!state.selectedId) return null;
  return state.byId.get(String(state.selectedId)) || null;
}

function loadCSV(url){
  return new Promise((resolve, reject) => {
    Papa.parse(url, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => resolve(results.data || []),
      error: (err) => reject(err),
    });
  });
}

function displayName(nsa){
  return state.lang === "es" ? safeText(nsa.TitleSPA) || safeText(nsa.TitleENG) : safeText(nsa.TitleENG) || safeText(nsa.TitleSPA);
}

function parseYearFromTitle(title){
  const m = String(title || "").match(/NSA-(\d{4})-/);
  return m ? Number(m[1]) : null;
}

async function init(){
  const [nsas, activity, workplan] = await Promise.all([
    loadCSV(FILES.nsas),
    loadCSV(FILES.activity),
    loadCSV(FILES.workplan),
  ]);

  state.nsas = nsas;
  state.activity = activity;
  state.workplan = workplan;

  state.byId = new Map();
  for(const r of nsas){
    const id = safeText(r.ID);
    if(id) state.byId.set(id, r);
  }

  // default selection
  const sorted = [...state.byId.values()].sort((a,b)=>displayName(a).localeCompare(displayName(b)));
  if(sorted.length) state.selectedId = safeText(sorted[0].ID);

  bindEvents();
  setupScrollSpy();
  setupFilters();
  renderAll();

  const params = new URLSearchParams(location.hash.replace(/^#/, ""));
  const fromHash = params.get("nsa");
  if(fromHash && state.byId.has(fromHash)){
    state.selectedId = fromHash;
    renderAll();
  }
}

function applyLanguage(){
  const t = UI[state.lang];
  setText("uiKicker", t.kicker);
  setText("uiSubtitle", t.subtitle);
  setText("uiLanguageLabel", t.language);
  setText("uiSearchLabel", t.search);
  $("searchInput").placeholder = t.searchPh;
  setText("uiPeriodLabel", t.period);
  setText("uiOrgTypeLabel", t.orgType);
  setText("uiListTitle", t.listTitle);
  setText("uiNavTitle", t.navTitle);
  setText("navProfile", t.navProfile);
  setText("navFinancials", t.navFinancials);
  setText("navCollaboration", t.navCollaboration);
  setText("navWorkplan", t.navWorkplan);

  setText("uiDisclaimerTitle", t.disclaimerTitle);
  setText("uiDisclaimerTitle2", t.disclaimerTitle);
  setText("uiDisclaimerText", DISCLAIMER[state.lang]);
  setText("uiDisclaimerText2", DISCLAIMER[state.lang]);

  setText("uiProfileTitle", t.profileTitle);
  setText("uiProfileSubtitle", t.profileSubtitle);
  setText("uiIdentityTitle", t.identityTitle);
  setText("uiFocalTitle", t.focalTitle);
  setText("uiDescTitle", t.descTitle);
  setText("uiGovernanceTitle", t.governanceTitle);

  setText("uiFinTitle", t.finTitle);
  setText("uiFinSubtitle", t.finSubtitle);
  setText("uiFiscalYear", t.fiscalYear);
  setText("uiIncome", t.annualIncome);
  setText("uiExpenses", t.annualExpenses);
  setText("uiAssets", t.assets);
  setText("uiFinNotes", t.finNotes);
  setText("finNotes", t.finNotesBody);

  setText("uiCollabTitle", t.collabTitle);
  setText("uiCollabSubtitle", t.collabSubtitle);
  setText("thEntity", t.thEntity);
  setText("thDesc", t.thDesc);
  setText("thResults", t.thResults);

  setText("uiWpTitle", t.wpTitle);
  setText("uiWpSubtitle", t.wpSubtitle);
  setText("thAgenda", t.thAgenda);
  setText("thSP", t.thSP);
  setText("thResp", t.thResp);
  setText("thWpDesc", t.thWpDesc);
  setText("thExpected", t.thExpected);

  setText("uiHint", t.hint);
  setText("uiFooter", t.footer);

  $("collabEmpty").textContent = t.noCollab;
  $("workplanEmpty").textContent = t.noWorkplan;
  $("workplanSuppressed").textContent = t.workplanSuppressed;

  setText("btnCopyLink", t.copyLink);

  setupFilters();
  $("periodSelect").value = state.period;
  $("orgTypeSelect").value = state.orgType;
}

function setupFilters(){
  const t = UI[state.lang];

  const periods = uniqSorted([
    ...state.nsas.map(r => r.CollaborationPeriod),
    ...state.workplan.map(r => r.CollaborationPeriod),
    ...state.activity.map(r => r.CollaborationPeriod),
  ]);

  const periodSelect = $("periodSelect");
  periodSelect.innerHTML = "";
  periodSelect.appendChild(new Option(t.all, "ALL"));
  console.log(`periods`, periods)
  periods.forEach(p => periodSelect.appendChild(new Option(p, p)));

  const orgKey = state.lang === "es" ? "NSAOrganizationTypeSPA" : "NSAOrganizationTypeENG";
  const orgTypes = uniqSorted(state.nsas.map(r => r[orgKey]));
  const orgTypeSelect = $("orgTypeSelect");
  orgTypeSelect.innerHTML = "";
  orgTypeSelect.appendChild(new Option(t.all, "ALL"));
  orgTypes.forEach(o => orgTypeSelect.appendChild(new Option(o, o)));
}

function bindEvents(){
  $("searchInput").addEventListener("input", (e) => {
    state.search = e.target.value || "";
    renderList();
  });

  $("periodSelect").addEventListener("change", (e) => {
    state.period = e.target.value;
    renderAll();
  });

  $("orgTypeSelect").addEventListener("change", (e) => {
    state.orgType = e.target.value;
    renderList();
  });

  $("langEN").addEventListener("click", () => setLang("en"));
  $("langES").addEventListener("click", () => setLang("es"));

  $("btnCopyLink").addEventListener("click", async () => {
    if(!state.selectedId) return;
    const hash = `nsa=${encodeURIComponent(state.selectedId)}`;
    const url = `${location.origin}${location.pathname}#${hash}`;
    try{
      await navigator.clipboard.writeText(url);
      $("btnCopyLink").textContent = "Copied!";
      setTimeout(()=>$("btnCopyLink").textContent = UI[state.lang].copyLink, 900);
    }catch(_){
      prompt("Copy link:", url);
    }
  });
}

function setLang(lang){
  state.lang = lang;
  $("langEN").classList.toggle("active", lang==="en");
  $("langES").classList.toggle("active", lang==="es");
  $("langEN").setAttribute("aria-selected", lang==="en");
  $("langES").setAttribute("aria-selected", lang==="es");
  renderAll();
}

function renderAll(){
  applyLanguage();
  renderList();
  renderProfile();
  renderFinancials();
  renderCollaboration();
  renderWorkplan();
}

function filteredNSAList(){
  const q = state.search.trim().toLowerCase();
  const orgKey = state.lang === "es" ? "NSAOrganizationTypeSPA" : "NSAOrganizationTypeENG";

  return state.nsas.filter(r => {
    const id = safeText(r.ID);
    const name = displayName(r);
    const orgType = safeText(r[orgKey]);
    const period = safeText(r.CollaborationPeriod);

    if(state.orgType !== "ALL" && orgType !== state.orgType) return false;
    if(state.period !== "ALL" && period !== state.period) return false;

    if(!q) return true;
    return name.toLowerCase().includes(q) || id.toLowerCase().includes(q);
  }).sort((a,b)=>displayName(a).localeCompare(displayName(b)));
}

function renderList(){
  const list = filteredNSAList();
  $("listCount").textContent = String(list.length);

  const box = $("nsaList");
  box.innerHTML = "";

  const orgKey = state.lang === "es" ? "NSAOrganizationTypeSPA" : "NSAOrganizationTypeENG";

  list.forEach(r => {
    const id = safeText(r.ID);
    const name = displayName(r);
    const sub = `${safeText(r.CollaborationPeriod) || ""} • ${safeText(r[orgKey]) || ""}`.trim();

    const item = document.createElement("div");
    item.className = "nsa-item" + (id === state.selectedId ? " active" : "");
    item.setAttribute("role", "option");
    item.setAttribute("aria-selected", id === state.selectedId ? "true" : "false");
    item.innerHTML = `<div class="nsa-name"></div><div class="nsa-sub"></div>`;
    item.querySelector(".nsa-name").textContent = name || `(ID ${id})`;
    item.querySelector(".nsa-sub").textContent = sub;

    item.addEventListener("click", () => {
      state.selectedId = id;
      if(state.period === "ALL"){
        const p = safeText(r.CollaborationPeriod);
        if(p){ $("periodSelect").value = p; state.period = p; }
      }
      location.hash = `nsa=${encodeURIComponent(id)}`;
      renderAll();
    });

    box.appendChild(item);
  });

  if(state.selectedId && !list.some(r => safeText(r.ID) === state.selectedId)){
    state.selectedId = list[0] ? safeText(list[0].ID) : null;
  }
}

function dlRow(k, v, isLink=false){
  const key = escapeHtml(String(k || ""));
  const val = escapeHtml(String(v || "—"));
  const content = (isLink && v) ? `<a href="${escapeAttr(String(v))}" target="_blank" rel="noreferrer">${val}</a>` : val;
  return `<div><dt>${key}</dt><dd>${content}</dd></div>`;
}

function escapeHtml(str){
  return String(str || "").replace(/[&<>"']/g, (c) => ({
    "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"
  }[c]));
}
function escapeAttr(str){ return String(str || "").replace(/"/g, "%22").trim(); }

function renderProfile(){
  const t = UI[state.lang];
  const nsa = getSelectedNSA();

  if(!nsa){
    setText("nsaName", t.selectOrg);
    setText("nsaMeta", t.selectOrgHelp);
    $("profileIdentity").innerHTML = "";
    $("profileFocals").innerHTML = "";
    $("profileDescription").innerHTML = "";
    $("profileGovernance").innerHTML = "";
    return;
  }

  setText("nsaName", displayName(nsa) || `(ID ${safeText(nsa.ID)})`);

  const orgType = safeText(state.lang==="es" ? nsa.NSAOrganizationTypeSPA : nsa.NSAOrganizationTypeENG);
  const submission = safeText(state.lang==="es" ? nsa.TypeOfSubmissionSPA : nsa.TypeOfSubmissionENG);
  const metaBits = [orgType, safeText(nsa.CollaborationPeriod), submission].filter(Boolean);
  setText("nsaMeta", metaBits.join(" • "));

  const identity = [
    [t.website, safeText(nsa.NSAWebsite)],
    [t.foundationYear, safeText(nsa.NSAYearOfEstablishment)],
    [t.orgTypeLabel, orgType],
    [t.collabPeriod, safeText(nsa.CollaborationPeriod)],
    [t.typeOfSubmission, submission],
  ];
  $("profileIdentity").innerHTML = identity.map(([k,v]) => dlRow(k, v, k===t.website)).join("");

  const focals = [
    [t.pahoFocal, safeText(nsa.PAHOFocalPoint)],
    [t.nsaFocal, safeText(nsa.NSAFocalpoint)],
    [t.nsaFocalRole, safeText(state.lang==="es" ? nsa.NSAFocalpointRoleSPA : nsa.NSAFocalpointRoleENG)],
    [t.contactEmail, safeText(nsa.NSAContactEmail)],
  ];
  $("profileFocals").innerHTML = focals.map(([k,v]) => dlRow(k, v)).join("");

  const desc = [
    [t.objectives, safeText(state.lang==="es" ? nsa.NSAObjectivesSPA : nsa.NSAObjectivesENG)],
    [t.workFields, safeText(state.lang==="es" ? nsa.NSAWorkFieldsSPA : nsa.NSAWorkFieldsENG)],
  ];
  $("profileDescription").innerHTML = desc.map(([k,v]) => dlRow(k, v)).join("");

  const blocks = [];
  const board = safeText(state.lang==="es" ? nsa.NSABoardMembersSPA : nsa.NSABoardMembersENG);
  const bodies = safeText(state.lang==="es" ? nsa.NSAOrganizationBodiesSPA : nsa.NSAOrganizationBodiesENG);
  if(board) blocks.push({ title: t.board, body: board });
  if(bodies) blocks.push({ title: t.bodies, body: bodies });

  const container = $("profileGovernance");
  container.innerHTML = blocks.length ? blocks.map(b => `
    <div class="block">
      <div class="block-title">${escapeHtml(b.title)}</div>
      <p class="block-body">${escapeHtml(b.body)}</p>
    </div>
  `).join("") : `<div class="empty">${state.lang==="es" ? "Sin información adicional." : "No additional information."}</div>`;
}

function renderFinancials(){
  const nsa = getSelectedNSA();
  console.log(`nsa`, nsa.FinAnnualIncomeYear)
  if(!nsa){
    setText("finYear", "—"); setText("finIncome", "—"); setText("finExpenses", "—"); setText("finAssets", "—");
    return;
  }
  setText("finYear", safeText(nsa.FinAnnualIncomeYear) || "—");
  setText("finIncome", fmtUSD(nsa.FinAnnualIncome));
  setText("finExpenses", fmtUSD(nsa.FinAnnualExpenses));
  setText("finAssets", fmtUSD(nsa.FinAssets));
}

function submissionTypeEn(nsa){
  return safeText(nsa.TypeOfSubmissionENG).toLowerCase();
}

function selectedPeriod(nsa){
  return (state.period !== "ALL") ? state.period : safeText(nsa.CollaborationPeriod);
}

function renderCollaboration(){
  const t = UI[state.lang];
  const nsa = getSelectedNSA();
  const tbody = $("collabTbody");
  tbody.innerHTML = "";
  $("collabEmpty").hidden = true;

  if(!nsa){ $("collabEmpty").hidden = false; return; }

  const id = safeText(nsa.ID);
  const sub = submissionTypeEn(nsa);

  if(sub.includes("new application")){
    $("collabEmpty").hidden = false;
    return;
  }

  const period = selectedPeriod(nsa);

  let rows = state.activity.filter(r => safeText(r.ParentID) === id && (!period || safeText(r.CollaborationPeriod) === period));

  if(sub.includes("progress report")){
    const years = rows.map(r => parseYearFromTitle(r.Title)).filter(Boolean);
    const y = years.length ? Math.max(...years) : null;
    if(y) rows = rows.filter(r => parseYearFromTitle(r.Title) === y);
  }

  if(!rows.length){ $("collabEmpty").hidden = false; return; }

  for(const r of rows){
    const entity = safeText(r.Entity);
    const desc = safeText(state.lang==="es" ? r.DescriptionSPA : r.DescriptionENG);
    const results = safeText(state.lang==="es" ? r.DirectResultsSPA : r.DirectResultsENG);

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(entity)}</td>
      <td style="white-space: pre-wrap;">${escapeHtml(desc)}</td>
      <td style="white-space: pre-wrap;">${escapeHtml(results)}</td>
    `;
    tbody.appendChild(tr);
  }
}

function renderWorkplan(){
  const t = UI[state.lang];
  const nsa = getSelectedNSA();
  const tbody = $("workplanTbody");
  tbody.innerHTML = "";

  $("workplanEmpty").hidden = true;
  $("workplanSuppressed").hidden = true;

  if(!nsa){ $("workplanEmpty").hidden = false; return; }

  const id = safeText(nsa.ID);
  const sub = submissionTypeEn(nsa);

  if(sub.includes("progress report")){
    $("workplanSuppressed").hidden = false;
    return;
  }

  const period = selectedPeriod(nsa);

  const rows = state.workplan.filter(r =>
    safeText(r.ParentID) === id &&
    (!period || safeText(r.CollaborationPeriod) === period)
  );

  if(!rows.length){ $("workplanEmpty").hidden = false; return; }

  for(const r of rows){
    const agenda = safeText(state.lang==="es" ? r.HealthAgendaSPA : r.HealthAgendaENG);
    const sp = safeText(state.lang==="es" ? r.StrategicPlanSPA : r.StrategicPlanENG);
    const resp = safeText(r.ResponsibleEntity);
    const desc = safeText(state.lang==="es" ? r.DescriptionSPA : r.DescriptionENG);
    const expected = safeText(state.lang==="es" ? r.ExpectedResultsSPA : r.ExpectedResultsENG);

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td style="white-space: pre-wrap;">${escapeHtml(agenda)}</td>
      <td style="white-space: pre-wrap;">${escapeHtml(sp)}</td>
      <td>${escapeHtml(resp)}</td>
      <td style="white-space: pre-wrap;">${escapeHtml(desc)}</td>
      <td style="white-space: pre-wrap;">${escapeHtml(expected)}</td>
    `;
    tbody.appendChild(tr);
  }
}

function setupScrollSpy(){
  const links = Array.from(document.querySelectorAll(".nav-link"));
  const sections = links.map(a => document.querySelector(a.getAttribute("href"))).filter(Boolean);

  const setActive = (id) => links.forEach(a => a.classList.toggle("active", a.getAttribute("href") === `#${id}`));

  const observer = new IntersectionObserver((entries) => {
    const visible = entries.filter(e => e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
    if (visible?.target?.id) setActive(visible.target.id);
  }, { rootMargin: "-20% 0px -70% 0px", threshold: [0.1, 0.2, 0.4, 0.6] });

  sections.forEach(s => observer.observe(s));
}

init().catch((err) => {
  console.error(err);
  alert("Failed to load clean CSV files. Make sure you run a local web server from this folder.");
});
