import { addDoc, collection, doc, increment, onSnapshot, orderBy, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { db, firebaseReady } from '../firebase/firebase.js';
import { localAdd, localListen, localUpdate } from '../firebase/localStore.js';
export function listenApartados(callback) { if (!firebaseReady) return localListen('apartados', callback); return onSnapshot(query(collection(db, 'apartados'), orderBy('createdAt', 'desc')), snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))); }
export function listenApartadosCliente(clienteId, callback) { if (!firebaseReady) return localListen('apartados', callback, x => x.clienteId === clienteId && x.estatus === 'activo'); return onSnapshot(query(collection(db, 'apartados'), where('clienteId','==',clienteId), where('estatus','==','activo')), snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))); }
export const crearApartado = (data) => firebaseReady ? addDoc(collection(db, 'apartados'), { ...data, estatus: 'activo', createdAt: serverTimestamp(), updatedAt: serverTimestamp() }) : localAdd('apartados', { ...data, estatus:'activo' });
export async function registrarAbono({ apartadoId, clienteId, cantidad, fecha, sucursalId, usuarioId }) {
  if (!firebaseReady) { await localAdd('abonos', { apartadoId, clienteId, cantidad:Number(cantidad), fecha, sucursalId, usuarioId }); return; }
  await addDoc(collection(db, 'abonos'), { apartadoId, clienteId, cantidad: Number(cantidad), fecha, sucursalId, usuarioId, createdAt: serverTimestamp() });
  await updateDoc(doc(db, 'apartados', apartadoId), { abonado: increment(Number(cantidad)), saldo: increment(-Number(cantidad)), updatedAt: serverTimestamp() });
}
