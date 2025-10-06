

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export default function Settings() {
  const { t, i18n } = useTranslation();
  const [apiKey, setApiKey] = useState('');
  const [language, setLanguage] = useState(i18n.language || 'es');
  const [isSaving, setIsSaving] = useState(false);

  // Load settings from localStorage
  useEffect(() => {
    const savedApiKey = localStorage.getItem('geminiApiKey');
    const savedLanguage = localStorage.getItem('language') || 'es';

    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
    setLanguage(savedLanguage);
  }, []);

  const handleSave = async () => {
    setIsSaving(true);

    try {
      // Save API key
      if (apiKey.trim()) {
        localStorage.setItem('geminiApiKey', apiKey.trim());
      } else {
        localStorage.removeItem('geminiApiKey');
      }

      // Save language preference
      localStorage.setItem('language', language);
      await i18n.changeLanguage(language);

      // Show success message
      alert(t('common.success') + ': ' + t('settings.save'));
    } catch (error) {
      console.error('Error saving settings:', error);
      alert(t('common.error') + ': ' + 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const changeLanguage = (lng: string) => {
    setLanguage(lng);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('settings.title')}</h1>
        <p className="text-gray-600">
          {t('settings.subtitle')}
        </p>
      </div>

      {/* Language Settings */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          {t('settings.language')}
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('settings.language')}
            </label>
            <select
              value={language}
              onChange={(e) => changeLanguage(e.target.value)}
              className="input-field"
            >
              <option value="es">🇪🇸 Español</option>
              <option value="en">🇺🇸 English</option>
            </select>
          </div>
        </div>
      </div>

      {/* API Configuration */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          {t('settings.api')}
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('settings.service')}
            </label>
            <div className="input-field bg-gray-50 text-gray-600">
              Google Gemini (Imagen 3.0)
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Default AI service for image generation
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('settings.apiKey')}
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your Google AI API key"
              className="input-field"
            />
            <p className="text-xs text-gray-500 mt-1">
              {t('settings.apiKeyDesc')}
            </p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`
            flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors
            ${isSaving
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-primary-600 hover:bg-primary-700 text-white'
            }
          `}
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
              <span>{t('common.loading')}</span>
            </>
          ) : (
            <span>{t('settings.save')}</span>
          )}
        </button>
      </div>

      {/* About Section */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          {t('settings.about')}
        </h2>

        <div className="text-sm text-gray-600 space-y-2">
          <p><strong>{t('settings.version')}:</strong> 1.0.0</p>
          <p><strong>{t('settings.builtWith')}:</strong> React, TypeScript, Firebase, Tailwind CSS</p>
          <p><strong>{t('settings.purpose')}:</strong> Generate AI reference images for ceramic modeling</p>
        </div>
      </div>
    </div>
  );
}