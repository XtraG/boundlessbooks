// This is your secure "middleman" server function.
// It runs on the server, not in the user's browser.

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ message: 'Only POST requests are allowed' });
  }

  try {
    const { userPrompt, bookList } = request.body;
    const apiKey = process.env.GEMINI_API_KEY; // Securely gets the key from Vercel's settings

    if (!apiKey) {
      return response.status(500).json({ error: 'API key not configured on the server.' });
    }

    const fullPrompt = `You are a helpful librarian. A user is looking for book recommendations. Their request is: "${userPrompt}". Based on this request, please recommend up to three books from the following list. For each book, provide the title in bold, followed by a brief, one-sentence explanation of why it's a good match. ONLY recommend books from this list. DO NOT include any markdown or special formatting. Do not include any bolding, highlighting, or anything other than plain text. Remember, NO BOLDING. Format everything as a bulleted list with clean line breaks. Do not make up any books. Here is the list of available books:\n${bookList}`;

    let chatHistory = [{ role: "user", parts: [{ text: fullPrompt }] }];
    const payload = { contents: chatHistory };
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const apiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!apiResponse.ok) {
        const errorBody = await apiResponse.text();
        console.error("Google API Error:", errorBody);
        return response.status(apiResponse.status).json({ error: `Google API request failed: ${errorBody}` });
    }

    const result = await apiResponse.json();
    response.status(200).json(result);

  } catch (error) {
    console.error("Backend function error:", error);
    response.status(500).json({ error: 'An internal server error occurred.' });
  }
}
