import XLSX from "https://cdn.sheetjs.com/xlsx-latest/package/xlsx.mjs";

const urlExcel = "https://raw.githubusercontent.com/carlosantencinas/insumos-pwa/4baa7c0dccc19e622a3d1bf9745cc334b1f0ca54/insumos.xlsx";

let datos = [];
let tablaBody, filterRow, headerRow;
let filtros = {};
let chartCosto, chartCantidad, chartPorcentaje;

document.addEventListener("DOMContentLoaded", async () => {
  tablaBody = document.querySelector("#tablaInsumos tbody");
  filterRow = document.getElementById("filter-row");
  headerRow = document.getElementById("header-row");

  await cargarDatos();

  crearTablaCompleta();
  crearFiltros();
  mostrarTabla(datos);

  configurarBotones();

  inicializarGraficas();
  mostrarTopPorCosto(5); // mostrar por defecto Top 5
  mostrarTopPorCantidad(5);
  mostrarPorcentajeTopCosto(5);
});

async function cargarDatos() {
  const resp = await fetch(urlExcel);
  const arrayBuffer = await resp.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
  // Aseguramos que Cant., Unit. y Parcial sean números
  datos = jsonData.map((row, i) => ({
    Nº: row["Nº"] ?? i + 1,
    "Descripción insumos": row["Descripción insumos"] ?? "",
    Und: row["Und."] ?? "",
    Cant: Number(row["Cant."]) || 0,
    Unit: Number(row["Unit."]) || 0,
    Parcial: Number(row["Parcial (Bs)"]) || 0,
  }));
}

function crearTablaCompleta() {
  // Crear headers según keys del primer objeto
  const keys = Object.keys(datos[0]);
  headerRow.innerHTML = "";
  keys.forEach((key) => {
    const th = document.createElement("th");
    th.textContent = key;
    headerRow.appendChild(th);
  });
}

function crearFiltros() {
  const keys = Object.keys(datos[0]);
  filterRow.innerHTML = "";
  filtros = {};
  keys.forEach((key) => {
    const th = document.createElement("th");
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Filtrar...";
    input.addEventListener("input", () => {
      filtros[key] = input.value.trim().toLowerCase();
      filtrarYMostrar();
    });
    th.appendChild(input);
    filterRow.appendChild(th);
  });
}

function filtrarYMostrar() {
  let datosFiltrados = datos.filter((fila) => {
    return Object.entries(filtros).every(([key, val]) => {
      if (!val) return true;
      const texto = ("" + fila[key]).toLowerCase();
      return texto.includes(val);
    });
  });
  mostrarTabla(datosFiltrados);
}

function mostrarTabla(datosMostrar) {
  tablaBody.innerHTML = "";
  if (datosMostrar.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = Object.keys(datos[0]).length;
    td.textContent = "No hay datos para mostrar.";
    tr.appendChild(td);
    tablaBody.appendChild(tr);
    return;
  }
  datosMostrar.forEach((fila) => {
    const tr = document.createElement("tr");
    Object.values(fila).forEach((valor) => {
      const td = document.createElement("td");
      td.textContent = valor;
      tr.appendChild(td);
    });
    tablaBody.appendChild(tr);
  });
}

function configurarBotones() {
  const topNInput = document.getElementById("topN");
  document.getElementById("topCantidad").addEventListener("click", () => {
    const n = Math.max(1, Number(topNInput.value));
    mostrarTopPorCantidad(n);
  });
  document.getElementById("topCosto").addEventListener("click", () => {
    const n = Math.max(1, Number(topNInput.value));
    mostrarTopPorCosto(n);
    mostrarPorcentajeTopCosto(n);
  });
  document.getElementById("reset").addEventListener("click", () => {
    limpiarFiltros();
    mostrarTabla(datos);
    mostrarTopPorCantidad(Number(topNInput.value));
    mostrarTopPorCosto(Number(topNInput.value));
    mostrarPorcentajeTopCosto(Number(topNInput.value));
  });
}

function limpiarFiltros() {
  filtros = {};
  [...filterRow.querySelectorAll("input")].forEach((input) => (input.value = ""));
}

function inicializarGraficas() {
  const ctxCosto = document.getElementById("chartCosto").getContext("2d");
  const ctxCantidad = document.getElementById("chartCantidad").getContext("2d");
  const ctxPorcentaje = document.getElementById("chartPorcentaje").getContext("2d");

  chartCosto = new Chart(ctxCosto, {
    type: "pie",
    data: {
      labels: [],
      datasets: [{ data: [], backgroundColor: [] }],
    },
    options: {
      responsive: false,
      plugins: {
        title: { display: true, text: "" },
      },
    },
  });

  chartCantidad = new Chart(ctxCantidad, {
    type: "pie",
    data: {
      labels: [],
      datasets: [{ data: [], backgroundColor: [] }],
    },
    options: {
      responsive: false,
      plugins: {
        title: { display: true, text: "" },
      },
    },
  });

  chartPorcentaje = new Chart(ctxPorcentaje, {
    type: "pie",
    data: {
      labels: ["Top N por costo", "Resto del total"],
      datasets: [{
        data: [0, 0],
        backgroundColor: ["#4caf50", "#e0e0e0"],
      }],
    },
    options: {
      responsive: false,
      plugins: {
        title: {
          display: true,
          text: "Porcentaje Top N por costo respecto al total",
        },
      },
    },
  });
}

function colorAleatorio() {
  const letras = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letras[Math.floor(Math.random() * 16)];
  }
  return color;
}

function mostrarTopPorCosto(n) {
  // Aplicar filtros
  let datosFiltrados = datos.filter((fila) => {
    return Object.entries(filtros).every(([key, val]) => {
      if (!val) return true;
      const texto = ("" + fila[key]).toLowerCase();
      return texto.includes(val);
    });
  });

  let topCosto = [...datosFiltrados].sort((a, b) => b.Parcial - a.Parcial).slice(0, n);
  const labels = topCosto.map((item) => item["Descripción insumos"]);
  const data = topCosto.map((item) => item.Parcial);
  const colors = labels.map(() => colorAleatorio());

  chartCosto.data.labels = labels;
  chartCosto.data.datasets[0].data = data;
  chartCosto.data.datasets[0].backgroundColor = colors;
  chartCosto.options.plugins.title.text = `Top ${n} por Costo`;
  chartCosto.update();
}

function mostrarTopPorCantidad(n) {
  let datosFiltrados = datos.filter((fila) => {
    return Object.entries(filtros).every(([key, val]) => {
      if (!val) return true;
      const texto = ("" + fila[key]).toLowerCase();
      return texto.includes(val);
    });
  });

  let topCantidad = [...datosFiltrados].sort((a, b) => b.Cant - a.Cant).slice(0, n);
  const labels = topCantidad.map((item) => item["Descripción insumos"]);
  const data = topCantidad.map((item) => item.Cant);
  const colors = labels.map(() => colorAleatorio());

  chartCantidad.data.labels = labels;
  chartCantidad.data.datasets[0].data = data;
  chartCantidad.data.datasets[0].backgroundColor = colors;
  chartCantidad.options.plugins.title.text = `Top ${n} por Cantidad`;
  chartCantidad.update();
}

function mostrarPorcentajeTopCosto(n) {
  // Datos sin filtro para total general
  const totalGeneral = datos.reduce((acc, item) => acc + item.Parcial, 0);

  // Datos filtrados para aplicar filtros de inputs
  let datosFiltrados = datos.filter((fila) => {
    return Object.entries(filtros).every(([key, val]) => {
      if (!val) return true;
      const texto = ("" + fila[key]).toLowerCase();
      return texto.includes(val);
    });
  });

  // Top N por costo del conjunto filtrado
  let topCostoFiltrado = [...datosFiltrados].sort((a, b) => b.Parcial - a.Parcial).slice(0, n);
  const sumaTop = topCostoFiltrado.reduce((acc, item) => acc + item.Parcial, 0);

  const dataPorcentajes = [sumaTop, Math.max(totalGeneral - sumaTop, 0)];

  chartPorcentaje.data.datasets[0].data = dataPorcentajes;
  chartPorcentaje.options.plugins.title.text = `Porcentaje Top ${n} por costo vs Total (${totalGeneral.toFixed(2)} Bs)`;
  chartPorcentaje.update();
}
