'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import CarreraForm from '@/components/race/CarreraForm';
import CarrerasTable from '@/components/race/CarrerasTable';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { escucharCarreras } from '@/services/firebaseCarreraService';
import {
  FaBell,
  FaCog,
  FaSun,
  FaMoon,
  FaSignInAlt,
  FaSignOutAlt,
} from 'react-icons/fa';
import IsAuth from '@/components/admin/is-auth';
import { getAuth, signOut } from 'firebase/auth'; // 🔹 NUEVO

const disciplinas = ['RUTA'];

export default function Pagina() {
  const [darkMode, setDarkMode] = useState(false);
  const [showConfigMenu, setShowConfigMenu] = useState(false);
  const [carreras, setCarreras] = useState([]);
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
      router.push('/login'); // 🔹 Redirige al login
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <IsAuth>
      <div className="flex flex-col h-screen font-sans bg-gradient-to-b from-white to-gray-200 dark:from-[#041C32] dark:via-[#041C32] dark:to-orange-500 text-gray-900 dark:text-white">
        <nav className="bg-gradient-to-r from-gray-100 to-gray-600 text-white flex items-center justify-between p-2 mb-2 shadow-md dark:from-[#041C32] dark:to-orange-500">
          <div className="flex items-center ml-4">
            <Link href="/admin">
              <Image src="/img/logo.png" alt="logo" width={54} height={50} style={{ width: 'auto', height: 'auto' }}/>
            </Link>
          </div>
          <div className="flex-grow flex justify-center">
            <Input
              className="w-1/2 text-gray-800 placeholder-gray-500 dark:text-gray-200 dark:placeholder-gray-400"
              placeholder="Buscar carreras..."
            />
          </div>
          <div className="flex items-center space-x-2 relative mr-2">
            <Button className="bg-gray-500 text-white hover:bg-gray-400 p-1 rounded-full h-8">
              <FaBell size={18} />
            </Button>
            <Button
              className="bg-gray-500 text-white hover:bg-gray-400 p-1 rounded-full h-8 relative"
              onClick={() => setShowConfigMenu(!showConfigMenu)}
            >
              <FaCog size={18} />
            </Button>
            {showConfigMenu && (
              <ul className="absolute right-0 top-full mt-2 w-48 bg-white bg-opacity-80 text-gray-900 dark:text-white shadow-lg rounded-lg overflow-hidden z-10">
                <li
                  className="flex items-center justify-between p-2 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => setDarkMode(!darkMode)}
                >
                  {darkMode ? 'Modo Claro' : 'Modo Oscuro'}
                  {darkMode ? <FaSun /> : <FaMoon />}
                </li>
                <li
                  className="flex items-center p-2 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => router.push('/login')} // 🔹 Cambiar cuenta
                >
                  <FaSignInAlt className="mr-2" />
                  Cambiar de cuenta
                </li>
                <li
                  className="flex items-center p-2 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={handleLogout} // 🔹 Función cerrar sesión
                >
                  <FaSignOutAlt className="mr-2" />
                  Cerrar sesión
                </li>
              </ul>
            )}
          </div>
        </nav>

        <div className="flex flex-col items-center m-8 space-y-4 flex-1">
          <div className="text-2xl font-extrabold text-gray-800 dark:text-gray-100">
            Gestión de Eventos Deportivos
          </div>

          <div className="flex w-full max-w-7xl space-x-4">
            <div className="flex-shrink-0">
              <Button
                className="bg-gradient-to-r from-white to-gray-400 border border-orange-400 hover:from-gray-200 hover:to-gray-500 hover:border-gray-500 text-sm py-2 px-4 rounded-full text-black font-semibold"
                onClick={() => setMostrarModal(true)}
              >
                + Nuevo Evento
              </Button>
            </div>

            <div className="flex-1 max-h-[60vh] overflow-y-auto">
              <hr className="border-gray-400 mb-2 dark:border-orange-500" />
              <CarrerasTable carreras={carreras} onVerCarrera={handleVerCarrera} />
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
