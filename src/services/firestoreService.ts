import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  updateDoc, 
  query, 
  orderBy, 
  limit,
  Firestore 
} from 'firebase/firestore';
import { ReferenceImage, GeneratedImage } from '../types';

export class FirestoreService {
  private db: Firestore;

  constructor(firestore: Firestore) {
    this.db = firestore;
  }

  // Reference Images
  async addReferenceImage(image: Omit<ReferenceImage, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(this.db, 'referenceImages'), {
        ...image,
        uploadedAt: image.uploadedAt.toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      console.log('Reference image added to Firestore with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error adding reference image to Firestore:', error);
      throw error;
    }
  }

  async getReferenceImages(): Promise<ReferenceImage[]> {
    try {
      const querySnapshot = await getDocs(
        query(collection(this.db, 'referenceImages'), orderBy('createdAt', 'desc'))
      );
      
      const images: ReferenceImage[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        images.push({
          id: doc.id,
          name: data.name,
          url: data.url,
          isActive: data.isActive || false,
          uploadedAt: data.uploadedAt ? new Date(data.uploadedAt) : new Date(data.createdAt || Date.now())
        });
      });
      
      console.log(`Loaded ${images.length} reference images from Firestore`);
      return images;
    } catch (error) {
      console.error('Error getting reference images from Firestore:', error);
      return [];
    }
  }

  async updateReferenceImage(id: string, updates: Partial<ReferenceImage>): Promise<void> {
    try {
      const imageRef = doc(this.db, 'referenceImages', id);
      const updateData: any = {
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      // Convert Date objects to ISO strings for Firestore
      if (updates.uploadedAt) {
        updateData.uploadedAt = updates.uploadedAt.toISOString();
      }
      
      await updateDoc(imageRef, updateData);
      console.log('Reference image updated in Firestore:', id);
    } catch (error) {
      console.error('Error updating reference image in Firestore:', error);
      throw error;
    }
  }

  async deleteReferenceImage(id: string): Promise<void> {
    try {
      await deleteDoc(doc(this.db, 'referenceImages', id));
      console.log('Reference image deleted from Firestore:', id);
    } catch (error) {
      console.error('Error deleting reference image from Firestore:', error);
      throw error;
    }
  }

  // Generated Images
  async addGeneratedImage(image: Omit<GeneratedImage, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(this.db, 'generatedImages'), {
        ...image,
        createdAt: image.createdAt.toISOString()
      });
      console.log('Generated image added to Firestore with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error adding generated image to Firestore:', error);
      throw error;
    }
  }

  async getGeneratedImages(limitCount: number = 50): Promise<GeneratedImage[]> {
    try {
      const querySnapshot = await getDocs(
        query(
          collection(this.db, 'generatedImages'), 
          orderBy('createdAt', 'desc'),
          limit(limitCount)
        )
      );
      
      const images: GeneratedImage[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        images.push({
          id: doc.id,
          prompt: data.prompt,
          url: data.url,
          parameters: data.parameters,
          createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
          isActive: data.isActive || false,
          views: data.views
        });
      });
      
      console.log(`Loaded ${images.length} generated images from Firestore`);
      return images;
    } catch (error) {
      console.error('Error getting generated images from Firestore:', error);
      return [];
    }
  }

  async deleteGeneratedImage(id: string): Promise<void> {
    try {
      await deleteDoc(doc(this.db, 'generatedImages', id));
      console.log('Generated image deleted from Firestore:', id);
    } catch (error) {
      console.error('Error deleting generated image from Firestore:', error);
      throw error;
    }
  }

  // Migration helper - transfer from localStorage to Firestore
  async migrateFromLocalStorage(): Promise<void> {
    try {
      console.log('Starting migration from localStorage to Firestore...');
      
      // Migrate reference images
      const storedRefs = localStorage.getItem('referenceImages');
      if (storedRefs) {
        const referenceImages: ReferenceImage[] = JSON.parse(storedRefs);
        console.log(`Migrating ${referenceImages.length} reference images...`);
        
        for (const image of referenceImages) {
          // Check if image already exists in Firestore
          const existingImages = await this.getReferenceImages();
          const exists = existingImages.some(existing => existing.url === image.url);
          
          if (!exists) {
            await this.addReferenceImage({
              name: image.name,
              url: image.url,
              isActive: image.isActive || false,
              uploadedAt: image.uploadedAt || new Date()
            });
          }
        }
      }

      // Migrate generated images
      const storedGens = localStorage.getItem('generatedImages');
      if (storedGens) {
        const generatedImages: GeneratedImage[] = JSON.parse(storedGens);
        console.log(`Migrating ${generatedImages.length} generated images...`);
        
        for (const image of generatedImages) {
          // Check if image already exists in Firestore
          const existingImages = await this.getGeneratedImages(100);
          const exists = existingImages.some(existing => existing.url === image.url);
          
          if (!exists) {
            await this.addGeneratedImage({
              prompt: image.prompt,
              url: image.url,
              parameters: image.parameters,
              createdAt: image.createdAt || new Date(),
              isActive: image.isActive || false,
              views: image.views
            });
          }
        }
      }

      console.log('Migration completed successfully');
    } catch (error) {
      console.error('Error during migration:', error);
      throw error;
    }
  }
}