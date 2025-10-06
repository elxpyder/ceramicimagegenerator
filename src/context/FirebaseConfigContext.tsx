import { createContext, useContext, ReactNode, useState } from 'react';

// Firebase configuration
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "your-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "ceramic-model-generator.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "ceramic-model-generator",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "ceramic-model-generator.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "your-app-id"
};

interface FirebaseConfigContextType {
  config: typeof firebaseConfig;
  updateConfig: (newConfig: Partial<typeof firebaseConfig>) => void;
  updateSettings: (settings: any) => void;
  isConfigured: boolean;
  resetToDefaults: () => void;
  isLoading: boolean;
}

const FirebaseConfigContext = createContext<FirebaseConfigContextType | undefined>(undefined);

export function useFirebaseConfig() {
  const context = useContext(FirebaseConfigContext);
  if (!context) {
    throw new Error('useFirebaseConfig must be used within a FirebaseConfigProvider');
  }
  return context;
}

interface FirebaseConfigProviderProps {
  children: ReactNode;
}

export function FirebaseConfigProvider({ children }: FirebaseConfigProviderProps) {
  const [config, setConfig] = useState(firebaseConfig);
  const [isLoading] = useState(false);

  const updateConfig = (newConfig: Partial<typeof firebaseConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  };

  const updateSettings = (settings: any) => {
    // Implementation for updating settings
    console.log('Updating settings:', settings);
  };

  const resetToDefaults = () => {
    setConfig(firebaseConfig);
  };

  const isConfigured = !!(
    config.apiKey &&
    config.apiKey !== "your-api-key" &&
    config.projectId &&
    config.projectId !== "your-project-id"
  );

  return (
    <FirebaseConfigContext.Provider value={{
      config,
      updateConfig,
      updateSettings,
      isConfigured,
      resetToDefaults,
      isLoading
    }}>
      {children}
    </FirebaseConfigContext.Provider>
  );
}
