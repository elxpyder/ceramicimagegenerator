import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

// Firebase configuration - replace with your actual config
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
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