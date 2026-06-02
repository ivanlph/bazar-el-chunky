import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
    where,
  } from 'firebase/firestore';
  import { db } from '../firebase/firebase.js';
  
  export function listenCargas(callback) {
    const q = query(collection(db, 'cargas'), orderBy('fecha', 'desc'));
  
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }
  
  export function createCarga(data) {
    return addDoc(collection(db, 'cargas'), {
      ...data,
      createdAt: serverTimestamp(),
    });
  }
  
  export function updateCarga(id, data) {
    return updateDoc(doc(db, 'cargas', id), data);
  }
  
  export function deleteCarga(id) {
    return deleteDoc(doc(db, 'cargas', id));
  }
  
  export function listenComprasPorCarga(cargaId, callback) {
    const q = query(
      collection(db, 'cargaCompras'),
      where('cargaId', '==', cargaId)
    );
  
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }
  
  export function createCompra(data) {
    return addDoc(collection(db, 'cargaCompras'), {
      ...data,
      createdAt: serverTimestamp(),
    });
  }
  
  export function deleteCompra(id) {
    return deleteDoc(doc(db, 'cargaCompras', id));
  }