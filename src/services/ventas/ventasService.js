import { addDoc, collection, doc, getDoc, onSnapshot, orderBy, query, runTransaction, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { db, firebaseReady } from '../firebase/firebase.js';
import { localAdd, localListen, localUpdate } from '../firebase/localStore.js';

const folioPrefix = {
  venta: 'V',
  apartado: 'A',
  abono: 'AB',
};

function folioYear(fecha) {
  return String(fecha || new Date().toISOString().slice(0, 10)).slice(0, 4);
}

async function nextFolio(tipo, fecha) {
  const year = folioYear(fecha);
  const prefix = folioPrefix[tipo] || 'V';
  const counterRef = doc(db, 'folios', `${tipo}-${year}`);

  const number = await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(counterRef);
    const current = snap.exists() ? Number(snap.data().siguiente || 1) : 1;
    transaction.set(counterRef, {
      tipo,
      year,
      siguiente: current + 1,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    return current;
  });

  return `${prefix}-${year}-${String(number).padStart(6, '0')}`;
}

async function withFolio(data) {
  if (!firebaseReady || data.folio) return data;
  const folioTipo = data.tipo === 'abono' ? 'abono' : data.tipo === 'apartado' ? 'apartado' : 'venta';
  return {
    ...data,
    folio: await nextFolio(folioTipo, data.fecha),
  };
}

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
export async function agregarVenta(data) {
  const payload = await withFolio(data);

  if (!firebaseReady) {
    const ref = await localAdd('ventas', payload);
    return { id: ref.id, ...payload };
  }

  const ref = await addDoc(collection(db, 'ventas'), {
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return { id: ref.id, ...payload };
}
export const actualizarVenta = (id, data) => firebaseReady ? updateDoc(doc(db, 'ventas', id), { ...data, updatedAt: serverTimestamp() }) : localUpdate('ventas', id, data);
