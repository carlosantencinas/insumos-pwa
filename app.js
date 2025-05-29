import * as XLSX from "https://cdn.sheetjs.com/xlsx-latest/package/xlsx.mjs";

const url = "https://raw.githubusercontent.com/carlosantencinas/insumos-pwa/4baa7c0dccc19e622a3d1bf9745cc334b1f0ca54/insumos.xlsx";

let data = [];
let filteredData = [];

const tabla = document.getElementById("tablaInsumos");
const headerRow = document.getElementById("header-row");
const filterRow = document.getElementById("filter-row");
const tbody = tabla.querySelector("tbody");

const topNInput = document.getElementById("topN");
const topCantidadBtn = document.getElementById("topCantidad");
const topCostoBtn = document.getElementById("topCosto");
const resetBtn = document.getElementById("reset");

const chartCanvas = document.getElementById('chartCosto');
const chartCantidadCanvas = document.getElementById('chartCantidad');

let chartInstance;
let chartCantidadInstance;

// Carga el Excel y prepara todo
async function loadExcel() {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Error al descargar el archivo: ${res.statusText}`);
    const arrayBuffer = await res.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    data = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
    filteredData = [...data];
    buildTableHeader();
    renderTable(data);        // Mostrar toda la tabla al inicio
    updateCharts(data);       // Graficar toda la data
  } catch (error) {
    alert("Error cargando datos: " + error.message);
  }
}

// Construye encabezados y filtros de columna
function buildTableHeader() {
  headerRow.innerHTML = "";
  filterRow.innerHTML = "";
  if (data.length === 0) return;

  const keys = Object.keys(data[0]);
  keys.forEach((key) => {
    // Encabezado
    const th = document.createElement("th");
    th.textContent = key;
    headerRow.appendChild(th);

    // Input filtro
    const filterTh = document.createElement("th");
    const input = document.createElement("input");
    input.type = "text";
    input.dataset.key = key;
    input.placeholder = "Filtrar...";
    input.setAttribute("aria-label", `Filtro para la columna ${key}`);

    input.addEventListener("input", () => {
      applyFilters();
    });

    filterTh.appendChild(input);
    filterRow.appendChild(filterTh);
  });
}

// Renderiza tabla con los datos que recibe
function renderTable(dataSet) {
  tbody.innerHTML = "";
  if (dataSet.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = Object.keys(data[0]).length;
    td.style.textAlign = "center";
    td.textContent = "No hay datos para mostrar.";
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }
  dataSet.forEach((row) => {
    const tr = document.createElement("tr");
    Object.values(row).forEach((val) => {
      const td = document.createElement("td");
      td.textContent = val;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
}

// Aplica filtros desde inputs, filtra sobre todos los datos originales (data)
function applyFilters() {
  const inputs = document.querySelectorAll("#filter-row input");
  filteredData = data.filter((row) =>
    Array.from(inputs).every((input) => {
      const key = input.dataset.key;
      const value = input.value.trim().toLowerCase();
      return value === "" || row[key]?.toString().toLowerCase().includes(value);
    })
  );
  renderTable(filteredData);
  updateCharts(filteredData);
}

// Resetea filtros y muestra toda la data
function resetFilters() {
  document.querySelectorAll("#filter-row input").forEach((input) => (input.value = ""));
  filteredData = [...data];
  renderTable(data);
  updateCharts(data);
}

// Devuelve el Top N por una clave numérica descendente
function getTopN(dataSet, key, n) {
  return [...dataSet]
    .filter(item => !isNaN(parseFloat(item[key])))
    .sort((a, b) => parseFloat(b[key]) - parseFloat(a[key]))
    .slice(0, n);
}

// Actualiza gráficos según data dada
function updateCharts(dataSet) {
  const topN = parseInt(topNInput.value) || 5;

  // Top por costo (pastel)
  const topCosto = getTopN(dataSet, "Parcial (Bs)", topN);
  const labelsCosto = topCosto.map((item) => item["Descripción insumos"]);
  const valoresCosto = topCosto.map((item) => parseFloat(item["Parcial (Bs)"]));

  if (chartInstance) chartInstance.destroy();
  chartInstance = new Chart(chartCanvas, {
    type: "pie",
    data: {
      labels: labelsCosto,
      datasets: [
        {
          label: "Costo",
          data: valoresCosto,
          backgroundColor: [
            "#ff6384",
            "#36a2eb",
            "#ffcd56",
            "#4bc0c0",
            "#9966ff",
            "#c9cbcf",
          ],
        },
      ],
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: `Top ${topN} por Costo (Bs)`,
        },
      },
    },
  });

  // Top por cantidad (barra)
  const topCant = getTopN(dataSet, "Cant.", topN);
  const labelsCant = topCant.map((item) => item["Descripción insumos"]);
  const valoresCant = topCant.map((item) => parseFloat(item["Cant."]));

  if (chartCantidadInstance) chartCantidadInstance.destroy();
  chartCantidadInstance = new Chart(chartCantidadCanvas, {
    type: "bar",
    data: {
      labels: labelsCant,
      datasets: [
        {
          label: "Cantidad",
          data: valoresCant,
          backgroundColor: "#4bc0c0",
        },
      ],
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: `Top ${topN} por Cantidad`,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  });
}

// Eventos botones
topCantidadBtn.addEventListener("click", () => {
  const topN = parseInt(topNInput.value) || 5;
  const topItems = getTopN(filteredData, "Cant.", topN);
  renderTable(topItems);
  updateCharts(topItems);
});

topCostoBtn.addEventListener("click", () => {
  const topN = parseInt(topNInput.value) || 5;
  const topItems = getTopN(filteredData, "Parcial (Bs)", topN);
  renderTable(topItems);
  updateCharts(topItems);
});

resetBtn.addEventListener("click", () => {
  resetFilters();
});

// Carga inicial
loadExcel();
