import React, { useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { ReferenceImage } from '../types';

interface ImageLightboxProps {
  images: ReferenceImage[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onGoToIndex: (index: number) => void;
}

export default function ImageLightbox({
  images,
  currentIndex,
  isOpen,
  onClose,
  onPrevious,
  onNext,
  onGoToIndex
}: ImageLightboxProps) {
  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          onPrevious();
          break;
        case 'ArrowRight':
          onNext();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    
    // Prevent body scroll when lightbox is open
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, onPrevious, onNext]);

  if (!isOpen || images.length === 0) {
    console.log('Lightbox not opening:', { isOpen, imagesLength: images.length });
    return null;
  }

  console.log('Lightbox should be visible:', { isOpen, currentIndex, imagesLength: images.length });

  const currentImage = images[currentIndex];
  if (!currentImage) {
    console.log('No current image at index:', currentIndex);
    return null;
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[9999]" onClick={handleBackdropClick}>
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 text-white hover:text-gray-300 transition-colors z-10"
        title="Close (Esc)"
      >
        <X className="w-8 h-8" />
      </button>

      {/* Previous Button */}
      {images.length > 1 && (
        <button
          onClick={onPrevious}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 text-white hover:text-gray-300 transition-colors z-10"
          title="Previous (←)"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
      )}

      {/* Next Button */}
      {images.length > 1 && (
        <button
          onClick={onNext}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 text-white hover:text-gray-300 transition-colors z-10"
          title="Next (→)"
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      )}

      {/* Main Image */}
      <div className="max-w-[90vw] max-h-[90vh] flex flex-col items-center">
        <img
          src={currentImage.url}
          alt={currentImage.name}
          className="max-w-full max-h-[80vh] object-contain"
          onClick={(e) => e.stopPropagation()}
        />

        {/* Image Info */}
        <div className="mt-4 text-center text-white px-4">
          <h3 className="text-lg font-medium mb-2">{currentImage.name}</h3>
          <div className="flex items-center justify-center space-x-4 text-sm text-gray-300">
            <span>{currentIndex + 1} of {images.length}</span>
            <span>•</span>
            <span>{currentImage.uploadedAt.toLocaleDateString()}</span>
            <span>•</span>
            <span className={currentImage.isActive ? 'text-green-400' : 'text-gray-400'}>
              {currentImage.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>

      {/* Thumbnail Navigation */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 max-w-[90vw] overflow-x-auto">
          {images.map((image, index) => (
            <button
              key={image.id}
              onClick={() => onGoToIndex(index)}
              className={`
                flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all
                ${index === currentIndex 
                  ? 'border-white' 
                  : 'border-transparent hover:border-gray-400'
                }
              `}
            >
              <img
                src={image.url}
                alt={image.name}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}