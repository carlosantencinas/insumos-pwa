let data = [];
let filteredData = [];

const tabla = document.getElementById('tablaInsumos').getElementsByTagName('tbody')[0];
const topNInput = document.getElementById('topN');
const chartCanvas = document.getElementById('chartCosto');
const resetButton = document.getElementById('reset');
const topCantidadBtn = document.getElementById('topCantidad');
const topCostoBtn = document.getElementById('topCosto');
let chartInstance;

const columnKeys = ['Nº', 'Descripción insumos', 'Und.', 'Cant.', 'Unit.', 'Parcial (Bs)'];

function renderTable(dataToShow) {
  tabla.innerHTML = '';

  dataToShow.forEach(row => {
    const tr = document.createElement('tr');
    columnKeys.forEach(key => {
      const td = document.createElement('td');
      td.textContent = row[key] ?? '';
      tr.appendChild(td);
    });
    tabla.appendChild(tr);
  });
}

function renderHeaderAndFilters() {
  const headerRow = document.getElementById('header-row');
  const filterRow = document.getElementById('filter-row');
  headerRow.innerHTML = '';
  filterRow.innerHTML = '';

  columnKeys.forEach(key => {
    const th = document.createElement('th');
    th.textContent = key;
    headerRow.appendChild(th);

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = `Filtrar...`;
    input.dataset.key = key;

    input.addEventListener('input', applyFilters);

    const filterTh = document.createElement('th');
    filterTh.appendChild(input);
    filterRow.appendChild(filterTh);
  });
}

function applyFilters() {
  const inputs = document.querySelectorAll('#filter-row input');
  filteredData = data.filter(row => {
    return Array.from(inputs).every(input => {
      const key = input.dataset.key;
      const value = input.value.trim().toLowerCase();
      return row[key]?.toString().toLowerCase().includes(value);
    });
  });
  renderTable(filteredData);
  updateChart(filteredData);
}

function resetFilters() {
  const inputs = document.querySelectorAll('#filter-row input');
  inputs.forEach(input => input.value = '');
  filteredData = [...data];
  renderTable(filteredData);
  updateChart(filteredData);
}

function getTopN(dataSet, field, n) {
  return [...dataSet]
    .sort((a, b) => parseFloat(b[field]) - parseFloat(a[field]))
    .slice(0, n);
}

function updateChart(dataSet) {
  const topN = parseInt(topNInput.value) || 5;
  const topItems = getTopN(dataSet, 'Parcial (Bs)', topN);

  const labels = topItems.map(item => item['Descripción insumos']);
  const valores = topItems.map(item => parseFloat(item['Parcial (Bs)']));
  const total = valores.reduce((acc, v) => acc + v, 0);

  if (chartInstance) chartInstance.destroy();

  chartInstance = new Chart(chartCanvas, {
    type: 'pie',
    data: {
      labels,
      datasets: [{
        label: 'Costo',
        data: valores,
        backgroundColor: ['#ff6384', '#36a2eb', '#ffcd56', '#4bc0c0', '#9966ff', '#c9cbcf']
      }]
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: `Distribución de los ${topN} materiales más costosos (Total Bs: ${total.toFixed(2)})`
        }
      }
    }
  });
}

topCantidadBtn.addEventListener('click', () => {
  const topN = parseInt(topNInput.value) || 5;
  const topItems = getTopN(filteredData, 'Cant.', topN);
  renderTable(topItems);
  updateChart(topItems);
});

topCostoBtn.addEventListener('click', () => {
  const topN = parseInt(topNInput.value) || 5;
  const topItems = getTopN(filteredData, 'Parcial (Bs)', topN);
  renderTable(topItems);
  updateChart(topItems);
});

resetButton.addEventListener('click', resetFilters);

fetch('https://raw.githubusercontent.com/carlosantencinas/insumos-pwa/4baa7c0dccc19e622a3d1bf9745cc334b1f0ca54/insumos.xlsx')
  .then(res => res.arrayBuffer())
  .then(buffer => {
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    data = XLSX.utils.sheet_to_json(sheet);
    filteredData = [...data];

    renderHeaderAndFilters();
    renderTable(filteredData);
    updateChart(filteredData);
  });
