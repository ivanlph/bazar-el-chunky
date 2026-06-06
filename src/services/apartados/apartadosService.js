import { addDoc, collection, doc, getDoc, increment, onSnapshot, orderBy, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { db, firebaseReady } from '../firebase/firebase.js';
import { localAdd, localListen, localUpdate } from '../firebase/localStore.js';
export function listenApartados(callback) { if (!firebaseReady) return localListen('apartados', callback); return onSnapshot(query(collection(db, 'apartados'), orderBy('createdAt', 'desc')), snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))); }
export function listenApartadosCliente(clienteId, callback) { if (!firebaseReady) return localListen('apartados', callback, x => x.clienteId === clienteId && x.estatus === 'activo'); return onSnapshot(query(collection(db, 'apartados'), where('clienteId','==',clienteId), where('estatus','==','activo')), snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))); }
export const crearApartado = (data) => firebaseReady ? addDoc(collection(db, 'apartados'), { ...data, estatus: data.estatus || 'activo', createdAt: serverTimestamp(), updatedAt: serverTimestamp() }) : localAdd('apartados', { ...data, estatus: data.estatus || 'activo' });
export async function registrarAbono({ apartadoId, clienteId, cantidad, fecha, sucursalId, usuarioId, metodoPago, recibidoUsd, tipoCambio, equivalenteMxn }) {
  const payload = { apartadoId, clienteId, cantidad: Number(cantidad), fecha, sucursalId, usuarioId, metodoPago, recibidoUsd: Number(recibidoUsd || 0), tipoCambio: Number(tipoCambio || 0), equivalenteMxn: Number(equivalenteMxn || 0) };
  if (!firebaseReady) { await localAdd('abonos', payload); return; }
  await addDoc(collection(db, 'abonos'), { ...payload, createdAt: serverTimestamp() });
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
}
