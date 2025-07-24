'use client'

import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table'
import { FaEdit, FaTrash } from 'react-icons/fa'

export default function CarrerasTable({ carreras, onVerCarrera, onEditarCarrera, eliminarCarrera }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Disciplina</TableHead>
          <TableHead>Etapas</TableHead>
          <TableHead>Fecha y Hora</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {carreras.map((carrera) => (
          <TableRow key={carrera.id} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
            <TableCell onClick={() => onVerCarrera(carrera.id)}>{carrera.nombre}</TableCell>
            <TableCell onClick={() => onVerCarrera(carrera.id)}>{carrera.disciplina}</TableCell>
            <TableCell onClick={() => onVerCarrera(carrera.id)}>{carrera.etapa}</TableCell>
            <TableCell onClick={() => onVerCarrera(carrera.id)}>
              {carrera.fechaHora ? new Date(carrera.fechaHora.seconds * 1000).toLocaleString() : 'Sin fecha'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
