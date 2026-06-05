import { addDoc, collection, onSnapshot, query, serverTimestamp, where } from 'firebase/firestore';
import { db, firebaseReady } from '../firebase/firebase.js';
import { localAdd, localListen } from '../firebase/localStore.js';

function createdAtMs(value) {
  if (!value) return 0;
  if (typeof value.toMillis === 'function') return value.toMillis();
  if (typeof value.toDate === 'function') return value.toDate().getTime();
  return new Date(value).getTime() || 0;
}

function sortByCreatedAtDesc(rows) {
  return [...rows].sort((a, b) => createdAtMs(b.createdAt) - createdAtMs(a.createdAt));
}

export function listenGastosDelDia(fecha, callback) {
  if (!firebaseReady) {
    return localListen('gastosDiarios', callback, (x) => x.fecha === fecha);
  }

  const q = query(collection(db, 'gastosDiarios'), where('fecha', '==', fecha));

  return onSnapshot(
    q,
    (snap) => {
      const gastos = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(sortByCreatedAtDesc(gastos));
    },
    (error) => {
      console.error('Error al cargar gastos diarios:', error);
      callback([]);
    }
  );
}

export const agregarGasto = (data) => firebaseReady ? addDoc(collection(db, 'gastosDiarios'), { ...data, createdAt: serverTimestamp() }) : localAdd('gastosDiarios', data);
