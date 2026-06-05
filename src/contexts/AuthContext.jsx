import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, limit, query, setDoc, where } from 'firebase/firestore';
import { auth, db } from '../services/firebase/firebase.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        const snap = await getDoc(doc(db, 'users', firebaseUser.uid));

        if (snap.exists()) {
          setPerfil(snap.data());
        } else {
          const byEmail = query(
            collection(db, 'users'),
            where('email', '==', firebaseUser.email),
            limit(1)
          );
          const emailSnap = await getDocs(byEmail);
          if (emailSnap.empty) {
            setPerfil(null);
          } else {
            const emailPerfil = emailSnap.docs[0].data();
            await setDoc(doc(db, 'users', firebaseUser.uid), emailPerfil, { merge: true });
            setPerfil(emailPerfil);
          }
        }
      } else {
        setPerfil(null);
      }

      setLoading(false);
    });
  }, []);

  const login = (email, password) =>
    signInWithEmailAndPassword(auth, email, password);

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ user, perfil, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
