import { useState } from 'react';
import { useFirebase } from '../context/FirebaseContext';
import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from 'firebase/storage';

export function StorageTest() {
  const { storage, isInitialized, error } = useFirebase();
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addLog = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  if (!isInitialized) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">Firebase Storage API Test</h2>
        <div className="card">
          <p className="text-gray-600">
            Firebase is not configured yet. Please go to Settings and configure your Firebase project first.
          </p>
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                <strong>Error:</strong> {error}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!storage) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">Firebase Storage API Test</h2>
        <div className="card">
          <p className="text-red-600">
            Firebase Storage is not available. Please check your Firebase configuration.
          </p>
        </div>
      </div>
    );
  }

  const testUploadImage = async () => {
    setIsLoading(true);
    try {
      // Create a simple test image (1x1 pixel PNG)
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(0, 0, 1, 1);
      }
      canvas.toBlob(async (blob) => {
        if (blob) {
          const testImageRef = ref(storage, `test-images/test-${Date.now()}.png`);
          addLog('Uploading test image...');
          await uploadBytes(testImageRef, blob);
          addLog('✅ Image uploaded successfully');

          const downloadURL = await getDownloadURL(testImageRef);
          addLog(`📎 Download URL: ${downloadURL}`);
        }
      });
    } catch (error) {
      addLog(`❌ Upload failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testListImages = async () => {
    setIsLoading(true);
    try {
      const testImagesRef = ref(storage, 'test-images/');
      addLog('Listing images in test-images folder...');
      const result = await listAll(testImagesRef);

      addLog(`📁 Found ${result.items.length} images:`);
      result.items.forEach((itemRef) => {
        addLog(`  - ${itemRef.name}`);
      });

      if (result.prefixes.length > 0) {
        addLog(`📂 Found ${result.prefixes.length} subfolders`);
      }
    } catch (error) {
      addLog(`❌ List failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testDeleteImage = async () => {
    setIsLoading(true);
    try {
      const testImagesRef = ref(storage, 'test-images/');
      const result = await listAll(testImagesRef);

      if (result.items.length > 0) {
        const imageToDelete = result.items[0];
        addLog(`Deleting image: ${imageToDelete.name}`);
        await deleteObject(imageToDelete);
        addLog('✅ Image deleted successfully');
      } else {
        addLog('⚠️ No images found to delete');
      }
    } catch (error) {
      addLog(`❌ Delete failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testFirestoreOperations = async () => {
    setIsLoading(true);
    try {
      // Import Firestore functions
      const { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy } = await import('firebase/firestore');
      const { firestore } = useFirebase();

      if (!firestore) {
        addLog('❌ Firestore is not available');
        return;
      }

      addLog('Testing Firestore operations...');

      // Add a test document
      const testData = {
        name: 'Test Image',
        url: 'https://example.com/test.png',
        createdAt: new Date(),
        testField: true
      };

      addLog('Adding test document to Firestore...');
      const docRef = await addDoc(collection(firestore, 'testImages'), testData);
      addLog(`✅ Document added with ID: ${docRef.id}`);

      // Query documents
      addLog('Querying test documents...');
      const q = query(collection(firestore, 'testImages'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);

      addLog(`📄 Found ${querySnapshot.size} documents:`);
      querySnapshot.forEach((doc) => {
        addLog(`  - ID: ${doc.id}, Name: ${doc.data().name}`);
      });

      // Clean up - delete the test document
      if (!querySnapshot.empty) {
        const docToDelete = querySnapshot.docs[0];
        addLog(`Deleting test document: ${docToDelete.id}`);
        await deleteDoc(doc(firestore, 'testImages', docToDelete.id));
        addLog('✅ Test document deleted');
      }

    } catch (error) {
      addLog(`❌ Firestore test failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const clearLogs = () => {
    setTestResults([]);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Firebase Storage API Test</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <button
          onClick={testUploadImage}
          disabled={isLoading}
          className="btn-primary disabled:opacity-50"
        >
          Test Image Upload
        </button>

        <button
          onClick={testListImages}
          disabled={isLoading}
          className="btn-primary disabled:opacity-50"
        >
          List Images
        </button>

        <button
          onClick={testDeleteImage}
          disabled={isLoading}
          className="btn-primary disabled:opacity-50"
        >
          Delete Test Image
        </button>

        <button
          onClick={testFirestoreOperations}
          disabled={isLoading}
          className="btn-primary disabled:opacity-50"
        >
          Test Firestore
        </button>
      </div>

      <button
        onClick={clearLogs}
        className="btn-secondary mb-4"
      >
        Clear Logs
      </button>

      <div className="bg-gray-100 p-4 rounded-lg max-h-96 overflow-y-auto">
        <h3 className="font-semibold mb-2">Test Results:</h3>
        {testResults.length === 0 ? (
          <p className="text-gray-500">No tests run yet. Click a button above to start testing.</p>
        ) : (
          <div className="space-y-1 font-mono text-sm">
            {testResults.map((result, index) => (
              <div key={index} className="text-gray-800">{result}</div>
            ))}
          </div>
        )}
      </div>

      {isLoading && (
        <div className="mt-4 text-blue-600">
          🔄 Running test...
        </div>
      )}
    </div>
  );
}