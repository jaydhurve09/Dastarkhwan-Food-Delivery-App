// getIdToken.js
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyC6YvZUiB6n2qITRFR2oBMppyGrJ-x2UzA',
  authDomain: 'dastarkhawn-demo.firebaseapp.com',
};

const email = 'superadmin@dastarkhwan.com';
const password = 'ChangeMe123!';

const app = initializeApp(firebaseConfig);
const auth = getAuth();

signInWithEmailAndPassword(auth, email, password)
  .then(async (userCredential) => {
    const token = await userCredential.user.getIdToken();
    console.log('✅ Firebase ID Token:\n', token);
  })
  .catch((error) => {
    console.error('❌ Login error:', error.message);
  });
