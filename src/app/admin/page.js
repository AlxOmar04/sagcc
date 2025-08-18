'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import CarreraForm from '@/components/race/CarreraForm';
import CarrerasTable from '@/components/race/CarrerasTable';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { escucharCarreras } from '@/services/firebaseCarreraService';
import { FaCog, FaSignInAlt, FaSignOutAlt, FaSearch, FaTimes } from 'react-icons/fa';
import IsAuth from '@/components/admin/is-auth';
import { getAuth, signOut } from 'firebase/auth';

const disciplinas = ['RUTA'];

/* ===== Barra de búsqueda flotante ===== */
function FloatingSearch({ value, onChange }) {
  const inputRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => {
      const tag = (e.target?.tagName || '').toLowerCase();
      const typing = tag === 'input' || tag === 'textarea' || e.metaKey || e.ctrlKey || e.altKey;
      if (!typing && e.key === '/') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="pointer-events-none sticky top-10 z-40 flex justify-center px-3">
      <div className="pointer-events-auto mx-auto w-full max-w-2xl rounded-full border border-orange-300/90 bg-white/70 dark:bg-gray-900/50 backdrop-blur-md shadow-lg ring-1 ring-black/5 hover:shadow-xl transition">
        <div className="flex items-center px-4">
          <FaSearch className="mr-3 text-gray-500" aria-hidden />
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Buscar eventos por nombre, disciplina, etapa o fecha…"
            aria-label="Buscar eventos"
            className="flex-1 bg-transparent outline-none text-gray-900 dark:text-gray-100 placeholder-gray-500 py-3"
          />
          {value ? (
            <button
              type="button"
              onClick={() => onChange('')}
              aria-label="Limpiar búsqueda"
              className="ml-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <FaTimes />
            </button>
          ) : null}
          <span className="ml-3 hidden md:inline text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded px-2 py-1 select-none">
            /
          </span>
        </div>
      </div>
    </div>
  );
}

export default function Pagina() {
  const [darkMode, setDarkMode] = useState(false);
  const [showConfigMenu, setShowConfigMenu] = useState(false);
  const [carreras, setCarreras] = useState([]);
  const [busqueda, setBusqueda] = useState('');

  const [nuevoNombreCarrera, setNuevoNombreCarrera] = useState('');
  const [fechaHoraCarrera, setFechaHoraCarrera] = useState('');
  const [etapaCarrera, setEtapaCarrera] = useState('');
  const [disciplinaSeleccionada, setDisciplinaSeleccionada] = useState('');
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mensajeConfirmacion, setMensajeConfirmacion] = useState('');

  const router = useRouter();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  useEffect(() => {
    const unsubscribe = escucharCarreras(setCarreras);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    document.body.style.overflow = mostrarModal ? 'hidden' : 'auto';
  }, [mostrarModal]);

  const carrerasFiltradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return carreras;

    return carreras.filter((c) => {
      const nombre = String(c?.nombre ?? '').toLowerCase();
      const dis = String(c?.disciplina ?? '').toLowerCase();
      const etapa = String(c?.etapa ?? '').toLowerCase();
      const fecha = c?.fechaHora?.seconds
        ? new Date(c.fechaHora.seconds * 1000).toLocaleString().toLowerCase()
        : '';
      return (
        nombre.includes(q) ||
        dis.includes(q) ||
        etapa.includes(q) ||
        fecha.includes(q)
      );
    });
  }, [carreras, busqueda]);

  const agregarCarrera = async () => {
    if (
      !nuevoNombreCarrera.trim() ||
      !disciplinaSeleccionada ||
      !etapaCarrera.trim() ||
      !fechaHoraCarrera.trim()
    ) {
      alert('Por favor, completa todos los campos.');
      return;
    }

    try {
      const etapaParsed = parseInt(etapaCarrera, 10);
      if (isNaN(etapaParsed)) {
        alert('La etapa debe ser un número válido.');
        return;
      }

      const fechaDate = new Date(fechaHoraCarrera);
      if (isNaN(fechaDate.getTime())) {
        alert('La fecha y hora no son válidas.');
        return;
      }

      const nuevaCarrera = {
        nombre: nuevoNombreCarrera.trim(),
        disciplina: disciplinaSeleccionada,
        etapa: etapaParsed,
        fechaHora: Timestamp.fromDate(fechaDate),
        publica: true, //
      };

      await addDoc(collection(db, 'carreras'), nuevaCarrera);

      setNuevoNombreCarrera('');
      setDisciplinaSeleccionada('');
      setEtapaCarrera('');
      setFechaHoraCarrera('');
      setMensajeConfirmacion('Evento guardado con exito.');

      setTimeout(() => {
        setMensajeConfirmacion('');
        setMostrarModal(false);
      }, 2000);
    } catch (error) {
      console.error('Error al agregar carrera:', error);
      alert('Error al guardar carrera: ' + error.message);
    }
  };

  const handleVerCarrera = (carreraId) => {
    router.push(`/admin/race/${carreraId}`);
  };

  const handleLogout = async () => {
    const auth = getAuth();
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <IsAuth>
      <div className="flex flex-col h-screen font-sans bg-gradient-to-b from-white to-gray-200 dark:from-[#041C32] dark:via-[#041C32] dark:to-orange-500 text-gray-900 dark:text-white">
        {/* NAVBAR */}
        <nav className="bg-gradient-to-r from-gray-100 to-gray-500 text-white flex items-center justify-between p-2 mb-2 shadow-md dark:from-[#041C32] dark:to-orange-500">
          <div className="flex items-center ml-4">
            <Link href="/admin">
              <Image src="/img/logo.png" alt="logo" width={48} height={42} style={{ width: 'auto', height: 'auto' }} />
            </Link>
            <span className="ml-2 text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">S A G C C</span>
          </div>

          <div className="flex-grow" />
          <div className="flex items-center space-x-2 relative mr-2">
            <Button
              className="bg-gray-500 text-white hover:bg-gray-400 p-1 rounded-full h-8 relative"
              onClick={() => setShowConfigMenu(!showConfigMenu)}
            >
              <FaCog size={18} />
            </Button>
            {showConfigMenu && (
              <ul className="absolute right-0 top-full mt-2 w-48 bg-white bg-opacity-80 text-gray-900 dark:text-white shadow-lg rounded-lg overflow-hidden z-10">
                <li
                  className="flex items-center p-2 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => router.push('/login')}
                >
                  <FaSignInAlt className="mr-2" />
                  Cambiar de cuenta
                </li>
                <li
                  className="flex items-center p-2 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={handleLogout}
                >
                  <FaSignOutAlt className="mr-2" />
                  Cerrar sesión
                </li>
              </ul>
            )}
          </div>
        </nav>

        {/* Barra de búsqueda */}
        <FloatingSearch value={busqueda} onChange={setBusqueda} />

        <div className="flex flex-col items-center m-8 space-y-4 flex-1">
          <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            GESTIÓN DE EVENTOS DEPORTIVOS
          </div>

          <div className="flex w-full max-w-7xl space-x-4">
            <div className="flex-shrink-0">
              <Button
                className="bg-gradient-to-r from-white to-orange-300 border border-gray-400 hover:from-gray-200 hover:to-gray-400 hover:border-orange-400 text-sm py-2 px-4 rounded-full text-black font-semibold"
                onClick={() => setMostrarModal(true)}
              >
                + Nuevo Evento
              </Button>
            </div>

            <div className="flex-1 max-h-[60vh] overflow-y-auto">
              <hr className="border-gray-400 mb-2 dark:border-orange-500" />
              <CarrerasTable carreras={carrerasFiltradas} onVerCarrera={handleVerCarrera} />
            </div>
          </div>
        </div>

        {mostrarModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm px-4">
            <div className="relative w-full max-w-md">
              <button
                onClick={() => setMostrarModal(false)}
                className="absolute top-2 right-3 text-black text-2xl font-bold z-10"
              >
                ✕
              </button>

              {mensajeConfirmacion ? (
                <div className="bg-black/50 border border-orange-400 rounded-xl p-6 text-center text-white">
                  <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-4">
                    <span className="text-4xl text-white">✓</span>
                  </div>
                  <div className="text-xl font-semibold">{mensajeConfirmacion}</div>
                </div>
              ) : (
                <CarreraForm
                  nuevoNombreCarrera={nuevoNombreCarrera}
                  setNuevoNombreCarrera={setNuevoNombreCarrera}
                  disciplinaSeleccionada={disciplinaSeleccionada}
                  setDisciplinaSeleccionada={setDisciplinaSeleccionada}
                  etapaCarrera={etapaCarrera}
                  setEtapaCarrera={setEtapaCarrera}
                  fechaHoraCarrera={fechaHoraCarrera}
                  setFechaHoraCarrera={setFechaHoraCarrera}
                  agregarCarrera={agregarCarrera}
                  disciplinas={disciplinas}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </IsAuth>
  );
}
