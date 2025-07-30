import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';

// Esta función escucha en tiempo real los cambios en la colección de carreras
export function escucharCarreras(callback) {
  const unsubscribe = onSnapshot(collection(db, 'carreras'), (snapshot) => {
    const carreras = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        nombre: data.nombre,
        disciplina: data.disciplina,
        etapa: data.etapa,
        fechaHora: data.fechaHora?.toDate() ?? null,
      };
    });

    callback(carreras);
  });

  return unsubscribe;
}
