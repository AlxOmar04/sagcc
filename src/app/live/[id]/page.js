'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { db } from '@/lib/firebase/client';
import { collection, doc, onSnapshot, orderBy, query, Timestamp } from 'firebase/firestore';

export default function LiveClasificacion() {
  const { id } = useParams();

  // Datos de la carrera (para mostrar info arriba)
  const [carrera, setCarrera] = useState(null);

  // Datos para clasificación
  const [competidores, setCompetidores] = useState([]);
  const [tiemposMap, setTiemposMap] = useState({});
  const tiemposUnsubsRef = useRef(new Map());

  // Cambiar el nombre de la pestaña cuando cargue/actualice la carrera
  useEffect(() => {
  document.title = carrera?.nombre
    ? `Clasificación — ${carrera.nombre} | SAGCC`
    : 'Clasificación — SAGCC';
  }, [carrera?.nombre]);

  // Escuchar datos de la carrera 
  useEffect(() => {
    if (!id) return;
    const ref = doc(db, 'carreras', String(id));
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) setCarrera({ id: snap.id, ...snap.data() });
        else setCarrera(null);
      },
      (err) => console.error('Error carrera:', err)
    );
    return () => unsub();
  }, [id]);

  // Suscripción a competidores y a su subcolección de tiempos
  useEffect(() => {
    if (!id) return;
    const unsubsMap = tiemposUnsubsRef.current;

    const colRef = collection(db, 'carreras', String(id), 'competidores');
    const unsubCompetidores = onSnapshot(
      colRef,
      (snap) => {
        const comps = snap.docs.map((d) => {
          const data = d.data() || {};
          return {
            id: d.id,
            nombre: data.nombre ?? 'Sin nombre',
            dorsal: String(data.dorsal ?? ''),
            team: data.team ?? '—',
            tiemposEmbebidos: Array.isArray(data.tiempos) ? data.tiempos : null,
          };
        });
        setCompetidores(comps);

        // limpiar listeners “huérfanos”
        const nextIds = new Set(comps.map((c) => c.id));
        for (const [compId, unsub] of unsubsMap.entries()) {
          if (!nextIds.has(compId)) {
            unsub();
            unsubsMap.delete(compId);
          }
        }

        // crear listeners para nuevos competidores
        comps.forEach((c) => {
          if (unsubsMap.has(c.id)) return;
          const tiemposRef = collection(db, 'carreras', String(id), 'competidores', c.id, 'tiempos');
          const qTiempos = query(tiemposRef, orderBy('timestamp', 'asc'));
          const unsub = onSnapshot(
            qTiempos,
            (snap2) => {
              const secs = snap2.docs
                .map((d) => {
                  const ts = d.data()?.timestamp;
                  if (ts instanceof Timestamp) return Math.floor(ts.toDate().getTime() / 1000);
                  if (ts && typeof ts.seconds === 'number') return ts.seconds;
                  return null;
                })
                .filter(Boolean);
              setTiemposMap((prev) => ({ ...prev, [c.id]: secs }));
            },
            (err) => console.error('Error tiempos:', err)
          );
          unsubsMap.set(c.id, unsub);
        });
      },
      (err) => console.error('Error competidores:', err)
    );

    return () => {
      unsubCompetidores();
      for (const unsub of unsubsMap.values()) unsub();
      unsubsMap.clear();
    };
  }, [id]);

  // Clasificación automática (mismo cálculo que en admin)
  const clasificaciones = useMemo(() => {
    const toSeconds = (ts) => {
      if (!ts) return null;
      if (ts instanceof Timestamp) return Math.floor(ts.toDate().getTime() / 1000);
      if (typeof ts === 'object' && typeof ts.seconds === 'number') return ts.seconds;
      const d = new Date(ts);
      return Number.isNaN(d.getTime()) ? null : Math.floor(d.getTime() / 1000);
    };

    const rows = competidores.map((c) => {
      const embedded = Array.isArray(c.tiemposEmbebidos)
        ? c.tiemposEmbebidos.map((t) => toSeconds(t?.timestamp)).filter(Boolean)
        : [];
      const subcol = Array.isArray(tiemposMap[c.id]) ? tiemposMap[c.id] : [];
      const allSecs = [...embedded, ...subcol].sort((a, b) => a - b);

      let elapsedSec = null;
      if (allSecs.length >= 2) {
        elapsedSec = allSecs[allSecs.length - 1] - allSecs[0];
        if (elapsedSec < 0) elapsedSec = null;
      }

      return {
        nombre: c.nombre,
        dorsal: c.dorsal || '—',
        team: c.team || '—',
        _elapsedSec: elapsedSec,
        tiempo: elapsedSec != null ? formatDuration(elapsedSec) : '—',
      };
    });

    const completados = rows.filter((r) => r._elapsedSec != null).sort((a, b) => a._elapsedSec - b._elapsedSec);
    const incompletos = rows.filter((r) => r._elapsedSec == null);

    const winner = completados.length ? completados[0]._elapsedSec : null;
    const withDiff = [...completados, ...incompletos].map((r, idx) => ({
      ...r,
      diferencia: winner != null && r._elapsedSec != null ? `+${formatDuration(r._elapsedSec - winner)}` : '—',
      _pos: idx + 1,
    }));

    return withDiff;
  }, [competidores, tiemposMap]);

  const countClasificados = useMemo(() => clasificaciones.filter((r) => r._elapsedSec != null).length, [clasificaciones]);

  const fechaFmt =
    carrera?.fechaHora?.seconds
      ? new Date(carrera.fechaHora.seconds * 1000).toLocaleString()
      : carrera?.fechaHora instanceof Date
      ? carrera.fechaHora.toLocaleString()
      : 'Sin fecha';

  return (
    <div className="min-h-screen font-sans bg-gradient-to-b from-white to-gray-200 dark:from-[#041C32] dark:via-[#041C32] dark:to-orange-500 text-gray-900 dark:text-white">
      {/* NAVBAR*/}
      <nav className="bg-gradient-to-r from-gray-100 to-gray-500 text-white flex items-center justify-between p-2 shadow-md dark:from-[#041C32] dark:to-orange-500">
        <div className="flex items-center ml-4">
          <Image src="/img/logo.png" alt="logo" width={48} height={42} style={{ width: 'auto', height: 'auto' }} />
          <span className="ml-2 text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">S A G C C</span>
        </div>
        <div className="mr-4" />
      </nav>

      {/* Contenedor principal (mismo estilo que admin) */}
      <div className="mt-6 mx-auto max-w-6xl border border-gray-400 p-4 rounded-lg shadow-md bg-white bg-opacity-0 dark:bg-gray-800 dark:bg-opacity-0">
        {/* Subtítulo */}
        <h2 className="text-xl font-bold mb-2 text-gray-700 dark:text-gray-200">Clasificación General</h2>
        <hr className="border-orange-300 dark:border-orange-500 mb-4" />

        {/* Info de la competencia */}
        <div className="mb-4 rounded-lg border border-orange-300 bg-white/70 dark:bg-[#1f2937] p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
            <div>
              <div className="text-gray-500 dark:text-gray-300">Nombre</div>
              <div className="font-semibold text-gray-900 dark:text-white">{carrera?.nombre ?? '—'}</div>
            </div>
            <div>
              <div className="text-gray-500 dark:text-gray-300">Disciplina</div>
              <div className="font-semibold text-gray-900 dark:text-white">{carrera?.disciplina ?? '—'}</div>
            </div>
            <div>
              <div className="text-gray-500 dark:text-gray-300">Etapa</div>
              <div className="font-semibold text-gray-900 dark:text-white">{carrera?.etapa ?? '—'}</div>
            </div>
            <div>
              <div className="text-gray-500 dark:text-gray-300">Fecha y Hora</div>
              <div className="font-semibold text-gray-900 dark:text-white">{fechaFmt}</div>
            </div>
          </div>
        </div>

        {/* Barra superior: contador (sin exportación) */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-2">
          <p className="text-gray-700 dark:text-gray-200">
            Clasificados: <span className="font-semibold">{countClasificados}</span>
          </p>
        </div>

        {/* Tabla de clasificados */}
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
          <div className="text-center text-gray-500 dark:text-gray-300">No hay clasificaciones registradas.</div>
        )}
      </div>

      <div className="max-w-6xl mx-auto px-4 py-3 text-xs text-gray-500 dark:text-gray-300">
        Fuente: FireBase SAGCC — Clasificación en tiempo real.
      </div>
    </div>
  );
}

/* ---------------- helpers ---------------- */
function formatDuration(totalSec) {
  if (totalSec == null || Number.isNaN(totalSec)) return '—';
  const s = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${m}:${String(sec).padStart(2, '0')}`;
}
