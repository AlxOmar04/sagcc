'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { FaFilePdf, FaFileExcel } from 'react-icons/fa'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { db } from '@/lib/firebase/client'
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  doc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore'

export default function ClasificacionesCarrera() {
  const { id } = useParams()
  const [competidores, setCompetidores] = useState([])
  const [tiemposMap, setTiemposMap] = useState({})
  const tiemposUnsubsRef = useRef(new Map())

  // Suscripción a competidores y tiempos (con cleanup seguro)
  useEffect(() => {
    if (!id) return
    const unsubsMap = tiemposUnsubsRef.current

    const colRef = collection(db, 'carreras', String(id), 'competidores')
    const unsubCompetidores = onSnapshot(colRef, snap => {
      const comps = snap.docs.map(d => {
        const data = d.data() || {}
        return {
          id: d.id,
          nombre: data.nombre ?? 'Sin nombre',
          dorsal: String(data.dorsal ?? ''),
          team: data.team ?? '—',
          tiemposEmbebidos: Array.isArray(data.tiempos) ? data.tiempos : null,
        }
      })
      setCompetidores(comps)

      const nextIds = new Set(comps.map(c => c.id))
      // Quitar listeners de los que ya no están
      for (const [compId, unsub] of unsubsMap.entries()) {
        if (!nextIds.has(compId)) {
          unsub()
          unsubsMap.delete(compId)
        }
      }
      // Añadir listeners nuevos
      comps.forEach(c => {
        if (unsubsMap.has(c.id)) return
        const tiemposRef = collection(db, 'carreras', String(id), 'competidores', c.id, 'tiempos')
        const qTiempos = query(tiemposRef, orderBy('timestamp', 'asc'))
        const unsub = onSnapshot(qTiempos, snap2 => {
          const secs = snap2.docs
            .map(d => {
              const ts = d.data()?.timestamp
              if (ts instanceof Timestamp) return Math.floor(ts.toDate().getTime() / 1000)
              if (ts && typeof ts.seconds === 'number') return ts.seconds
              return null
            })
            .filter(Boolean)
          setTiemposMap(prev => ({ ...prev, [c.id]: secs }))
        })
        unsubsMap.set(c.id, unsub)
      })
    })

    return () => {
      unsubCompetidores()
      for (const unsub of unsubsMap.values()) unsub()
      unsubsMap.clear()
    }
  }, [id])

  // Clasificación automática
  const clasificaciones = useMemo(() => {
    const toSeconds = ts => {
      if (!ts) return null
      if (ts instanceof Timestamp) return Math.floor(ts.toDate().getTime() / 1000)
      if (typeof ts === 'object' && typeof ts.seconds === 'number') return ts.seconds
      const d = new Date(ts)
      return Number.isNaN(d.getTime()) ? null : Math.floor(d.getTime() / 1000)
    }

    const rows = competidores.map(c => {
      const embedded = Array.isArray(c.tiemposEmbebidos)
        ? c.tiemposEmbebidos.map(t => toSeconds(t?.timestamp)).filter(Boolean)
        : []
      const subcol = Array.isArray(tiemposMap[c.id]) ? tiemposMap[c.id] : []
      const allSecs = [...embedded, ...subcol].sort((a, b) => a - b)

      let elapsedSec = null
      if (allSecs.length >= 2) {
        elapsedSec = allSecs[allSecs.length - 1] - allSecs[0]
        if (elapsedSec < 0) elapsedSec = null
      }

      return {
        nombre: c.nombre,
        dorsal: c.dorsal || '—',
        team: c.team || '—',
        _elapsedSec: elapsedSec,
        tiempo: elapsedSec != null ? formatDuration(elapsedSec) : '—',
      }
    })

    const completados = rows.filter(r => r._elapsedSec != null).sort((a, b) => a._elapsedSec - b._elapsedSec)
    const incompletos = rows.filter(r => r._elapsedSec == null)

    const winner = completados.length ? completados[0]._elapsedSec : null
    const withDiff = [...completados, ...incompletos].map((r, idx) => ({
      ...r,
      diferencia: winner != null && r._elapsedSec != null ? `+${formatDuration(r._elapsedSec - winner)}` : '—',
      _pos: idx + 1,
    }))

    return withDiff
  }, [competidores, tiemposMap])

  const countClasificados = useMemo(
    () => clasificaciones.filter(r => r._elapsedSec != null).length,
    [clasificaciones]
  )

  // ✅ Publicación automática al doc público (debounce ligero)
  useEffect(() => {
    if (!id) return
    const rows = clasificaciones
      .filter(r => r._elapsedSec != null)
      .map(r => ({
        posicion: r._pos,
        nombre: r.nombre,
        dorsal: r.dorsal,
        team: r.team,
        tiempo: r.tiempo,
        diferencia: r.diferencia,
        elapsedSec: r._elapsedSec,
      }))

    const t = setTimeout(async () => {
      try {
        await setDoc(
          doc(db, 'carreras', String(id), 'clasificacionPublica', 'general'),
          { generatedAt: serverTimestamp(), rows },
          { merge: true }
        )
      } catch (e) {
        console.error('No se pudo publicar clasificación:', e)
      }
    }, 600)

    return () => clearTimeout(t)
  }, [id, clasificaciones])

  // Export real -> API Route
  async function exportar(format) {
    try {
      const rows = clasificaciones
        .filter(r => r._elapsedSec != null)
        .map(r => ({
          posicion: r._pos,
          nombre: r.nombre,
          dorsal: r.dorsal,
          team: r.team,
          tiempo: r.tiempo,
          diferencia: r.diferencia,
          elapsedSec: r._elapsedSec,
        }))

      const res = await fetch(`/api/exports/clasificaciones?format=${format}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carreraId: String(id), rows }),
      })
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(`No se pudo generar el archivo (${res.status}) ${text}`)
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `clasificaciones_${id}.${format === 'xlsx' ? 'xlsx' : 'pdf'}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error(e)
      alert('Error al exportar. Revisa la consola.')
    }
  }

  return (
    <div className="mt-6 border border-gray-400 p-4 rounded-lg shadow-md bg-white bg-opacity-0 dark:bg-gray-800 dark:bg-opacity-0">
      <h2 className="text-xl font-bold mb-2 text-gray-700 dark:text-gray-200">Clasificación General</h2>
      <hr className="border-orange-300 dark:border-orange-500 mb-4" />

      {/* Top bar (contador + export) */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-2">
        <p className="text-gray-700 dark:text-gray-200">
          Clasificados: <span className="font-semibold">{countClasificados}</span>
        </p>

        <div className="flex gap-2">
          <button
            onClick={() => exportar('pdf')}
            className="flex items-center gap-1 px-3 py-1 border border-red-500 bg-red-100 hover:bg-red-200 text-red-600 rounded-full text-sm font-medium transition"
            type="button"
          >
            <FaFilePdf /> Exportar PDF
          </button>

          <button
            onClick={() => exportar('xlsx')}
            className="flex items-center gap-1 px-3 py-1 border border-green-500 bg-green-100 hover:bg-green-200 text-green-700 rounded-full text-sm font-medium transition"
            type="button"
          >
            <FaFileExcel /> Exportar Excel
          </button>
        </div>
      </div>

      {clasificaciones.length > 0 ? (
        <div className="overflow-x-auto rounded-lg">
          <Table className="border-separate border-spacing-0 border-gray-50 dark:border-gray-700 min-w-full">
            <TableHeader>
              <TableRow className="bg-gray-200 dark:bg-orange-600 text-gray-800 dark:text-white">
                <TableHead className="px-4 py-2 text-left text-sm font-semibold">Posición</TableHead>
                <TableHead className="px-4 py-2 text-left text-sm font-semibold">Nombre</TableHead>
                <TableHead className="px-4 py-2 text-left text-sm font-semibold">Dorsal</TableHead>
                <TableHead className="px-4 py-2 text-left text-sm font-semibold">Team</TableHead>
                <TableHead className="px-4 py-2 text-left text-sm font-semibold">Tiempo</TableHead>
                <TableHead className="px-4 py-2 text-left text-sm font-semibold">Diferencia</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody className="bg-gradient-to-b from-orange-50 to-orange-100 dark:from-[#1f2937] dark:to-orange-200">
              {clasificaciones.map((r, index) => (
                <TableRow
                  key={`${r.dorsal}-${index}`}
                  className="hover:bg-orange-100 dark:hover:bg-orange-300 text-gray-900 dark:text-gray-100"
                >
                  <TableCell className="px-4 py-2">{index + 1}</TableCell>
                  <TableCell className="px-4 py-2">{r.nombre}</TableCell>
                  <TableCell className="px-4 py-2">{r.dorsal}</TableCell>
                  <TableCell className="px-4 py-2">{r.team}</TableCell>
                  <TableCell className="px-4 py-2">{r.tiempo}</TableCell>
                  <TableCell className="px-4 py-2">{r.diferencia}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center text-gray-500 dark:text-gray-300">
          No hay clasificaciones registradas.
        </div>
      )}
    </div>
  )
}

/* ------------------- helpers ------------------- */
function formatDuration(totalSec) {
  if (totalSec == null || Number.isNaN(totalSec)) return '—'
  const s = Math.max(0, Math.floor(totalSec))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  return `${m}:${String(sec).padStart(2, '0')}`
}
