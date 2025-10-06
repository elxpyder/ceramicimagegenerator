import { useState, useEffect } from 'react';
import { useFirebaseConfig } from '../context/FirebaseConfigContext';
import { useFirebase } from '../context/FirebaseContext';

export default function Settings() {
  const { config, updateConfig, updateSettings, isConfigured, resetToDefaults, isLoading } = useFirebaseConfig();
  const { isInitialized, error } = useFirebase();

  const [localConfig, setLocalConfig] = useState(config);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [language, setLanguage] = useState('es');

  // Load settings from localStorage
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') || 'es';

    setLanguage(savedLanguage);
  }, []);

  // Update local config when context config changes
  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  const handleConfigChange = (field: keyof typeof config, value: string) => {
    setLocalConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveConfig = async () => {
    setSaveStatus('saving');
    try {
      updateConfig(localConfig);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      console.error('Error saving config:', err);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleSaveApiSettings = async () => {
    setSaveStatus('saving');
    try {
      await updateSettings({
        language: language
      });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Failed to save API settings:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  };

  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear all local data? This cannot be undone.')) {
      localStorage.clear();
      setLanguage('es');
      resetToDefaults();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">
          Configure your ceramic model generator preferences
        </p>
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          API Configuration
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              AI Image Generation
            </label>
            <select
              value="gemini"
              className="input-field"
              disabled
            >
              <option value="gemini">Google Gemini Imagen</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Using Google Gemini Imagen API for image generation
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Language
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="input-field"
            >
              <option value="en">English</option>
              <option value="es">Español</option>
            </select>
          </div>

          <button
            onClick={handleSaveApiSettings}
            className="btn-primary"
          >
            Save API Settings
          </button>
        </div>
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Firebase Cloud Storage
          {isLoading && <span className="ml-2 text-sm text-blue-600">(Loading...)</span>}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">
              <strong>Firebase Error:</strong> {error}
            </p>
          </div>
        )}

        {!isConfigured && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Setup Required:</strong> Configure Firebase to enable cloud storage for your images.
            </p>
          </div>
        )}

        {isConfigured && !isInitialized && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Initializing:</strong> Setting up Firebase connection...
            </p>
          </div>
        )}

        {isConfigured && isInitialized && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              <strong>Connected:</strong> Firebase is configured and ready to use.
            </p>
          </div>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project ID *
              </label>
              <input
                type="text"
                value={localConfig.projectId}
                onChange={(e) => handleConfigChange('projectId', e.target.value)}
                placeholder="your-firebase-project-id"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Key *
              </label>
              <input
                type="password"
                value={localConfig.apiKey}
                onChange={(e) => handleConfigChange('apiKey', e.target.value)}
                placeholder="your-api-key"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Storage Bucket *
              </label>
              <input
                type="text"
                value={localConfig.storageBucket}
                onChange={(e) => handleConfigChange('storageBucket', e.target.value)}
                placeholder="your-project.appspot.com"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Auth Domain
              </label>
              <input
                type="text"
                value={localConfig.authDomain}
                onChange={(e) => handleConfigChange('authDomain', e.target.value)}
                placeholder="your-project.firebaseapp.com"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Messaging Sender ID
              </label>
              <input
                type="text"
                value={localConfig.messagingSenderId}
                onChange={(e) => handleConfigChange('messagingSenderId', e.target.value)}
                placeholder="123456789"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                App ID
              </label>
              <input
                type="text"
                value={localConfig.appId}
                onChange={(e) => handleConfigChange('appId', e.target.value)}
                placeholder="your-app-id"
                className="input-field"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSaveConfig}
              disabled={saveStatus === 'saving'}
              className="btn-primary disabled:opacity-50"
            >
              {saveStatus === 'saving' ? 'Saving...' :
               saveStatus === 'saved' ? '✅ Saved!' :
               saveStatus === 'error' ? '❌ Error' : 'Save Firebase Config'}
            </button>

            <button
              onClick={resetToDefaults}
              className="btn-secondary text-red-600 border-red-300 hover:bg-red-50"
            >
              Reset to Defaults
            </button>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">
              Firebase Setup Instructions
            </h3>
            <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
              <li>Create a Firebase project at <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="underline">console.firebase.google.com</a></li>
              <li>Enable Firebase Storage and Firestore in the console</li>
              <li>Go to Project Settings → General → Your apps → Web app</li>
              <li>Copy the Firebase config values above</li>
              <li>Set up Storage and Firestore security rules (see project documentation)</li>
            </ol>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Storage & Data
        </h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">Clear All Local Data</h3>
              <p className="text-sm text-gray-600">
                Remove all locally stored images, settings, and Firebase configuration
              </p>
            </div>
            <button
              onClick={handleClearData}
              className="btn-secondary text-red-600 border-red-300 hover:bg-red-50"
            >
              Clear All Data
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">Export Settings</h3>
              <p className="text-sm text-gray-600">
                Download your current configuration as JSON
              </p>
            </div>
            <button
              onClick={() => {
                const exportData = {
                  firebaseConfig: config,
                  language: language,
                  timestamp: new Date().toISOString()
                };
                const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'ceramic-generator-settings.json';
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="btn-secondary"
            >
              Export
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          About
        </h2>

        <div className="text-sm text-gray-600 space-y-2">
          <p><strong>Version:</strong> 1.0.0</p>
          <p><strong>Built with:</strong> React, TypeScript, Firebase, Tailwind CSS</p>
          <p><strong>Purpose:</strong> Generate AI reference images for ceramic modeling</p>
          <p><strong>Storage:</strong> {isConfigured ? 'Cloud (Firebase)' : 'Local (localStorage)'}</p>
          <p><strong>Settings:</strong> {isConfigured ? 'Cloud-synced' : 'Local only'}</p>
        </div>
      </div>
    </div>
  );
}