'use client'

import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'

export default function EditarCarrera({ carrera, onGuardar }) {
  const [nuevoNombreCarrera, setNuevoNombreCarrera] = useState('')
  const [fechaHoraCarrera, setFechaHoraCarrera] = useState('')
  const [numeroEtapas, setNumeroEtapas] = useState(1)
  const [mostrarMensaje, setMostrarMensaje] = useState(false)

  useEffect(() => {
    if (carrera) {
      setNuevoNombreCarrera(carrera.nombre || '')
      setFechaHoraCarrera(carrera.fechaHora || '')
      setNumeroEtapas(carrera.etapas?.length || 1)
    }
  }, [carrera])

  const guardarCarreraEditada = async () => {
    if (!carrera || !carrera.id) {
      console.error('Carrera no válida.')
      return
    }

    try {
      const ref = doc(db, 'carreras', carrera.id)
      await updateDoc(ref, {
        nombre: nuevoNombreCarrera,
        disciplina: 'RUTA',
        fechaHora: fechaHoraCarrera,
        etapas: Array.from({ length: numeroEtapas }, (_, i) => `Etapa ${i + 1}`)
      })

      setMostrarMensaje(true)

      setTimeout(() => {
        setMostrarMensaje(false)
        if (onGuardar) onGuardar()
      }, 2000)
    } catch (error) {
      console.error('Error al actualizar carrera:', error)
      alert('No se pudo guardar los cambios.')
    }
  }

  return (
    <>
      {mostrarMensaje && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          Carrera actualizada correctamente.
        </div>
      )}

      <div className="border border-gray-400 p-4 rounded-lg shadow-md bg-white bg-opacity-0 dark:bg-gray-800 dark:bg-opacity-20 mt-4 max-w-md">
        <h2 className="text-xl font-bold mb-2 text-gray-700 dark:text-gray-200">Editar Carrera</h2>
        <hr className="border-gray-400 dark:border-orange-500 mb-4" />

        <Input
          className="mb-4 p-2 border border-gray-300 dark:border-gray-600 rounded-lg w-80 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          placeholder="Nombre de la carrera"
          value={nuevoNombreCarrera}
          onChange={e => setNuevoNombreCarrera(e.target.value)}
        />

        <div className="mb-4">
          <label className="block mb-1 text-gray-600 dark:text-gray-300">Disciplina:</label>
          <select
            value="RUTA"
            disabled
            className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg w-80 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white cursor-not-allowed"
          >
            <option value="RUTA">RUTA</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block mb-1 text-gray-600 dark:text-gray-300">Fecha y Hora:</label>
          <Input
            type="datetime-local"
            value={fechaHoraCarrera}
            onChange={(e) => setFechaHoraCarrera(e.target.value)}
            className="w-80"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1 text-gray-600 dark:text-gray-300">Número de etapas:</label>
          <Input
            type="number"
            min={1}
            value={numeroEtapas}
            onChange={(e) => setNumeroEtapas(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-80"
          />
        </div>

        <Button
          onClick={guardarCarreraEditada}
          className="border border-orange-400 dark:border-orange-500 bg-[#D7DBDD] dark:bg-gray-700 text-black dark:text-white hover:border-gray-400 dark:hover:border-gray-600 hover:border-2 hover:bg-[#C4C6C7] dark:hover:bg-gray-600 rounded-full"
        >
          Guardar Cambios
        </Button>
      </div>
    </>
  )
}
