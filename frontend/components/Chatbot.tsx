"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
  pendingAction?: {
    tool: string;
    args: any;
  } | null;
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hi! I'm your AI Recruitment Assistant. How can I help you today?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { getToken } = useAuth();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const token = await getToken();
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "/api";
      
      const res = await fetch(`${baseUrl}/ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({
          message: userMessage,
          history: messages.slice(1).map(m => ({ role: m.role, content: m.content })),
          currentUrl: window.location.href
        })
      });

      if (!res.ok) throw new Error("Failed to send message");
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.data.reply, pendingAction: data.data.pendingAction }]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [...prev, { role: "assistant", content: "⚠️ Sorry, I encountered an error." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async (msgIndex: number, action: any) => {
    setIsLoading(true);
    // Remove the pending action from the message so buttons disappear
    setMessages(prev => prev.map((m, i) => i === msgIndex ? { ...m, pendingAction: null } : m));

    try {
      const token = await getToken();
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "/api";
      
      const res = await fetch(`${baseUrl}/ai/chat/execute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify(action)
      });

      if (!res.ok) throw new Error("Failed to execute action");
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.data.reply }]);
      
      // Dispatch a custom event to tell client components to silently re-fetch their data
      window.dispatchEvent(new Event('refresh-kanban'));
    } catch (error) {
      console.error(error);
      setMessages((prev) => [...prev, { role: "assistant", content: "⚠️ Action failed to execute." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = (msgIndex: number) => {
    setMessages(prev => prev.map((m, i) => i === msgIndex ? { ...m, pendingAction: null } : m));
    setMessages((prev) => [...prev, { role: "assistant", content: "Action cancelled." }]);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-[9999] bg-indigo-600 text-white p-4 rounded-full shadow-2xl hover:bg-indigo-700 transition-transform transform hover:scale-105 active:scale-95 flex items-center justify-center"
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        ) : (
          <span className="text-xl">🤖</span>
        )}
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[500px] z-[9999] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5">
          <div className="bg-indigo-600 text-white p-4 font-bold flex items-center gap-2 shadow-sm">
            <span>🤖 AI Assistant</span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 text-sm">
            {messages.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2 shadow-sm ${
                  msg.role === "user" 
                    ? "bg-indigo-600 text-white rounded-br-none" 
                    : "bg-white border text-gray-800 rounded-bl-none prose prose-sm prose-indigo"
                }`}>
                  {msg.role === "user" ? msg.content : <ReactMarkdown>{msg.content}</ReactMarkdown>}
                </div>
                
                {msg.pendingAction && (
                  <div className="mt-2 flex gap-2 ml-2">
                    <button 
                      onClick={() => handleConfirm(i, msg.pendingAction)}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg font-medium text-xs shadow-sm transition"
                    >
                      Confirm Execution
                    </button>
                    <button 
                      onClick={() => handleCancel(i)}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1.5 rounded-lg font-medium text-xs shadow-sm transition"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex items-center gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} className="p-3 bg-white border-t flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything..."
              className="flex-1 border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
              disabled={isLoading}
            />
            <button 
              type="submit" 
              disabled={isLoading || !input.trim()}
              className="bg-indigo-600 text-white rounded-full p-2 w-10 h-10 flex items-center justify-center disabled:opacity-50 hover:bg-indigo-700 transition shadow-sm"
            >
              <svg className="w-5 h-5 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            </button>
          </form>
        </div>
      )}
    </>
  );
}
