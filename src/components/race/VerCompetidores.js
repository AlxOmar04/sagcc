'use client'

import { useEffect, useState, useCallback } from 'react'
import { FaTrash } from 'react-icons/fa'
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import { useParams } from 'next/navigation'

export default function VerCompetidores() {
  const { id } = useParams()
  const [competidores, setCompetidores] = useState([])
  const [cargando, setCargando] = useState(true)

  const obtenerCompetidores = useCallback(async () => {
    setCargando(true)
    try {
      const snapshot = await getDocs(collection(db, `carreras/${id}/competidores`))
      const lista = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setCompetidores(lista)
    } catch (error) {
      console.error('Error al obtener competidores:', error)
    } finally {
      setCargando(false)
    }
  }, [id])

  const eliminarCompetidor = async (competidorId) => {
    const confirmar = confirm('¿Deseas eliminar este competidor?')
    if (!confirmar) return

    try {
      await deleteDoc(doc(db, `carreras/${id}/competidores`, competidorId))
      setCompetidores((prev) => prev.filter((c) => c.id !== competidorId))
    } catch (error) {
      console.error('Error al eliminar competidor:', error)
    }
  }

  useEffect(() => {
    obtenerCompetidores()
  }, [obtenerCompetidores])

  return (
    <div className="mt-6 border border-gray-400 p-4 rounded-lg shadow-md bg-white bg-opacity-0 dark:bg-gray-800 dark:bg-opacity-0">
      <h2 className="text-xl font-bold mb-2 text-gray-700 dark:text-gray-200">Competidores Inscritos</h2>
      <hr className="border-gray-400 dark:border-orange-500 mb-4" />

      <div className="overflow-x-auto rounded-lg">
        <table className="border-separate border-spacing-0 w-full border-gray-50 dark:border-gray-700">
          <thead className="bg-gray-200 dark:bg-orange-600 text-gray-800 dark:text-white">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-semibold">Nombre</th>
              <th className="px-4 py-2 text-left text-sm font-semibold">Cédula</th>
              <th className="px-4 py-2 text-left text-sm font-semibold">Edad</th>
              <th className="px-4 py-2 text-left text-sm font-semibold">Team</th>
              <th className="px-4 py-2 text-left text-sm font-semibold">Dorsal</th>
              <th className="px-4 py-2 text-center text-sm font-semibold">Acción</th>
            </tr>
          </thead>
          <tbody className="bg-gradient-to-b from-orange-50 to-orange-100 dark:from-[#1f2937] dark:to-orange-200">
            {cargando ? (
              <tr>
                <td colSpan={6} className="text-center px-4 py-4 text-gray-500 dark:text-gray-300">
                  Cargando competidores...
                </td>
              </tr>
            ) : competidores.length > 0 ? (
              competidores.map((competidor) => (
                <tr
                  key={competidor.id}
                  className="hover:bg-orange-100 dark:hover:bg-orange-300 text-gray-900 dark:text-gray-100"
                >
                  <td className="px-4 py-2">{competidor.nombre}</td>
                  <td className="px-4 py-2">{competidor.cedula}</td>
                  <td className="px-4 py-2">{competidor.edad}</td>
                  <td className="px-4 py-2">{competidor.team}</td>
                  <td className="px-4 py-2">{competidor.dorsal}</td>
                  <td className="px-4 py-2 text-center">
                    <button
                      onClick={() => eliminarCompetidor(competidor.id)}
                      className="text-gray-500 dark:text-gray-300 hover:text-red-400 dark:hover:text-red-300 transition-colors duration-200"
                      title="Eliminar Competidor"
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="text-center px-4 py-4 text-gray-500 dark:text-gray-300">
                  No hay competidores inscritos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
