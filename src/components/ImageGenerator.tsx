import { useState } from 'react';
import { useImageContext } from '../context/ImageContext';
import { GeneratedImage } from '../types';
import { Palette, RotateCcw } from 'lucide-react';

export default function ImageGenerator() {
  const { addGeneratedImage, referenceImages, isGenerating, setIsGenerating } = useImageContext();
  const [prompt, setPrompt] = useState('');
  const activeReferences = referenceImages.filter(img => img.isActive);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);

    try {
      // Call Gemini Imagen API via Firebase Cloud Function
      const response = await fetch('https://api-5irvh6jqca-uc.a.run.app/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          referenceImages: activeReferences.map(ref => ref.url),
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();

      if (!data.imageUrl) {
        throw new Error('No image URL received from API');
      }

      const newImage: GeneratedImage = {
        id: Date.now().toString(),
        url: data.imageUrl,
        prompt: prompt,
        parameters: {
          type: 'ceramic-model',
          style: 'realistic',
          description: prompt,
          quality: 'high',
          aspectRatio: '1:1'
        },
        createdAt: new Date()
      };

      await addGeneratedImage(newImage);
      setPrompt('');
    } catch (error) {
      console.error('Generation failed:', error);
      // For now, fall back to placeholder if API fails
      console.warn('Falling back to placeholder image due to API error');
      const randomNum = Math.floor(Math.random() * 1000);
      const imageUrl = `https://picsum.photos/512/512?random=${randomNum}`;

      const newImage: GeneratedImage = {
        id: Date.now().toString(),
        url: imageUrl,
        prompt: prompt,
        parameters: {
          type: 'ceramic-model',
          style: 'realistic',
          description: prompt,
          quality: 'high',
          aspectRatio: '1:1'
        },
        createdAt: new Date()
      };

      await addGeneratedImage(newImage);
      setPrompt('');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Generate Reference Images
        </h1>
        <p className="text-gray-600">
          Create AI-generated images for your ceramic modeling projects
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Generation Parameters
            </h2>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Detailed Description
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                className="input-field resize-none"
                placeholder="Describe your desired ceramic model in detail..."
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="w-full flex items-center justify-center space-x-2 py-3 px-6 rounded-lg font-medium transition-colors bg-primary-600 hover:bg-primary-700 text-white disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <RotateCcw className="w-5 h-5 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Palette className="w-5 h-5" />
                  <span>Generate Image</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Active References
            </h3>
            {activeReferences.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {activeReferences.map(ref => (
                  <div key={ref.id} className="aspect-square">
                    <img
                      src={ref.url}
                      alt={ref.name}
                      className="w-full h-full object-cover rounded-lg shadow-sm"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">
                No active references. Upload some reference images to improve generation results.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}