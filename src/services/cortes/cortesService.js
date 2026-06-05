import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { db, firebaseReady } from '../firebase/firebase.js';
import { localAdd, localListen } from '../firebase/localStore.js';

export function listenCortes(callback) {
  if (!firebaseReady) {
    return localListen('cortes', callback);
  }

  const q = query(collection(db, 'cortes'), orderBy('createdAt', 'desc'));

  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export function listenCorteDelDia(fecha, sucursalId, callback) {
  if (!firebaseReady) {
    return localListen(
      'cortes',
      callback,
      (x) => x.fecha === fecha && x.sucursalId === sucursalId
    );
  }

  const q = query(
    collection(db, 'cortes'),
    where('fecha', '==', fecha),
    where('sucursalId', '==', sucursalId)
  );

  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export function crearCorte(data) {
  const payload = {
    ...data,
    estatus: 'cerrado',
    createdAt: firebaseReady ? serverTimestamp() : new Date().toISOString(),
    updatedAt: firebaseReady ? serverTimestamp() : new Date().toISOString(),
  };

  return firebaseReady
    ? addDoc(collection(db, 'cortes'), payload)
    : localAdd('cortes', payload);
}
