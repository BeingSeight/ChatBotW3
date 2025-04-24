import { NextResponse } from 'next/server';

type ChatMessage = { role: string; content: string };

export async function POST(req: Request) {
  try {
    const { messages } = (await req.json()) as { messages?: ChatMessage[] };
    if (!Array.isArray(messages)) {
      return NextResponse.json(
        { error: "'messages' must be an array." },
        { status: 200 }
      );
    }

    // Only send the last user prompt
    const lastUser = messages.filter((m) => m.role === 'user').pop()?.content ?? '';
    
    // Improved request format
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ 
            role: "user",
            parts: [{ text: lastUser }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 800,
            topP: 0.8,
            topK: 40
          },
        }),
      }
    );

    const result = await resp.json();
    console.log('🎯 Gemini raw response:', JSON.stringify(result, null, 2));

    // Check for errors in the response
    if (result.error) {
      console.error('Gemini API error:', result.error);
      return NextResponse.json(
        { error: `Gemini API error: ${result.error.message || 'Unknown error'}` },
        { status: 200 }
      );
    }

    if (Array.isArray(result.candidates) && result.candidates.length > 0) {
      const bot = result.candidates[0].content.parts[0].text;
      return NextResponse.json(
        { output: { role: 'assistant', content: bot } },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { 
          error: 'No valid response from Gemini. Please try again.', 
          raw: result 
        },
        { status: 200 }
      );
    }
  } catch (e) {
    console.error('🔥 Gemini API thrown error:', e);
    console.log('API KEY LENGTH:', process.env.GEMINI_API_KEY?.length || 'undefined');
    console.log('API KEY FIRST 4 CHARS:', 
      process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 4) + '...' : 'undefined');
    
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    const errorDetails = e instanceof Error ? e.toString() : String(e);
    
    return NextResponse.json(
      { error: `Gemini API error: ${errorMessage}`, details: errorDetails },
      { status: 200 }
    );
  }
}
