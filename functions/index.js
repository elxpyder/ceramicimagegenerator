const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');
const { GoogleAuth } = require('google-auth-library');

const app = express();

// Enable CORS for all routes
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

app.post('/generate-image', async (req, res) => {
  try {
    const { prompt, referenceImages, editMode = false } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Gemini API key - using the correct model for image generation and editing
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyBbknbJqkMrH0PQBL2GktXybmGk_0ghOME';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${GEMINI_API_KEY}`;

    // Build parts array following Gemini documentation for image editing
    const parts = [];

    // For editing mode: Add the target image first, then the edit instructions
    if (editMode && referenceImages && referenceImages.length > 0) {
      // Add the primary reference image to edit
      const primaryImage = referenceImages[0]; // Use first image as the target for editing
      const match = primaryImage.match(/^data:(image\/[a-z]+);base64,/);
      if (match) {
        const mimeType = match[1];
        const base64Data = primaryImage.replace(/^data:image\/[a-z]+;base64,/, '');
        parts.push({
          inlineData: {
            mimeType,
            data: base64Data
          }
        });
      }

      // Add specific editing instructions following Gemini documentation patterns
      parts.push({
        text: `Edit this ceramic sculpture image with the following changes: ${prompt}. Maintain the ceramic material properties, clay-like textures, and sculptural form while making the requested modifications. Preserve the artistic integrity and craftsmanship details.`
      });

    } else {
      // For generation mode: Add reference images for style guidance, then prompt
      if (referenceImages && referenceImages.length > 0) {
        referenceImages.slice(0, 3).forEach(refUrl => { // Limit to 3 for better performance
          const match = refUrl.match(/^data:(image\/[a-z]+);base64,/);
          if (!match) return;
          const mimeType = match[1];
          const base64Data = refUrl.replace(/^data:image\/[a-z]+;base64,/, '');
          parts.push({
            inlineData: {
              mimeType,
              data: base64Data
            }
          });
        });
      }

      // Enhanced generation prompt following Gemini best practices
      parts.push({
        text: `Generate a high-quality, photorealistic ceramic sculpture image: ${prompt}. Create detailed clay-like surfaces with natural ceramic textures, professional pottery craftsmanship, and sculptural forms. Include realistic glazing effects, surface imperfections, and artistic detailing that shows the handmade ceramic quality.`
      });
    }

    const requestBody = {
      contents: [
        {
          role: 'user',
          parts
        }
      ],
      generationConfig: {
        temperature: 0.8, // Slightly higher for more creative image generation
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
        responseModalities: ['Text', 'Image'] // Explicitly request image responses
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
      ]
    };

    console.log('Request body being sent to Gemini API:', JSON.stringify({
      ...requestBody,
      contents: [{
        ...requestBody.contents[0],
        parts: requestBody.contents[0].parts.map(part => 
          part.inlineData ? { inlineData: { mimeType: part.inlineData.mimeType, data: '[BASE64_DATA]' } } : part
        )
      }]
    }, null, 2));

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', errorText);
      throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Gemini API response structure:', {
      candidates: data.candidates?.length || 0,
      hasContent: !!data.candidates?.[0]?.content,
      hasParts: !!data.candidates?.[0]?.content?.parts?.length
    });
    // Find the first inlineData part in the response
    let imageData = null;
    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
      const parts = data.candidates[0].content.parts;
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          imageData = part.inlineData.data;
          break;
        }
      }
    }
    if (!imageData) {
      console.error('No image data found in response. Full response:', JSON.stringify(data, null, 2));
      throw new Error('No image data returned from Gemini API');
    }
    // Format response to match frontend expectations
    const formattedResponse = {
      candidates: [{
        content: {
          parts: [{
            inlineData: {
              data: imageData,
            },
          }],
        },
      }],
    };
    res.json(formattedResponse);

  } catch (error) {
    console.error('Error generating image:', error);
    res.status(500).json({ error: error.message || 'Failed to generate image' });
  }
});

exports.api = functions.https.onRequest(app);
