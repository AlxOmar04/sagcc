'use client'

import { useEffect, useState } from 'react'
import { FaTrash, FaFilePdf, FaFileExcel } from 'react-icons/fa'
import { collection, deleteDoc, doc, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import { useParams } from 'next/navigation'
import Link from 'next/link'

export default function VerCompetidores() {
  const { id } = useParams()
  const [competidores, setCompetidores] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, `carreras/${id}/competidores`),
      (snapshot) => {
        const lista = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        setCompetidores(lista)
        setCargando(false)
      },
      (error) => {
        console.error('Error al escuchar competidores:', error)
        setCargando(false)
      }
    )

    return () => unsubscribe()
  }, [id])

  const eliminarCompetidor = async (competidorId) => {
    const confirmar = confirm('¿Deseas eliminar este competidor?')
    if (!confirmar) return

    try {
      await deleteDoc(doc(db, `carreras/${id}/competidores`, competidorId))
    } catch (error) {
      console.error('Error al eliminar competidor:', error)
    }
  }

  return (
    <div className="mt-6 border border-gray-400 p-4 rounded-lg shadow-md bg-white bg-opacity-0 dark:bg-gray-800 dark:bg-opacity-0">
      <h2 className="text-xl font-bold mb-2 text-gray-700 dark:text-gray-200">Competidores Inscritos</h2>
      <hr className="border-orange-300 dark:border-orange-500 mb-4" />

      {/* Contador y botones de exportación */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-2">
        <p className="text-gray-700 dark:text-gray-200">
          Total inscritos: <span className="font-semibold">{competidores.length}</span>
        </p>

        <div className="flex gap-2">
          <Link
            href="/descargas/competidores_inscritos.pdf"
            download
            className="flex items-center gap-1 px-3 py-1 border border-red-500 bg-red-100 hover:bg-red-200 text-red-600 rounded-full text-sm font-medium transition"
          >
            <FaFilePdf /> Exportar PDF
          </Link>
          <Link
            href="/descargas/competidores_inscritos.xlsx"
            download
            className="flex items-center gap-1 px-3 py-1 border border-green-500 bg-green-100 hover:bg-green-200 text-green-700 rounded-full text-sm font-medium transition"
          >
            <FaFileExcel /> Exportar Excel
          </Link>
        </div>
      </div>

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

