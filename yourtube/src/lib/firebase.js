// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCVwFoKeumn33XPFhwE69F3vtMDcI2EnVk",
  authDomain: "yourtube-61c4e.firebaseapp.com",
  projectId: "yourtube-61c4e",
  storageBucket: "yourtube-61c4e.firebasestorage.app",
  messagingSenderId: "943726366531",
  appId: "1:943726366531:web:c20dae8f6ea7a0e5fe29f6",
  measurementId: "G-P6SFGGP76P"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
export { auth, provider };
