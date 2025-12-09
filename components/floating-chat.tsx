"use client";

import { useState, useRef, useEffect } from "react";
import { X, ArrowUp, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useLanguage } from "@/components/clerk-provider-with-locale";

const translations = {
  en: {
    askAI: "Ask AI",
    about: "About",
    assistant: "AHTN 2022 Assistant",
    askAboutClassification: "Ask questions about this classification",
    askAnything: "Ask anything about AHTN 2022 codes",
    placeholder: "Ask a question...",
    error: "Sorry, something went wrong. Please try again.",
    // Suggested questions with context
    whyThisCode: "Why this code instead of alternatives?",
    dutyRate: "What's the duty rate?",
    documentsNeeded: "What documents are needed?",
    // Suggested questions without context
    classifyElectronics: "How do I classify electronics?",
    chapterDifference: "What's the difference between Chapter 84 and 85?",
    mixedMaterials: "How to classify mixed materials?",
  },
  th: {
    askAI: "ถาม AI",
    about: "เกี่ยวกับ",
    assistant: "ผู้ช่วย AHTN 2022",
    askAboutClassification: "ถามคำถามเกี่ยวกับการจำแนกนี้",
    askAnything: "ถามอะไรก็ได้เกี่ยวกับรหัส AHTN 2022",
    placeholder: "ถามคำถาม...",
    error: "ขออภัย เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง",
    // Suggested questions with context
    whyThisCode: "ทำไมถึงเลือกรหัสนี้แทนตัวเลือกอื่น?",
    dutyRate: "อัตราภาษีเท่าไหร่?",
    documentsNeeded: "ต้องใช้เอกสารอะไรบ้าง?",
    // Suggested questions without context
    classifyElectronics: "จำแนกสินค้าอิเล็กทรอนิกส์อย่างไร?",
    chapterDifference: "ความแตกต่างระหว่างบทที่ 84 และ 85 คืออะไร?",
    mixedMaterials: "จำแนกวัสดุผสมอย่างไร?",
  },
};

interface ClassificationContext {
  product_description: string;
  hs_code: string;
  hs_description: string;
  confidence: number;
  reasoning: string;
  alternatives?: Array<{
    hs_code: string;
    description: string;
    reason: string;
  }>;
  edge_cases?: Array<{
    condition: string;
    hs_code: string;
    description: string;
    explanation: string;
  }>;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface FloatingChatProps {
  classificationContext?: ClassificationContext | null;
}

export function FloatingChat({ classificationContext }: FloatingChatProps) {
  const { language } = useLanguage();
  const t = translations[language];

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Prevent body scroll when chat is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      // Use classification context if available, otherwise use general context
      const context = classificationContext || {
        product_description: "",
        hs_code: "general",
        hs_description: "General AHTN 2022 inquiry",
        confidence: 0,
        reasoning: "",
      };

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          context,
          history: messages,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      let assistantMessage = "";

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                assistantMessage += data.content;
                setMessages((prev) => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1] = {
                    role: "assistant",
                    content: assistantMessage,
                  };
                  return newMessages;
                });
              }
            } catch {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: t.error },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const suggestedQuestions = classificationContext
    ? [t.whyThisCode, t.dutyRate, t.documentsNeeded]
    : [t.classifyElectronics, t.chapterDifference, t.mixedMaterials];

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-full shadow-lg hover:bg-gray-800 transition-all z-40 ${
          isOpen ? "scale-0 opacity-0" : "scale-100 opacity-100"
        }`}
      >
        {t.askAI}
      </button>

      {/* Chat modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Chat window */}
          <div
            className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col animate-in fade-in zoom-in-95 duration-200"
            style={{ height: "min(600px, calc(100vh - 4rem))" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div>
                <h3 className="font-semibold text-sm">{t.askAI}</h3>
                <p className="text-xs text-gray-500">
                  {classificationContext
                    ? `${t.about} ${classificationContext.hs_code}`
                    : t.assistant}
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                aria-label="Close chat"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 text-center">
                    {classificationContext
                      ? t.askAboutClassification
                      : t.askAnything}
                  </p>
                  <div className="space-y-2">
                    {suggestedQuestions.map((q, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setInput(q);
                          inputRef.current?.focus();
                        }}
                        className="w-full text-left text-sm px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-gray-700 cursor-pointer"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${
                        msg.role === "user"
                          ? "bg-black text-white rounded-br-sm"
                          : "bg-gray-100 text-gray-800 rounded-bl-sm"
                      }`}
                    >
                      {msg.role === "assistant" ? (
                        <div className="prose prose-sm prose-gray max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
              {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 px-3 py-2 rounded-2xl rounded-bl-sm">
                    <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t.placeholder}
                  className="flex-1 px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:border-gray-400 focus:bg-white transition-colors"
                  disabled={isLoading}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading}
                  className="w-9 h-9 bg-black text-white rounded-full flex items-center justify-center hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  aria-label="Send message"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ArrowUp className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
