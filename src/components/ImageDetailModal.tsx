import React from 'react';
import { X, Calendar, Eye, EyeOff, Download, Trash2 } from 'lucide-react';
import { ReferenceImage } from '../types';

interface ImageDetailModalProps {
  image: ReferenceImage;
  isOpen: boolean;
  onClose: () => void;
  onToggleActive: (id: string) => void;
  onDownload: (url: string, filename: string) => void;
  onDelete: (id: string) => void;
}

export default function ImageDetailModal({
  image,
  isOpen,
  onClose,
  onToggleActive,
  onDownload,
  onDelete
}: ImageDetailModalProps) {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9998] p-4" onClick={handleBackdropClick}>
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Image Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 overflow-y-auto">
          {/* Image Preview */}
          <div className="relative">
            <img
              src={image.url}
              alt={image.name}
              className="w-full h-64 object-contain bg-gray-50 rounded-lg"
            />
            
            {/* Status Badge */}
            <div className="absolute top-3 left-3">
              <div className={`
                px-3 py-1 rounded-full text-sm font-medium
                ${image.name.startsWith('Generated:')
                  ? 'bg-blue-100 text-blue-800'
                  : image.isActive
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-600'
                }
              `}>
                {image.name.startsWith('Generated:') ? 'Generated Image' : (image.isActive ? 'Active Reference' : 'Reference Image')}
              </div>
            </div>
          </div>

          {/* Image Information */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <p className="text-gray-900">{image.name}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Upload Date</label>
              <div className="flex items-center space-x-2 text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>{image.uploadedAt.toLocaleDateString()} at {image.uploadedAt.toLocaleTimeString()}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <p className={`font-medium ${image.isActive ? 'text-green-600' : 'text-gray-600'}`}>
                {image.isActive ? 'Active (used in generation)' : 'Inactive'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
              <p className="text-sm text-gray-500 break-all font-mono bg-gray-50 p-2 rounded">
                {image.url}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="border-t p-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onToggleActive(image.id)}
              className={`
                inline-flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors
                ${image.isActive
                  ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
                }
              `}
            >
              {image.isActive ? (
                <>
                  <EyeOff className="w-4 h-4" />
                  <span>Deactivate</span>
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  <span>Activate</span>
                </>
              )}
            </button>

            <button
              onClick={() => onDownload(
                image.url,
                `${image.name.startsWith('Generated:') ? 'generated' : 'reference'}_${image.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.jpg`
              )}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>

            <button
              onClick={() => {
                if (confirm('Are you sure you want to delete this image?')) {
                  onDelete(image.id);
                  onClose();
                }
              }}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}