import { addDoc, collection, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { db, firebaseReady } from '../firebase/firebase.js';
import { localAdd, localListen, localUpdate } from '../firebase/localStore.js';
export function listenEmpleados(callback) { if (!firebaseReady) return localListen('empleados', callback); return onSnapshot(query(collection(db, 'empleados'), orderBy('nombre')), snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))); }
export const agregarEmpleado = (data) => firebaseReady ? addDoc(collection(db, 'empleados'), { ...data, activo: true, createdAt: serverTimestamp() }) : localAdd('empleados', { ...data, activo:true });
export function listenHorarios(fechaInicio, fechaFin, callback) { if (!firebaseReady) return localListen('horarios', callback, x => x.fecha >= fechaInicio && x.fecha <= fechaFin); return onSnapshot(query(collection(db, 'horarios'), where('fecha','>=',fechaInicio), where('fecha','<=',fechaFin)), snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))); }
export const agregarHorario = (data) => firebaseReady ? addDoc(collection(db, 'horarios'), { ...data, createdAt: serverTimestamp() }) : localAdd('horarios', data);
export const actualizarHorario = (id, data) => firebaseReady ? updateDoc(doc(db, 'horarios', id), { ...data, updatedAt: serverTimestamp() }) : localUpdate('horarios', id, data);
