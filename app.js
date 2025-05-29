const inputExcel = document.getElementById('input-excel');
const tableContainer = document.getElementById('table-container');

let data = []; // Array de objetos con datos
let filteredData = [];

inputExcel.addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (evt) => {
    const dataArray = new Uint8Array(evt.target.result);
    const workbook = XLSX.read(dataArray, {type:'array'});
    // Suponemos la primera hoja
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const json = XLSX.utils.sheet_to_json(worksheet, {defval: ''});
    data = json;
    filteredData = [...data];
    renderTable(filteredData);
    renderCharts(filteredData);
  };
  reader.readAsArrayBuffer(file);
});

// Renderizar tabla con filtros en encabezado
function renderTable(dataArray) {
  if(dataArray.length === 0){
    tableContainer.innerHTML = '<p>No hay datos para mostrar.</p>';
    return;
  }

  const columns = Object.keys(dataArray[0]);

  // Crear tabla y encabezados con input de filtro
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

  // Agregar eventos a inputs para filtrar
  const inputs = tableContainer.querySelectorAll('thead input');
  inputs.forEach(input => {
    input.addEventListener('input', onFilterChange);
  });
}

// Función que filtra tabla según inputs
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

// Generar gráficos de torta para top 5 por cantidad y costo
function renderCharts(dataArray) {
  if (!dataArray.length) return;

  // Parsear valores numéricos
  const parsedData = dataArray.map(item => ({
    desc: item['Descripción insumos'],
    cant: parseFloat(item['Cant.']) || 0,
    costo: parseFloat(item['Parcial (Bs)']) || 0
  }));

  const totalCosto = parsedData.reduce((acc, cur) => acc + cur.costo, 0);

  // Top 5 por cantidad
  const topCantidad = [...parsedData]
    .sort((a,b) => b.cant - a.cant)
    .slice(0,5);

  // Top 5 por costo
  const topCosto = [...parsedData]
    .sort((a,b) => b.costo - a.costo)
    .slice(0,5);

  // Función para preparar datos para Chart.js
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
    options: {
      responsive: true
    }
  });
}

// Registrar service worker para PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').then(() => {
      console.log('Service Worker registrado');
    }).catch(err => console.log('Error registrando SW:', err));
  });
}
