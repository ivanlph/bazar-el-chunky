import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db, firebaseReady } from '../firebase/firebase.js';
import { localAdd, localListen, localUpdate } from '../firebase/localStore.js';

function stripUndefined(data) {
  return Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined)
  );
}

function pagoFields(data) {
  const pagado = Boolean(data.pagado);
  const payload = {
    ...data,
    pagado,
    pagoMontoMxn: pagado ? Number(data.pagoMontoMxn || 0) : 0,
    pagoOrigen: pagado ? data.pagoOrigen || 'fondoCaja' : '',
    pagoFecha: pagado
      ? data.pagoFecha || (firebaseReady ? serverTimestamp() : new Date().toISOString())
      : null,
  };

  return stripUndefined(payload);
}

export function listenEmpleados(callback) {
  if (!firebaseReady) return localListen('empleados', callback);

  return onSnapshot(
    query(collection(db, 'empleados'), orderBy('nombre')),
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  );
}

export function agregarEmpleado(data) {
  const payload = {
    ...data,
    activo: true,
    createdAt: firebaseReady ? serverTimestamp() : new Date().toISOString(),
  };

  return firebaseReady
    ? addDoc(collection(db, 'empleados'), stripUndefined(payload))
    : localAdd('empleados', stripUndefined(payload));
}

export function listenHorarios(fechaInicio, fechaFin, callback) {
  if (!firebaseReady) {
    return localListen(
      'horarios',
      callback,
      (x) => x.fecha >= fechaInicio && x.fecha <= fechaFin
    );
  }

  const q = query(
    collection(db, 'horarios'),
    where('fecha', '>=', fechaInicio),
    where('fecha', '<=', fechaFin)
  );

  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export function agregarHorario(data) {
  const payload = {
    ...pagoFields(data),
    createdAt: firebaseReady ? serverTimestamp() : new Date().toISOString(),
  };

  return firebaseReady
    ? addDoc(collection(db, 'horarios'), stripUndefined(payload))
    : localAdd('horarios', stripUndefined(payload));
}

export function actualizarHorario(id, data) {
  const payload = {
    ...pagoFields(data),
    updatedAt: firebaseReady ? serverTimestamp() : new Date().toISOString(),
  };

  return firebaseReady
    ? updateDoc(doc(db, 'horarios', id), stripUndefined(payload))
    : localUpdate('horarios', id, stripUndefined(payload));
}
