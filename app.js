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

  // Pegar foto (CTRL+V)
  document.addEventListener("paste", async (e) => {
    const items = e.clipboardData.items;
    for (const item of items) {
      if (item.type.indexOf("image") !== -1) {
        const blob = item.getAsFile();
        const reader = new FileReader();
        reader.onload = function (event) {
          const base64 = event.target.result;
          document.getElementById("p-foto-base64").value = base64;

          const preview = document.getElementById("foto-preview");
          preview.innerHTML = `<img src="${base64}" />`;
        };
        reader.readAsDataURL(blob);
      }
    }
  });

}); // ← CIERRE CORRECTO DEL DOMContentLoaded


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
      const tabEl = document.getElementById(`tab-${tabId}`);
      tabEl.classList.add("active");

      if (tabId === "mapa" && typeof map !== "undefined") {
        setTimeout(() => {
          map.invalidateSize();
        }, 200);
      }
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

function populateMIGFilter() {
  const sel = document.getElementById("persona-filtro-mig");
  MIG_CODES.forEach((m) => {
    const opt = document.createElement("option");
    opt.value = m.code;
    opt.textContent = m.code;
    sel.appendChild(opt);
  });
}

// --- Formularios PERSONAS ---
function setupPersonasForm() {
  const form = document.getElementById("persona-form");
  const resetBtn = document.getElementById("persona-reset-btn");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const persona = getPersonaFromForm();
    const editId = document.getElementById("p-id-edit").value;

    if (editId) {
      const idx = db.personas.findIndex((p) => p.id === editId);
      if (idx !== -1) {
        db.personas[idx] = { ...db.personas[idx], ...persona, id: editId };
      }
    } else {
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
  document.querySelectorAll("#p-mig-codes .chip").forEach((c) => c.classList.remove("active"));
}

function getSelectedMIGCodes() {
  const active = document.querySelectorAll("#p-mig-codes .chip.active");
  return Array.from(active).map((c) => c.dataset.code);
}

function setSelectedMIGCodes(codes) {
  clearMIGChipsSelection();
  if (!codes || !Array.isArray(codes)) return;
  document.querySelectorAll("#p-mig-codes .chip").forEach((c) => {
    if (codes.includes(c.dataset.code)) c.classList.add("active");
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

// (EL RESTO DEL CÓDIGO SIGUE IGUAL – eventos, direcciones, render, ficha, exportar, mapa)

