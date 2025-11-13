// src/firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";


const firebaseConfig = {
  apiKey: "AIzaSyA_wRI1KDDA0x9xvQbi2MIgzqDaQX5sn1E",
  authDomain: "autoskelbk.firebaseapp.com",
  databaseURL: "https://autoskelbk-default-rtdb.firebaseio.com",
  projectId: "autoskelbk",
  storageBucket: "autoskelbk.appspot.com", 
  messagingSenderId: "115076600985",
  appId: "1:115076600985:web:040946f83374f27d41d408",
  measurementId: "G-32BL2243H4",
};



firebaseConfig.storageBucket = "autoskelbk.appspot.com";


const app = initializeApp(firebaseConfig);


export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
