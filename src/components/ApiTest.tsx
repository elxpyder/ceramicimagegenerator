import { useEffect, useState } from 'react';

const ApiTest = () => {
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testGeminiApi = async () => {
      console.log('--- Starting Gemini API Test ---');
      try {
        const apiKey = "AIzaSyBbknbJqkMrH0PQBL2GktXybmGk_0ghOME";
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=${apiKey}`;

        const requestBody = {
          contents: [
            {
              parts: [{ text: "Describe this image" }, {
                inline_data: {
                  mime_type: "image/jpeg",
                  // A small, blank, white JPEG image as a base64 string
                  data: "/9j/4AAQSkZJRgABAQEAYABgAAD/4QAiRXhpZgAATU0AKgAAAAgAAQESAAMAAAABAAEAAAAAAAD/2wBDAAIBAQIBAQICAgICAgICAwUDAwMDAwYEBAMFBwYHBwcGBwcICQsJCAgKCAcHCg0KCgsMDAwMBwkODw0MDgsMDAz/2wBDAQICAgMDAwYDAwYMCAcIDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAz/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAj/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFAEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AL+AD//Z"
                }
              }],
            },
          ],
        };

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        const data = await response.json();

        if (!response.ok) {
          console.error('--- Gemini API Test FAILED (Network) ---', data);
          setError(JSON.stringify(data.error?.message || data, null, 2));
        } else {
          console.log('--- Gemini API Test SUCCESS ---', data);
          setApiResponse(JSON.stringify(data, null, 2));
        }

      } catch (err: any) {
        console.error('--- Gemini API Test FAILED (Catch) ---', err);
        setError(err.message);
      }
    };

    testGeminiApi();
  }, []);

  return (
    <div style={{ 
      position: 'fixed', 
      bottom: '10px', 
      left: '10px', 
      backgroundColor: 'white', 
      border: '2px solid black', 
      padding: '10px', 
      zIndex: 1000,
      maxWidth: '90vw',
      maxHeight: '40vh',
      overflow: 'auto'
    }}>
      <h3>Gemini API Test</h3>
      {error && <pre style={{ color: 'red' }}><b>Error:</b><br />{error}</pre>}
      {apiResponse && <pre style={{ color: 'green' }}><b>Success:</b><br />{apiResponse}</pre>}
      {!error && !apiResponse && <p>Running test...</p>}
    </div>
  );
};

export default ApiTest;
