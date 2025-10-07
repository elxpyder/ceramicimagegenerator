import React, { useState, useRef } from 'react';
import { useImageContext } from '../context/ImageContext';
import { Upload, Image, Trash2, Eye, EyeOff, Download, Info } from 'lucide-react';
import ImageDetailModal from './ImageDetailModal';
import ImageLightbox from './ImageLightbox';

export default function ReferenceManager() {
  const { 
    referenceImages,
    removeReferenceImage,
    toggleReferenceImage,
    uploadReferenceFile,
    isUploading
  } = useImageContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [viewMode, setViewMode] = useState<'all' | 'references' | 'generated'>('all');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files) return;

    setUploadError(null);
    
    for (const file of Array.from(files)) {
      if (file.type.startsWith('image/')) {
        try {
          console.log('Uploading file:', file.name);
          await uploadReferenceFile(file);
          console.log('File uploaded successfully');
        } catch (error) {
          console.error('Error uploading file:', error);
          setUploadError(`Failed to upload ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Modal and Lightbox handlers
  const openImageDetail = (image: any) => {
    setSelectedImage(image);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedImage(null);
  };

  const openLightbox = (imageIndex: number) => {
    console.log('openLightbox called with index:', imageIndex);
    setLightboxIndex(imageIndex);
    setIsLightboxOpen(true);
    console.log('Lightbox state should be:', { index: imageIndex, open: true });
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
  };

  const goToPrevious = () => {
    setLightboxIndex((prev) => (prev > 0 ? prev - 1 : displayImages.length - 1));
  };

  const goToNext = () => {
    setLightboxIndex((prev) => (prev < displayImages.length - 1 ? prev + 1 : 0));
  };

  const goToIndex = (index: number) => {
    setLightboxIndex(index);
  };

  // Filter images based on view mode
  const getDisplayImages = () => {
    const allImages = referenceImages.map(img => ({
      ...img,
      type: img.name.startsWith('Generated:') ? 'generated' as const : 'reference' as const
    }));

    switch (viewMode) {
      case 'references':
        return allImages.filter(img => img.type === 'reference');
      case 'generated':
        return allImages.filter(img => img.type === 'generated');
      default:
        return allImages;
    }
  };

  const displayImages = getDisplayImages();
  
  const activeReferenceCount = displayImages.filter(img => img.isActive && img.type === 'reference').length;
  const activeGeneratedCount = displayImages.filter(img => img.isActive && img.type === 'generated').length;
  const totalActiveCount = activeReferenceCount + activeGeneratedCount;
  
  const totalGenerated = displayImages.filter(img => img.type === 'generated').length;
  const totalReferences = displayImages.filter(img => img.type === 'reference').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Images & References</h1>
        <p className="text-gray-600">
          Upload reference images and manage generated images. Convert generated images to references for better AI results.
        </p>
        <div className="mt-4 flex items-center space-x-4 text-sm">
          <span className="text-gray-600">
            Total: <span className="font-medium">{displayImages.length}</span>
          </span>
          <span className="text-blue-600">
            Generated: <span className="font-medium">{totalGenerated}</span>
          </span>
          <span className="text-green-600">
            Active References: <span className="font-medium">{totalActiveCount}</span>
            <span className="text-sm text-gray-500 ml-1">({activeReferenceCount} ref + {activeGeneratedCount} gen)</span>
          </span>
        </div>
        
        {/* View Mode Selector */}
        <div className="mt-4 flex space-x-2">
          <button
            onClick={() => setViewMode('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'all'
                ? 'bg-primary-100 text-primary-700 border border-primary-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All Images ({displayImages.length})
          </button>
          <button
            onClick={() => setViewMode('references')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'references'
                ? 'bg-green-100 text-green-700 border border-green-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            References Only ({totalReferences})
          </button>
          <button
            onClick={() => setViewMode('generated')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'generated'
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Generated Only ({totalGenerated})
          </button>
        </div>
      </div>

      {/* Upload Area */}
      <div className="card">
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
            ${dragOver
              ? 'border-primary-500 bg-primary-50'
              : 'border-gray-300 hover:border-gray-400'
            }
          `}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Upload Reference Images
          </h3>
          
          {/* Upload Status */}
          {isUploading && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                <span className="text-blue-700">Uploading to Firebase Storage...</span>
              </div>
            </div>
          )}
          
          {/* Upload Error */}
          {uploadError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <span className="text-red-700">{uploadError}</span>
              <button 
                onClick={() => setUploadError(null)}
                className="ml-2 text-red-600 hover:text-red-800"
              >
                ×
              </button>
            </div>
          )}
          
          <p className="text-gray-600 mb-4">
            Drag and drop images here, or click to select files
          </p>
          <p className="text-sm text-gray-500">
            Supports JPG, PNG, GIF up to 10MB each
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => handleFileUpload(e.target.files)}
            className="hidden"
          />
        </div>
      </div>

      {/* Images Grid */}
      {displayImages.length === 0 ? (
        <div className="card text-center py-12">
          <Image className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Images
          </h3>
          <p className="text-gray-600">
            Upload reference images or generate some images to get started
          </p>
        </div>
      ) : (
        <div className="gallery-grid">
          {displayImages.map((image, index) => (
            <div key={image.id} className="image-card group relative">
              <img
                src={image.url}
                alt={image.name}
                className={`
                  w-full h-64 object-cover transition-all cursor-pointer
                  ${image.type === 'reference' && image.isActive ? 'opacity-100' : 
                    image.type === 'reference' && !image.isActive ? 'opacity-50 grayscale' :
                    'opacity-100'}
                `}
                onClick={() => {
                  console.log('Image clicked, opening lightbox at index:', index);
                  openLightbox(index);
                }}
              />

              {/* Type and Status Indicators */}
              <div className="absolute top-3 left-3 flex flex-col space-y-1">
                <div className={`
                  px-2 py-1 rounded-full text-xs font-medium
                  ${image.type === 'generated'
                    ? 'bg-blue-100 text-blue-800'
                    : image.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-600'
                  }
                `}>
                  {image.type === 'generated' ? 'Generated' : (image.isActive ? 'Active Ref' : 'Reference')}
                </div>
              </div>

              {/* Overlay Controls */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div className="absolute top-3 right-3 flex flex-col space-y-2 pointer-events-auto">
                  {/* Image Details Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openImageDetail(image);
                    }}
                    className="p-2 bg-gray-500/90 hover:bg-gray-500 rounded-lg shadow-sm transition-colors"
                    title="View Details"
                  >
                    <Info className="w-4 h-4 text-white" />
                  </button>

                  {/* Toggle activate/deactivate for all images */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleReferenceImage(image.id);
                    }}
                    className={`
                      p-2 rounded-lg shadow-sm transition-colors
                      ${image.isActive
                        ? 'bg-yellow-500/90 hover:bg-yellow-500'
                        : 'bg-green-500/90 hover:bg-green-500'
                      }
                    `}
                    title={image.isActive ? 'Deactivate' : 'Activate as Reference'}
                  >
                    {image.isActive ? (
                      <EyeOff className="w-4 h-4 text-white" />
                    ) : (
                      <Eye className="w-4 h-4 text-white" />
                    )}
                  </button>
                  
                  {/* Download */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(
                        image.url, 
                        `${image.type}_${image.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.jpg`
                      );
                    }}
                    className="p-2 bg-blue-500/90 hover:bg-blue-500 rounded-lg shadow-sm transition-colors"
                    title="Download"
                  >
                    <Download className="w-4 h-4 text-white" />
                  </button>
                  
                  {/* Delete */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeReferenceImage(image.id);
                    }}
                    className="p-2 bg-red-500/90 hover:bg-red-500 rounded-lg shadow-sm transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-white" />
                  </button>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-4 pointer-events-auto">
                  <p className="text-white font-medium text-sm line-clamp-2">
                    {image.name}
                  </p>
                  <p className="text-white/80 text-xs">
                    {image.type === 'generated' ? 'Generated' : 'Uploaded'} {image.uploadedAt.toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tips */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Tips for Better Results
        </h3>
        <ul className="text-sm text-gray-600 space-y-2">
          <li>• <strong>Upload references:</strong> High-quality images with clear details</li>
          <li>• <strong>Convert generated images:</strong> Turn good AI results into references for future generations</li>
          <li>• <strong>Mix perspectives:</strong> Include multiple angles and lighting conditions</li>
          <li>• <strong>Focus on details:</strong> Show textures, patterns, and surface features</li>
          <li>• <strong>Toggle references:</strong> Activate/deactivate to test different combinations</li>
          <li>• <strong>Iterate and improve:</strong> Build a library of references over time</li>
        </ul>
      </div>

      {/* Image Detail Modal */}
      {selectedImage && (
        <ImageDetailModal
          image={selectedImage}
          isOpen={isModalOpen}
          onClose={closeModal}
          onToggleActive={toggleReferenceImage}
          onDownload={handleDownload}
          onDelete={removeReferenceImage}
        />
      )}

      {/* Image Lightbox */}
      <ImageLightbox
        images={displayImages}
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