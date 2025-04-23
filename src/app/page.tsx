"use client";
import { useState } from "react";

export default function Home() {
  const [theInput, setTheInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Yo, this is ChatterBot! How can I help you today?",
    },
  ]);

  const Submit = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      callGetResponse();
    }
  };

  const callGetResponse = async () => {
    try {
      setIsLoading(true);
      let temp = [...messages];
      temp.push({ role: "user", content: theInput });
      setMessages(temp);
      setTheInput("");
      console.log("Calling OpenAI...");
  
      const response = await fetch("/api", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error:", errorData.error);
  
        if (response.status === 429) {
          setMessages((prevMessages) => [
            ...prevMessages,
            { role: "assistant", content: "You have exceeded your OpenAI quota. Please try again later." },
          ]);
        } else {
          setMessages((prevMessages) => [
            ...prevMessages,
            { role: "assistant", content: "Something went wrong. Please try again." },
          ]);
        }
  
        setIsLoading(false);
        return;
      }
  
      const data = await response.json();
      const { output } = data;
      console.log("OpenAI replied...", output.content);
  
      setMessages((prevMessages) => [...prevMessages, output]);
      setIsLoading(false);
    } catch (error) {
      console.error("Error in callGetResponse:", error);
      setMessages((prevMessages) => [
        ...prevMessages,
        { role: "assistant", content: "An error occurred. Please try again." },
      ]);
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between px-24 py-5">
      <h1 className="text-5xl font-sans">ChatterBot</h1>

      <div className="flex h-[35rem] w-[40rem] flex-col items-center bg-gray-600 rounded-xl">
        <div className="h-full flex flex-col gap-2 overflow-y-auto py-8 px-3 w-full">
          {messages.map((e) => {
            return (
              <div
                key={e.content}
                className={`w-max max-w-[18rem] rounded-md px-4 py-3 h-min ${
                  e.role === "assistant"
                    ? "self-start bg-gray-200 text-gray-800"
                    : "self-end bg-gray-800 text-gray-50"
                }`}
              >
                {e.content}
              </div>
            );
          })}

          {isLoading ? (
            <div className="self-start bg-gray-200 text-gray-800 w-max max-w-[18rem] rounded-md px-4 py-3 h-min">
              *thinking*
            </div>
          ) : (
            ""
          )}
        </div>
        <div className="relative w-[80%] bottom-4 flex justify-center">
          <textarea
            value={theInput}
            onChange={(event) => setTheInput(event.target.value)}
            className="w-[85%] h-10 px-3 py-2 resize-none overflow-y-auto text-black bg-gray-300 rounded-l outline-none"
            onKeyDown={Submit}
          />
          <button
            onClick={callGetResponse}
            className="w-[15%] bg-blue-500 px-4 py-2 rounded-r"
          >
            send
          </button>
        </div>
      </div>
    </main>
  );
}