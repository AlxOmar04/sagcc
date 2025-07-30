// services/firebaseAuthService.js
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { app } from '@/lib/firebase/client';

const auth = getAuth(app);

export const login = (email, password) => signInWithEmailAndPassword(auth, email, password);
export const register = (email, password) => createUserWithEmailAndPassword(auth, email, password);
export const logout = () => signOut(auth);
export const getCurrentUser = () => auth.currentUser;
export { auth };
