import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { db, firebaseReady } from '../firebase/firebase.js';
import { localAdd, localListen } from '../firebase/localStore.js';
export function listenClientes(callback) { if (!firebaseReady) return localListen('clientes', callback); return onSnapshot(query(collection(db, 'clientes'), orderBy('nombre')), snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))); }
export const agregarCliente = (data) => firebaseReady ? addDoc(collection(db, 'clientes'), { ...data, activo: true, createdAt: serverTimestamp() }) : localAdd('clientes', { ...data, activo:true });
