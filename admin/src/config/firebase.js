import { initializeApp } from 'firebase/app';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

const firebaseConfig = {
  apiKey: "AIzaSyDlCOF6kllUkxFDQe8TSYhJw89f9K9z64Q",
  authDomain: "dastarkhawn-demo.firebaseapp.com",
  projectId: "dastarkhawn-demo",
  storageBucket: "dastarkhawn-demo.firebasestorage.app",
  messagingSenderId: "848121620256",
  appId: "1:848121620256:web:0caf7c847b5bb2e83b2f29",
  measurementId: "G-04R5J2LKQM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Functions
const functions = getFunctions(app);

// Connect to local emulator if in development
if (process.env.NODE_ENV === 'development') {
  try {
    connectFunctionsEmulator(functions, 'localhost', 5001);
  } catch (error) {
    console.log('Functions emulator already connected or not available');
  }
}

export { functions };
export default app;
