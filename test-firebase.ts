import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDB6IjnMYQNhU3GPYzgdDAEGoT_DuAbuaE",
  authDomain: "ceramic-model-generator.firebaseapp.com",
  projectId: "ceramic-model-generator",
  storageBucket: "ceramic-model-generator.firebasestorage.app",
  messagingSenderId: "121028790771",
  appId: "1:121028790771:web:9bdd588822fe1081ea2a86"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const firestore = getFirestore(app);

async function testFirebaseStorage() {
  try {
    console.log('Testing Firebase Storage upload...');

    // Create a simple test image (1x1 pixel PNG)
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    ctx!.fillStyle = 'red';
    ctx!.fillRect(0, 0, 1, 1);

    canvas.toBlob(async (blob) => {
      if (!blob) {
        console.error('Failed to create test blob');
        return;
      }

      // Upload to Firebase Storage
      const testImageRef = ref(storage, 'reference-images/test-image.png');
      await uploadBytes(testImageRef, blob);
      console.log('✅ Image uploaded to Firebase Storage successfully');

      // Get download URL
      const downloadURL = await getDownloadURL(testImageRef);
      console.log('✅ Download URL obtained:', downloadURL);

      // Save metadata to Firestore
      const imageData = {
        url: downloadURL,
        name: 'test-image.png',
        isActive: true,
        uploadedAt: new Date()
      };

      const docRef = await addDoc(collection(firestore, 'referenceImages'), imageData);
      console.log('✅ Metadata saved to Firestore with ID:', docRef.id);

      console.log('🎉 Firebase Cloud Storage test completed successfully!');
    });

  } catch (error) {
    console.error('❌ Firebase Storage test failed:', error);
  }
}

// Run the test
testFirebaseStorage();