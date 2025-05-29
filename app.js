let insumos = [];

document.getElementById('fileInput').addEventListener('change', cargarCSV);
document.getElementById('filtroNombre').addEventListener('input', filtrar);
document.getElementById('filtroUnidad').addEventListener('input', filtrar);
document.getElementById('filtroCantidad').addEventListener('input', filtrar);

function cargarCSV(event) {
  const file = event.target.files[0];
  Papa.parse(file, {
    header: true,
    dynamicTyping: true,
    complete: function(results) {
      insumos = results.data;
      filtrar();
    }
  });
}

function filtrar() {
  const nombre = document.getElementById('filtroNombre').value.toLowerCase();
  const unidad = document.getElementById('filtroUnidad').value.toLowerCase();
  const cantidadMin = parseFloat(document.getElementById('filtroCantidad').value) || 0;

  const filtrados = insumos.filter(i =>
    (!nombre || i.Nombre?.toLowerCase().includes(nombre)) &&
    (!unidad || i.Unidad?.toLowerCase().includes(unidad)) &&
    (!isNaN(i.Cantidad) && i.Cantidad >= cantidadMin)
  );

  mostrarTabla(filtrados);
}

function mostrarTabla(data) {
  const tbody = document.querySelector('#tablaInsumos tbody');
  tbody.innerHTML = '';
  data.forEach(i => {
    const fila = document.createElement('tr');
    fila.innerHTML = `
      <td>${i.Nombre}</td>
      <td>${i.Unidad}</td>
      <td>${i.Cantidad}</td>
      <td>${i['Precio Unitario']}</td>
      <td>${i['Costo Parcial']}</td>
    `;
    tbody.appendChild(fila);
  });
}

function mostrarTopCantidad() {
  const topN = parseInt(document.getElementById('topN').value) || 5;
  const top = [...insumos].sort((a, b) => b.Cantidad - a.Cantidad).slice(0, topN);
  mostrarTabla(top);
}

function mostrarTopCosto() {
  const topN = parseInt(document.getElementById('topN').value) || 5;
  const top = [...insumos].sort((a, b) => b['Costo Parcial'] - a['Costo Parcial']).slice(0, topN);
  mostrarTabla(top);
}
