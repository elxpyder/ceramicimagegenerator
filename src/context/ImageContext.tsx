import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { GeneratedImage, ReferenceImage } from '../types';
import { useFirebase } from './FirebaseContext';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, orderBy } from 'firebase/firestore';

interface ImageContextType {
  generatedImages: GeneratedImage[];
  referenceImages: ReferenceImage[];
  isGenerating: boolean;
  isLoadingImages: boolean;
  addGeneratedImage: (image: GeneratedImage) => void;
  removeGeneratedImage: (id: string) => void;
  addReferenceImage: (image: ReferenceImage) => Promise<void>;
  removeReferenceImage: (id: string) => Promise<void>;
  toggleReferenceImage: (id: string) => Promise<void>;
  setIsGenerating: (generating: boolean) => void;
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
  const { storage, firestore } = useFirebase();
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingImages, setIsLoadingImages] = useState(true);

  // Load images from Firebase on mount
  useEffect(() => {
    const loadImages = async () => {
      if (!firestore) {
        setIsLoadingImages(false);
        return;
      }

      try {
        setIsLoadingImages(true);

        // Load generated images from Firestore
        const generatedQuery = query(collection(firestore, 'generatedImages'), orderBy('createdAt', 'desc'));
        const generatedSnapshot = await getDocs(generatedQuery);
        const loadedGeneratedImages = generatedSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        })) as GeneratedImage[];
        setGeneratedImages(loadedGeneratedImages);

        // Load reference images from Firestore
        const referenceQuery = query(collection(firestore, 'referenceImages'), orderBy('uploadedAt', 'desc'));
        const referenceSnapshot = await getDocs(referenceQuery);
        const loadedReferenceImages = referenceSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          uploadedAt: doc.data().uploadedAt?.toDate() || new Date(),
        })) as ReferenceImage[];
        setReferenceImages(loadedReferenceImages);

      } catch (error) {
        console.error('Error loading images from cloud:', error);
        // Fallback to localStorage if cloud loading fails
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
            console.error('Error loading generated images from localStorage:', error);
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
            console.error('Error loading reference images from localStorage:', error);
          }
        }
      } finally {
        setIsLoadingImages(false);
      }
    };

    loadImages();
  }, [firestore]);

  const addGeneratedImage = async (image: GeneratedImage) => {
    if (!storage || !firestore) {
      console.warn('Firebase not initialized, saving locally');
      setGeneratedImages(prev => [image, ...prev]);
      return;
    }

    try {
      // Upload image to Firebase Storage
      const imageBlob = await fetch(image.url).then(r => r.blob());
      const imageRef = ref(storage, `generated-images/${image.id}.jpg`);
      await uploadBytes(imageRef, imageBlob);
      const downloadURL = await getDownloadURL(imageRef);

      // Save metadata to Firestore
      const imageData = {
        url: downloadURL,
        prompt: image.prompt,
        parameters: image.parameters,
        createdAt: image.createdAt
      };

      const docRef = await addDoc(collection(firestore, 'generatedImages'), imageData);

      // Update local state with the Firestore document ID and cloud URL
      const cloudImage: GeneratedImage = {
        ...image,
        id: docRef.id,
        url: downloadURL
      };

      setGeneratedImages(prev => [cloudImage, ...prev]);

    } catch (error) {
      console.error('Error saving generated image to cloud:', error);
      // Fallback: still add to local state if cloud save fails
      setGeneratedImages(prev => [image, ...prev]);
    }
  };

  const removeGeneratedImage = async (id: string) => {
    if (!storage || !firestore) {
      console.warn('Firebase not initialized, removing locally');
      setGeneratedImages(prev => prev.filter(img => img.id !== id));
      return;
    }

    try {
      // Find the image to get its URL for storage deletion
      const imageToRemove = generatedImages.find(img => img.id === id);

      if (imageToRemove) {
        // Delete from Firebase Storage
        try {
          const imageRef = ref(storage, `generated-images/${id}.jpg`);
          await deleteObject(imageRef);
        } catch (storageError) {
          console.warn('Could not delete generated image from storage:', storageError);
        }

        // Delete from Firestore
        try {
          await deleteDoc(doc(firestore, 'generatedImages', id));
        } catch (firestoreError) {
          console.warn('Could not delete generated image from Firestore:', firestoreError);
        }
      }

      // Update local state
      setGeneratedImages(prev => prev.filter(img => img.id !== id));

    } catch (error) {
      console.error('Error removing generated image:', error);
      // Fallback: just remove from local state
      setGeneratedImages(prev => prev.filter(img => img.id !== id));
    }
  };

  const addReferenceImage = async (image: ReferenceImage) => {
    if (!storage || !firestore) {
      console.warn('Firebase not initialized, saving locally');
      setReferenceImages(prev => [image, ...prev]);
      return;
    }

    try {
      // Upload image to Firebase Storage
      const imageBlob = await fetch(image.url).then(r => r.blob());
      const imageRef = ref(storage, `reference-images/${image.id}.png`);
      await uploadBytes(imageRef, imageBlob);
      const downloadURL = await getDownloadURL(imageRef);

      // Save metadata to Firestore
      const imageData = {
        url: downloadURL,
        name: image.name,
        isActive: image.isActive,
        uploadedAt: image.uploadedAt
      };

      const docRef = await addDoc(collection(firestore, 'referenceImages'), imageData);
      
      // Update local state with the Firestore document ID and cloud URL
      const cloudImage: ReferenceImage = {
        ...image,
        id: docRef.id,
        url: downloadURL
      };

      setReferenceImages(prev => [cloudImage, ...prev]);
      
    } catch (error) {
      console.error('Error saving reference image to cloud:', error);
      // Fallback: still add to local state if cloud save fails
      setReferenceImages(prev => [image, ...prev]);
    }
  };

  const removeReferenceImage = async (id: string) => {
    if (!storage || !firestore) {
      console.warn('Firebase not initialized, removing locally');
      setReferenceImages(prev => prev.filter(img => img.id !== id));
      return;
    }

    try {
      // Find the image to get its URL for storage deletion
      const imageToRemove = referenceImages.find(img => img.id === id);
      
      if (imageToRemove) {
        // Delete from Firebase Storage
        try {
          const imageRef = ref(storage, `reference-images/${id}.png`);
          await deleteObject(imageRef);
        } catch (storageError) {
          console.warn('Could not delete reference image from storage:', storageError);
        }
        
        // Delete from Firestore
        try {
          await deleteDoc(doc(firestore, 'referenceImages', id));
        } catch (firestoreError) {
          console.warn('Could not delete reference image from Firestore:', firestoreError);
        }
      }
      
      // Update local state
      setReferenceImages(prev => prev.filter(img => img.id !== id));
      
    } catch (error) {
      console.error('Error removing reference image:', error);
      // Fallback: just remove from local state
      setReferenceImages(prev => prev.filter(img => img.id !== id));
    }
  };

  const toggleReferenceImage = async (id: string) => {
    if (!firestore) {
      console.warn('Firebase not initialized, toggling locally');
      setReferenceImages(prev =>
        prev.map(img =>
          img.id === id ? { ...img, isActive: !img.isActive } : img
        )
      );
      return;
    }

    try {
      const imageToUpdate = referenceImages.find(img => img.id === id);
      if (!imageToUpdate) return;
      
      const newActiveState = !imageToUpdate.isActive;
      
      // Update Firestore
      try {
        await updateDoc(doc(firestore, 'referenceImages', id), {
          isActive: newActiveState
        });
      } catch (firestoreError) {
        console.warn('Could not update reference image in Firestore:', firestoreError);
      }
      
      // Update local state
      setReferenceImages(prev =>
        prev.map(img =>
          img.id === id ? { ...img, isActive: newActiveState } : img
        )
      );
      
    } catch (error) {
      console.error('Error toggling reference image:', error);
      // Fallback: just update local state
      setReferenceImages(prev =>
        prev.map(img =>
          img.id === id ? { ...img, isActive: !img.isActive } : img
        )
      );
    }
  };

  const value: ImageContextType = {
    generatedImages,
    referenceImages,
    isGenerating,
    isLoadingImages,
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