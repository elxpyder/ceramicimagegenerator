import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDB6IjnMYQNhU3GPYzgdDAEGoT_DuAbuaE",
  authDomain: "ceramic-model-generator.firebaseapp.com",
  projectId: "ceramic-model-generator",
  storageBucket: "ceramic-model-generator.firebasestorage.app",
  messagingSenderId: "121028790771",
  appId: "1:121028790771:web:9bdd588822fe1081ea2a86"
};

interface FirebaseContextType {
  app: FirebaseApp;
  storage: FirebaseStorage;
  firestore: Firestore;
  auth: Auth;
  isInitialized: boolean;
  error: string | null;
}

const FirebaseContext = createContext<FirebaseContextType | null>(null);

export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
}

interface FirebaseProviderProps {
  children: ReactNode;
}

export function FirebaseProvider({ children }: FirebaseProviderProps) {
  const [firebaseServices, setFirebaseServices] = useState<FirebaseContextType | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      // Initialize Firebase
      const app = initializeApp(firebaseConfig);
      const storage = getStorage(app);
      const firestore = getFirestore(app);
      const auth = getAuth(app);

      setFirebaseServices({
        app,
        storage,
        firestore,
        auth,
        isInitialized: true,
        error: null,
      });
      setIsInitialized(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize Firebase');
      setIsInitialized(true);
    }
  }, []);

  if (!isInitialized) {
    return <div>Loading Firebase...</div>;
  }

  if (error) {
    return <div>Error initializing Firebase: {error}</div>;
  }

  return (
    <FirebaseContext.Provider value={firebaseServices}>
      {children}
    </FirebaseContext.Provider>
  );
}