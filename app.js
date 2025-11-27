// --- Constantes de clave de almacenamiento ---
const STORAGE_KEY = "migratorio-analisis-db";

// Estructura base
const defaultDB = {
  personas: [],
  eventos: [],
  direcciones: []
};

let db = loadDB();

// --- Utilidades base de datos ---
function loadDB() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(defaultDB);
    const parsed = JSON.parse(raw);
    return { ...defaultDB, ...parsed };
  } catch (e) {
    console.error("Error al cargar DB:", e);
    return structuredClone(defaultDB);
  }
}

function saveDB() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

// Generar ID interno
function generateId(prefix) {
  const now = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 6);
  return `${prefix}${now}${rand}`.toUpperCase();
}

// --- MIG CODES ---
const MIG_CODES = [
  { code: "MIG-01", desc: "Ingreso irregular" },
  { code: "MIG-02", desc: "Solicitud de refugio" },
  { code: "MIG-03", desc: "Orden de expulsión" },
  { code: "MIG-04", desc: "Expulsión ejecutada" },
  { code: "MIG-05", desc: "Vinculado a delito" },
  { code: "MIG-06", desc: "Documento falso" },
  { code: "MIG-07", desc: "Organización criminal" },
  { code: "MIG-08", desc: "Incivilidades" },
  { code: "MIG-09", desc: "Control preventivo" },
  { code: "MIG-10", desc: "Control investigativo" }
];

// --- Inicialización de UI ---
document.addEventListener("DOMContentLoaded", () => {
  setupTabs();
  setupMIGChips();
  populateMIGFilter();
  renderPersonas();
  renderEventos();
  renderDirecciones();
  fillPersonaSelects();

  setupPersonasForm();
  setupEventosForm();
  setupDireccionesForm();
  setupSearchFilters();
  setupExportImport();
  setupFicha();
  setupMapa();
});

// --- Tabs ---
function setupTabs() {
  const buttons = document.querySelectorAll(".tab-button");
  const tabs = document.querySelectorAll(".tab");

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.remove("active"));
      tabs.forEach((t) => t.classList.remove("active"));

      btn.classList.add("active");
      const tabId = btn.dataset.tab;
      document.getElementById(`tab-${tabId}`).classList.add("active");
    });
  });
}

// --- MIG Chips ---
function setupMIGChips() {
  const container = document.getElementById("p-mig-codes");
  container.innerHTML = "";
  MIG_CODES.forEach((m) => {
    const chip = document.createElement("div");
    chip.className = "chip";
    chip.dataset.code = m.code;
    chip.title = m.desc;
    chip.innerHTML = `<span class="chip-label">${m.code}</span>`;
    chip.addEventListener("click", () => {
      chip.classList.toggle("active");
    });
    container.appendChild(chip);
  });
}

// Llenar select filtro MIG
function populateMIGFilter() {
  const sel = document.getElementById("persona-filtro-mig");
  MIG_CODES.forEach((m) => {
    const opt = document.createElement("option");
    opt.value = m.code;
    opt.textContent = m.code;
    sel.appendChild(opt);
  });
}

// --- Formularios ---
// PERSONAS
function setupPersonasForm() {
  const form = document.getElementById("persona-form");
  const resetBtn = document.getElementById("persona-reset-btn");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const persona = getPersonaFromForm();
    const editId = document.getElementById("p-id-edit").value;

    if (editId) {
      // editar
      const idx = db.personas.findIndex((p) => p.id === editId);
      if (idx !== -1) {
        db.personas[idx] = { ...db.personas[idx], ...persona, id: editId };
      }
    } else {
      // nuevo
      persona.id = generateId("MIG");
      db.personas.push(persona);
    }

    saveDB();
    renderPersonas();
    fillPersonaSelects();
    form.reset();
    document.getElementById("p-id-edit").value = "";
    clearMIGChipsSelection();
    alert("Persona guardada.");
  });

  resetBtn.addEventListener("click", () => {
    document.getElementById("p-id-edit").value = "";
    clearMIGChipsSelection();
  });
}

function clearMIGChipsSelection() {
  document
    .querySelectorAll("#p-mig-codes .chip")
    .forEach((c) => c.classList.remove("active"));
}

function getSelectedMIGCodes() {
  const active = document.querySelectorAll("#p-mig-codes .chip.active");
  return Array.from(active).map((c) => c.dataset.code);
}

function setSelectedMIGCodes(codes) {
  clearMIGChipsSelection();
  if (!codes || !Array.isArray(codes)) return;
  document.querySelectorAll("#p-mig-codes .chip").forEach((c) => {
    if (codes.includes(c.dataset.code)) {
      c.classList.add("active");
    }
  });
}

function getPersonaFromForm() {
  return {
    id: null,
    nombre: document.getElementById("p-nombre").value.trim(),
    alias: document.getElementById("p-alias").value.trim(),
    nacionalidad: document.getElementById("p-nacionalidad").value.trim(),
    fecha_nacimiento: document.getElementById("p-fecha-nac").value || "",
    documento: document.getElementById("p-documento").value.trim(),
    estado_migratorio: document.getElementById("p-estado").value,
    fecha_ingreso: document.getElementById("p-fecha-ingreso").value || "",
    tipo_ingreso: document.getElementById("p-tipo-ingreso").value,
    domicilio: document.getElementById("p-domicilio").value.trim(),
    delito: document.getElementById("p-delito").value,
    orden_expulsion: document.getElementById("p-orden-exp").value,
    expulsion_ejecutada: document.getElementById("p-exp-ejecutada").value,
    mig_codes: getSelectedMIGCodes(),
    observaciones: document.getElementById("p-observaciones").value.trim()
  };
}

function fillPersonaForm(p) {
  document.getElementById("p-id-edit").value = p.id;
  document.getElementById("p-nombre").value = p.nombre || "";
  document.getElementById("p-alias").value = p.alias || "";
  document.getElementById("p-nacionalidad").value = p.nacionalidad || "";
  document.getElementById("p-fecha-nac").value = p.fecha_nacimiento || "";
  document.getElementById("p-documento").value = p.documento || "";
  document.getElementById("p-estado").value = p.estado_migratorio || "";
  document.getElementById("p-fecha-ingreso").value = p.fecha_ingreso || "";
  document.getElementById("p-tipo-ingreso").value = p.tipo_ingreso || "";
  document.getElementById("p-domicilio").value = p.domicilio || "";
  document.getElementById("p-delito").value = p.delito || "";
  document.getElementById("p-orden-exp").value = p.orden_expulsion || "";
  document.getElementById("p-exp-ejecutada").value = p.expulsion_ejecutada || "";
  document.getElementById("p-observaciones").value = p.observaciones || "";
  setSelectedMIGCodes(p.mig_codes || []);
}

// EVENTOS
function setupEventosForm() {
  const form = document.getElementById("evento-form");
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const persona_id = document.getElementById("e-persona-id").value;
    if (!persona_id) {
      alert("Selecciona una persona.");
      return;
    }

    const evento = {
      id: generateId("EV"),
      persona_id,
      fecha: document.getElementById("e-fecha").value || "",
      tipo: document.getElementById("e-tipo").value || "",
      unidad: document.getElementById("e-unidad").value.trim(),
      evidencia: document.getElementById("e-evidencia").value.trim(),
      observaciones: document.getElementById("e-observaciones").value.trim()
    };

    db.eventos.push(evento);
    saveDB();
    renderEventos();
    form.reset();
    alert("Evento guardado.");
  });
}

// DIRECCIONES
function setupDireccionesForm() {
  const form = document.getElementById("direccion-form");
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const persona_id = document.getElementById("d-persona-id").value;
    if (!persona_id) {
      alert("Selecciona una persona.");
      return;
    }

    const direccion = {
      id: generateId("D"),
      persona_id,
      direccion: document.getElementById("d-direccion").value.trim(),
      tipo: document.getElementById("d-tipo").value || "",
      lat: parseFloat(document.getElementById("d-lat").value) || null,
      lng: parseFloat(document.getElementById("d-lng").value) || null,
      observaciones: document.getElementById("d-observaciones").value.trim()
    };

    db.direcciones.push(direccion);
    saveDB();
    renderDirecciones();
    form.reset();
    alert("Dirección guardada.");
  });
}

// --- Selects de personas para eventos y direcciones ---
function fillPersonaSelects() {
  const selects = [document.getElementById("e-persona-id"), document.getElementById("d-persona-id")];
  selects.forEach((sel) => {
    const currentValue = sel.value;
    sel.innerHTML = `<option value="">-- Seleccionar persona --</option>`;
    db.personas.forEach((p) => {
      const opt = document.createElement("option");
      opt.value = p.id;
      opt.textContent = `${p.id} · ${p.nombre}`;
      sel.appendChild(opt);
    });
    if (currentValue) sel.value = currentValue;
  });
}

// --- Render tablas ---
// PERSONAS
function renderPersonas() {
  const tbody = document.querySelector("#personas-table tbody");
  tbody.innerHTML = "";

  const search = document.getElementById("persona-buscar").value.toLowerCase();
  const migFilter = document.getElementById("persona-filtro-mig").value;

  db.personas
    .slice()
    .sort((a, b) => a.nombre.localeCompare(b.nombre))
    .forEach((p) => {
      const matchText =
        p.nombre.toLowerCase().includes(search) ||
        p.documento.toLowerCase().includes(search) ||
        p.nacionalidad.toLowerCase().includes(search);

      const hasMig =
        !migFilter || (Array.isArray(p.mig_codes) && p.mig_codes.includes(migFilter));

      if (!matchText || !hasMig) return;

      const tr = document.createElement("tr");

      const migText = (p.mig_codes || []).join(", ");

      tr.innerHTML = `
        <td>${p.id}</td>
        <td>${p.nombre}</td>
        <td>${p.nacionalidad || ""}</td>
        <td>${p.estado_migratorio || ""}</td>
        <td>${migText}</td>
        <td>
          <span class="action-link" data-action="ficha" data-id="${p.id}">Ficha</span>
          <span class="action-link" data-action="editar" data-id="${p.id}">Editar</span>
          <span class="action-link danger" data-action="eliminar" data-id="${p.id}">Eliminar</span>
        </td>
      `;

      tbody.appendChild(tr);
    });

  // Acciones
  tbody.querySelectorAll(".action-link").forEach((link) => {
    link.addEventListener("click", () => {
      const id = link.dataset.id;
      const action = link.dataset.action;
      const persona = db.personas.find((p) => p.id === id);
      if (!persona) return;

      if (action === "editar") {
        fillPersonaForm(persona);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else if (action === "eliminar") {
        if (confirm("¿Eliminar esta persona y sus vínculos (eventos/direcciones)?")) {
          db.personas = db.personas.filter((p) => p.id !== id);
          db.eventos = db.eventos.filter((e) => e.persona_id !== id);
          db.direcciones = db.direcciones.filter((d) => d.persona_id !== id);
          saveDB();
          renderPersonas();
          renderEventos();
          renderDirecciones();
          fillPersonaSelects();
        }
      } else if (action === "ficha") {
        mostrarFichaPersona(persona);
      }
    });
  });
}

// EVENTOS
function renderEventos() {
  const tbody = document.querySelector("#eventos-table tbody");
  tbody.innerHTML = "";

  const search = document.getElementById("evento-buscar").value.toLowerCase();

  db.eventos
    .slice()
    .sort((a, b) => (a.fecha || "").localeCompare(b.fecha || ""))
    .forEach((ev) => {
      const persona = db.personas.find((p) => p.id === ev.persona_id);
      const nombre = persona ? persona.nombre : "";

      const match =
        (ev.persona_id || "").toLowerCase().includes(search) ||
        nombre.toLowerCase().includes(search) ||
        (ev.tipo || "").toLowerCase().includes(search) ||
        (ev.unidad || "").toLowerCase().includes(search) ||
        (ev.evidencia || "").toLowerCase().includes(search);

      if (!match) return;

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${ev.fecha || ""}</td>
        <td>${ev.persona_id}</td>
        <td>${nombre}</td>
        <td>${ev.tipo || ""}</td>
        <td>${ev.unidad || ""}</td>
        <td>${ev.evidencia || ""}</td>
      `;
      tbody.appendChild(tr);
    });
}

// DIRECCIONES
function renderDirecciones() {
  const tbody = document.querySelector("#direcciones-table tbody");
  tbody.innerHTML = "";

  const search = document.getElementById("direccion-buscar").value.toLowerCase();

  db.direcciones.forEach((d) => {
    const persona = db.personas.find((p) => p.id === d.persona_id);
    const nombre = persona ? persona.nombre : "";

    const textToSearch =
      `${d.persona_id} ${nombre} ${d.direccion} ${d.tipo}`.toLowerCase();

    if (!textToSearch.includes(search)) return;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${d.persona_id}</td>
      <td>${nombre}</td>
      <td>${d.direccion}</td>
      <td>${d.tipo || ""}</td>
      <td>${d.lat ?? ""}</td>
      <td>${d.lng ?? ""}</td>
    `;
    tbody.appendChild(tr);
  });
}

// --- Buscadores ---
function setupSearchFilters() {
  document.getElementById("persona-buscar").addEventListener("input", renderPersonas);
  document.getElementById("persona-filtro-mig").addEventListener("change", renderPersonas);
  document.getElementById("evento-buscar").addEventListener("input", renderEventos);
  document.getElementById("direccion-buscar").addEventListener("input", renderDirecciones);
}

// --- Ficha de persona ---
function setupFicha() {
  const cerrarBtn = document.getElementById("cerrar-ficha-btn");
  cerrarBtn.addEventListener("click", () => {
    document.getElementById("ficha-panel").style.display = "none";
  });

  document.getElementById("ficha-imprimir-btn").addEventListener("click", () => {
    window.print();
  });
}

function mostrarFichaPersona(p) {
  const panel = document.getElementById("ficha-panel");
  const container = document.getElementById("ficha-contenido");

  // Eventos y direcciones de esta persona
  const eventos = db.eventos.filter((e) => e.persona_id === p.id);
  const direcciones = db.direcciones.filter((d) => d.persona_id === p.id);

  const migText = (p.mig_codes || []).join(", ");

  container.innerHTML = `
    <h3>${p.nombre}</h3>
    <p><strong>ID interno:</strong> ${p.id}</p>
    <dl>
      <dt>Alias</dt><dd>${p.alias || "-"}</dd>
      <dt>Nacionalidad</dt><dd>${p.nacionalidad || "-"}</dd>
      <dt>Documento</dt><dd>${p.documento || "-"}</dd>
      <dt>Fecha nacimiento</dt><dd>${p.fecha_nacimiento || "-"}</dd>
      <dt>Estado migratorio</dt><dd>${p.estado_migratorio || "-"}</dd>
      <dt>Fecha ingreso</dt><dd>${p.fecha_ingreso || "-"}</dd>
      <dt>Tipo ingreso</dt><dd>${p.tipo_ingreso || "-"}</dd>
      <dt>Domicilio declarado</dt><dd>${p.domicilio || "-"}</dd>
      <dt>Vinculado a delito</dt><dd>${p.delito || "No"}</dd>
      <dt>Orden de expulsión</dt><dd>${p.orden_expulsion || "No"}</dd>
      <dt>Expulsión ejecutada</dt><dd>${p.expulsion_ejecutada || "No"}</dd>
      <dt>Códigos MIG</dt><dd>${migText || "-"}</dd>
      <dt>Observaciones</dt><dd>${p.observaciones || "-"}</dd>
    </dl>

    <h4>Eventos vinculados</h4>
    ${
      eventos.length === 0
        ? "<p>No hay eventos registrados.</p>"
        : `<ul>${eventos
            .map(
              (e) =>
                `<li>${e.fecha || ""} · ${e.tipo || ""} · ${e.unidad || ""} · ${
                  e.evidencia || ""
                }</li>`
            )
            .join("")}</ul>`
    }

    <h4>Direcciones vinculadas</h4>
    ${
      direcciones.length === 0
        ? "<p>No hay direcciones registradas.</p>"
        : `<ul>${direcciones
            .map(
              (d) =>
                `<li>${d.direccion} · ${d.tipo || ""}${
                  d.lat && d.lng ? ` · (${d.lat}, ${d.lng})` : ""
                }</li>`
            )
            .join("")}</ul>`
    }
  `;

  panel.style.display = "block";
  panel.scrollIntoView({ behavior: "smooth" });
}

// --- Exportar / Importar ---
function setupExportImport() {
  const exportBtn = document.getElementById("exportar-json-btn");
  const importBtn = document.getElementById("importar-json-btn");
  const importInput = document.getElementById("importar-json-input");

  exportBtn.addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(db, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const fecha = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `migratorio-analisis-backup-${fecha}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  importBtn.addEventListener("click", () => {
    const file = importInput.files && importInput.files[0];
    if (!file) {
      alert("Selecciona un archivo .json primero.");
      return;
    }
    if (!confirm("Esto sobrescribirá la base actual. ¿Continuar?")) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        if (!imported || typeof imported !== "object") {
          throw new Error("Formato inválido.");
        }
        db = {
          personas: imported.personas || [],
          eventos: imported.eventos || [],
          direcciones: imported.direcciones || []
        };
        saveDB();
        renderPersonas();
        renderEventos();
        renderDirecciones();
        fillPersonaSelects();
        alert("Base importada correctamente.");
      } catch (err) {
        console.error(err);
        alert("Error al importar la base. Revisa el archivo.");
      }
    };
    reader.readAsText(file);
  });
}

// --- Mapa ---
let map;
let markersLayer;

function setupMapa() {
  const mapDiv = document.getElementById("map");
  if (!mapDiv) return;

  map = L.map("map").setView([-33.45, -70.65], 11);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap"
  }).addTo(map);

  markersLayer = L.layerGroup().addTo(map);

  document
    .getElementById("mapa-actualizar-btn")
    .addEventListener("click", updateMapMarkers);
}

function updateMapMarkers() {
  if (!markersLayer) return;
  markersLayer.clearLayers();

  const points = db.direcciones.filter((d) => d.lat != null && d.lng != null);
  if (points.length === 0) {
    alert("No hay direcciones con coordenadas registradas.");
    return;
  }

  const bounds = [];
  points.forEach((d) => {
    const persona = db.personas.find((p) => p.id === d.persona_id);
    const nombre = persona ? persona.nombre : "";

    const marker = L.marker([d.lat, d.lng]).addTo(markersLayer);
    marker.bindPopup(
      `<strong>${nombre}</strong><br>${d.direccion}<br>${d.tipo || ""}`
    );
    bounds.push([d.lat, d.lng]);
  });

  if (bounds.length > 0) {
    map.fitBounds(bounds, { padding: [20, 20] });
  }
}
