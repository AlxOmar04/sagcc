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
    <form
      onSubmit={(e) => {
        e.preventDefault();
        agregarCarrera();
      }}
      className="flex flex-col space-y-4 text-sm border border-orange-400 rounded-xl p-6 bg-gradient-to-br from-white to-orange-200 backdrop-blur-sm shadow-lg"
    >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold mb-2 text-gray-700 dark:text-gray-200">Nuevo Evento</h2>
        </div>
      <hr className="border-gray-400 dark:border-orange-500 mb-4" />

      {/* Nombre */}
      <div className="flex flex-col">
        <label className="mb-1 text-black font-medium">Nombre del evento</label>
        <Input
          type="text"
          placeholder="Ej. Vuelta Ciclística 2025"
          value={nuevoNombreCarrera}
          onChange={(e) => setNuevoNombreCarrera(e.target.value)}
          className="rounded-md px-4 py-2 bg-white text-black placeholder-gray-600"
        />
      </div>

      {/* Disciplina */}
      <div className="flex flex-col">
        <label className="mb-1 text-black font-medium">Disciplina</label>
        <select
          value={disciplinaSeleccionada}
          onChange={(e) => setDisciplinaSeleccionada(e.target.value)}
          className="rounded-md px-4 py-2 bg-white text-black border border-gray-300"
        >
          <option value="">Selecciona una disciplina</option>
          {disciplinas.map((disciplina, index) => (
            <option key={index} value={disciplina}>
              {disciplina}
            </option>
          ))}
        </select>
      </div>

      {/* Etapas */}
      <div className="flex flex-col">
        <label className="mb-1 text-black font-medium">Número de etapas</label>
        <Input
          type="number"
          placeholder="Ej. 3"
          value={etapaCarrera}
          onChange={(e) => setEtapaCarrera(e.target.value)}
          className="rounded-md px-4 py-2 bg-white text-black placeholder-gray-600"
        />
      </div>

      {/* Fecha y hora */}
      <div className="flex flex-col">
        <label className="mb-1 text-black font-medium">Fecha y Hora</label>
        <Input
          type="datetime-local"
          value={fechaHoraCarrera}
          onChange={(e) => setFechaHoraCarrera(e.target.value)}
          className="rounded-md px-4 py-2 bg-white text-black"
        />
      </div>

      {/* Botón */}
      <div className="pt-2">
        <Button
          type="submit"
          className="bg-gradient-to-r from-white to-gray-400 border border-orange-400 hover:from-gray-200 hover:to-gray-500 hover:border-gray-500 text-sm py-2 px-4 rounded-full text-black font-semibold"
        >
          Agregar
        </Button>
      </div>
    </form>
  );
}
