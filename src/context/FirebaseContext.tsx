import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { useFirebaseConfig } from './FirebaseConfigContext';

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
  const { config } = useFirebaseConfig();
  const [firebaseServices, setFirebaseServices] = useState<FirebaseContextType | null>(null);

  useEffect(() => {
    try {
      // Initialize Firebase
      const app = initializeApp(config);
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
    } catch (error) {
      console.error('Firebase initialization error:', error);
      setFirebaseServices({
        app: null as any,
        storage: null as any,
        firestore: null as any,
        auth: null as any,
        isInitialized: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }, [config]);

  if (!firebaseServices) {
    return <div>Loading Firebase...</div>;
  }

  if (firebaseServices.error) {
    return <div>Error initializing Firebase: {firebaseServices.error}</div>;
  }

  return (
    <FirebaseContext.Provider value={firebaseServices}>
      {children}
    </FirebaseContext.Provider>
  );
}