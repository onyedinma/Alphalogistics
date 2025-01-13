import { initializeApp, getApps } from '@react-native-firebase/app';
import { getAuth } from '@react-native-firebase/auth';
import { getFirestore } from '@react-native-firebase/firestore';
import { getStorage } from '@react-native-firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD1pkwxsiSqR83kcAHbEtoyAJHQBHrlNb0",
  authDomain: "alphalogistics-452e4.firebaseapp.com",
  projectId: "alphalogistics-452e4",
  storageBucket: "alphalogistics-452e4.firebasestorage.app",
  messagingSenderId: "733359249229",
  appId: "1:733359249229:android:bc83eee2fa11b215af0904"
};

// Initialize Firebase if it hasn't been initialized
if (getApps().length === 0) {
  initializeApp(firebaseConfig);
}

const auth = getAuth();
const firestore = getFirestore();
const storage = getStorage();

export { auth, firestore, storage };
