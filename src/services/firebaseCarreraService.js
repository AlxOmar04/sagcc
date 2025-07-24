'use client'

import { db } from '@/lib/firebase/client'
import { collection, getDocs, doc, getDoc } from 'firebase/firestore'

// Obtener todas las carreras desde Firebase
export async function obtenerCarrerasDeFirebase() {
  try {
    const snapshot = await getDocs(collection(db, 'carreras'))
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  } catch (error) {
    console.error('Error al obtener carreras desde Firebase:', error)
    return []
  }
}

// Obtener una carrera específica por ID
export async function obtenerCarreraPorId(id) {
  try {
    const docRef = doc(db, 'carreras', id)
    const docSnap = await getDoc(docRef)
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null
  } catch (error) {
    console.error(`Error al obtener la carrera con ID ${id}:`, error)
    return null
  }
}
