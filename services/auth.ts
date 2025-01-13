import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { UserRole, UserData } from '@/types/auth';

export async function checkExistingRole(email: string): Promise<UserRole | null> {
  const userSnapshot = await firestore()
    .collection('users')
    .where('email', '==', email)
    .get();

  if (!userSnapshot.empty) {
    const userData = userSnapshot.docs[0].data();
    return userData.role as UserRole;
  }

  return null;
}

export async function signUp(email: string, password: string, role: UserRole, displayName: string) {
  // Check if email already exists with a different role
  const existingRole = await checkExistingRole(email);
  if (existingRole) {
    throw new Error(`This email is already registered as a ${existingRole}`);
  }

  // Create auth user
  const userCredential = await auth().createUserWithEmailAndPassword(email, password);
  const user = userCredential.user;

  // Update display name
  await user.updateProfile({ displayName });

  // Create user document
  const userData: UserData = {
    uid: user.uid,
    email: user.email!,
    role,
    displayName,
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

  return userDoc.data() as UserData;
} 