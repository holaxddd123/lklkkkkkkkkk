import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBAm91Sx_6--rVXLsa3qbFZaMAwnysS3GA",
  authDomain: "klkclon2.firebaseapp.com",
  projectId: "klkclon2",
  storageBucket: "klkclon2.firebasestorage.app",
  messagingSenderId: "1015649898609",
  appId: "1:1015649898609:web:230e56414caa4cd4a94bd0"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);