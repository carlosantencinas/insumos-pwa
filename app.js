let data = [];
let filteredData = [];
let chartCosto;
let chartCantidad;

const inputFilter = document.getElementById('inputFilter');
const resetButton = document.getElementById('resetFilter');
const tableBody = document.querySelector('#dataTable tbody');
const chartCostoCanvas = document.getElementById('chartCosto');
const chartCantidadCanvas = document.getElementById('chartCantidad');
const topCantidadInput = document.getElementById('topCantidad');
const topCostoInput = document.getElementById('topCosto');

fetch('https://raw.githubusercontent.com/carlosantencinas/insumos-pwa/4baa7c0dccc19e622a3d1bf9745cc334b1f0ca54/insumos.xlsx')
  .then(res => res.arrayBuffer())
  .then(buffer => {
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    data = XLSX.utils.sheet_to_json(sheet);
    filteredData = [...data]; // Mostrar todo al inicio
    renderTable(filteredData);
    updateChartCosto();
    updateChartCantidad();
  });

function renderTable(dataToRender) {
  tableBody.innerHTML = '';

  if (dataToRender.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 6;
    td.style.textAlign = 'center';
    td.textContent = 'No hay datos para mostrar.';
    tr.appendChild(td);
    tableBody.appendChild(tr);
    return;
  }

  dataToRender.forEach(row => {
    const tr = document.createElement('tr');
    ['Nº', 'Descripción insumos', 'Und.', 'Cant.', 'Unit.', 'Parcial (Bs)'].forEach(key => {
      const td = document.createElement('td');
      td.textContent = row[key];
      tr.appendChild(td);
    });
    tableBody.appendChild(tr);
  });
}

function updateChartCosto() {
  const topN = parseInt(topCostoInput.value || 5);
  const sorted = [...filteredData]
    .sort((a, b) => (parseFloat(b['Parcial (Bs)']) || 0) - (parseFloat(a['Parcial (Bs)']) || 0))
    .slice(0, topN);

  const total = filteredData.reduce((sum, row) => sum + (parseFloat(row['Parcial (Bs)']) || 0), 0);
  const labels = sorted.map(row => row['Descripción insumos']);
  const values = sorted.map(row => parseFloat(row['Parcial (Bs)']));

  if (chartCosto) chartCosto.destroy();
  chartCosto = new Chart(chartCostoCanvas, {
    type: 'pie',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: labels.map(() => `hsl(${Math.random() * 360}, 70%, 70%)`)
      }]
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: `Top ${topN} por Costo (Bs) sobre un total de ${total.toFixed(2)} Bs`
        }
      }
    }
  });
}

function updateChartCantidad() {
  const topN = parseInt(topCantidadInput.value || 5);
  const sorted = [...filteredData]
    .sort((a, b) => (parseFloat(b['Cant.']) || 0) - (parseFloat(a['Cant.']) || 0))
    .slice(0, topN);

  const labels = sorted.map(row => row['Descripción insumos']);
  const values = sorted.map(row => parseFloat(row['Cant.']));

  if (chartCantidad) chartCantidad.destroy();
  chartCantidad = new Chart(chartCantidadCanvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Cantidad',
        data: values,
        backgroundColor: 'rgba(54, 162, 235, 0.6)'
      }]
    },
    options: {
      indexAxis: 'y',
      plugins: {
        title: {
          display: true,
          text: `Top ${topN} por Cantidad`
        },
        legend: { display: false }
      },
      scales: {
        x: {
          beginAtZero: true
        }
      }
    }
  });
}

// EVENTOS

inputFilter.addEventListener('input', () => {
  const text = inputFilter.value.toLowerCase();
  filteredData = data.filter(row =>
    (row['Descripción insumos'] || '').toString().toLowerCase().includes(text)
  );
  renderTable(filteredData);
  updateChartCosto();
  updateChartCantidad();
});

resetButton.addEventListener('click', () => {
  inputFilter.value = '';
  filteredData = [...data];
  renderTable(filteredData);
  updateChartCosto();
  updateChartCantidad();
});

topCantidadInput.addEventListener('input', () => {
  updateChartCantidad();
});

topCostoInput.addEventListener('input', () => {
  updateChartCosto();
});
