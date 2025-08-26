'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { FaCog } from 'react-icons/fa'
import { useRouter } from 'next/navigation'

import { db } from '@/lib/firebase/client'
import { collection, getDocs, doc, getDoc } from 'firebase/firestore'

export default function HomePage() {
  const [showConfigMenu, setShowConfigMenu] = useState(false)
  const [clasificaciones, setClasificaciones] = useState([])
  const [competencia, setCompetencia] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentDateTime, setCurrentDateTime] = useState('')
  const router = useRouter()

  // Fecha y hora del lado del cliente (evita hydration error)
  useEffect(() => {
    const now = new Date()
    setCurrentDateTime(now.toLocaleString())
  }, [])

  // Cargar última competencia y clasificaciones
  useEffect(() => {
    let mounted = true

    const fetchLastCompetition = async () => {
      setLoading(true)
      try {
        const carrerasSnap = await getDocs(collection(db, 'carreras'))
        if (carrerasSnap.empty) {
          setCompetencia(null)
          setClasificaciones([])
          setLoading(false)
          return
        }

        const latestDoc = carrerasSnap.docs[carrerasSnap.docs.length - 1]
        const compData = latestDoc.data()
        const compId = latestDoc.id

        const generalDocRef = doc(db, 'carreras', compId, 'clasificacionPublica', 'general')
        const generalSnap = await getDoc(generalDocRef)

        let rows = []
        if (generalSnap.exists()) {
          const data = generalSnap.data()
          if (Array.isArray(data.rows)) {
            rows = data.rows
          }
        }

        if (!mounted) return
        setCompetencia({ id: compId, ...compData })
        setClasificaciones(rows)
      } catch (err) {
        console.error('Error cargando última competencia:', err)
        if (!mounted) return
        setCompetencia(null)
        setClasificaciones([])
      } finally {
        if (!mounted) return
        setLoading(false)
      }
    }

    fetchLastCompetition()
    return () => {
      mounted = false
    }
  }, [])

  return (
    <div className="flex flex-col min-h-screen font-sans bg-gradient-to-b from-white to-gray-200 dark:from-[#041C32] dark:via-[#041C32] dark:to-orange-500 text-gray-900 dark:text-white">
      
      {/* NAVBAR */}
      <nav className="bg-gradient-to-r from-gray-100 to-gray-500 text-white flex items-center justify-between p-2 mb-2 shadow-md dark:from-[#041C32] dark:to-orange-500">
        <div className="flex items-center ml-4">
          <Link href="/">
            <Image src="/img/logo.png" alt="logo" width={48} height={42} style={{ width: 'auto', height: 'auto' }} />
          </Link>
          <span className="ml-2 text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
            S A G C C
          </span>
        </div>
        <div className="flex-grow" />
        <div className="flex items-center space-x-2 relative mr-2">
          <button
            className="bg-gray-500 text-white hover:bg-gray-400 p-1 rounded-full h-8 relative"
            onClick={() => setShowConfigMenu(!showConfigMenu)}
          >
            <FaCog size={18} />
          </button>
          {showConfigMenu && (
            <ul className="absolute right-0 top-full mt-2 w-48 bg-white bg-opacity-80 text-gray-900 dark:text-white shadow-lg rounded-lg overflow-hidden z-10">
              <li
                className="flex items-center p-2 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer"
                onClick={() => router.push('/login')}
              >
                <FaCog className="mr-2" />
                Iniciar sesión
              </li>
            </ul>
          )}
        </div>
      </nav>

      {/* CONTENIDO */}
      <main className="flex-grow overflow-auto p-4">
        <div className="mt-6 mx-auto max-w-6xl border border-gray-400 p-4 rounded-lg shadow-md bg-white bg-opacity-0 dark:bg-gray-800 dark:bg-opacity-0">
          

          {/* Encabezado de competencia */}
          <div className="border border-orange-400 rounded-md p-4 mb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm sm:text-base">
              <div>
                <p className="font-bold">Nombre</p>
                <p>{competencia?.nombre || competencia?.id || 'Desconocido'}</p>
              </div>
              <div>
                <p className="font-bold">Disciplina</p>
                <p>RUTA</p>
              </div>
              <div>
                <p className="font-bold">Etapa</p>
                <p>{competencia?.etapa || 'N/A'}</p>
              </div>
              <div>
                <p className="font-bold">Fecha y Hora</p>
                <p>{currentDateTime}</p>
              </div>
            </div>
          </div>

          <h2 className="text-xl font-bold mb-4">Clasificación General</h2>
          <hr className="border-orange-400 dark:border-orange-500 mb-4" />

          {/* Animación de carga */}
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <div className="w-10 h-10 border-4 border-orange-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : clasificaciones.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-300">No hay clasificaciones registradas.</p>
          ) : (
            <div className="overflow-x-auto transition-opacity duration-500 opacity-100">
              <table className="w-full table-auto text-xs sm:text-sm md:text-base text-center">
                <thead>
                  <tr className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white">
                    <th className="py-2 px-3">Posición</th>
                    <th className="py-2 px-3">Nombre</th>
                    <th className="py-2 px-3">Dorsal</th>
                    <th className="py-2 px-3">Team</th>
                    <th className="py-2 px-3">Tiempo</th>
                    <th className="py-2 px-3">Diferencia</th>
                  </tr>
                </thead>
                <tbody>
                  {clasificaciones.map((r, i) => (
                    <tr
                      key={i}
                      className={`border-b ${i % 2 === 0 ? 'bg-orange-50 dark:bg-[#123456]' : 'bg-white dark:bg-[#0f2b47]'}`}
                    >
                      <td className="py-2 px-3 font-semibold">{r.posicion}</td>
                      <td className="py-2 px-3">{r.nombre}</td>
                      <td className="py-2 px-3">{r.dorsal}</td>
                      <td className="py-2 px-3">{r.team}</td>
                      <td className="py-2 px-3">{r.tiempo}</td>
                      <td className="py-2 px-3">{r.diferencia}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pie de página */}
        <p className="text-xs text-gray-500 mt-6 text-center">
          Fuente: Firebase SAGCC — Clasificación en tiempo real.
        </p>
      </main>
    </div>
  )
}
