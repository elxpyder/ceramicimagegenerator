import React, { useState, useRef } from 'react';
import { useImageContext } from '../context/ImageContext';
import { ReferenceImage } from '../types';
import { Upload, Image, Trash2, Eye, EyeOff } from 'lucide-react';

export default function ReferenceManager() {
  const { referenceImages, addReferenceImage, removeReferenceImage, toggleReferenceImage } = useImageContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;

    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            const newImage: ReferenceImage = {
              id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
              url: e.target.result as string,
              name: file.name,
              isActive: true,
              uploadedAt: new Date()
            };
            addReferenceImage(newImage);
          }
        };
        reader.readAsDataURL(file);
      }
    });
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

  const activeCount = referenceImages.filter(img => img.isActive).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Reference Images</h1>
        <p className="text-gray-600">
          Upload and manage reference images to improve AI generation results
        </p>
        <div className="mt-4 flex items-center space-x-4 text-sm">
          <span className="text-gray-600">
            Total: <span className="font-medium">{referenceImages.length}</span>
          </span>
          <span className="text-green-600">
            Active: <span className="font-medium">{activeCount}</span>
          </span>
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

      {/* Reference Images Grid */}
      {referenceImages.length === 0 ? (
        <div className="card text-center py-12">
          <Image className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Reference Images
          </h3>
          <p className="text-gray-600">
            Upload some reference images to get started
          </p>
        </div>
      ) : (
        <div className="gallery-grid">
          {referenceImages.map((image) => (
            <div key={image.id} className="image-card group relative">
              <img
                src={image.url}
                alt={image.name}
                className={`
                  w-full h-64 object-cover transition-all
                  ${image.isActive ? 'opacity-100' : 'opacity-50 grayscale'}
                `}
              />

              {/* Status Indicator */}
              <div className={`
                absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-medium
                ${image.isActive
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-600'
                }
              `}>
                {image.isActive ? 'Active' : 'Inactive'}
              </div>

              {/* Overlay Controls */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute top-3 right-3 flex space-x-2">
                  <button
                    onClick={() => toggleReferenceImage(image.id)}
                    className={`
                      p-2 rounded-lg shadow-sm transition-colors
                      ${image.isActive
                        ? 'bg-yellow-500/90 hover:bg-yellow-500'
                        : 'bg-green-500/90 hover:bg-green-500'
                      }
                    `}
                    title={image.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {image.isActive ? (
                      <EyeOff className="w-4 h-4 text-white" />
                    ) : (
                      <Eye className="w-4 h-4 text-white" />
                    )}
                  </button>
                  <button
                    onClick={() => removeReferenceImage(image.id)}
                    className="p-2 bg-red-500/90 hover:bg-red-500 rounded-lg shadow-sm transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-white" />
                  </button>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="text-white font-medium text-sm truncate">
                    {image.name}
                  </p>
                  <p className="text-white/80 text-xs">
                    Uploaded {image.uploadedAt.toLocaleDateString()}
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
          Reference Image Tips
        </h3>
        <ul className="text-sm text-gray-600 space-y-2">
          <li>• Upload high-quality images with clear details</li>
          <li>• Include multiple angles and perspectives</li>
          <li>• Show different lighting conditions</li>
          <li>• Focus on textures, patterns, and surface details</li>
          <li>• Use images that match your desired ceramic style</li>
          <li>• Toggle images active/inactive to test different combinations</li>
        </ul>
      </div>
    </div>
  );
}