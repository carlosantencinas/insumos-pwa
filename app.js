let insumos = [];

function cargarCSV() {
  Papa.parse("insumos.csv", {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete: function(results) {
      insumos = results.data.map(row => ({
        Nombre: row["Descripción insumos"],
        Unidad: row["Und."],
        Cantidad: parseFloat(row["Cant."]),
        PrecioUnitario: parseFloat(row["Unit."]),
        CostoParcial: parseFloat(row["Parcial (Bs)"])
      }));
      filtrar();
    }
  });
}

function filtrar() {
  const nombre = document.getElementById("filtroNombre").value.toLowerCase();
  const unidad = document.getElementById("filtroUnidad").value.toLowerCase();
  const cantidad = parseFloat(document.getElementById("filtroCantidad").value) || 0;

  const resultados = insumos.filter(i =>
    i.Nombre.toLowerCase().includes(nombre) &&
    i.Unidad.toLowerCase().includes(unidad) &&
    (!cantidad || i.Cantidad >= cantidad)
  );

  const tbody = document.getElementById("tablaInsumos");
  tbody.innerHTML = resultados.map(i => `
    <tr>
      <td>${i.Nombre}</td>
      <td>${i.Unidad}</td>
      <td>${i.Cantidad}</td>
      <td>${i.PrecioUnitario}</td>
      <td>${i.CostoParcial}</td>
    </tr>`).join("");

  mostrarTop(resultados);
}

function mostrarTop(data) {
  const topCantidad = [...data].sort((a, b) => b.Cantidad - a.Cantidad).slice(0, 5);
  const topCosto = [...data].sort((a, b) => b.CostoParcial - a.CostoParcial).slice(0, 5);

  document.getElementById("topCantidad").innerHTML = topCantidad.map(i =>
    `<li>${i.Nombre} (${i.Cantidad})</li>`).join("");

  document.getElementById("topCosto").innerHTML = topCosto.map(i =>
    `<li>${i.Nombre} (${i.CostoParcial} Bs)</li>`).join("");
}

window.addEventListener("load", cargarCSV);
