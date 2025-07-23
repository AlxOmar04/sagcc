'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { collection, addDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'

export default function FormularioCompetidor() {
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

      // Limpiar campos
      setNombre('')
      setCedula('')
      setEdad('')
      setCategoria('')
      setEquipo('')
      setDorsal(Math.floor(1000 + Math.random() * 9000))

      alert('Competidor guardado con éxito')
    } catch (error) {
      console.error('Error al guardar competidor:', error)
      alert('Ocurrió un error al guardar el competidor')
    }
  }

  return (
    <section id="inscribirCompetidor" className="mt-10 scroll-mt-20">
      <div className="border border-gray-400 p-4 rounded-lg shadow-md bg-white bg-opacity-0 dark:bg-gray-800 dark:bg-opacity-0">
        <h2 className="text-xl font-bold mb-2 text-gray-700 dark:text-gray-200">Inscribir Competidor</h2>
        <hr className="border-gray-400 dark:border-orange-500 mb-4" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <Input placeholder="Nombre" value={nombre} onChange={e => setNombre(e.target.value)} />
          <Input placeholder="Cédula" value={cedula} onChange={e => setCedula(e.target.value)} />
          <Input placeholder="Edad" type="number" value={edad} onChange={e => setEdad(e.target.value)} />
          <Input placeholder="Categoría" value={categoria} onChange={e => setCategoria(e.target.value)} />
          <Input placeholder="Equipo" value={equipo} onChange={e => setEquipo(e.target.value)} />
          <Input
            placeholder="Dorsal"
            value={dorsal}
            readOnly
            className="cursor-not-allowed bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300"
          />
        </div>

        <Button
          className="border border-orange-400 dark:border-orange-500 bg-[#D7DBDD] dark:bg-gray-700 text-black dark:text-white hover:border-gray-400 dark:hover:border-gray-600 hover:border-2 hover:bg-[#C4C6C7] dark:hover:bg-gray-600 rounded-full"
          onClick={guardarCompetidor}
        >
          Guardar
        </Button>
      </div>
    </section>
  )
}
