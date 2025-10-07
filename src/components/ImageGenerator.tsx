import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useImageContext } from '../context/ImageContext';
import { useNotification } from '../context/NotificationContext';
import { GeneratedImage } from '../types';
import { RotateCcw, Download, Edit, Plus, EyeOff } from 'lucide-react';
import { useEffect } from 'react';
import ImageLightbox from './ImageLightbox';

export default function ImageGenerator() {
  const { t } = useTranslation();
  const { addGeneratedImage, referenceImages, isGenerating, setIsGenerating, convertImageToBase64, toggleReferenceImage } = useImageContext();
  const { addToast } = useNotification();
  const navigate = useNavigate();

  const [prompt, setPrompt] = useState('');
  const [actionPrompt, setActionPrompt] = useState('');
  const [objectDescription, setObjectDescription] = useState('');
  const [shotDescription, setShotDescription] = useState('');
  const [lastGeneratedImage, setLastGeneratedImage] = useState<GeneratedImage | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [mode, setMode] = useState<'generate' | 'edit' | 'shot'>('generate');
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const allActiveReferences = referenceImages.filter(img => img.isActive);

  // Set default action prompt based on mode
  useEffect(() => {
    if (mode === 'edit') {
      setActionPrompt(t('generator.actionPrompt.editDefault'));
    } else if (mode === 'shot') {
      setActionPrompt(t('generator.actionPrompt.shotDefault'));
    } else {
      setActionPrompt(t('generator.actionPrompt.generateDefault'));
    }
  }, [mode, t]);

  // Lightbox handlers
  const openLightbox = (imageIndex: number) => {
    setLightboxIndex(imageIndex);
    setIsLightboxOpen(true);
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
  };

  const goToPrevious = () => {
    // Since we only have one image, just stay at index 0
    setLightboxIndex(0);
  };

  const goToNext = () => {
    // Since we only have one image, just stay at index 0
    setLightboxIndex(0);
  };

  const goToIndex = (index: number) => {
    setLightboxIndex(index);
  };

  const handleGenerate = async () => {
    // Build the final prompt by combining action prompt, object description/shot description, and main prompt
    const finalPrompt = [
      actionPrompt.trim(),
      mode === 'shot' ? shotDescription.trim() : objectDescription.trim(),
      prompt.trim()
    ].filter(Boolean).join('. ');

    if (!finalPrompt || isGenerating) return;

    // Validate mode requirements
    if (mode === 'edit' && allActiveReferences.length === 0) {
      addToast('Edit mode requires at least one active reference image', 'error');
      return;
    }

    if (mode === 'shot' && allActiveReferences.length === 0) {
      addToast('New Shot mode requires at least one active reference image', 'error');
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
          prompt: finalPrompt,
          referenceImages: referenceImages, // Now base64 strings
          editMode: mode === 'edit'
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
        prompt: finalPrompt,
        parameters: {
          type: 'custom',
          style: mode === 'edit' ? 'edited' : mode === 'shot' ? 'reshot' : 'realistic',
          description: mode === 'edit' ? 'Image edit' : mode === 'shot' ? 'New shot' : 'Generated',
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
      addToast(mode === 'edit' ? 'Image edited successfully!' : mode === 'shot' ? 'New shot generated successfully!' : t('common.success'), 'success');

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

            {/* Mode Toggle */}
            <div className="mb-6">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setMode('generate')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    mode === 'generate'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {t('generator.modes.generateNew')}
                </button>
                <button
                  onClick={() => setMode('edit')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    mode === 'edit'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  disabled={allActiveReferences.length === 0}
                >
                  <Edit className="w-4 h-4 mr-2 inline" />
                  {t('generator.modes.editImage')}
                </button>
                <button
                  onClick={() => setMode('shot')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    mode === 'shot'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  disabled={allActiveReferences.length === 0}
                >
                  <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  {t('generator.modes.newShot')}
                </button>
              </div>
              {(mode === 'edit' || mode === 'shot') && allActiveReferences.length === 0 && (
                <p className="text-sm text-amber-600 mt-2">
                  ⚠️ {mode === 'edit' ? 'Edit mode' : 'New Shot mode'} requires at least one active reference image
                </p>
              )}
            </div>

            {/* Action Prompt */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('generator.actionPrompt.label')}
              </label>
              <textarea
                value={actionPrompt}
                onChange={(e) => setActionPrompt(e.target.value)}
                rows={3}
                className="input-field resize-none"
              />
            </div>

            {/* Object Description */}
            {mode !== 'shot' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('generator.objectDescription.label')}
                </label>
                <input
                  type="text"
                  value={objectDescription}
                  onChange={(e) => setObjectDescription(e.target.value)}
                  className="input-field"
                  placeholder={t('generator.objectDescription.placeholder')}
                />
              </div>
            )}

            {/* Shot Description */}
            {mode === 'shot' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('generator.shotDescription.label')}
                </label>
                <input
                  type="text"
                  value={shotDescription}
                  onChange={(e) => setShotDescription(e.target.value)}
                  className="input-field"
                  placeholder={t('generator.shotDescription.placeholder')}
                />
              </div>
            )}

            {/* Main Prompt */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {mode === 'edit' ? 'Describe your edits' : mode === 'shot' ? 'Additional shot details (optional)' : t('generator.label')}
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                className="input-field resize-none"
                placeholder={
                  mode === 'edit'
                    ? 'Describe how you want to modify the reference image (e.g., "make it more textured", "add blue glaze", "make it larger")...'
                    : mode === 'shot'
                    ? 'Any additional details about the shot (optional)...'
                    : t('generator.placeholder')
                }
              />
              {allActiveReferences.length > 0 && (
                <p className="text-xs text-blue-600 mt-2">
                  {mode === 'edit'
                    ? `🎨 Editing based on ${allActiveReferences.length} reference image${allActiveReferences.length > 1 ? 's' : ''}`
                    : mode === 'shot'
                    ? `📷 Creating new shot based on ${allActiveReferences.length} reference image${allActiveReferences.length > 1 ? 's' : ''}`
                    : t('generator.referenceHint', { count: allActiveReferences.length })
                  }
                </p>
              )}
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating || (!actionPrompt.trim() && !objectDescription.trim() && !shotDescription.trim() && !prompt.trim()) || ((mode === 'edit' || mode === 'shot') && allActiveReferences.length === 0)}
              className={`
                w-full flex items-center justify-center space-x-2 py-3 px-6 rounded-lg font-medium transition-colors
                ${isGenerating || (!actionPrompt.trim() && !objectDescription.trim() && !shotDescription.trim() && !prompt.trim()) || ((mode === 'edit' || mode === 'shot') && allActiveReferences.length === 0)
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-primary-600 hover:bg-primary-700 text-white'
                }
              `}
            >
              {isGenerating ? (
                <>
                  <RotateCcw className="w-5 h-5 animate-spin" />
                  <span>{mode === 'edit' ? 'Editing...' : mode === 'shot' ? 'Creating Shot...' : t('generator.generating')}</span>
                </>
              ) : (
                <>
                  {mode === 'edit' ? (
                    <Edit className="w-5 h-5" />
                  ) : mode === 'shot' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                      <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                      <circle cx="13.5" cy="6.5" r=".5"></circle>
                      <circle cx="17.5" cy="10.5" r=".5"></circle>
                      <circle cx="8.5" cy="7.5" r=".5"></circle>
                      <circle cx="6.5" cy="12.5" r=".5"></circle>
                      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"></path>
                    </svg>
                  )}
                  <span>{mode === 'edit' ? 'Edit Image' : mode === 'shot' ? 'Create New Shot' : t('generator.generate')}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Active References Sidebar */}
        <div className="space-y-6">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {t('references.active')}
              </h3>
              <button
                onClick={() => navigate('/references')}
                className="inline-flex items-center space-x-1 text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>
            </div>
            {allActiveReferences.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {allActiveReferences.map(ref => (
                  <div key={ref.id} className="aspect-square relative group">
                    <img
                      src={ref.url}
                      alt={ref.name}
                      className="w-full h-full object-cover rounded-lg shadow-sm"
                    />
                    {mode === 'edit' && (
                      <div className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                        Edit
                      </div>
                    )}
                    {mode === 'shot' && (
                      <div className="absolute top-1 left-1 bg-green-500 text-white text-xs px-2 py-1 rounded">
                        Shot
                      </div>
                    )}
                    {/* Deactivate button */}
                    <button
                      onClick={() => toggleReferenceImage(ref.id)}
                      className="absolute top-1 right-1 p-1 bg-red-500/90 hover:bg-red-500 rounded-md shadow-sm transition-colors opacity-0 group-hover:opacity-100"
                      title="Deactivate"
                    >
                      <EyeOff className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm mb-3">
                  {t('references.noActive')}
                </p>
                <button
                  onClick={() => navigate('/references')}
                  className="inline-flex items-center space-x-2 text-sm bg-primary-600 hover:bg-primary-700 text-white px-3 py-2 rounded-lg font-medium transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add References</span>
                </button>
              </div>
            )}
          </div>

          {/* Generation Tips */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {mode === 'edit' ? 'Editing Tips' : mode === 'shot' ? 'New Shot Tips' : t('references.tips')}
            </h3>
            <ul className="text-sm text-gray-600 space-y-2">
              {mode === 'edit' ? (
                <>
                  <li>• Select a reference image to edit</li>
                  <li>• Describe specific changes (e.g., "make it more textured", "add blue glaze", "make it larger")</li>
                  <li>• The AI will modify the selected image based on your instructions</li>
                  <li>• Use clear, specific prompts for best results</li>
                </>
              ) : mode === 'shot' ? (
                <>
                  <li>• Select a reference image to create a new shot from</li>
                  <li>• Describe the desired camera angle and framing</li>
                  <li>• The AI will maintain all scene elements while changing perspective</li>
                  <li>• Focus on angle, distance, and composition details</li>
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
              {mode === 'edit' ? 'Edited Image' : mode === 'shot' ? 'New Shot' : t('gallery.title')} - {t('common.success')}
            </h2>
            <button
              onClick={() => navigate('/references')}
              className="btn-secondary"
            >
              {t('references.title')}
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
                  className={`w-full h-full object-cover rounded-lg shadow-lg cursor-pointer ${imageLoading ? 'opacity-0' : 'opacity-100'} transition-opacity`}
                  onLoad={() => setImageLoading(false)}
                  onClick={() => openLightbox(0)}
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
                  {mode === 'edit' ? 'Edit Description' : mode === 'shot' ? 'Shot Description' : t('generator.label')}
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
                  {mode === 'edit' ? 'Edit Again' : mode === 'shot' ? 'Create Another Shot' : t('generator.generate')} Again
                </button>
                <button
                  onClick={async () => {
                    try {
                      const response = await fetch(lastGeneratedImage.url);
                      const blob = await response.blob();
                      const url = window.URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `ceramic-${mode === 'edit' ? 'edited-' : mode === 'shot' ? 'shot-' : ''}${lastGeneratedImage.id}.png`;
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
                  onClick={() => navigate('/references')}
                  className="btn-primary flex-1"
                >
                  {t('references.title')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Lightbox */}
      {lastGeneratedImage && (
        <ImageLightbox
          images={[{
            id: lastGeneratedImage.id,
            url: lastGeneratedImage.url,
            name: lastGeneratedImage.prompt.length > 50
              ? lastGeneratedImage.prompt.substring(0, 50) + '...'
              : lastGeneratedImage.prompt,
            isActive: lastGeneratedImage.isActive,
            uploadedAt: lastGeneratedImage.createdAt
          }]}
          currentIndex={lightboxIndex}
          isOpen={isLightboxOpen}
          onClose={closeLightbox}
          onPrevious={goToPrevious}
          onNext={goToNext}
          onGoToIndex={goToIndex}
        />
      )}
    </div>
  );
}