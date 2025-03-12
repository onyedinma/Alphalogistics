import { GoogleSignin } from '@react-native-google-signin/google-signin';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

export async function signInWithGoogle() {
  // Check if Play Services are available
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  
  // Get the user credentials from Google Sign In
  await GoogleSignin.signIn();
  
  // Get the tokens (this is where we get the idToken)
  const { accessToken, idToken } = await GoogleSignin.getTokens();
  if (!idToken) {
    throw new Error('Failed to get ID token');
  }
  
  // Create a Firebase credential
  const googleCredential = auth.GoogleAuthProvider.credential(idToken);
  
  // Sign in to Firebase with the Google credential
  const userCredential = await auth().signInWithCredential(googleCredential);
  
  return userCredential;
}

export async function verifyCustomerRole(uid: string) {
  const userDoc = await firestore().collection('users').doc(uid).get();
  
  if (!userDoc.exists) {
    throw new Error('User profile not found');
  }
  
  const userData = userDoc.data();
  if (!userData?.role || userData.role !== 'customer') {
    throw new Error('Access denied. This portal is for customers only.');
  }
  
  return userData;
}