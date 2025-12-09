"use client";

import { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/components/clerk-provider-with-locale";
import {
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
  useAuth,
} from "@clerk/nextjs";
import { Copy, Check, Clock, ChevronDown, ChevronUp, X, ArrowUp, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

const translations = {
  en: {
    brand: "Customs AI",
    pricing: "Pricing",
    history: "History",
    about: "About",
    contact: "Contact",
    getStarted: "Get Started",
    title: "Classification History",
    subtitle: "View your past HS code classifications",
    noHistory: "No classifications yet",
    noHistoryDesc: "Your classification history will appear here after you classify your first product.",
    startClassifying: "Start Classifying",
    loading: "Loading...",
    hsCode: "HS Code",
    confidence: "Confidence",
    copied: "Copied!",
    showMore: "Show details",
    showLess: "Hide details",
    reasoning: "Reasoning",
    signInRequired: "Sign in to view your history",
    signInDesc: "Create an account or sign in to access your classification history.",
    copyright: "Customs AI. All rights reserved.",
    askAI: "Ask AI",
    chatAbout: "About",
    askAboutClassification: "Ask questions about this classification",
    placeholder: "Ask a question...",
    error: "Sorry, something went wrong. Please try again.",
    whyThisCode: "Why this code instead of alternatives?",
    dutyRate: "What's the duty rate?",
    documentsNeeded: "What documents are needed?",
  },
  th: {
    brand: "Customs AI",
    pricing: "ราคา",
    history: "ประวัติ",
    about: "เกี่ยวกับ",
    contact: "ติดต่อ",
    getStarted: "เริ่มต้นใช้งาน",
    title: "ประวัติการจำแนก",
    subtitle: "ดูประวัติการจำแนกพิกัดศุลกากรของคุณ",
    noHistory: "ยังไม่มีประวัติ",
    noHistoryDesc: "ประวัติการจำแนกจะปรากฏที่นี่หลังจากคุณจำแนกสินค้าชิ้นแรก",
    startClassifying: "เริ่มจำแนก",
    loading: "กำลังโหลด...",
    hsCode: "รหัส HS",
    confidence: "ความเชื่อมั่น",
    copied: "คัดลอกแล้ว!",
    showMore: "แสดงรายละเอียด",
    showLess: "ซ่อนรายละเอียด",
    reasoning: "เหตุผล",
    signInRequired: "เข้าสู่ระบบเพื่อดูประวัติ",
    signInDesc: "สร้างบัญชีหรือเข้าสู่ระบบเพื่อเข้าถึงประวัติการจำแนก",
    copyright: "Customs AI สงวนลิขสิทธิ์",
    askAI: "ถาม AI",
    chatAbout: "เกี่ยวกับ",
    askAboutClassification: "ถามคำถามเกี่ยวกับการจำแนกนี้",
    placeholder: "ถามคำถาม...",
    error: "ขออภัย เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง",
    whyThisCode: "ทำไมถึงเลือกรหัสนี้แทนตัวเลือกอื่น?",
    dutyRate: "อัตราภาษีเท่าไหร่?",
    documentsNeeded: "ต้องใช้เอกสารอะไรบ้าง?",
  },
};

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ClassificationContext {
  product_description: string;
  hs_code: string;
  hs_description: string;
  confidence: number;
  reasoning: string;
}

interface Classification {
  id: string;
  description: string;
  hs_code: string;
  hs_description?: string;
  confidence: number;
  reasoning?: string;
  created_at: string;
}

export default function HistoryPage() {
  const { language, toggleLanguage } = useLanguage();
  const { isSignedIn } = useAuth();
  const t = translations[language];

  const [history, setHistory] = useState<Classification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Chat state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatContext, setChatContext] = useState<ClassificationContext | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSignedIn) {
      fetch("/api/user/history")
        .then((res) => res.json())
        .then((data) => {
          setHistory(data.history || []);
        })
        .catch((err) => {
          console.error("Error fetching history:", err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else if (isSignedIn === false) {
      setIsLoading(false);
    }
  }, [isSignedIn]);

  // Chat effects
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  useEffect(() => {
    if (isChatOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isChatOpen]);

  useEffect(() => {
    if (isChatOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isChatOpen]);

  const openChat = (item: Classification) => {
    setChatContext({
      product_description: item.description,
      hs_code: item.hs_code,
      hs_description: item.hs_description || "",
      confidence: item.confidence,
      reasoning: item.reasoning || "",
    });
    setChatMessages([]);
    setChatInput("");
    setIsChatOpen(true);
  };

  const sendMessage = async () => {
    if (!chatInput.trim() || isChatLoading || !chatContext) return;

    const userMessage = chatInput.trim();
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsChatLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          context: chatContext,
          history: chatMessages,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      let assistantMessage = "";

      setChatMessages((prev) => [...prev, { role: "assistant", content: "" }]);

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
                setChatMessages((prev) => {
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
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: t.error },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const suggestedQuestions = [t.whyThisCode, t.dutyRate, t.documentsNeeded];

  const copyToClipboard = async (code: string, id: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === "th" ? "th-TH" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return "text-green-600 bg-green-50";
    if (confidence >= 0.7) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  return (
    <main className="gradient-bg min-h-screen flex flex-col items-center px-4 pb-16">
      {/* Navbar */}
      <nav className="w-full h-14 mb-16">
        <div className="flex items-center justify-between h-full max-w-3xl mx-auto">
          <div className="flex items-center gap-6">
            <a href="/" className="text-lg font-semibold text-gray-900 hover:text-gray-700 transition-colors tracking-tighter">{t.brand}</a>
            <a href="/pricing" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">{t.pricing}</a>
            {isSignedIn && (
              <a href="/history" className="text-sm font-medium text-gray-900">{t.history}</a>
            )}
            <a href="/about" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">{t.about}</a>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleLanguage}
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors cursor-pointer font-medium"
              title={language === "en" ? "Switch to Thai" : "เปลี่ยนเป็นภาษาอังกฤษ"}
            >
              {language === "en" ? "TH" : "EN"}
            </button>
            <SignedOut>
              <SignUpButton mode="modal" unsafeMetadata={{ language }}>
                <button className="text-sm px-4 py-1.5 rounded-full bg-gray-900 text-white hover:bg-gray-800 transition-colors cursor-pointer">
                  {t.getStarted}
                </button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <UserButton />
            </SignedIn>
          </div>
        </div>
      </nav>

      <div className="w-full max-w-3xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-semibold text-gray-900 mb-4 tracking-tight">
            {t.title}
          </h1>
          <p className="text-gray-500 text-lg">{t.subtitle}</p>
        </div>

        {/* Content */}
        <SignedOut>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 text-center border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{t.signInRequired}</h2>
            <p className="text-gray-500 mb-6">{t.signInDesc}</p>
            <SignUpButton mode="modal" unsafeMetadata={{ language }}>
              <button className="px-6 py-2.5 rounded-full bg-gray-900 text-white hover:bg-gray-800 transition-colors cursor-pointer">
                {t.getStarted}
              </button>
            </SignUpButton>
          </div>
        </SignedOut>

        <SignedIn>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full mx-auto mb-4" />
              <p className="text-gray-500">{t.loading}</p>
            </div>
          ) : history.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 text-center border border-gray-200">
              <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">{t.noHistory}</h2>
              <p className="text-gray-500 mb-6">{t.noHistoryDesc}</p>
              <a
                href="/"
                className="inline-block px-6 py-2.5 rounded-full bg-gray-900 text-white hover:bg-gray-800 transition-colors"
              >
                {t.startClassifying}
              </a>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="bg-white/80 backdrop-blur-sm rounded-xl p-5 border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  <p className="text-gray-900 font-medium mb-2 line-clamp-2">
                    {item.description}
                  </p>
                  <div className="flex items-center gap-3 text-sm mb-3">
                    <span className="text-gray-400">
                      {formatDate(item.created_at)}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getConfidenceColor(item.confidence)}`}>
                      {Math.round(item.confidence * 100)}% {t.confidence}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyToClipboard(item.hs_code, item.id)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
                    >
                      <span className="font-mono font-medium text-gray-900">
                        {item.hs_code}
                      </span>
                      {copiedId === item.id ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                    <button
                      onClick={() => openChat(item)}
                      className="px-3 py-1.5 bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors cursor-pointer text-sm text-white font-medium"
                    >
                      {t.askAI}
                    </button>
                  </div>

                  {item.hs_description && (
                    <p className="text-sm text-gray-500 mt-2">{item.hs_description}</p>
                  )}

                  {item.reasoning && (
                    <div className="mt-3">
                      <button
                        onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
                      >
                        {expandedId === item.id ? (
                          <>
                            <ChevronUp className="w-4 h-4" />
                            {t.showLess}
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4" />
                            {t.showMore}
                          </>
                        )}
                      </button>
                      {expandedId === item.id && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs font-medium text-gray-500 mb-1">{t.reasoning}</p>
                          <p className="text-sm text-gray-700">{item.reasoning}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </SignedIn>
      </div>

      {/* Footer */}
      <p className="text-center text-gray-400 text-xs mt-16">
        &copy;2025 {t.copyright}
      </p>

      {/* Global Chat Modal */}
      {isChatOpen && chatContext && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setIsChatOpen(false)}
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
                <p className="text-xs text-gray-500">{t.chatAbout} {chatContext.hs_code}</p>
              </div>
              <button
                onClick={() => setIsChatOpen(false)}
                className="p-1.5 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                aria-label="Close chat"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.length === 0 ? (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 text-center">
                    {t.askAboutClassification}
                  </p>
                  <div className="space-y-2">
                    {suggestedQuestions.map((q, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setChatInput(q);
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
                chatMessages.map((msg, i) => (
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
              {isChatLoading && chatMessages[chatMessages.length - 1]?.role !== "assistant" && (
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
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t.placeholder}
                  className="flex-1 px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:border-gray-400 focus:bg-white transition-colors"
                  disabled={isChatLoading}
                />
                <button
                  onClick={sendMessage}
                  disabled={!chatInput.trim() || isChatLoading}
                  className="w-9 h-9 bg-black text-white rounded-full flex items-center justify-center hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  aria-label="Send message"
                >
                  {isChatLoading ? (
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
    </main>
  );
}
