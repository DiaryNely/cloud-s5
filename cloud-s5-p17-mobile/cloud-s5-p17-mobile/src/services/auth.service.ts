import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { ref as dbRef, set } from 'firebase/database';
import { auth, database } from './firebase';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  nom?: string;
  prenom?: string;
  numEtu?: string;
  role?: string;
}

export interface AuthResponse {
  token: string;
  uid: string;
  email: string;
  role: string;
}

export const authService = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      credentials.email,
      credentials.password
    );
    const user = userCredential.user;
    const token = await user.getIdToken();

    localStorage.setItem('auth_token', token);
    localStorage.setItem('user_email', user.email || '');
    localStorage.setItem('user_role', 'USER');
    localStorage.setItem('user_uid', user.uid);

    return {
      token,
      uid: user.uid,
      email: user.email || '',
      role: 'USER',
    };
  },

  async register(request: RegisterRequest): Promise<AuthResponse> {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      request.email,
      request.password
    );
    const user = userCredential.user;
    const token = await user.getIdToken();

    // Sauvegarder les infos utilisateur dans Firebase
    await set(dbRef(database, `users/${user.uid}`), {
      email: user.email,
      nom: request.nom || '',
      prenom: request.prenom || '',
      numEtu: request.numEtu || '',
      role: request.role || 'USER',
      createdAt: new Date().toISOString(),
    });

    localStorage.setItem('auth_token', token);
    localStorage.setItem('user_email', user.email || '');
    localStorage.setItem('user_role', request.role || 'USER');
    localStorage.setItem('user_uid', user.uid);

    return {
      token,
      uid: user.uid,
      email: user.email || '',
      role: request.role || 'USER',
    };
  },

  logout() {
    signOut(auth);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_uid');
  },

  isAuthenticated(): boolean {
    return !!auth.currentUser || !!localStorage.getItem('auth_token');
  },

  getUser() {
    return {
      email: auth.currentUser?.email || localStorage.getItem('user_email'),
      role: localStorage.getItem('user_role'),
      uid: auth.currentUser?.uid || localStorage.getItem('user_uid'),
    };
  },
};
