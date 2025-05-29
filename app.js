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

const chartCostoCanvas = document.getElementById('chartCosto');
const chartCantidadCanvas = document.getElementById('chartCantidad');
const chartPorcentajeCanvas = document.getElementById('chartPorcentaje');

let chartCostoInstance;
let chartCantidadInstance;
let chartPorcentajeInstance;

// Carga y lee Excel
async function loadExcel() {
  const res = await fetch(url);
  const arrayBuffer = await res.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  data = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
  filteredData = [...data];
  buildTableHeader();
  renderTable(filteredData);
  updateCharts(filteredData);
}

// Construye encabezados y fila filtros
function buildTableHeader() {
  headerRow.innerHTML = "";
  filterRow.innerHTML = "";
  if (data.length === 0) return;

  const keys = Object.keys(data[0]);
  keys.forEach((key) => {
    // Header
    const th = document.createElement("th");
    th.textContent = key;
    headerRow.appendChild(th);

    // Filtro
    const filterTh = document.createElement("th");
    const input = document.createElement("input");
    input.type = "text";
    input.dataset.key = key;
    input.placeholder = "Filtrar...";
    input.addEventListener("input", () => {
      applyFilters();
    });
    filterTh.appendChild(input);
    filterRow.appendChild(filterTh);
  });
}

// Renderiza tabla
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

// Aplica filtros
function applyFilters() {
  const inputs = document.querySelectorAll("#filter-row input");
  filteredData = data.filter((row) =>
    Array.from(inputs).every((input) => {
      const key = input.dataset.key;
      const value = input.value.trim().toLowerCase();
      return row[key]?.toString().toLowerCase().includes(value);
    })
  );
  renderTable(filteredData);
  updateCharts(filteredData);
}

// Resetea filtros
function resetFilters() {
  document.querySelectorAll("#filter-row input").forEach((input) => (input.value = ""));
  filteredData = [...data];
  renderTable(filteredData);
  updateCharts(filteredData);
}

// Obtiene Top N por campo numérico descendente
function getTopN(dataSet, key, n) {
  return [...dataSet]
    .sort((a, b) => parseFloat(b[key]) - parseFloat(a[key]))
    .slice(0, n);
}

// Actualiza gráficos
function updateCharts(dataSet) {
  const topN = parseInt(topNInput.value) || 5;

  // Top costo (torta)
  const topCosto = getTopN(dataSet, "Parcial (Bs)", topN);
  const labelsCosto = topCosto.map((item) => item["Descripción insumos"]);
  const valoresCosto = topCosto.map((item) => parseFloat(item["Parcial (Bs)"]));

  if (chartCostoInstance) chartCostoInstance.destroy();
  chartCostoInstance = new Chart(chartCostoCanvas, {
    type: "pie",
    data: {
      labels: labelsCosto,
      datasets: [{
        label: "Costo",
        data: valoresCosto,
        backgroundColor: [
          "#ff6384","#36a2eb","#ffcd56","#4bc0c0","#9966ff","#c9cbcf",
        ],
      }],
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

  // Top cantidad (barra)
  const topCant = getTopN(dataSet, "Cant.", topN);
  const labelsCant = topCant.map((item) => item["Descripción insumos"]);
  const valoresCant = topCant.map((item) => parseFloat(item["Cant."]));

  if (chartCantidadInstance) chartCantidadInstance.destroy();
  chartCantidadInstance = new Chart(chartCantidadCanvas, {
    type: "bar",
    data: {
      labels: labelsCant,
      datasets: [{
        label: "Cantidad",
        data: valoresCant,
        backgroundColor: "#4bc0c0",
      }],
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: `Top ${topN} por Cantidad`,
        },
      },
      scales: {
        y: { beginAtZero: true },
      },
    },
  });

  // Nueva gráfica: porcentaje del Top por costo respecto al total sin filtro
  const totalCostoSinFiltro = data.reduce((acc, item) => acc + parseFloat(item["Parcial (Bs)"] || 0), 0);
  const totalTopCosto = valoresCosto.reduce((acc, val) => acc + val, 0);
  const porcentajeTop = ((totalTopCosto / totalCostoSinFiltro) * 100).toFixed(2);

  if (chartPorcentajeInstance) chartPorcentajeInstance.destroy();
  chartPorcentajeInstance = new Chart(chartPorcentajeCanvas, {
    type: 'doughnut',
    data: {
      labels: [`Top ${topN} (Bs)`, "Resto (Bs)"],
      datasets: [{
        data: [totalTopCosto, totalCostoSinFiltro - totalTopCosto],
        backgroundColor: ["#ff6384", "#e0e0e0"],
      }],
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: `Porcentaje del Top ${topN} por Costo respecto al total: ${porcentajeTop}%`,
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.parsed || 0;
              return `${label}: Bs ${value.toFixed(2)}`;
            }
          }
        }
      },
      cutout: '70%',
    },
  });
}

// Botones
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

loadExcel();
