'use client'

import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'

export default function FormularioEditarCarrera({ carrera, onGuardar }) {
  const [nuevoNombreCarrera, setNuevoNombreCarrera] = useState('')
  const [fechaHoraCarrera, setFechaHoraCarrera] = useState('')
  const [numeroEtapas, setNumeroEtapas] = useState(1)

  useEffect(() => {
    if (carrera) {
      setNuevoNombreCarrera(carrera.nombre || '')
      if (carrera.fechaHora?.seconds) {
        const dateObj = new Date(carrera.fechaHora.seconds * 1000)
        const isoString = dateObj.toISOString().slice(0, 16)
        setFechaHoraCarrera(isoString)
      } else {
        setFechaHoraCarrera('')
      }
      setNumeroEtapas(carrera.etapas?.length || 1)
    }
  }, [carrera])

  const guardarCarreraEditada = async () => {
    if (!carrera || !carrera.id) return

    try {
      const ref = doc(db, 'carreras', carrera.id)
      await updateDoc(ref, {
        nombre: nuevoNombreCarrera,
        disciplina: 'RUTA',
        fechaHora: new Date(fechaHoraCarrera),
        etapas: Array.from({ length: numeroEtapas }, (_, i) => `Etapa ${i + 1}`)
      })

      if (onGuardar) onGuardar() // aquí se activa el mensaje del componente padre
    } catch (error) {
      console.error('Error al actualizar carrera:', error)
      alert('No se pudo guardar los cambios.')
    }
  }

  return (
    <div className="flex flex-col space-y-4 text-sm border border-orange-400 rounded-xl p-6 bg-gradient-to-br from-white to-orange-200 backdrop-blur-sm shadow-lg">
      <h2 className="text-xl font-bold mb-2 text-gray-700 dark:text-gray-200">Editar Carrera</h2>
      <hr className="border-gray-400 dark:border-orange-500 mb-4" />

      <Input
        className="mb-4 p-2 border border-gray-300 dark:border-gray-600 rounded-lg w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        placeholder="Nombre de la carrera"
        value={nuevoNombreCarrera}
        onChange={e => setNuevoNombreCarrera(e.target.value)}
      />

      <div className="mb-4">
        <label className="block mb-1 text-gray-600 dark:text-gray-300">Disciplina:</label>
        <select
          value="RUTA"
          disabled
          className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg w-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white cursor-not-allowed"
        >
          <option value="RUTA">RUTA</option>
        </select>
      </div>

      <div className="mb-4">
        <label className="block mb-1 text-gray-600 dark:text-gray-300">Fecha y Hora:</label>
        <Input
          type="datetime-local"
          value={fechaHoraCarrera}
          onChange={e => setFechaHoraCarrera(e.target.value)}
          className="w-full"
        />
      </div>

      <div className="mb-4">
        <label className="block mb-1 text-gray-600 dark:text-gray-300">Número de etapas:</label>
        <Input
          type="number"
          min={1}
          value={numeroEtapas}
          onChange={e => setNumeroEtapas(Math.max(1, parseInt(e.target.value) || 1))}
          className="w-full"
        />
      </div>

      <div className="self-start">
        <Button
          onClick={guardarCarreraEditada}
          className="bg-gradient-to-r from-white to-gray-400 border border-orange-400 hover:from-gray-200 hover:to-gray-500 hover:border-gray-500 text-sm py-2 px-4 rounded-full text-black font-semibold"
        >
          Guardar Cambios
        </Button>
      </div>
    </div>
  )
}
