'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { collection, addDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'

export default function FormularioCompetidor({ onGuardado }) {
  const { id } = useParams()
  const [nombre, setNombre] = useState('')
  const [cedula, setCedula] = useState('')
  const [edad, setEdad] = useState('')
  const [categoria, setCategoria] = useState('')
  const [equipo, setEquipo] = useState('')
  const [dorsal, setDorsal] = useState(() => Math.floor(1000 + Math.random() * 9000))

  const guardarCompetidor = async () => {
    if (!nombre.trim() || !cedula.trim() || !edad.trim() || !categoria.trim() || !equipo.trim()) {
      alert('Por favor, completa todos los campos.')
      return
    }

    try {
      const nuevoCompetidor = {
        nombre,
        cedula,
        edad,
        categoria,
        team: equipo,
        dorsal
      }

      await addDoc(collection(db, `carreras/${id}/competidores`), nuevoCompetidor)

      setNombre('')
      setCedula('')
      setEdad('')
      setCategoria('')
      setEquipo('')
      setDorsal(Math.floor(1000 + Math.random() * 9000))

      if (onGuardado) onGuardado()
    } catch (error) {
      console.error('Error al guardar competidor:', error)
      alert('Ocurrió un error al guardar el competidor')
    }
  }

  return (
    <section id="inscribirCompetidor" className="mt-10 scroll-mt-20">
      <div className="flex flex-col space-y-4 text-sm border border-orange-400 rounded-xl p-6 bg-gradient-to-br from-white to-orange-200 backdrop-blur-sm shadow-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold mb-2 text-gray-700 dark:text-gray-200">Inscribir Competidor</h2>
        </div>
        <hr className="border-gray-400 dark:border-orange-500 mb-4" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Nombre ocupa toda la fila */}
          <div className="col-span-1 md:col-span-2">
            <Input
              placeholder="Nombre"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
            />
          </div>

          <Input
            placeholder="Cédula"
            value={cedula}
            onChange={e => setCedula(e.target.value)}
          />
          <Input
            placeholder="Edad"
            type="number"
            value={edad}
            onChange={e => setEdad(e.target.value)}
          />

          {/* Equipo ocupa toda la fila */}
          <div className="col-span-1 md:col-span-2">
            <Input
              placeholder="Equipo"
              value={equipo}
              onChange={e => setEquipo(e.target.value)}
            />
          </div>

          {/* Categoría y Dorsal en la misma fila */}
          <Input
            placeholder="Categoría"
            value={categoria}
            onChange={e => setCategoria(e.target.value)}
          />
          <Input
            placeholder="Dorsal"
            value={dorsal}
            readOnly
            className="cursor-not-allowed bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300"
          />
        </div>

        <div className="flex justify-start">
          <Button
            className="px-4 py-2 bg-gradient-to-r from-white to-gray-400 border border-orange-400 hover:from-gray-200 hover:to-gray-500 hover:border-gray-500 text-sm rounded-full text-black font-semibold w-auto"
            onClick={guardarCompetidor}
          >
            Guardar
          </Button>
        </div>
      </div>
    </section>
  )
}
