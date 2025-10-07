import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { GeneratedImage, ReferenceImage } from '../types';
import { useFirebase } from './FirebaseContext';
import { StorageService } from '../services/storageService';
import { urlToBase64, isBase64DataUrl, extractBase64FromDataUrl } from '../utils/imageUtils';

interface ImageContextType {
  referenceImages: ReferenceImage[];
  isGenerating: boolean;
  addGeneratedImage: (image: GeneratedImage) => Promise<void>;
  removeReferenceImage: (id: string) => Promise<void>;
  addReferenceImage: (image: ReferenceImage) => Promise<void>;
  uploadReferenceFile: (file: File, name?: string) => Promise<void>;
  convertImageToBase64: (imageUrl: string) => Promise<string>;
  toggleReferenceImage: (id: string) => void;
  setIsGenerating: (generating: boolean) => void;
  storageWarning?: string;
  isUploading: boolean;
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
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [storageService, setStorageService] = useState<StorageService | null>(null);
  const firebase = useFirebase();

  // Initialize Firebase Storage service
  useEffect(() => {
    if (firebase?.storage) {
      setStorageService(new StorageService(firebase.storage));
    }
  }, [firebase]);

  // Load images from localStorage on mount
  useEffect(() => {
    // Clean up old localStorage keys
    localStorage.removeItem('generatedImages');
    
    const savedReferences = localStorage.getItem('referenceImages');
    
    if (savedReferences) {
      try {
        const parsed = JSON.parse(savedReferences);
        setReferenceImages(parsed.map((img: any) => ({
          ...img,
          uploadedAt: typeof img.uploadedAt === 'string' ? new Date(img.uploadedAt) : new Date(img.uploadedAt)
        })));
      } catch (error) {
        console.error('Error loading reference images:', error);
        // Clear corrupted data
        localStorage.removeItem('referenceImages');
      }
    }
  }, []);

  // Save to localStorage when images change (simplified for cloud storage)
  useEffect(() => {
    console.log('=== SAVE TO LOCALSTORAGE ===');
    console.log('Saving image metadata only (URLs point to Firebase Storage)');
    
    try {
      // Store only metadata - images are in Firebase Storage
      const imageMetadata = referenceImages.map(img => ({
        id: img.id,
        url: img.url, // Firebase Storage URL
        name: img.name,
        isActive: img.isActive,
        uploadedAt: img.uploadedAt.toISOString()
      }));
      
      localStorage.setItem('referenceImages', JSON.stringify(imageMetadata));
      console.log('Successfully saved image metadata to localStorage');
    } catch (error) {
      console.error('Error saving image metadata:', error);
      // With Firebase Storage, this should be much less likely to fail
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.warn('localStorage quota exceeded - clearing old data');
        localStorage.removeItem('referenceImages');
        // Try again with current data only
        try {
          const limitedMetadata = referenceImages.slice(0, 10).map(img => ({
            id: img.id,
            url: img.url,
            name: img.name,
            isActive: img.isActive,
            uploadedAt: img.uploadedAt.toISOString()
          }));
          localStorage.setItem('referenceImages', JSON.stringify(limitedMetadata));
        } catch (e) {
          console.error('Failed to save even limited metadata:', e);
        }
      }
    }
    console.log('=== END SAVE TO LOCALSTORAGE ===');
  }, [referenceImages]);

  const addGeneratedImage = async (image: GeneratedImage) => {
    console.log('=== ADD GENERATED IMAGE ===');
    console.log('Input image:', image);
    console.log('Current state BEFORE adding:');
    console.log('- Total images:', referenceImages.length);
    console.log('- Uploaded refs:', referenceImages.filter(img => !img.name.startsWith('Generated:')).length);
    console.log('- Generated refs:', referenceImages.filter(img => img.name.startsWith('Generated:')).length);
    
    try {
      setIsUploading(true);
      
      // Upload generated image to Firebase Storage
      let cloudUrl = image.url;
      if (storageService && !storageService.isFirebaseStorageUrl(image.url)) {
        console.log('Uploading generated image to Firebase Storage');
        cloudUrl = await storageService.uploadGeneratedImage(image.url, image.prompt);
        console.log('Generated image uploaded to cloud:', cloudUrl);
      }
      
      // Store generated images as reference images directly
      const referenceImage: ReferenceImage = {
        id: image.id,
        url: cloudUrl,
        name: `Generated: ${image.prompt.substring(0, 50)}${image.prompt.length > 50 ? '...' : ''}`,
        isActive: image.isActive,
        uploadedAt: image.createdAt
      };
      
      console.log('New reference image to add:', referenceImage);
      
      setReferenceImages(prev => {
        const newImages = [referenceImage, ...prev];
        console.log('State AFTER adding:');
        console.log('- Total images:', newImages.length);
        console.log('- Uploaded refs:', newImages.filter(img => !img.name.startsWith('Generated:')).length);
        console.log('- Generated refs:', newImages.filter(img => img.name.startsWith('Generated:')).length);
        
        console.log('=== END ADD GENERATED IMAGE ===');
        return newImages;
      });
    } catch (error) {
      console.error('Error adding generated image:', error);
      // Fallback to local storage
      const referenceImage: ReferenceImage = {
        id: image.id,
        url: image.url,
        name: `Generated: ${image.prompt.substring(0, 50)}${image.prompt.length > 50 ? '...' : ''}`,
        isActive: image.isActive,
        uploadedAt: image.createdAt
      };
      setReferenceImages(prev => [referenceImage, ...prev]);
    } finally {
      setIsUploading(false);
    }
  };

  const uploadReferenceFile = async (file: File, name?: string) => {
    console.log('=== UPLOAD REFERENCE FILE ===');
    console.log('Uploading file:', file.name);
    
    try {
      setIsUploading(true);
      
      if (!storageService) {
        throw new Error('Storage service not initialized');
      }
      
      // Upload file to Firebase Storage
      const cloudUrl = await storageService.uploadImage(file, 'references');
      console.log('File uploaded to cloud:', cloudUrl);
      
      // Create reference image
      const referenceImage: ReferenceImage = {
        id: crypto.randomUUID(),
        url: cloudUrl,
        name: name || file.name.replace(/\.[^/.]+$/, ''), // Remove extension
        isActive: false,
        uploadedAt: new Date()
      };
      
      console.log('Adding reference image:', referenceImage);
      setReferenceImages(prev => [referenceImage, ...prev]);
      console.log('=== END UPLOAD REFERENCE FILE ===');
    } catch (error) {
      console.error('Error uploading reference file:', error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const addReferenceImage = async (image: ReferenceImage) => {
    setReferenceImages(prev => [image, ...prev]);
  };

  const removeReferenceImage = async (id: string) => {
    console.log('=== REMOVE REFERENCE IMAGE ===');
    console.log('Removing image ID:', id);
    
    const imageToRemove = referenceImages.find(img => img.id === id);
    if (imageToRemove && storageService && storageService.isFirebaseStorageUrl(imageToRemove.url)) {
      try {
        console.log('Deleting image from Firebase Storage:', imageToRemove.url);
        await storageService.deleteImage(imageToRemove.url);
        console.log('Image deleted from cloud storage');
      } catch (error) {
        console.error('Error deleting from cloud storage:', error);
        // Continue with local removal even if cloud deletion fails
      }
    }
    
    setReferenceImages(prev => prev.filter(img => img.id !== id));
    console.log('=== END REMOVE REFERENCE IMAGE ===');
  };

  const convertImageToBase64 = async (imageUrl: string): Promise<string> => {
    console.log('=== CONVERT IMAGE TO BASE64 ===');
    console.log('Converting image URL:', imageUrl);
    
    try {
      if (isBase64DataUrl(imageUrl)) {
        console.log('Extracting base64 from data URL');
        const result = extractBase64FromDataUrl(imageUrl);
        console.log('=== END CONVERT IMAGE TO BASE64 ===');
        return result;
      } else {
        console.log('Using urlToBase64 utility function');
        const result = await urlToBase64(imageUrl);
        console.log('=== END CONVERT IMAGE TO BASE64 ===');
        return result;
      }
    } catch (error) {
      console.error('Error converting image to base64:', error);
      console.log('=== END CONVERT IMAGE TO BASE64 ===');
      throw error;
    }
  };

  const toggleReferenceImage = (id: string) => {
    console.log('=== TOGGLE REFERENCE IMAGE ===');
    console.log('Toggling image ID:', id);
    console.log('Current state BEFORE toggle:', referenceImages.map(img => ({
      id: img.id,
      name: img.name,
      isActive: img.isActive,
      type: img.name.startsWith('Generated:') ? 'generated' : 'uploaded'
    })));
    
    setReferenceImages(prev =>
      prev.map(img => {
        if (img.id === id) {
          console.log(`Toggling ${img.name} from ${img.isActive} to ${!img.isActive}`);
          return { ...img, isActive: !img.isActive };
        }
        return img;
      })
    );
    console.log('=== END TOGGLE REFERENCE IMAGE ===');
  };

  const value: ImageContextType = {
    referenceImages,
    isGenerating,
    addGeneratedImage,
    addReferenceImage,
    uploadReferenceFile,
    convertImageToBase64,
    removeReferenceImage,
    toggleReferenceImage,
    setIsGenerating,
    isUploading,
  };

  return (
    <ImageContext.Provider value={value}>
      {children}
    </ImageContext.Provider>
  );
}