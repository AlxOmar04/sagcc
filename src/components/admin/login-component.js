'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function LoginComponent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/admin');
    } catch (err) {
      console.error(err);
      setError('Credenciales inválidas o usuario no registrado.');
    }
  };

  return (
    <div
      className="flex items-center justify-center min-h-screen bg-cover bg-center"
      style={{ backgroundImage: 'url("/img/portada.jpg")' }}
    >
      <form
        onSubmit={handleLogin}
        className="backdrop-blur-md bg-white/20 dark:bg-gray-800/30 p-8 rounded-2xl shadow-lg w-full max-w-md border border-white/20"
      >
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-white">
          Iniciar Sesión
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
          className="mb-6"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        

        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-white to-orange-400 border border-gray-400 hover:from-gray-200 hover:to-gray-500 hover:border-orange-400 text-sm rounded-full text-black font-semibold"
        >
          Iniciar
        </Button>
      </form>
    </div>
  );
}
