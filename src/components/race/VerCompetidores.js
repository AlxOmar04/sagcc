'use client'

import { useEffect, useState } from 'react'
import { FaTrash, FaFilePdf, FaFileExcel } from 'react-icons/fa'
import { collection, deleteDoc, doc, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import { useParams } from 'next/navigation'

export default function VerCompetidores() {
  const { id } = useParams()
  const [competidores, setCompetidores] = useState([])
  const [cargando, setCargando] = useState(true)
  const [exportando, setExportando] = useState(null) // 'pdf' | 'xlsx' | null

  // Estado para el modal de confirmación
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmTargetId, setConfirmTargetId] = useState(null)

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, `carreras/${id}/competidores`),
      (snapshot) => {
        const lista = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
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

  // Abrir modal
  const solicitarEliminar = (competidorId) => {
    setConfirmTargetId(competidorId)
    setConfirmOpen(true)
  }

  // Confirmar eliminación
  const confirmarEliminar = async () => {
    if (!confirmTargetId) return
    try {
      await deleteDoc(doc(db, `carreras/${id}/competidores`, confirmTargetId))
    } catch (error) {
      console.error('Error al eliminar competidor:', error)
      alert('No se pudo eliminar el competidor.')
    } finally {
      setConfirmOpen(false)
      setConfirmTargetId(null)
    }
  }

  // Cancelar modal
  const cancelarEliminar = () => {
    setConfirmOpen(false)
    setConfirmTargetId(null)
  }

  async function exportar(format) {
    if (!competidores?.length) return
    try {
      setExportando(format)
      const rows = competidores.map((c) => ({
        nombre: c.nombre ?? '',
        cedula: c.cedula ?? '',
        edad: c.edad ?? '',
        team: c.team ?? '',
        dorsal: c.dorsal ?? '',
      }))

      const res = await fetch(`/api/exports/competidores?format=${format}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carreraId: String(id), rows }),
      })
      if (!res.ok) {
        const txt = await res.text().catch(() => '')
        throw new Error(`No se pudo generar el archivo (${res.status}) ${txt}`)
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `competidores_${id}.${format === 'xlsx' ? 'xlsx' : 'pdf'}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error(e)
      alert('Error al exportar. Revisa la consola.')
    } finally {
      setExportando(null)
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
          <button
            type="button"
            onClick={() => exportar('pdf')}
            disabled={!competidores.length || exportando === 'pdf'}
            className="flex items-center gap-1 px-3 py-1 border border-red-500 bg-red-100 hover:bg-red-200 text-red-600 rounded-full text-sm font-medium transition disabled:opacity-60 disabled:cursor-not-allowed"
            aria-busy={exportando === 'pdf'}
            title="Exportar PDF"
          >
            <FaFilePdf />
            {exportando === 'pdf' ? 'Generando...' : 'Exportar PDF'}
          </button>

          <button
            type="button"
            onClick={() => exportar('xlsx')}
            disabled={!competidores.length || exportando === 'xlsx'}
            className="flex items-center gap-1 px-3 py-1 border border-green-500 bg-green-100 hover:bg-green-200 text-green-700 rounded-full text-sm font-medium transition disabled:opacity-60 disabled:cursor-not-allowed"
            aria-busy={exportando === 'xlsx'}
            title="Exportar Excel"
          >
            <FaFileExcel />
            {exportando === 'xlsx' ? 'Generando...' : 'Exportar Excel'}
          </button>
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
                      onClick={() => solicitarEliminar(competidor.id)}
                      className="text-gray-500 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-300 transition-colors duration-200"
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

      {/* Modal de confirmación con el mismo estilo de tus mensajes */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="relative w-full max-w-md">
            <div className="bg-black/50 border border-orange-400 rounded-xl p-6 text-center text-white">
              <div className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl text-white">!</span>
              </div>
              <p className="text-lg font-bold mb-2">¿Eliminar competidor?</p>
              <p className="mb-6 text-sm opacity-90">
                Esta acción no se puede deshacer.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={cancelarEliminar}
                  className="px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarEliminar}
                  className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 transition"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
