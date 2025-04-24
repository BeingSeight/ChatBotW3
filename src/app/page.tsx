'use client';
import { useState, useRef, useEffect } from 'react';

type Message = {
  role: 'assistant' | 'user';
  content: string;
  timestamp?: number;
};

export default function Home() {
  const [theInput, setTheInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Yo, this is ChatterBot! How can I help you today?',
      timestamp: Date.now(),
    },
  ]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      callGetResponse();
    }
  };

  const callGetResponse = async () => {
    if (!theInput.trim()) return;
    
    setIsLoading(true);

    // Add the user's message with timestamp
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: theInput, timestamp: Date.now() },
    ]);
    
    // Store current messages plus new user message
    const currentMessages = [
      ...messages, 
      { role: 'user', content: theInput, timestamp: Date.now() }
    ];
    
    setTheInput('');

    try {
      const response = await fetch('/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: currentMessages }),
      });
      const data = await response.json();

      if (data.error) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: data.error, timestamp: Date.now() },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { 
            role: 'assistant', 
            content: data.output.content,
            timestamp: Date.now()
          },
        ]);
      }
    } catch (err) {
      console.error('Fetch failed:', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Network error. Please try again.',
          timestamp: Date.now()
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Format timestamp
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Create a client-only component for timestamps
  const TimeDisplay = ({ timestamp }: { timestamp: number }) => {
    const [formattedTime, setFormattedTime] = useState('');
    
    useEffect(() => {
      // Only format the time on the client side
      setFormattedTime(formatTime(timestamp));
    }, [timestamp]);
    
    return formattedTime;
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:px-24 py-5 bg-gray-900">
      <div className="w-full max-w-3xl flex flex-col h-screen">
        <h1 className="text-4xl md:text-5xl font-bold text-center text-white mb-6">
          <span className="text-blue-500">Chatter</span>Bot
        </h1>

        {/* Chat container */}
        <div className="flex flex-col flex-grow bg-gray-800 rounded-xl overflow-hidden shadow-xl">
          {/* Messages area */}
          <div className="flex-grow p-4 overflow-y-auto flex flex-col space-y-4">
            {messages.map((message, index) => (
              <div 
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`
                  max-w-[80%] rounded-2xl px-4 py-3 
                  ${message.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : 'bg-gray-700 text-gray-100 rounded-tl-none'}
                `}>
                  <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                  {message.timestamp && (
                    <div className={`text-xs mt-1 ${message.role === 'user' ? 'text-blue-200' : 'text-gray-400'}`}>
                      <TimeDisplay timestamp={message.timestamp} />
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-700 text-white rounded-2xl rounded-tl-none px-4 py-3 max-w-[80%]">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="bg-gray-900 p-4">
            <div className="flex rounded-lg overflow-hidden bg-gray-800">
              <textarea
                value={theInput}
                onChange={(e) => setTheInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                className="flex-grow resize-none outline-none border-none bg-gray-800 text-white p-3 min-h-[50px] max-h-32"
                rows={1}
              />
              <button
                onClick={callGetResponse}
                disabled={isLoading || !theInput.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
