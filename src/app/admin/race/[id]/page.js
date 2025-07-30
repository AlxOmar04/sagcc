'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { doc, onSnapshot, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { getAuth, signOut } from 'firebase/auth';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';

import {
  FaBell,
  FaCog,
  FaMoon,
  FaSignInAlt,
  FaSignOutAlt,
  FaSun,
  FaEdit,
  FaTrash,
  FaUserPlus,
  FaUsers,
  FaTrophy,
  FaChevronLeft,
  FaChevronRight
} from 'react-icons/fa';

import FormularioCompetidor from '@/components/race/FormularioCompetidor';
import VerCompetidores from '@/components/race/VerCompetidores';
import Clasificaciones from '@/components/race/ClasificacionesCarrera';
import FormularioEditarCarrera from '@/components/race/FormularioEditarCarrera';

import IsAuth from '@/components/admin/is-auth';

export default function DetalleCarreraPage() {
  const { id } = useParams();
  const router = useRouter();
  const [carrera, setCarrera] = useState(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [showConfigMenu, setShowConfigMenu] = useState(false);
  const [mostrarFormularioEditar, setMostrarFormularioEditar] = useState(false);
  const [sidebarExpandido, setSidebarExpandido] = useState(true);
  const [seccionActiva, setSeccionActiva] = useState(null);
  const [mostrarModalInscribir, setMostrarModalInscribir] = useState(false);
  const [mensajeConfirmacion, setMensajeConfirmacion] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'carreras', id), (docSnap) => {
      if (docSnap.exists()) {
        setCarrera({ id: docSnap.id, ...docSnap.data() });
      } else {
        console.warn('No existe la carrera con ese ID.');
      }
      setLoading(false);
    }, (error) => {
      console.error('Error al escuchar carrera:', error);
      setLoading(false);
    });

    return () => unsub();
  }, [id]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  useEffect(() => {
    document.body.style.overflow = mostrarModalInscribir ? 'hidden' : 'auto';
  }, [mostrarModalInscribir]);

  const onEditarCarrera = () => setMostrarFormularioEditar(true);

  const eliminarCarrera = async (idCarrera) => {
    if (confirm("¿Estás seguro de eliminar esta carrera?")) {
      try {
        await deleteDoc(doc(db, 'carreras', idCarrera));
        alert("Carrera eliminada");
        window.location.href = '/admin';
      } catch (error) {
        console.error('Error al eliminar carrera:', error);
        alert('No se pudo eliminar la carrera.');
      }
    }
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
      <div className="flex flex-col min-h-screen font-sans bg-gradient-to-b from-white to-gray-200 dark:from-[#041C32] dark:to-orange-500 text-gray-900 dark:text-white">
        <nav className="bg-gradient-to-r from-gray-100 to-gray-600 text-white flex items-center justify-between p-2 mb-2 shadow-md dark:from-[#041C32] dark:to-orange-500">
          <div className="flex items-center ml-4">
            <Link href="/admin">
              <Image src="/img/logo.png" alt="logo" width={54} height={50} style={{ width: 'auto', height: 'auto' }} />
            </Link>
          </div>
          <div className="flex-grow flex justify-center">
            <Input className="w-1/2 text-gray-700 dark:text-gray-300 dark:placeholder-gray-400" placeholder="Buscar carreras..." />
          </div>
          <div className="flex items-center space-x-2 relative mr-2">
            <Button className="bg-gray-500 text-white hover:bg-[#041C32] p-1 rounded-full p-0.5 h-8">
              <FaBell size={18} />
            </Button>
            <Button className="bg-gray-500 text-white hover:bg-[#041C32] p-1 rounded-full p-0.5 h-8 relative" onClick={() => setShowConfigMenu(!showConfigMenu)}>
              <FaCog size={18} />
            </Button>
            {showConfigMenu && (
              <ul className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-lg rounded-lg overflow-hidden z-10">
                <li className="flex items-center justify-between p-2 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer" onClick={() => setDarkMode(!darkMode)}>
                  {darkMode ? 'Modo Claro' : 'Modo Oscuro'}
                  {darkMode ? <FaSun /> : <FaMoon />}
                </li>
                <li className="flex items-center p-2 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer" onClick={() => router.push('/login')}>
                  <FaSignInAlt className="mr-2" /> Cambiar de cuenta
                </li>
                <li className="flex items-center p-2 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer" onClick={handleLogout}>
                  <FaSignOutAlt className="mr-2" /> Cerrar sesión
                </li>
              </ul>
            )}
          </div>
        </nav>

        <div className="relative flex flex-grow">
          <div className={`fixed top-40 left-4 z-50 transition-all duration-300 bg-black/40 dark:bg-black/40 backdrop-blur-md text-white rounded-xl shadow-xl p-4 flex flex-col justify-start ${sidebarExpandido ? 'w-60' : 'w-14'}`}>
            <div className="flex justify-end mb-4">
              <button onClick={() => setSidebarExpandido(!sidebarExpandido)} className="hover:bg-white hover:bg-opacity-20 dark:hover:bg-gray-700 dark:hover:bg-opacity-50 rounded-full p-2 transition-all">
                {sidebarExpandido ? <FaChevronLeft /> : <FaChevronRight />}
              </button>
            </div>
            <div className="flex flex-col space-y-6">
              <Link href="#" onClick={() => setMostrarModalInscribir(true)} className="flex items-center space-x-2 group cursor-pointer">
                <FaUserPlus className="group-hover:text-black" />
                {sidebarExpandido && <span className="text-sm font-semibold group-hover:text-black">Inscribir Competidor</span>}
              </Link>
              <Link href="#" onClick={() => setSeccionActiva('ver')} className="flex items-center space-x-2 group cursor-pointer">
                <FaUsers className="group-hover:text-black" />
                {sidebarExpandido && <span className="text-sm font-semibold group-hover:text-black">Ver Competidores</span>}
              </Link>
              <Link href="#" onClick={() => setSeccionActiva('clasificaciones')} className="flex items-center space-x-2 group cursor-pointer">
                <FaTrophy className="group-hover:text-black" />
                {sidebarExpandido && <span className="text-sm font-semibold group-hover:text-black">Clasificaciones</span>}
              </Link>
            </div>
          </div>

          <div className={`flex-1 p-8 transition-all ${sidebarExpandido ? 'ml-72' : 'ml-24'}`}>
            {loading ? (
              <div className="text-center mt-10 text-gray-700 dark:text-gray-300 text-lg font-semibold">
                Cargando información de la carrera...
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-extrabold text-gray-800 dark:text-gray-200 mb-4">Información del Evento</h1>
                <div className="border border-gray-400 p-4 rounded-lg shadow-md bg-white bg-opacity-0 dark:bg-gray-800 dark:bg-opacity-20 mb-10">
                  <div className="text-xl font-bold mb-2 text-gray-700 dark:text-gray-200">Detalles</div>
                  <hr className="border-orange-300 dark:border-orange-500 mb-2" />
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Disciplina</TableHead>
                        <TableHead>Etapa</TableHead>
                        <TableHead>Fecha y Hora</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>{carrera?.id}</TableCell>
                        <TableCell>{carrera?.nombre}</TableCell>
                        <TableCell>{carrera?.disciplina}</TableCell>
                        <TableCell>{carrera?.etapa ?? 'N/A'}</TableCell>
                        <TableCell>{carrera?.fechaHora?.seconds ? new Date(carrera.fechaHora.seconds * 1000).toLocaleString() : 'Sin fecha'}</TableCell>
                        <TableCell className="text-center space-x-2">
                          <FaEdit className="inline text-gray-500 dark:text-gray-300 cursor-pointer hover:text-blue-400 dark:hover:text-blue-300" title="Editar" onClick={(e) => { e.stopPropagation(); onEditarCarrera(); }} />
                          <FaTrash className="inline text-gray-500 dark:text-gray-300 cursor-pointer hover:text-red-400 dark:hover:text-red-300" title="Eliminar" onClick={(e) => { e.stopPropagation(); eliminarCarrera(carrera?.id); }} />
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                {seccionActiva === 'ver' && (
                  <div className="mb-10">
                    <VerCompetidores carreraId={id} />
                  </div>
                )}
                {seccionActiva === 'clasificaciones' && (
                  <div className="mb-10">
                    <Clasificaciones />
                  </div>
                )}

                {mostrarFormularioEditar && (
                  <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm px-4">
                    <div className="relative w-full max-w-md">
                      <button onClick={() => setMostrarFormularioEditar(false)} className="absolute top-2 right-4 text-black dark:text-white text-2xl font-bold z-10">✕</button>
                      <FormularioEditarCarrera carrera={carrera} onGuardar={() => {
                        setMostrarFormularioEditar(false);
                        setMensajeConfirmacion('¡Cambios guardados con éxito!');
                        setTimeout(() => {
                          setMensajeConfirmacion('');
                        }, 2000);
                      }} />
                    </div>
                  </div>
                )}

                {mensajeConfirmacion && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
                    <div className="bg-black/50 border border-orange-400 rounded-xl p-6 text-center text-white">
                      <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-4">
                        <span className="text-4xl text-white">✓</span>
                      </div>
                      <p className="text-lg font-bold">{mensajeConfirmacion}</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {mostrarModalInscribir && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm px-4">
              <div className="relative w-full max-w-md">
                <button onClick={() => { setMostrarModalInscribir(false); setMensajeConfirmacion(''); }} className="absolute top-12 right-4 text-black text-2xl font-bold z-10">✕</button>

                {mensajeConfirmacion ? (
                  <div className="bg-black/50 border border-orange-400 rounded-xl p-6 text-center text-white">
                    <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-4">
                      <span className="text-4xl text-white">✓</span>
                    </div>
                    <p className="text-lg font-bold">{mensajeConfirmacion}</p>
                  </div>
                ) : (
                  <FormularioCompetidor carreraId={id} onGuardado={() => {
                    setMensajeConfirmacion('¡Competidor guardado con éxito!');
                    setTimeout(() => {
                      setMostrarModalInscribir(false);
                      setMensajeConfirmacion('');
                    }, 2000);
                  }} />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </IsAuth>
  );
}
