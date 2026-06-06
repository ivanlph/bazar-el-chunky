import { addDoc, collection, doc, getDoc, increment, onSnapshot, orderBy, query, runTransaction, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { db, firebaseReady } from '../firebase/firebase.js';
import { localAdd, localListen, localUpdate } from '../firebase/localStore.js';

function folioYear(fecha) {
  return String(fecha || new Date().toISOString().slice(0, 10)).slice(0, 4);
}

async function nextFolio(tipo, fecha) {
  const year = folioYear(fecha);
  const prefix = tipo === 'abono' ? 'AB' : 'A';
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
export function listenApartados(callback) { if (!firebaseReady) return localListen('apartados', callback); return onSnapshot(query(collection(db, 'apartados'), orderBy('createdAt', 'desc')), snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))); }
export function listenApartadosCliente(clienteId, callback) { if (!firebaseReady) return localListen('apartados', callback, x => x.clienteId === clienteId && x.estatus === 'activo'); return onSnapshot(query(collection(db, 'apartados'), where('clienteId','==',clienteId), where('estatus','==','activo')), snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))); }
export async function crearApartado(data) {
  const payload = {
    ...data,
    estatus: data.estatus || 'activo',
    folio: data.folio || (firebaseReady ? await nextFolio('apartado', data.fecha || data.fechaLimite) : ''),
  };

  if (!firebaseReady) {
    const ref = await localAdd('apartados', payload);
    return { id: ref.id, ...payload };
  }

  const ref = await addDoc(collection(db, 'apartados'), {
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return { id: ref.id, ...payload };
}
export async function registrarAbono({ apartadoId, clienteId, cantidad, fecha, sucursalId, usuarioId, metodoPago, recibidoUsd, tipoCambio, equivalenteMxn }) {
  const payload = { apartadoId, clienteId, cantidad: Number(cantidad), fecha, sucursalId, usuarioId, metodoPago, recibidoUsd: Number(recibidoUsd || 0), tipoCambio: Number(tipoCambio || 0), equivalenteMxn: Number(equivalenteMxn || 0), folio: firebaseReady ? await nextFolio('abono', fecha) : '' };
  if (!firebaseReady) {
    const ref = await localAdd('abonos', payload);
    return { id: ref.id, ...payload };
  }
  const abonoRef = await addDoc(collection(db, 'abonos'), { ...payload, createdAt: serverTimestamp() });
  const apartadoRef = doc(db, 'apartados', apartadoId);
  const apartadoSnap = await getDoc(apartadoRef);
  const saldoActual = Number(apartadoSnap.data()?.saldo || 0);
  const nuevoSaldo = Math.max(0, saldoActual - Number(cantidad));
  await updateDoc(apartadoRef, {
    abonado: increment(Number(cantidad)),
    saldo: nuevoSaldo,
    estatus: nuevoSaldo <= 0 ? 'liquidado' : 'activo',
    liquidadoAt: nuevoSaldo <= 0 ? serverTimestamp() : null,
    updatedAt: serverTimestamp(),
  });
  return { id: abonoRef.id, ...payload, saldoAnterior: saldoActual, saldoNuevo: nuevoSaldo };
}
