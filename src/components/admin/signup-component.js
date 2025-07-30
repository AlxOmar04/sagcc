'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function SignupComponent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmar) {
      setError('Las contraseñas no coinciden');
      return;
    }

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      router.push('/admin'); // o '/login' si prefieres
    } catch (err) {
      console.error(err);
      setError('Error al registrar: ' + err.message);
    }
  };

  return (
    <div
      className="flex items-center justify-center min-h-screen bg-cover bg-center"
      style={{ backgroundImage: 'url("/img/portada.jpg")' }}
    >
      <form
        onSubmit={handleSignup}
        className="backdrop-blur-md bg-white/30 dark:bg-gray-800/30 p-8 rounded-2xl shadow-lg w-full max-w-md border border-white/20"
      >
        <h2 className="text-3xl font-bold mb-6 text-center text-gray-900 dark:text-white">
          Crear Cuenta
        </h2>

        {error && (
          <p className="text-red-500 mb-4 text-center font-medium">{error}</p>
        )}

        <Input
          type="email"
          placeholder="Correo electrónico"
          className="mb-4"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          type="password"
          placeholder="Contraseña"
          className="mb-4"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Input
          type="password"
          placeholder="Confirmar contraseña"
          className="mb-6"
          value={confirmar}
          onChange={(e) => setConfirmar(e.target.value)}
          required
        />
        <Button type="submit" className="w-full bg-gradient-to-r from-white to-gray-400 border border-orange-400 hover:from-gray-200 hover:to-gray-500 hover:border-gray-500 text-sm rounded-full text-black font-semibold">
          Registrarse
        </Button>
      </form>
    </div>
  );
}
