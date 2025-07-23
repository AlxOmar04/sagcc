'use client'

import { db } from '@/lib/firebase/client'
import { collection, getDocs, doc, getDoc } from 'firebase/firestore'

// Obtener todas las carreras
export async function obtenerCarrerasDeFirebase() {
  const snapshot = await getDocs(collection(db, 'carreras'))
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

// Obtener una sola carrera por ID
export async function obtenerCarreraPorId(id) {
  const docRef = doc(db, 'carreras', id)
  const docSnap = await getDoc(docRef)
  return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null
}
