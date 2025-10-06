import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useImageContext } from '../context/ImageContext';
import { Download, Eye, Trash2, Grid, List, Search, Filter } from 'lucide-react';

export default function Gallery() {
  const { t } = useTranslation();
  const { generatedImages, removeGeneratedImage } = useImageContext();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'prompt'>('newest');

  const filteredImages = generatedImages
    .filter(img => 
      img.prompt.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return b.createdAt.getTime() - a.createdAt.getTime();
        case 'oldest':
          return a.createdAt.getTime() - b.createdAt.getTime();
        case 'prompt':
          return a.prompt.localeCompare(b.prompt);
        default:
          return 0;
      }
    });

  const handleDownload = async (imageUrl: string, filename: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('gallery.title')}</h1>
          <p className="text-gray-600">
            {t('gallery.imagesCount', { filtered: filteredImages.length, total: generatedImages.length })}
          </p>
        </div>

        <div className="flex items-center space-x-4">
          {/* View Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`
                p-2 rounded-md transition-colors
                ${viewMode === 'grid'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
                }
              `}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`
                p-2 rounded-md transition-colors
                ${viewMode === 'list'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
                }
              `}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder={t('gallery.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>

          {/* Sort */}
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'prompt')}
              className="input-field min-w-0"
            >
              <option value="newest">{t('gallery.newest')}</option>
              <option value="oldest">{t('gallery.oldest')}</option>
              <option value="prompt">{t('gallery.byPrompt')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Gallery */}
      {filteredImages.length === 0 ? (
        <div className="card text-center py-12">
          <Eye className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {generatedImages.length === 0 ? t('gallery.noImages') : t('gallery.noImagesFound')}
          </h3>
          <p className="text-gray-600">
            {generatedImages.length === 0
              ? t('gallery.noImagesDesc')
              : t('gallery.noImagesFoundDesc')
            }
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="gallery-grid">
          {filteredImages.map((image) => (
            <div key={image.id} className="image-card group">
              <img
                src={image.url}
                alt={image.prompt}
                className="w-full h-64 object-cover"
              />
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute top-4 right-4 flex space-x-2">
                  <button
                    onClick={() => handleDownload(image.url, `ceramic-${image.id}.jpg`)}
                    className="p-2 bg-white/90 hover:bg-white rounded-lg shadow-sm transition-colors"
                    title={t('gallery.download')}
                  >
                    <Download className="w-4 h-4 text-gray-700" />
                  </button>
                  <button
                    onClick={() => removeGeneratedImage(image.id)}
                    className="p-2 bg-red-500/90 hover:bg-red-500 rounded-lg shadow-sm transition-colors"
                    title={t('gallery.delete')}
                  >
                    <Trash2 className="w-4 h-4 text-white" />
                  </button>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="text-white font-medium text-sm mb-1 line-clamp-2">
                    {image.prompt}
                  </p>
                  <div className="flex items-center justify-end text-white/80 text-xs">
                    <span>{image.createdAt.toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredImages.map((image) => (
            <div key={image.id} className="card">
              <div className="flex flex-col sm:flex-row gap-4">
                <img
                  src={image.url}
                  alt={image.prompt}
                  className="w-full sm:w-32 h-32 object-cover rounded-lg flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">
                    {image.prompt}
                  </h3>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {image.createdAt.toLocaleDateString()} at {image.createdAt.toLocaleTimeString()}
                    </span>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleDownload(image.url, `ceramic-${image.id}.jpg`)}
                        className="btn-secondary py-1 px-3 text-sm"
                      >
                        <Download className="w-3 h-3 mr-1" />
                        {t('gallery.download')}
                      </button>
                      <button
                        onClick={() => removeGeneratedImage(image.id)}
                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                      >
                        {t('gallery.delete')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}