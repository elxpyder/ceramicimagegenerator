// Test script for the Imagen API Cloud Function
const testImagenAPI = async () => {
  const functionUrl = 'https://api-5irvh6jqca-uc.a.run.app/generate-image';

  // Test 1: Text-to-image generation
  console.log('Testing text-to-image generation...');
  try {
    const response1 = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: 'A beautiful ceramic vase with blue glaze',
      }),
    });

    console.log('Response status:', response1.status);
    const data1 = await response1.json();
    console.log('Response data:', data1);

    if (data1.imageUrl) {
      console.log('✅ Text-to-image test PASSED - Image URL received');
    } else {
      console.log('❌ Text-to-image test FAILED - No image URL');
    }
  } catch (error) {
    console.error('❌ Text-to-image test ERROR:', error.message);
  }

  // Test 2: Image-to-image generation (would need a reference image URL)
  console.log('\nTesting image-to-image generation...');
  console.log('Note: This test requires a reference image URL from Firebase Storage');
  console.log('Skipping for now - can be tested manually in the app');
};

testImagenAPI();