"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/components/clerk-provider-with-locale";
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
  useAuth,
} from "@clerk/nextjs";
import { Copy, Check, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { ClassificationChat } from "@/components/classification-chat";

const translations = {
  en: {
    brand: "Customs AI",
    pricing: "Pricing",
    history: "History",
    about: "About",
    contact: "Contact",
    signIn: "Sign in",
    signUp: "Sign up",
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
  },
  th: {
    brand: "Customs AI",
    pricing: "ราคา",
    history: "ประวัติ",
    about: "เกี่ยวกับ",
    contact: "ติดต่อ",
    signIn: "เข้าสู่ระบบ",
    signUp: "สมัครสมาชิก",
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
  },
};

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
            <a href="/history" className="text-sm font-medium text-gray-900">{t.history}</a>
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
              <SignInButton mode="modal">
                <button className="text-sm text-gray-600 hover:text-gray-900 transition-colors cursor-pointer">
                  {t.signIn}
                </button>
              </SignInButton>
              <SignUpButton mode="modal" unsafeMetadata={{ language }}>
                <button className="text-sm px-4 py-1.5 rounded-full bg-gray-900 text-white hover:bg-gray-800 transition-colors cursor-pointer">
                  {t.signUp}
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
            <SignInButton mode="modal">
              <button className="px-6 py-2.5 rounded-full bg-gray-900 text-white hover:bg-gray-800 transition-colors cursor-pointer">
                {t.signIn}
              </button>
            </SignInButton>
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
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 font-medium mb-2 line-clamp-2">
                        {item.description}
                      </p>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-gray-400">
                          {formatDate(item.created_at)}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getConfidenceColor(item.confidence)}`}>
                          {Math.round(item.confidence * 100)}% {t.confidence}
                        </span>
                      </div>
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
                      <ClassificationChat
                        context={{
                          product_description: item.description,
                          hs_code: item.hs_code,
                          hs_description: item.hs_description || "",
                          confidence: item.confidence,
                          reasoning: item.reasoning || "",
                        }}
                        buttonClassName="px-3 py-1.5 bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors cursor-pointer text-sm text-white font-medium"
                      />
                    </div>
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
    </main>
  );
}
