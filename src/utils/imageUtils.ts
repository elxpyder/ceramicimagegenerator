/**
 * Utility functions for image processing and conversion
 */

/**
 * Convert a Firebase Storage URL to base64 format using multiple fallback methods
 */
export async function urlToBase64(url: string): Promise<string> {
  try {
    console.log('Converting URL to base64:', url);
    
    // Method 1: Try Firebase Function proxy
    try {
      console.log('Trying Firebase Function proxy method');
      const response = await fetch('https://api-5irvh6jqca-uc.a.run.app/convert-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl: url })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Firebase Function proxy successful, base64 length:', data.base64.length);
        return data.base64;
      }
    } catch (proxyError) {
      console.warn('Firebase Function proxy failed:', proxyError);
    }
    
    // Method 2: Try fetch with no-cors mode
    try {
      console.log('Trying fetch with no-cors mode');
      const response = await fetch(url, { mode: 'no-cors' });
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const base64Data = result.split(',')[1];
          console.log('No-cors fetch successful, base64 length:', base64Data.length);
          resolve(base64Data);
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
      });
    } catch (fetchError) {
      console.warn('No-cors fetch failed:', fetchError);
    }
    
    // Method 3: XMLHttpRequest fallback
    console.log('Trying XMLHttpRequest fallback');
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', url, true);
      xhr.responseType = 'blob';
      xhr.onload = function() {
        if (xhr.status === 200 || xhr.status === 0) { // 0 for local/CORS
          const blob = xhr.response;
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            const base64Data = result.split(',')[1];
            console.log('XMLHttpRequest successful, base64 length:', base64Data.length);
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
    console.error('All conversion methods failed:', error);
    throw new Error(`Failed to convert image to base64: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Convert multiple URLs to base64 format
 */
export async function urlsToBase64(urls: string[]): Promise<string[]> {
  console.log('Converting multiple URLs to base64:', urls.length);
  
  const conversions = urls.map(async (url) => {
    try {
      return await urlToBase64(url);
    } catch (error) {
      console.error(`Failed to convert URL ${url}:`, error);
      throw error;
    }
  });
  
  return Promise.all(conversions);
}

/**
 * Check if a URL is a Firebase Storage URL
 */
export function isFirebaseStorageUrl(url: string): boolean {
  return url.includes('firebasestorage.googleapis.com') || url.includes('firebase');
}

/**
 * Check if a URL is already a base64 data URL
 */
export function isBase64DataUrl(url: string): boolean {
  return url.startsWith('data:image/');
}

/**
 * Extract base64 data from a data URL
 */
export function extractBase64FromDataUrl(dataUrl: string): string {
  const parts = dataUrl.split(',');
  if (parts.length !== 2) {
    throw new Error('Invalid data URL format');
  }
  return parts[1];
}