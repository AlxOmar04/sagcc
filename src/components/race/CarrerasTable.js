'use client';

import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { FaEdit, FaTrash } from 'react-icons/fa';

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
        {carreras.map((carrera) => {
          const fechaHora = carrera.fechaHora instanceof Date
            ? carrera.fechaHora
            : carrera.fechaHora?.toDate?.() || null;

          return (
            <TableRow
              key={carrera.id}
              className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <TableCell onClick={() => onVerCarrera(carrera.id)}>
                {carrera.nombre}
              </TableCell>
              <TableCell onClick={() => onVerCarrera(carrera.id)}>
                {carrera.disciplina}
              </TableCell>
              <TableCell onClick={() => onVerCarrera(carrera.id)}>
                {typeof carrera.etapa === 'number' ? carrera.etapa : '0'}
              </TableCell>
              <TableCell onClick={() => onVerCarrera(carrera.id)}>
                {fechaHora ? fechaHora.toLocaleString() : 'Sin fecha'}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
