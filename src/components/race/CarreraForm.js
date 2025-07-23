'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function CarreraForm({
  nuevoNombreCarrera,
  setNuevoNombreCarrera,
  disciplinaSeleccionada,
  setDisciplinaSeleccionada,
  etapaCarrera,
  setEtapaCarrera,
  fechaHoraCarrera,
  setFechaHoraCarrera,
  agregarCarrera,
  disciplinas
}) {
  return (
    <form onSubmit={(e) => { e.preventDefault(); agregarCarrera(); }} className="flex flex-col space-y-4">
      <Input
        type="text"
        placeholder="Nombre de la nueva carrera"
        value={nuevoNombreCarrera}
        onChange={(e) => setNuevoNombreCarrera(e.target.value)}
        className="rounded-md px-4 py-2 text-gray-900 dark:text-white"
      />

      <select
        value={disciplinaSeleccionada}
        onChange={(e) => setDisciplinaSeleccionada(e.target.value)}
        className="rounded-md px-4 py-2 text-gray-900 dark:text-white bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600"
      >
        <option value="">Selecciona una disciplina</option>
        {disciplinas.map((disciplina, index) => (
          <option key={index} value={disciplina}>{disciplina}</option>
        ))}
      </select>

      <Input
        type="number"
        placeholder="Número de Etapas"
        value={etapaCarrera}
        onChange={(e) => setEtapaCarrera(e.target.value)}
        className="rounded-md px-4 py-2 text-gray-900 dark:text-white"
      />

      <Input
        type="datetime-local"
        placeholder="Fecha y hora"
        value={fechaHoraCarrera}
        onChange={(e) => setFechaHoraCarrera(e.target.value)}
        className="rounded-md px-4 py-2 text-gray-900 dark:text-white"
      />

      <Button type="submit" className="text-black bg-gradient-to-r from-white to-gray-400 border border-orange-400 hover:from-gray-200 hover:to-gray-500 hover:border-gray-500 text-sm py-2 px-4 w-full rounded-full">
       Agregar
     </Button>
    </form>
  );
}
