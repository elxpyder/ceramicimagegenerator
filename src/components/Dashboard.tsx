
import { useImageContext } from '../context/ImageContext';
import { Palette } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import ImageLightbox from './ImageLightbox';

export default function Dashboard() {
  const { 
    referenceImages, 
    generatedImages,
    isLoading
  } = useImageContext();
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const totalImages = referenceImages.length;
  
  const activeReferences = referenceImages.filter(img => img.isActive);
  const recentImages = referenceImages
    .sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime())
    .slice(0, 4);

  const openLightbox = (imageIndex: number) => {
    setLightboxIndex(imageIndex);
    setIsLightboxOpen(true);
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
  };

  const goToPrevious = () => {
    setLightboxIndex((prev) => (prev > 0 ? prev - 1 : recentImages.length - 1));
  };

  const goToNext = () => {
    setLightboxIndex((prev) => (prev < recentImages.length - 1 ? prev + 1 : 0));
  };

  const goToIndex = (index: number) => {
    setLightboxIndex(index);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your images from cloud storage...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="text-center py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Ceramic Model Generator
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Create AI-generated reference images for your ceramic modeling projects
        </p>
        <Link
          to="/generate"
          className="inline-flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
        >
          <Palette className="w-5 h-5" />
          <span>Start Generating</span>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Collection</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-primary-600">{totalImages}</p>
            <p className="text-sm text-gray-600">Reference Images</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{activeReferences.length}</p>
            <p className="text-sm text-gray-600">Active References</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{generatedImages.length}</p>
            <p className="text-sm text-gray-600">Generated Images</p>
          </div>
        </div>
      </div>

      {/* Recent Images */}
      {recentImages.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Recent Generations
            </h2>
            <Link
              to="/gallery"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              View All
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentImages.map((image, index) => (
              <div key={image.id} className="image-card group relative">
                <img
                  src={image.url}
                  alt={image.name}
                  className="w-full h-48 object-cover cursor-pointer"
                  onClick={() => openLightbox(index)}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="absolute bottom-0 left-0 right-0 p-4 pointer-events-auto">
                    <p className="text-white text-sm font-medium truncate">
                      {image.name}
                    </p>
                    <p className="text-white/80 text-xs">
                      {image.uploadedAt.toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active References */}
      {activeReferences.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Active References
            </h2>
            <Link
              to="/references"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Manage
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
            {activeReferences.map((image) => (
              <div key={image.id} className="aspect-square">
                <img
                  src={image.url}
                  alt={image.name}
                  className="w-full h-full object-cover rounded-lg shadow-sm"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Getting Started */}
      {totalImages === 0 && (
        <div className="card text-center">
          <div className="py-8">
            <Palette className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Get Started with Image Generation
            </h3>
            <p className="text-gray-600 mb-6">
              Upload reference images and start generating custom ceramic model designs
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/references"
                className="btn-secondary"
              >
                Upload References
              </Link>
              <Link
                to="/generate"
                className="btn-primary"
              >
                Generate Images
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Image Lightbox */}
      <ImageLightbox
        images={recentImages}
        currentIndex={lightboxIndex}
        isOpen={isLightboxOpen}
        onClose={closeLightbox}
        onPrevious={goToPrevious}
        onNext={goToNext}
        onGoToIndex={goToIndex}
      />
    </div>
  );
}