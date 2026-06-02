import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';


const firebaseConfig = {
  apiKey: "AIzaSyAayxQovYpOgk2aYlO6z0mslTU9c_2fHzg",
  authDomain: "bazar-el-chunky.firebaseapp.com",
  projectId: "bazar-el-chunky",
  storageBucket: "bazar-el-chunky.firebasestorage.app",
  messagingSenderId: "189979627896",
  appId: "1:189979627896:web:3d8b099f91f57529b3788d",
  measurementId: "G-4P52846SL7"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const firebaseReady = true;