const GITHUB_RAW_URL = 'https://raw.githubusercontent.com/carlosantencinas/insumos-pwa/4baa7c0dccc19e622a3d1bf9745cc334b1f0ca54/insumos.xlsx';

const tableContainer = document.getElementById('table-container');

let data = [];
let filteredData = [];

async function loadExcelFromURL(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Error al descargar archivo Excel');

    const arrayBuffer = await response.arrayBuffer();
    const dataArray = new Uint8Array(arrayBuffer);
    const workbook = XLSX.read(dataArray, { type: 'array' });

    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const json = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

    data = json;
    filteredData = [...data];
    renderTable(filteredData);
    renderCharts(filteredData);

  } catch (error) {
    tableContainer.innerHTML = `<p>Error cargando archivo: ${error.message}</p>`;
    console.error(error);
  }
}

// Renderizado y funciones para filtros y gráficos, igual que antes

function renderTable(dataArray) {
  if(dataArray.length === 0){
    tableContainer.innerHTML = '<p>No hay datos para mostrar.</p>';
    return;
  }

  const columns = Object.keys(dataArray[0]);

  let html = '<table><thead><tr>';
  columns.forEach(col => {
    html += `<th>${col}<br><input type="text" data-col="${col}" placeholder="Filtrar" /></th>`;
  });
  html += '</tr></thead><tbody>';

  dataArray.forEach(row => {
    html += '<tr>';
    columns.forEach(col => {
      html += `<td>${row[col]}</td>`;
    });
    html += '</tr>';
  });
  html += '</tbody></table>';

  tableContainer.innerHTML = html;

  // Añadir eventos para filtrar
  const inputs = tableContainer.querySelectorAll('thead input');
  inputs.forEach(input => {
    input.addEventListener('input', onFilterChange);
  });
}

function onFilterChange() {
  const inputs = tableContainer.querySelectorAll('thead input');
  filteredData = data.filter(row => {
    return Array.from(inputs).every(input => {
      const col = input.dataset.col;
      const val = input.value.trim().toLowerCase();
      if (!val) return true;
      return row[col].toString().toLowerCase().includes(val);
    });
  });
  renderTable(filteredData);
  renderCharts(filteredData);
}

function renderCharts(dataArray) {
  if (!dataArray.length) return;

  const parsedData = dataArray.map(item => ({
    desc: item['Descripción insumos'],
    cant: parseFloat(item['Cant.']) || 0,
    costo: parseFloat(item['Parcial (Bs)']) || 0
  }));

  const totalCosto = parsedData.reduce((acc, cur) => acc + cur.costo, 0);

  const topCantidad = [...parsedData]
    .sort((a,b) => b.cant - a.cant)
    .slice(0,5);

  const topCosto = [...parsedData]
    .sort((a,b) => b.costo - a.costo)
    .slice(0,5);

  function prepareChartData(items) {
    const labels = items.map(i => i.desc);
    const values = items.map(i => i.costo);
    const otros = totalCosto - values.reduce((a,b) => a+b, 0);
    if (otros > 0) {
      labels.push('Otros');
      values.push(otros);
    }
    return {labels, values};
  }

  const chartDataCant = prepareChartData(topCantidad);
  const chartDataCosto = prepareChartData(topCosto);

  renderPieChart('chartCantidad', chartDataCant.labels, chartDataCant.values);
  renderPieChart('chartCosto', chartDataCosto.labels, chartDataCosto.values);
}

let chartInstances = {};
function renderPieChart(canvasId, labels, data) {
  if(chartInstances[canvasId]){
    chartInstances[canvasId].destroy();
  }
  const ctx = document.getElementById(canvasId).getContext('2d');
  chartInstances[canvasId] = new Chart(ctx, {
    type: 'pie',
    data: {
      labels,
      datasets: [{
        label: 'Costo (Bs)',
        data,
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#C9CBCF'
        ]
      }]
    },
    options: { responsive: true }
  });
}

// Cargar archivo al inicio
loadExcelFromURL(GITHUB_RAW_URL);

// Registro service worker igual que antes
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').then(() => {
      console.log('Service Worker registrado');
    }).catch(err => console.log('Error registrando SW:', err));
  });
}
