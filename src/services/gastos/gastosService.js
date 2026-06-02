import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp, where } from 'firebase/firestore';
import { db, firebaseReady } from '../firebase/firebase.js';
import { localAdd, localListen } from '../firebase/localStore.js';
export function listenGastosDelDia(fecha, callback) { if (!firebaseReady) return localListen('gastosDiarios', callback, x => x.fecha === fecha); return onSnapshot(query(collection(db, 'gastosDiarios'), where('fecha','==',fecha), orderBy('createdAt','desc')), snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))); }
export const agregarGasto = (data) => firebaseReady ? addDoc(collection(db, 'gastosDiarios'), { ...data, createdAt: serverTimestamp() }) : localAdd('gastosDiarios', data);
