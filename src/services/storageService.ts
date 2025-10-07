import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from 'firebase/storage';
import { FirebaseStorage } from 'firebase/storage';

export class StorageService {
  private storage: FirebaseStorage;

  constructor(storage: FirebaseStorage) {
    this.storage = storage;
  }

  /**
   * Upload an image file to Firebase Storage
   */
  async uploadImage(file: File, folder: 'references' | 'generated' = 'references'): Promise<string> {
    try {
      const timestamp = Date.now();
      const fileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const storageRef = ref(this.storage, `images/${folder}/${fileName}`);
      
      console.log(`Uploading ${file.name} to ${folder}/${fileName}`);
      
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      console.log('Upload successful, download URL:', downloadURL);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Upload a generated image from a blob URL
   */
  async uploadGeneratedImage(imageUrl: string, prompt: string): Promise<string> {
    try {
      console.log('Converting generated image to file for upload');
      
      // Fetch the blob from the generated URL
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      // Create a file from the blob
      const timestamp = Date.now();
      const fileName = `generated-${timestamp}-${prompt.substring(0, 30).replace(/[^a-zA-Z0-9]/g, '_')}.jpg`;
      const file = new File([blob], fileName, { type: 'image/jpeg' });
      
      return await this.uploadImage(file, 'generated');
    } catch (error) {
      console.error('Error uploading generated image:', error);
      throw new Error(`Failed to upload generated image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete an image from Firebase Storage
   */
  async deleteImage(imageUrl: string): Promise<void> {
    try {
      // Extract the path from the download URL
      const url = new URL(imageUrl);
      const pathMatch = url.pathname.match(/\/o\/(.+?)\?/);
      
      if (!pathMatch) {
        throw new Error('Invalid Firebase Storage URL');
      }
      
      const path = decodeURIComponent(pathMatch[1]);
      const storageRef = ref(this.storage, path);
      
      console.log('Deleting image from storage:', path);
      await deleteObject(storageRef);
      console.log('Image deleted successfully');
    } catch (error) {
      console.error('Error deleting image:', error);
      // Don't throw error for deletion failures - the URL reference will be removed anyway
    }
  }

  /**
   * List all images in storage (for debugging/management)
   */
  async listImages(): Promise<string[]> {
    try {
      const imagesRef = ref(this.storage, 'images');
      const result = await listAll(imagesRef);
      
      const urls: string[] = [];
      for (const itemRef of result.items) {
        const url = await getDownloadURL(itemRef);
        urls.push(url);
      }
      
      return urls;
    } catch (error) {
      console.error('Error listing images:', error);
      return [];
    }
  }

  /**
   * Check if a URL is a Firebase Storage URL
   */
  isFirebaseStorageUrl(url: string): boolean {
    return url.includes('firebasestorage.googleapis.com') || url.includes('firebase');
  }

  /**
   * Get image as base64 directly from Firebase Storage (bypasses CORS)
   */
  async getImageAsBase64(imageUrl: string): Promise<string> {
    try {
      console.log('Getting image as base64 from Firebase Storage:', imageUrl);
      
      // Try using our Firebase Function proxy first
      try {
        console.log('Attempting conversion via Firebase Function proxy');
        const response = await fetch('https://api-5irvh6jqca-uc.a.run.app/convert-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ imageUrl })
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('Firebase Function conversion successful, base64 length:', data.base64.length);
          return data.base64;
        } else {
          console.warn('Firebase Function proxy failed with status:', response.status);
        }
      } catch (proxyError) {
        console.warn('Firebase Function proxy error, trying fallback:', proxyError);
      }
      
      // Fallback: Try direct fetch with CORS mode
      console.log('Attempting direct fetch with CORS');
      
      try {
        const response = await fetch(imageUrl, {
          method: 'GET',
          mode: 'cors'
        });
        
        if (response.ok) {
          const blob = await response.blob();
          
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const result = reader.result as string;
              const base64Data = result.split(',')[1];
              console.log('Direct fetch conversion successful, base64 length:', base64Data.length);
              resolve(base64Data);
            };
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(blob);
          });
        }
      } catch (directError) {
        console.warn('Direct fetch failed:', directError);
      }
      
      // Final fallback: XMLHttpRequest approach
      console.log('Attempting XMLHttpRequest fallback');
      
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', imageUrl, true);
        xhr.responseType = 'blob';
        
        xhr.onload = function() {
          if (xhr.status === 200) {
            const blob = xhr.response;
            const reader = new FileReader();
            reader.onload = () => {
              const result = reader.result as string;
              const base64Data = result.split(',')[1];
              console.log('XMLHttpRequest conversion successful, base64 length:', base64Data.length);
              resolve(base64Data);
            };
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(blob);
          } else {
            reject(new Error(`XHR failed with status: ${xhr.status}`));
          }
        };
        
        xhr.onerror = () => reject(new Error('XHR request failed'));
        xhr.send();
      });
    } catch (error) {
      console.error('Error getting image as base64 from Firebase Storage:', error);
      throw error;
    }
  }

  /**
   * Get storage usage statistics
   */
  async getStorageStats(): Promise<{ count: number; estimatedSize: string }> {
    try {
      const urls = await this.listImages();
      return {
        count: urls.length,
        estimatedSize: `~${(urls.length * 0.5).toFixed(1)} MB` // Rough estimate
      };
    } catch (error) {
      console.error('Error getting storage stats:', error);
      return { count: 0, estimatedSize: '0 MB' };
    }
  }
}