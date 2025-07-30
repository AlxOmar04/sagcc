'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'

export default function ClasificacionesCarrera() {
  const { id } = useParams()
  const [clasificaciones, setClasificaciones] = useState([])

  useEffect(() => {
    const carrerasGuardadas = JSON.parse(localStorage.getItem('carrerasGuardadas')) || []
    const carrera = carrerasGuardadas.find(c => c.id === parseInt(id))
    if (carrera && carrera.competidores) {
      const clasificados = [...carrera.competidores].sort((a, b) => {
        const tiempoA = parseFloat(a.tiempo) || Infinity
        const tiempoB = parseFloat(b.tiempo) || Infinity
        return tiempoA - tiempoB
      })
      setClasificaciones(clasificados)
    }
  }, [id])

  const exportarExcel = () => {
    window.open(`/exports/clasificaciones_${id}.xlsx`, '_blank')
  }

  const exportarPDF = () => {
    window.open(`/exports/clasificaciones_${id}.pdf`, '_blank')
  }

  return (
    <div className="mt-4 border border-gray-400 p-4 rounded-lg shadow-md bg-white bg-opacity-0 dark:bg-gray-800 dark:bg-opacity-0">
      <h2 className="text-xl font-bold mb-2 text-gray-700 dark:text-gray-200">Clasificación General</h2>
      <hr className="border-orange-300 dark:border-orange-500 mb-4" />

      {clasificaciones.length > 0 ? (
        <>
          <div className="overflow-x-auto rounded-lg">
            <Table className="border-separate border-spacing-0 border-gray-50 dark:border-gray-700 min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-gray-600 dark:text-gray-300 px-4 py-2 text-left">Posición</TableHead>
                  <TableHead className="text-gray-600 dark:text-gray-300 px-4 py-2 text-left">Nombre</TableHead>
                  <TableHead className="text-gray-600 dark:text-gray-300 px-4 py-2 text-left">Dorsal</TableHead>
                  <TableHead className="text-gray-600 dark:text-gray-300 px-4 py-2 text-left">Team</TableHead>
                  <TableHead className="text-gray-600 dark:text-gray-300 px-4 py-2 text-left">Tiempo</TableHead>
                  <TableHead className="text-gray-600 dark:text-gray-300 px-4 py-2 text-left">Diferencia</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="bg-gradient-to-b from-orange-50 to-orange-100 dark:from-[#1f2937] dark:to-orange-200">
                {clasificaciones.map((competidor, index) => (
                  <TableRow
                    key={index}
                    className="hover:bg-orange-100 dark:hover:bg-orange-300 text-gray-900 dark:text-gray-100"
                  >
                    <TableCell className="px-4 py-2">{index + 1}</TableCell>
                    <TableCell className="px-4 py-2">{competidor.nombre}</TableCell>
                    <TableCell className="px-4 py-2">{competidor.dorsal}</TableCell>
                    <TableCell className="px-4 py-2">{competidor.team}</TableCell>
                    <TableCell className="px-4 py-2">{competidor.tiempo}</TableCell>
                    <TableCell className="px-4 py-2">{competidor.diferencia || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-end mt-4 space-x-2">
            <span className="text-sm text-gray-600 dark:text-gray-300">Exportar:</span>
            <Button
              onClick={exportarExcel}
              className="border border-orange-400 dark:border-orange-500 bg-[#D7DBDD] dark:bg-gray-700 text-black dark:text-white hover:border-gray-400 dark:hover:border-gray-600 hover:border-2 hover:bg-[#C4C6C7] dark:hover:bg-gray-600 rounded-90 p-0.5 text-xs h-6"
            >
              Excel
            </Button>
            <Button
              onClick={exportarPDF}
              className="border border-orange-400 dark:border-orange-500 bg-[#D7DBDD] dark:bg-gray-700 text-black dark:text-white hover:border-gray-400 dark:hover:border-gray-600 hover:border-2 hover:bg-[#C4C6C7] dark:hover:bg-gray-600 rounded-80 p-0.5 text-xs h-6"
            >
              PDF
            </Button>
          </div>
        </>
      ) : (
        <div className="text-center text-gray-500 dark:text-gray-300">No hay clasificaciones registradas.</div>
      )}
    </div>
  )
}
