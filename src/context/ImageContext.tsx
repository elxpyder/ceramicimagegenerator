import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { GeneratedImage, ReferenceImage } from '../types';
import { useFirebase } from './FirebaseContext';
import { StorageService } from '../services/storageService';
import { FirestoreService } from '../services/firestoreService';
import { urlToBase64, isBase64DataUrl, extractBase64FromDataUrl } from '../utils/imageUtils';

interface ImageContextType {
  referenceImages: ReferenceImage[];
  generatedImages: GeneratedImage[];
  isGenerating: boolean;
  isLoading: boolean;
  addGeneratedImage: (image: GeneratedImage) => Promise<void>;
  removeReferenceImage: (id: string) => Promise<void>;
  addReferenceImage: (image: ReferenceImage) => Promise<void>;
  uploadReferenceFile: (file: File, name?: string) => Promise<void>;
  convertImageToBase64: (imageUrl: string) => Promise<string>;
  toggleReferenceImage: (id: string) => Promise<void>;
  setIsGenerating: (generating: boolean) => void;
  loadFromFirestore: () => Promise<void>;
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
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [storageService, setStorageService] = useState<StorageService | null>(null);
  const [firestoreService, setFirestoreService] = useState<FirestoreService | null>(null);
  const firebase = useFirebase();

  // Initialize Firebase services
  useEffect(() => {
    if (firebase?.storage) {
      setStorageService(new StorageService(firebase.storage));
    }
    if (firebase?.firestore) {
      setFirestoreService(new FirestoreService(firebase.firestore));
    }
  }, [firebase]);

  // Load images from Firestore on mount
  useEffect(() => {
    if (firestoreService) {
      loadFromFirestore();
    }
  }, [firestoreService]);

  const loadFromFirestore = async () => {
    if (!firestoreService) return;
    
    try {
      setIsLoading(true);
      console.log('Loading images from Firestore...');
      
      const [references, generated] = await Promise.all([
        firestoreService.getReferenceImages(),
        firestoreService.getGeneratedImages()
      ]);
      
      setReferenceImages(references);
      setGeneratedImages(generated);
      
      console.log(`Loaded ${references.length} reference images and ${generated.length} generated images from Firestore`);
    } catch (error) {
      console.error('Error loading images from Firestore:', error);
    } finally {
      setIsLoading(false);
    }
  };



  const addGeneratedImage = async (image: GeneratedImage) => {
    if (!firestoreService || !storageService) {
      console.error('Services not available');
      return;
    }

    try {
      setIsUploading(true);
      console.log('Adding generated image to Firestore...');
      
      // Upload generated image to Firebase Storage if needed
      let cloudUrl = image.url;
      if (!storageService.isFirebaseStorageUrl(image.url)) {
        console.log('Uploading generated image to Firebase Storage');
        cloudUrl = await storageService.uploadGeneratedImage(image.url, image.prompt);
        console.log('Generated image uploaded to cloud:', cloudUrl);
      }
      
      // Create the image object for Firestore
      const imageToAdd = {
        ...image,
        url: cloudUrl
      };
      
      // Add to Firestore
      const id = await firestoreService.addGeneratedImage(imageToAdd);
      
      // Update local state for generated images
      const newImage = { ...imageToAdd, id };
      setGeneratedImages(prev => [newImage, ...prev]);
      
      // Also add as reference image for UI display
      const referenceImage: ReferenceImage = {
        id: `gen_${id}`,
        url: cloudUrl,
        name: `Generated: ${image.prompt.substring(0, 50)}${image.prompt.length > 50 ? '...' : ''}`,
        isActive: image.isActive,
        uploadedAt: image.createdAt
      };
      
      // Add to Firestore as reference image
      await firestoreService.addReferenceImage(referenceImage);
      
      // Update local reference images state
      setReferenceImages(prev => [referenceImage, ...prev]);
      
      console.log('Generated image added successfully');
    } catch (error) {
      console.error('Error adding generated image:', error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const addReferenceImage = async (image: ReferenceImage) => {
    if (!firestoreService) {
      console.error('Firestore service not available');
      return;
    }

    try {
      console.log('Adding reference image to Firestore...');
      
      // Add to Firestore
      const id = await firestoreService.addReferenceImage(image);
      
      // Update local state
      const newImage = { ...image, id };
      setReferenceImages(prev => [newImage, ...prev]);
      
      console.log('Reference image added successfully');
    } catch (error) {
      console.error('Error adding reference image:', error);
      throw error;
    }
  };

  const removeReferenceImage = async (id: string) => {
    if (!firestoreService) {
      console.error('Firestore service not available');
      return;
    }

    try {
      console.log('Removing reference image from Firestore:', id);
      
      // Remove from Firestore
      await firestoreService.deleteReferenceImage(id);
      
      // Update local state
      setReferenceImages(prev => prev.filter(img => img.id !== id));
      
      console.log('Reference image removed successfully');
    } catch (error) {
      console.error('Error removing reference image:', error);
      throw error;
    }
  };

  const uploadReferenceFile = async (file: File, name?: string) => {
    if (!storageService || !firestoreService) {
      console.error('Services not available');
      return;
    }

    try {
      setIsUploading(true);
      console.log('Uploading reference file...');
      
      // Upload to Firebase Storage
      const cloudUrl = await storageService.uploadImage(file, 'references');
      console.log('File uploaded to Firebase Storage:', cloudUrl);
      
      // Create reference image object
      const referenceImage: Omit<ReferenceImage, 'id'> = {
        name: name || file.name,
        url: cloudUrl,
        isActive: false,
        uploadedAt: new Date()
      };
      
      // Add to Firestore
      const id = await firestoreService.addReferenceImage(referenceImage);
      
      // Update local state
      const newImage = { ...referenceImage, id };
      setReferenceImages(prev => [newImage, ...prev]);
      
      console.log('Reference file uploaded successfully');
    } catch (error) {
      console.error('Error uploading reference file:', error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const toggleReferenceImage = async (id: string) => {
    if (!firestoreService) {
      console.error('Firestore service not available');
      return;
    }

    try {
      const image = referenceImages.find(img => img.id === id);
      if (!image) return;
      
      const newIsActive = !image.isActive;
      
      // Update in Firestore
      await firestoreService.updateReferenceImage(id, { isActive: newIsActive });
      
      // Update local state
      setReferenceImages(prev => 
        prev.map(img => 
          img.id === id ? { ...img, isActive: newIsActive } : img
        )
      );
      
      console.log(`Reference image ${id} toggled to ${newIsActive ? 'active' : 'inactive'}`);
    } catch (error) {
      console.error('Error toggling reference image:', error);
      throw error;
    }
  };

  const convertImageToBase64 = async (imageUrl: string): Promise<string> => {
    try {
      if (isBase64DataUrl(imageUrl)) {
        return extractBase64FromDataUrl(imageUrl);
      }
      return await urlToBase64(imageUrl);
    } catch (error) {
      console.error('Error converting image to base64:', error);
      throw error;
    }
  };

  return (
    <ImageContext.Provider
      value={{
        referenceImages,
        generatedImages,
        isGenerating,
        isLoading,
        isUploading,
        addGeneratedImage,
        removeReferenceImage,
        addReferenceImage,
        uploadReferenceFile,
        convertImageToBase64,
        toggleReferenceImage,
        setIsGenerating,
        loadFromFirestore
      }}
    >
      {children}
    </ImageContext.Provider>
  );
}