import { addDoc, collection, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { db, firebaseReady } from '../firebase/firebase.js';
import { localAdd, localListen, localUpdate } from '../firebase/localStore.js';

export function listenVentasDelDia(fecha, callback) {
  if (!firebaseReady) {
    return localListen('ventas', callback, x => x.fecha === fecha);
  }

  const q = query(collection(db, 'ventas'), orderBy('createdAt', 'desc'));

  return onSnapshot(q, (snap) => {
    const ventas = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    console.log('VENTAS DESDE FIREBASE:', ventas);

    callback(ventas.filter((v) => v.fecha === fecha));
  });
}
export const agregarVenta = (data) => firebaseReady ? addDoc(collection(db, 'ventas'), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }) : localAdd('ventas', data);
export const actualizarVenta = (id, data) => firebaseReady ? updateDoc(doc(db, 'ventas', id), { ...data, updatedAt: serverTimestamp() }) : localUpdate('ventas', id, data);
