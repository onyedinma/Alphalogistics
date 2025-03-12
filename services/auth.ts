import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { UserRole, UserData } from '@/types/auth';

export async function checkExistingUser(email: string): Promise<boolean> {
  const userSnapshot = await firestore()
    .collection('users')
    .where('email', '==', email)
    .get();

  return !userSnapshot.empty;
}

export async function signUp(email: string, password: string, displayName: string) {
  // Check if email already exists
  const exists = await checkExistingUser(email);
  if (exists) {
    throw new Error('This email is already registered');
  }

  // Create auth user
  const userCredential = await auth().createUserWithEmailAndPassword(email, password);
  const user = userCredential.user;

  // Update display name
  await user.updateProfile({ displayName });

  // Create user document
  const userData: UserData = {
    id: user.uid,
    email: user.email!,
    role: 'customer', // Always customer
    name: displayName,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await firestore().collection('users').doc(user.uid).set(userData);

  return userData;
}

export async function signIn(email: string, password: string) {
  const userCredential = await auth().signInWithEmailAndPassword(email, password);
  const userDoc = await firestore().collection('users').doc(userCredential.user.uid).get();
  
  if (!userDoc.exists) {
    await auth().signOut();
    throw new Error('User data not found');
  }

  const userData = userDoc.data() as UserData;
  return userData;
}

export async function createCustomerProfile(
  uid: string,
  email: string | null,
  displayName: string | null
) {
  const userData = {
    id: uid,
    email: email || '',
    role: 'customer',
    name: displayName || '',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await firestore().collection('users').doc(uid).set(userData);
  return userData;
}
