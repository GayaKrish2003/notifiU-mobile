import React, { useState, useRef, useEffect } from "react";
import { Send, Loader2, Bot } from "lucide-react";
import { sendChatMessage } from "../services/api";
import type { ChatMessage } from "../services/api";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
}

const WELCOME_MESSAGE: Message = {
  id: 0,
  role: "assistant",
  content:
    "Hi! I'm your NotifiU AI assistant. Ask me anything about your modules, exams, fees, or how to use the portal.",
};

const ChatBot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const nextId = useRef(1);

  // Auto scroll inside chat only
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = async (): Promise<void> => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = {
      id: nextId.current++,
      role: "user",
      content: text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const history: ChatMessage[] = [...messages, userMsg]
        .filter((m) => m.id !== 0)
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const res = await sendChatMessage(history);

      const reply: Message = {
        id: nextId.current++,
        role: "assistant",
        content: (res.data as { message: string }).message,
      };

      setMessages((prev) => [...prev, reply]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: nextId.current++,
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>
  ): void => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="w-full flex flex-col items-center py-6 px-4">

      {/* Title */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-[#2D3A5D]">
          How can we help you?
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Ask questions or search FAQs instantly.
        </p>
      </div>

      {/* Chat Container */}
      <div className="w-full max-w-4xl h-[70vh] bg-white rounded-2xl shadow-md border border-gray-200 flex flex-col overflow-hidden">

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 bg-[#F9FAFB]">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {/* Bot Icon */}
              {msg.role === "assistant" && (
                <div className="w-8 h-8 bg-[#FBB017] rounded-full flex items-center justify-center mr-2">
                  <Bot size={14} className="text-[#1A1C2C]" />
                </div>
              )}

              {/* Message Bubble */}
              <div
                className={`max-w-[75%] px-4 py-3 rounded-xl text-sm ${
                  msg.role === "user"
                    ? "bg-[#1A1C2C] text-white"
                    : "bg-white border border-gray-200 text-[#2D3A5D]"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {/* Loading */}
          {loading && (
            <div className="flex items-center gap-2">
              <Loader2 className="animate-spin text-gray-400" size={16} />
              <span className="text-sm text-gray-400">Thinking...</span>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t px-4 py-3 flex items-center gap-3">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question..."
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#FBB017]"
          />

          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="bg-[#FBB017] px-4 py-2 rounded-lg text-white hover:bg-[#e0a000] disabled:opacity-50"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;