import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useImageContext } from '../context/ImageContext';
import { useNotification } from '../context/NotificationContext';
import { GeneratedImage } from '../types';
import { RotateCcw, Download, Edit } from 'lucide-react';

export default function ImageGenerator() {
  const { t } = useTranslation();
  const { addGeneratedImage, referenceImages, isGenerating, setIsGenerating, convertImageToBase64 } = useImageContext();
  const { addToast } = useNotification();
  const navigate = useNavigate();

  const [prompt, setPrompt] = useState('');
  const [lastGeneratedImage, setLastGeneratedImage] = useState<GeneratedImage | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const allActiveReferences = referenceImages.filter(img => img.isActive);

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;

    // Validate edit mode requirements
    if (editMode && allActiveReferences.length === 0) {
      addToast('Edit mode requires at least one active reference image', 'error');
      return;
    }

    setIsGenerating(true);

    try {
      // Get active reference image URLs
      const referenceUrls = allActiveReferences.map(ref => ref.url);
      console.log('Active references found:', allActiveReferences.length);
      console.log('Reference URLs:', referenceUrls);

      // Convert Firebase Storage URLs to base64
      let referenceImages: string[] = [];
      if (referenceUrls.length > 0) {
        console.log('Converting reference images to base64...');
        referenceImages = await Promise.all(referenceUrls.map(async (url) => {
          console.log('Converting URL using context method:', url);
          const base64Data = await convertImageToBase64(url);
          // Format as data URL for the API
          const dataUrl = `data:image/jpeg;base64,${base64Data}`;
          console.log('Formatted as data URL, length:', dataUrl.length);
          return dataUrl;
        }));
        console.log('Base64 conversion complete, image count:', referenceImages.length);
      }

      addToast(t('common.loading'), 'info');

      // Call the API with base64 images
      const response = await fetch('https://api-5irvh6jqca-uc.a.run.app/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          referenceImages: referenceImages, // Now base64 strings
          editMode: editMode
        })
      });

      console.log('API Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error response:', errorData);
        throw new Error(errorData.error || `API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('API Response:', data);

      // Extract the generated image from the response
      const candidates = data.candidates || [];
      if (candidates.length === 0) {
        throw new Error('No images generated');
      }

      const imageData = candidates[0].content.parts[0].inlineData;
      if (!imageData || !imageData.data) {
        throw new Error('Invalid image data format');
      }

      // Validate base64 data
      if (!imageData.data || typeof imageData.data !== 'string') {
        throw new Error('Invalid base64 image data');
      }

      // Create base64 image URL
      const imageUrl = `data:image/png;base64,${imageData.data}`;

      const newImage: GeneratedImage = {
        id: Date.now().toString(),
        url: imageUrl,
        prompt: prompt,
        parameters: {
          type: 'custom',
          style: editMode ? 'edited' : 'realistic',
          description: editMode ? 'Image edit' : 'Generated',
          quality: 'high',
          aspectRatio: '1:1'
        },
        createdAt: new Date(),
        isActive: false
      };

      // Test the image URL before adding it
      await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => reject(new Error('Generated image is not valid'));
        img.src = imageUrl;
      });

      // Check storage usage before adding
      if (referenceImages.length >= 15) {
        addToast('You have many images stored. Old images may be cleared automatically.', 'info');
      }

      console.log('About to call addGeneratedImage with:', newImage);
      addGeneratedImage(newImage);
      console.log('addGeneratedImage called successfully');

      // Store locally for immediate display
      setLastGeneratedImage(newImage);
      setImageLoading(true);

      // Clear form
      setPrompt('');

      // Show success notification
      addToast(editMode ? 'Image edited successfully!' : t('common.success'), 'success');

    } catch (error) {
      console.error('Generation failed:', error);

      // Check if it's a storage quota error
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        addToast('Storage full! Old images have been cleared to make space.', 'error');
      } else {
        const errorMessage = error instanceof Error ? error.message : t('common.error');
        addToast(`${t('common.error')}: ${errorMessage}`, 'error');
      }
      setImageLoading(false);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {t('generator.title')}
        </h1>
        <p className="text-gray-600">
          {t('dashboard.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Generation Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              {t('generator.title')}
            </h2>

            {/* Edit Mode Toggle */}
            <div className="mb-6">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setEditMode(false)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    !editMode 
                      ? 'bg-primary-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Generate New
                </button>
                <button
                  onClick={() => setEditMode(true)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    editMode 
                      ? 'bg-primary-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  disabled={allActiveReferences.length === 0}
                >
                  <Edit className="w-4 h-4 mr-2 inline" />
                  Edit Image
                </button>
              </div>
              {editMode && allActiveReferences.length === 0 && (
                <p className="text-sm text-amber-600 mt-2">
                  ⚠️ Edit mode requires at least one active reference image
                </p>
              )}
            </div>

            {/* Prompt */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {editMode ? 'Describe your edits' : t('generator.label')}
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={6}
                className="input-field resize-none"
                placeholder={
                  editMode 
                    ? 'Describe how you want to modify the reference image (e.g., "make it more textured", "add blue glaze", "make it larger")...'
                    : t('generator.placeholder')
                }
              />
              {allActiveReferences.length > 0 && (
                <p className="text-xs text-blue-600 mt-2">
                  {editMode 
                    ? `🎨 Editing based on ${allActiveReferences.length} reference image${allActiveReferences.length > 1 ? 's' : ''}`
                    : t('generator.referenceHint', { count: allActiveReferences.length })
                  }
                </p>
              )}
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim() || (editMode && allActiveReferences.length === 0)}
              className={`
                w-full flex items-center justify-center space-x-2 py-3 px-6 rounded-lg font-medium transition-colors
                ${isGenerating || !prompt.trim() || (editMode && allActiveReferences.length === 0)
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-primary-600 hover:bg-primary-700 text-white'
                }
              `}
            >
              {isGenerating ? (
                <>
                  <RotateCcw className="w-5 h-5 animate-spin" />
                  <span>{editMode ? 'Editing...' : t('generator.generating')}</span>
                </>
              ) : (
                <>
                  {editMode ? (
                    <Edit className="w-5 h-5" />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                      <circle cx="13.5" cy="6.5" r=".5"></circle>
                      <circle cx="17.5" cy="10.5" r=".5"></circle>
                      <circle cx="8.5" cy="7.5" r=".5"></circle>
                      <circle cx="6.5" cy="12.5" r=".5"></circle>
                      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"></path>
                    </svg>
                  )}
                  <span>{editMode ? 'Edit Image' : t('generator.generate')}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Active References Sidebar */}
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {t('references.active')}
            </h3>
            {allActiveReferences.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {allActiveReferences.map(ref => (
                  <div key={ref.id} className="aspect-square relative">
                    <img
                      src={ref.url}
                      alt={ref.name}
                      className="w-full h-full object-cover rounded-lg shadow-sm"
                    />
                    {editMode && (
                      <div className="absolute top-1 right-1 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                        Edit
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">
                {t('references.noActive')}
              </p>
            )}
          </div>

          {/* Generation Tips */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editMode ? 'Editing Tips' : t('references.tips')}
            </h3>
            <ul className="text-sm text-gray-600 space-y-2">
              {editMode ? (
                <>
                  <li>• Select a reference image to edit</li>
                  <li>• Describe specific changes (e.g., "add blue glaze", "make it more textured")</li>
                  <li>• The AI will modify the selected image based on your instructions</li>
                  <li>• Use clear, specific prompts for best results</li>
                </>
              ) : (
                (t('references.tipsList', { returnObjects: true }) as string[]).map((tip: string, index: number) => (
                  <li key={index}>• {tip}</li>
                ))
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Generated Image Display */}
      {lastGeneratedImage && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {editMode ? 'Edited Image' : t('gallery.title')} - {t('common.success')}
            </h2>
            <button
              onClick={() => navigate('/gallery')}
              className="btn-secondary"
            >
              {t('gallery.title')}
            </button>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Image */}
            <div className="flex-1">
              <div className="aspect-square max-w-md mx-auto lg:mx-0 relative">
                {imageLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
                    <div className="text-center">
                      <RotateCcw className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Loading image...</p>
                    </div>
                  </div>
                )}
                <img
                  src={lastGeneratedImage.url}
                  alt={lastGeneratedImage.prompt}
                  className={`w-full h-full object-cover rounded-lg shadow-lg ${imageLoading ? 'opacity-0' : 'opacity-100'} transition-opacity`}
                  onLoad={() => setImageLoading(false)}
                  onError={(e) => {
                    console.error('Image failed to load:', e);
                    addToast('Generated image failed to display', 'error');
                    setLastGeneratedImage(null);
                    setImageLoading(false);
                  }}
                />
              </div>
            </div>

            {/* Details and Actions */}
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">
                  {editMode ? 'Edit Description' : t('generator.label')}
                </h3>
                <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                  {lastGeneratedImage.prompt}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  {t('common.success')} - {lastGeneratedImage.createdAt.toLocaleString()}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    setPrompt(lastGeneratedImage.prompt);
                    setLastGeneratedImage(null);
                  }}
                  className="btn-secondary flex-1"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  {editMode ? 'Edit Again' : t('generator.generate')} Again
                </button>
                <button
                  onClick={async () => {
                    try {
                      const response = await fetch(lastGeneratedImage.url);
                      const blob = await response.blob();
                      const url = window.URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `ceramic-${editMode ? 'edited-' : ''}${lastGeneratedImage.id}.png`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      window.URL.revokeObjectURL(url);
                      addToast(t('gallery.download'), 'success');
                    } catch (error) {
                      addToast(t('common.error'), 'error');
                    }
                  }}
                  className="btn-secondary flex-1"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {t('gallery.download')}
                </button>
                <button
                  onClick={() => navigate('/gallery')}
                  className="btn-primary flex-1"
                >
                  {t('gallery.title')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}