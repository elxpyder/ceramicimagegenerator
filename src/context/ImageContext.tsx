import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { GeneratedImage, ReferenceImage } from '../types';

interface ImageContextType {
  generatedImages: GeneratedImage[];
  referenceImages: ReferenceImage[];
  isGenerating: boolean;
  addGeneratedImage: (image: GeneratedImage) => void;
  removeGeneratedImage: (id: string) => void;
  addReferenceImage: (image: ReferenceImage) => void;
  removeReferenceImage: (id: string) => void;
  toggleReferenceImage: (id: string) => void;
  setIsGenerating: (generating: boolean) => void;
  storageWarning?: string;
}

const ImageContext = createContext<ImageContextType | undefined>(undefined);

export function useImageContext() {
  const context = useContext(ImageContext);
  if (!context) {
    throw new Error('useImageContext must be used within an ImageContextProvider');
  }
  return context;
}

interface ImageContextProviderProps {
  children: ReactNode;
}

export function ImageContextProvider({ children }: ImageContextProviderProps) {
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Load images from localStorage on mount
  useEffect(() => {
    const savedGenerated = localStorage.getItem('generatedImages');
    const savedReferences = localStorage.getItem('referenceImages');
    
    if (savedGenerated) {
      try {
        const parsed = JSON.parse(savedGenerated);
        setGeneratedImages(parsed.map((img: any) => ({
          ...img,
          createdAt: new Date(img.createdAt)
        })));
      } catch (error) {
        console.error('Error loading generated images:', error);
      }
    }
    
    if (savedReferences) {
      try {
        const parsed = JSON.parse(savedReferences);
        setReferenceImages(parsed.map((img: any) => ({
          ...img,
          uploadedAt: new Date(img.uploadedAt)
        })));
      } catch (error) {
        console.error('Error loading reference images:', error);
      }
    }
  }, []);

  // Save to localStorage when images change
  useEffect(() => {
    try {
      // Keep only the most recent 20 images to prevent storage quota issues
      const imagesToSave = generatedImages.slice(0, 20);
      localStorage.setItem('generatedImages', JSON.stringify(imagesToSave));
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.warn('localStorage quota exceeded, clearing old images');
        try {
          // Clear all images and keep only the most recent 5
          const recentImages = generatedImages.slice(0, 5);
          localStorage.setItem('generatedImages', JSON.stringify(recentImages));
          setGeneratedImages(recentImages);
        } catch (e) {
          console.error('Failed to save even minimal images:', e);
          // Last resort: clear all generated images
          localStorage.removeItem('generatedImages');
          setGeneratedImages([]);
        }
      } else {
        console.error('Error saving generated images:', error);
      }
    }
  }, [generatedImages]);

  useEffect(() => {
    try {
      localStorage.setItem('referenceImages', JSON.stringify(referenceImages));
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.warn('localStorage quota exceeded for reference images');
        // Keep only active reference images if storage is full
        const activeRefs = referenceImages.filter(img => img.isActive);
        try {
          localStorage.setItem('referenceImages', JSON.stringify(activeRefs));
          setReferenceImages(activeRefs);
        } catch (e) {
          console.error('Failed to save reference images:', e);
          localStorage.removeItem('referenceImages');
          setReferenceImages([]);
        }
      } else {
        console.error('Error saving reference images:', error);
      }
    }
  }, [referenceImages]);

  const addGeneratedImage = (image: GeneratedImage) => {
    setGeneratedImages(prev => {
      const newImages = [image, ...prev];
      // Warn user if we have many images (approaching limit)
      if (newImages.length >= 15) {
        console.warn(`You have ${newImages.length} generated images. Old images will be automatically cleared when storage is full.`);
      }
      return newImages;
    });
  };

  const removeGeneratedImage = (id: string) => {
    setGeneratedImages(prev => prev.filter(img => img.id !== id));
  };

  const addReferenceImage = (image: ReferenceImage) => {
    setReferenceImages(prev => [image, ...prev]);
  };

  const removeReferenceImage = (id: string) => {
    setReferenceImages(prev => prev.filter(img => img.id !== id));
  };

  const toggleReferenceImage = (id: string) => {
    setReferenceImages(prev =>
      prev.map(img =>
        img.id === id ? { ...img, isActive: !img.isActive } : img
      )
    );
  };

  const value: ImageContextType = {
    generatedImages,
    referenceImages,
    isGenerating,
    addGeneratedImage,
    removeGeneratedImage,
    addReferenceImage,
    removeReferenceImage,
    toggleReferenceImage,
    setIsGenerating,
  };

  return (
    <ImageContext.Provider value={value}>
      {children}
    </ImageContext.Provider>
  );
}