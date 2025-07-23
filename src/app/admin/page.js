'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import CarreraForm from '@/components/race/CarreraForm';
import CarrerasTable from '@/components/race/CarrerasTable';
import { obtenerCarrerasDeFirebase } from '@/services/firebaseCarreraService';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import {
  FaBell,
  FaCog,
  FaSun,
  FaMoon,
  FaSignInAlt,
  FaSignOutAlt,
} from 'react-icons/fa';

const disciplinas = ['RUTA'];

export default function Pagina() {
  const [darkMode, setDarkMode] = useState(false);
  const [showConfigMenu, setShowConfigMenu] = useState(false);
  const [carreras, setCarreras] = useState([]);
  const [nuevoNombreCarrera, setNuevoNombreCarrera] = useState('');
  const [fechaHoraCarrera, setFechaHoraCarrera] = useState('');
  const [etapaCarrera, setEtapaCarrera] = useState('');
  const [disciplinaSeleccionada, setDisciplinaSeleccionada] = useState('');

  const router = useRouter();

  useEffect(() => {
    cargarCarreras();
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const cargarCarreras = async () => {
    const datos = await obtenerCarrerasDeFirebase();
    setCarreras(datos);
  };

  const agregarCarrera = async () => {
    if (
      nuevoNombreCarrera.trim() === '' ||
      disciplinaSeleccionada === '' ||
      etapaCarrera.trim() === '' ||
      fechaHoraCarrera.trim() === ''
    ) {
      alert('Por favor, completa todos los campos.');
      return;
    }

    try {
      const nuevaCarrera = {
        nombre: nuevoNombreCarrera,
        disciplina: disciplinaSeleccionada,
        etapa: etapaCarrera,
        fechaHora: fechaHoraCarrera,
      };

      await addDoc(collection(db, 'carreras'), nuevaCarrera);
      setNuevoNombreCarrera('');
      setDisciplinaSeleccionada('');
      setEtapaCarrera('');
      setFechaHoraCarrera('');
      cargarCarreras(); // Recargar después de agregar
    } catch (error) {
      console.error('Error al agregar carrera:', error);
    }
  };

  const handleVerCarrera = (carreraId) => {
    router.push(`/admin/race/${carreraId}`);
  };

  return (
    <div className="fflex-col h-screen font-sans bg-gradient-to-b from-gray-100 to-orange-400 dark:from-[#041C32] dark:via-[#041C32] dark:to-orange-500 text-gray-900 dark:text-white">
      {/* Navbar */}
      <nav className="bg-gradient-to-r from-gray-100 to-gray-600 text-white flex items-center justify-between p-2 mb-2 shadow-md dark:from-[#041C32] dark:to-orange-500">
        <div className="flex items-center ml-4">
          <Link href="/admin">
            <Image src="/img/logo.png" alt="logo" width={54} height={54} />
          </Link>
        </div>
        <div className="flex-grow flex justify-center">
          <Input
            className="w-1/2 text-gray-800 placeholder-gray-500 dark:text-gray-200 dark:placeholder-gray-400"
            placeholder="Buscar carreras..."
          />
        </div>
        <div className="flex items-center space-x-2 relative mr-2">
          <Button className="bg-gray-500 text-white hover:bg-gray-400 p-1 rounded-full p-0.5 h-8">
            <FaBell size={18} />
          </Button>
          <Button
            className="bg-gray-500 text-white hover:bg-gray-400 p-1 rounded-full p-0.5 h-8 relative"
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
              <li className="flex items-center p-2 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer">
                <FaSignInAlt className="mr-2" />
                Log In
              </li>
              <li className="flex items-center p-2 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer">
                <FaSignOutAlt className="mr-2" />
                Log Out
              </li>
            </ul>
          )}
        </div>
      </nav>

      <div className="flex flex-col items-center m-8 space-y-4 flex-1">
        <div className="text-2xl font-extrabold text-gray-800 dark:text-gray-100">
          Gestión de Carreras
        </div>

        <div className="flex justify-center w-full max-w-7xl">
          <div className="w-90 p-6 bg-gray-500 bg-opacity-10 border border-gray-400 dark:border-gray-400 p-4 shadow-lg rounded-lg mr-6 sticky top-8 fixed">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
              Nueva Carrera
            </h2>
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
          </div>

          <div className="flex-1 max-h-[60vh] overflow-y-auto">
            <hr className="border-gray-400 mb-2 dark:border-orange-500" />
            <CarrerasTable carreras={carreras} onVerCarrera={handleVerCarrera} />
          </div>
        </div>
      </div>
    </div>
  );
}
