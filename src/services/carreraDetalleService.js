export const obtenerCarreraPorId = (id) => {
  const carrerasGuardadas = JSON.parse(localStorage.getItem('carrerasGuardadas')) || [];
  return carrerasGuardadas.find(c => c.id === Number(id));
};

export const actualizarCarrera = (carreraActualizada) => {
  const carrerasGuardadas = JSON.parse(localStorage.getItem('carrerasGuardadas')) || [];
  const index = carrerasGuardadas.findIndex(c => c.id === carreraActualizada.id);
  carrerasGuardadas[index] = carreraActualizada;
  localStorage.setItem('carrerasGuardadas', JSON.stringify(carrerasGuardadas));
};

export const eliminarCarreraPorId = (id) => {
  const carrerasGuardadas = JSON.parse(localStorage.getItem('carrerasGuardadas')) || [];
  const nuevasCarreras = carrerasGuardadas.filter(c => c.id !== id);
  localStorage.setItem('carrerasGuardadas', JSON.stringify(nuevasCarreras));
};

export const agregarCompetidor = (carrera, competidor) => {
  const carreraActualizada = { ...carrera, competidores: [...(carrera.competidores || []), competidor] };
  actualizarCarrera(carreraActualizada);
  return carreraActualizada;
};

export const eliminarCompetidorDeCarrera = (carrera, index) => {
  const carreraActualizada = { ...carrera };
  carreraActualizada.competidores.splice(index, 1);
  actualizarCarrera(carreraActualizada);
  return carreraActualizada;
};

export const eliminarEtapaDeCarrera = (carrera, index) => {
  const carreraActualizada = { ...carrera };
  carreraActualizada.recorrido.splice(index, 1);
  actualizarCarrera(carreraActualizada);
  return carreraActualizada;
};

export const agregarEtapa = (carrera, nuevaEtapa) => {
  const carreraActualizada = {
    ...carrera,
    recorrido: [...(carrera.recorrido || []), nuevaEtapa],
  };
  actualizarCarrera(carreraActualizada);
  return carreraActualizada;
};
