import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type RequestBody = {
  messages: ChatCompletionMessageParam[];
};

type ErrorWithCode = {
  code?: string;
};

export async function POST(req: Request) {
  let theResponse;

  try {
    const body: RequestBody = await req.json();

    // Validate the request body
    if (!body.messages || !Array.isArray(body.messages)) {
      return NextResponse.json(
        { error: "Invalid request body. 'messages' must be an array." },
        { status: 400 }
      );
    }

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: body.messages,
    });

    theResponse = completion.choices[0]?.message;

    if (!theResponse) {
      return NextResponse.json(
        { error: "No response from OpenAI." },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    console.error("Error in API:", error);

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as ErrorWithCode).code === "insufficient_quota"
    ) {
      return NextResponse.json(
        { error: "You have exceeded your OpenAI quota. Please check your plan and billing details." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }

  return NextResponse.json({ output: theResponse }, { status: 200 });
}
