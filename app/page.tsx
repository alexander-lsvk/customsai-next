"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
  useAuth,
} from "@clerk/nextjs";
import { useLanguage } from "@/components/clerk-provider-with-locale";

const translations = {
  en: {
    brand: "Customs AI",
    pricing: "Pricing",
    signIn: "Sign in",
    signUp: "Sign up",
    heroTitle1: "Your",
    heroTitle2: "smart assistant",
    heroTitle3: "for",
    heroTitle4: "customs classification.",
    heroSubtitle1: "AI-powered customs classification for ASEAN imports & exports.",
    heroSubtitle2: "Get HS codes in seconds, not hours. Save time, manpower, and avoid fines.",
    describeProduct: "Describe your product",
    placeholder: "Brand names like 'Labubu' or 'iPhone' work, but add details for better accuracy (e.g. 'Labubu keychain, plastic, 5cm')",
    classify: "Classify",
    classifying: "Classifying...",
    interpretedAs: "Interpreted as",
    hsCode: "HS Code",
    copy: "Copy",
    copied: "Copied",
    confidence: "confidence",
    reasoning: "Reasoning",
    edgeCases: "Edge Cases",
    alternatives: "Alternatives",
    disclaimer: "Disclaimer:",
    disclaimerText: "This tool provides AI-generated HS code suggestions for reference only. Classifications may contain errors and should be verified with official customs authorities before use. Always consult a licensed customs broker for final classification decisions.",
    copyright: "Customs AI. All rights reserved.",
    getStarted: "Get Started",
    noCreditCard: "No credit card required",
    creditsLeft: "classifications left",
    unlimited: "Unlimited",
    // Upgrade modal
    upgradeTitle: "You've used all 5 free classifications",
    upgradeSubtitle: "Start your 7-day free trial to continue classifying",
    startFreeTrial: "Start Free Trial",
    perMonth: "/month",
    classificationsPerMonth: "classifications/month",
    viewAllPlans: "View all plans",
    trialNote: "7-day free trial, cancel anytime",
  },
  th: {
    brand: "Customs AI",
    pricing: "ราคา",
    signIn: "เข้าสู่ระบบ",
    signUp: "สมัครสมาชิก",
    heroTitle1: "ผู้ช่วย",
    heroTitle2: "อัจฉริยะ",
    heroTitle3: "สำหรับ",
    heroTitle4: "การจำแนกพิกัดศุลกากร",
    heroSubtitle1: "ระบบจำแนกพิกัดศุลกากรด้วย AI สำหรับการนำเข้า-ส่งออกอาเซียน",
    heroSubtitle2: "รับรหัส HS ในไม่กี่วินาที ประหยัดเวลา กำลังคน และหลีกเลี่ยงค่าปรับ",
    describeProduct: "อธิบายสินค้าของคุณ",
    placeholder: "ชื่อแบรนด์เช่น 'Labubu' หรือ 'iPhone' ใช้ได้ แต่เพิ่มรายละเอียดเพื่อความแม่นยำ (เช่น 'พวงกุญแจ Labubu พลาสติก 5 ซม.')",
    classify: "จำแนก",
    classifying: "กำลังจำแนก...",
    interpretedAs: "ตีความเป็น",
    hsCode: "รหัส HS",
    copy: "คัดลอก",
    copied: "คัดลอกแล้ว",
    confidence: "ความมั่นใจ",
    reasoning: "เหตุผล",
    edgeCases: "กรณีพิเศษ",
    alternatives: "ทางเลือกอื่น",
    disclaimer: "ข้อจำกัดความรับผิดชอบ:",
    disclaimerText: "เครื่องมือนี้ให้คำแนะนำรหัส HS ที่สร้างโดย AI เพื่อการอ้างอิงเท่านั้น การจำแนกอาจมีข้อผิดพลาดและควรตรวจสอบกับหน่วยงานศุลกากรอย่างเป็นทางการก่อนใช้งาน ควรปรึกษานายหน้าศุลกากรที่ได้รับอนุญาตสำหรับการตัดสินใจจำแนกขั้นสุดท้าย",
    copyright: "Customs AI สงวนลิขสิทธิ์",
    getStarted: "เริ่มต้นใช้งาน",
    noCreditCard: "ไม่ต้องใช้บัตรเครดิต",
    creditsLeft: "ครั้งที่เหลือ",
    unlimited: "ไม่จำกัด",
    // Upgrade modal
    upgradeTitle: "คุณใช้ครบ 5 ครั้งฟรีแล้ว",
    upgradeSubtitle: "เริ่มทดลองใช้ฟรี 7 วันเพื่อจำแนกต่อ",
    startFreeTrial: "เริ่มทดลองใช้ฟรี",
    perMonth: "/เดือน",
    classificationsPerMonth: "การจำแนก/เดือน",
    viewAllPlans: "ดูแผนทั้งหมด",
    trialNote: "ทดลองใช้ฟรี 7 วัน ยกเลิกได้ทุกเมื่อ",
  },
};

interface Alternative {
  hs_code: string;
  description: string;
  reason: string;
}

interface EdgeCase {
  condition: string;
  hs_code: string;
  description: string;
  explanation: string;
}

interface ClassificationResult {
  primary_hs_code_thailand: string;
  primary_description?: string;
  confidence: number;
  alternatives: Alternative[];
  reasoning: string;
  interpreted_product?: string;
  edge_cases?: EdgeCase[];
}

// Try to parse partial JSON, returning what we can
function parsePartialJSON(text: string): Partial<ClassificationResult> | null {
  try {
    // Try complete parse first
    const parsed = JSON.parse(text);
    return {
      primary_hs_code_thailand: parsed.primary_hs_code,
      confidence: parsed.confidence,
      reasoning: parsed.reasoning,
      alternatives: parsed.alternatives || [],
      interpreted_product: parsed.interpreted_product,
      primary_description: parsed.primary_description,
      edge_cases: parsed.edge_cases || [],
    };
  } catch {
    // Try to extract individual fields from partial JSON
    const result: Partial<ClassificationResult> = {};

    // Extract interpreted_product
    const interpretedMatch = text.match(/"interpreted_product"\s*:\s*"([^"]*(?:\\.[^"]*)*)"/);
    if (interpretedMatch) result.interpreted_product = interpretedMatch[1].replace(/\\"/g, '"');

    // Extract primary_hs_code
    const hsCodeMatch = text.match(/"primary_hs_code"\s*:\s*"([^"]+)"/);
    if (hsCodeMatch) result.primary_hs_code_thailand = hsCodeMatch[1];

    // Extract primary_description
    const descMatch = text.match(/"primary_description"\s*:\s*"([^"]*(?:\\.[^"]*)*)"/);
    if (descMatch) result.primary_description = descMatch[1].replace(/\\"/g, '"');

    // Extract confidence
    const confMatch = text.match(/"confidence"\s*:\s*(0\.\d+)/);
    if (confMatch) result.confidence = parseFloat(confMatch[1]);

    // Extract reasoning (might be partial)
    const reasoningMatch = text.match(/"reasoning"\s*:\s*"((?:[^"\\]|\\.)*)(?:"|$)/);
    if (reasoningMatch) result.reasoning = reasoningMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n');

    // Extract edge_cases array - find complete objects
    const edgeCasesMatch = text.match(/"edge_cases"\s*:\s*\[([\s\S]*)/);
    if (edgeCasesMatch) {
      const edgeCases: EdgeCase[] = [];
      const edgeRegex = /\{\s*"condition"\s*:\s*"([^"]*(?:\\.[^"]*)*)"\s*,\s*"hs_code"\s*:\s*"([^"]+)"\s*,\s*"description"\s*:\s*"([^"]*(?:\\.[^"]*)*)"\s*,\s*"explanation"\s*:\s*"([^"]*(?:\\.[^"]*)*)"\s*\}/g;
      let match;
      while ((match = edgeRegex.exec(edgeCasesMatch[1])) !== null) {
        edgeCases.push({
          condition: match[1].replace(/\\"/g, '"').replace(/\\n/g, '\n'),
          hs_code: match[2],
          description: match[3].replace(/\\"/g, '"'),
          explanation: match[4].replace(/\\"/g, '"').replace(/\\n/g, '\n'),
        });
      }
      if (edgeCases.length > 0) result.edge_cases = edgeCases;
    }

    // Extract alternatives array - find complete objects
    const alternativesMatch = text.match(/"alternatives"\s*:\s*\[([\s\S]*)/);
    if (alternativesMatch) {
      const alternatives: Alternative[] = [];
      const altRegex = /\{\s*"hs_code"\s*:\s*"([^"]+)"\s*,\s*"description"\s*:\s*"([^"]*(?:\\.[^"]*)*)"\s*,\s*"reason"\s*:\s*"([^"]*(?:\\.[^"]*)*)"\s*\}/g;
      let match;
      while ((match = altRegex.exec(alternativesMatch[1])) !== null) {
        alternatives.push({
          hs_code: match[1],
          description: match[2].replace(/\\"/g, '"'),
          reason: match[3].replace(/\\"/g, '"').replace(/\\n/g, '\n'),
        });
      }
      if (alternatives.length > 0) result.alternatives = alternatives;
    }

    return Object.keys(result).length > 0 ? result : null;
  }
}

export default function Home() {
  const { isSignedIn } = useAuth();
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ClassificationResult | null>(null);
  const [partialResult, setPartialResult] = useState<Partial<ClassificationResult> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [creditsRemaining, setCreditsRemaining] = useState<number | null>(null);
  const { language, toggleLanguage } = useLanguage();

  const t = translations[language];

  useEffect(() => {
    if (isSignedIn) {
      fetch("/api/user/credits")
        .then((res) => res.json())
        .then((data) => {
          if (data.credits_remaining !== undefined) {
            setCreditsRemaining(data.credits_remaining);
          }
        })
        .catch((err) => {
          console.error("Error fetching credits:", err);
        });
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

  const handleStartTrial = async (plan: "growth" | "professional" | "business") => {
    setIsCheckingOut(true);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Checkout error:", err);
      setIsCheckingOut(false);
    }
  };

  const handleClassify = async () => {
    if (!description.trim()) return;

    setIsLoading(true);
    setError(null);
    setResult(null);
    setPartialResult(null);

    try {
      const response = await fetch("/api/classify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ description: description.trim() }),
      });

      if (!response.ok) {
        if (response.status === 402) {
          setShowUpgradeModal(true);
          setIsLoading(false);
          return;
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Classification failed");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n\n").filter((line) => line.startsWith("data: "));

        for (const line of lines) {
          const jsonStr = line.replace("data: ", "");
          try {
            const data = JSON.parse(jsonStr);

            if (data.error) {
              throw new Error(data.error);
            }

            if (data.fullText) {
              const partial = parsePartialJSON(data.fullText);
              if (partial) setPartialResult(partial);
            }

            if (data.done && data.result) {
              setPartialResult(null);
              setResult(data.result);
              setIsLoading(false);
              // Update credits count after successful classification
              setCreditsRemaining((prev) => (prev !== null && prev > 0 ? prev - 1 : prev));
            }
          } catch (e) {
            if (e instanceof SyntaxError) continue;
            throw e;
          }
        }
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to classify. Please try again."
      );
      setIsLoading(false);
    }
  };

  return (
    <main className="gradient-bg min-h-screen flex flex-col items-center px-4 pb-16">
      {/* Navbar */}
      <nav className="w-full h-14 mb-16">
        <div className="flex items-center justify-between h-full max-w-3xl mx-auto">
          <div className="flex items-center gap-6">
            <a href="/" className="text-lg font-semibold text-gray-900 hover:text-gray-700 transition-colors tracking-tighter">{t.brand}</a>
            <a href="/pricing" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">{t.pricing}</a>
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
              <SignUpButton mode="modal">
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

      <div className="relative z-10 w-full max-w-3xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-semibold text-gray-900 mb-4 tracking-tight leading-tight">
            {t.heroTitle1}{" "}
            <span className="italic font-thin" style={{ fontFamily: "'PP Editorial New', serif" }}>{t.heroTitle2}</span>{" "}
            {t.heroTitle3}
            <br />
            {t.heroTitle4}
          </h1>
          <p className="text-gray-500 text-base md:text-lg">
            {t.heroSubtitle1}
            <br />
            {t.heroSubtitle2}
          </p>
          <SignedOut>
            <div className="mt-6">
              <SignUpButton mode="modal">
                <button className="px-6 py-2.5 rounded-full bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors cursor-pointer">
                  {t.getStarted}
                </button>
              </SignUpButton>
              <p className="text-gray-400 text-xs mt-2">{t.noCreditCard}</p>
            </div>
          </SignedOut>
        </div>

        {/* Card */}
        <Card className="glass-card rounded-2xl border-0 overflow-hidden">
          <CardContent className="p-6 md:p-8">
            {/* Input Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between h-6">
                <label className="text-sm font-semibold text-gray-700">
                  {t.describeProduct}
                </label>
                {isSignedIn && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full min-w-[140px] h-6 flex items-center justify-center">
                    {creditsRemaining === null ? (
                      <span className="inline-block w-20 h-3 bg-gray-200 rounded animate-pulse" />
                    ) : creditsRemaining === -1 ? (
                      t.unlimited
                    ) : (
                      `${creditsRemaining} ${t.creditsLeft}`
                    )}
                  </span>
                )}
              </div>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t.placeholder}
                className="glass-input min-h-[100px] text-gray-900 placeholder:text-gray-400 rounded-xl resize-none focus:ring-0 focus:outline-none transition-all duration-200 text-base"
              />

              {isSignedIn ? (
                <Button
                  onClick={handleClassify}
                  disabled={isLoading || !description.trim()}
                  className="w-full h-12 rounded-xl text-base font-medium bg-gray-900 hover:bg-gray-800 text-white transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <svg
                        className="animate-spin h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      {t.classifying}
                    </span>
                  ) : (
                    t.classify
                  )}
                </Button>
              ) : (
                <SignUpButton mode="modal">
                  <Button
                    disabled={!description.trim()}
                    className="w-full h-12 rounded-xl text-base font-medium bg-gray-900 hover:bg-gray-800 text-white transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {t.classify}
                  </Button>
                </SignUpButton>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-100">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

          </CardContent>
        </Card>

        {/* Results Section - show skeleton or data */}
        {(isLoading || result || partialResult) && (() => {
          const displayResult = result || partialResult;
          const Skeleton = ({ className }: { className?: string }) => (
            <div className={`animate-pulse bg-gray-200 rounded ${className || ""}`} />
          );
          return (
            <div className="mt-8 space-y-4">
              {/* Primary Result Card */}
              <Card className="glass-card rounded-2xl border-0">
                <CardContent className="p-6 text-center">
                  {/* Interpreted Product */}
                  <div className="mb-4 pb-4 border-b border-gray-100">
                    <span className="text-gray-400 text-xs uppercase tracking-wider">
                      {t.interpretedAs}
                    </span>
                    {displayResult?.interpreted_product ? (
                      <p className="text-gray-700 text-base font-medium mt-1">
                        {displayResult.interpreted_product}
                      </p>
                    ) : (
                      <Skeleton className="h-5 w-48 mx-auto mt-1" />
                    )}
                  </div>

                  <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">
                    {t.hsCode}
                  </p>
                  {displayResult?.primary_hs_code_thailand ? (
                    <>
                      <p className="text-3xl md:text-4xl font-semibold text-gray-900 font-mono tracking-wide">
                        {displayResult.primary_hs_code_thailand}
                      </p>
                      <button
                        onClick={() => copyToClipboard(displayResult.primary_hs_code_thailand!, "primary")}
                        className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors cursor-pointer"
                        title="Copy HS code"
                      >
                        {copiedId === "primary" ? (
                          <>
                            <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-emerald-600 text-xs">{t.copied}</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            <span className="text-gray-600 text-xs">{t.copy}</span>
                          </>
                        )}
                      </button>
                    </>
                  ) : (
                    <Skeleton className="h-10 w-40 mx-auto" />
                  )}

                  {displayResult?.primary_description ? (
                    <p className="text-gray-500 text-sm mt-3">
                      {displayResult.primary_description}
                    </p>
                  ) : (
                    <Skeleton className="h-4 w-56 mx-auto mt-3" />
                  )}

                  {displayResult?.confidence != null ? (
                    <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-50">
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${displayResult.confidence >= 0.8
                          ? "bg-emerald-500"
                          : displayResult.confidence >= 0.6
                            ? "bg-amber-500"
                            : "bg-red-500"
                          }`}
                      />
                      <span className="text-gray-600 text-xs">
                        {(displayResult.confidence * 100).toFixed(0)}% {t.confidence}
                      </span>
                    </div>
                  ) : (
                    <Skeleton className="h-6 w-28 mx-auto mt-3 rounded-full" />
                  )}
                </CardContent>
              </Card>

              {/* Reasoning */}
              <Card className="glass-card rounded-2xl border-0">
                <CardContent className="p-5">
                  <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">
                    {t.reasoning}
                  </p>
                  {displayResult?.reasoning ? (
                    <div className="text-gray-600 text-sm leading-relaxed prose prose-sm prose-gray max-w-none">
                      <ReactMarkdown>{displayResult.reasoning}</ReactMarkdown>
                      {isLoading && <span className="animate-pulse">▋</span>}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Edge Cases */}
              <Card className="glass-card rounded-2xl border-0 border-l-4 border-l-amber-400">
                <CardContent className="p-5">
                  <p className="text-amber-600 text-xs uppercase tracking-wider mb-3">
                    {t.edgeCases}
                  </p>
                  {displayResult?.edge_cases && displayResult.edge_cases.length > 0 ? (
                    <div className="space-y-3">
                      {displayResult.edge_cases.map((edge, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <button
                            onClick={() => copyToClipboard(edge.hs_code, `edge-${index}`)}
                            className="relative shrink-0 cursor-pointer group"
                            title="Click to copy"
                          >
                            <code className="text-sm font-medium font-mono text-amber-600 group-hover:text-amber-700 transition-colors">
                              {edge.hs_code}
                            </code>
                            {copiedId === `edge-${index}` && (
                              <span className="absolute inset-0 flex items-center justify-center bg-white/80 rounded">
                                <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </span>
                            )}
                          </button>
                          <div>
                            <p className="text-gray-500 text-xs">
                              <span className="text-gray-700 text-sm font-semibold">{edge.description}</span>
                              <br />
                              {edge.condition}
                              <br />
                              {edge.explanation}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <Skeleton className="h-5 w-24 shrink-0" />
                        <div className="flex-1 space-y-1">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-3 w-2/3" />
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Alternatives */}
              <Card className="glass-card rounded-2xl border-0">
                <CardContent className="p-5">
                  <p className="text-gray-400 text-xs uppercase tracking-wider mb-3">
                    {t.alternatives}
                  </p>
                  {displayResult?.alternatives && displayResult.alternatives.length > 0 ? (
                    <div className="space-y-3">
                      {displayResult.alternatives.map((alt, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <button
                            onClick={() => copyToClipboard(alt.hs_code, `alt-${index}`)}
                            className="relative shrink-0 cursor-pointer group"
                            title="Click to copy"
                          >
                            <code className="text-sm font-medium font-mono text-gray-900 group-hover:text-gray-700 transition-colors">
                              {alt.hs_code}
                            </code>
                            {copiedId === `alt-${index}` && (
                              <span className="absolute inset-0 flex items-center justify-center bg-white/80 rounded">
                                <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </span>
                            )}
                          </button>
                          <div>
                            <p className="text-gray-500 text-xs">
                              {alt.description && (
                                <>
                                  <span className="text-gray-700 text-sm font-semibold">{alt.description}</span>
                                  <br />
                                </>
                              )}
                              {alt.reason}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <Skeleton className="h-5 w-24 shrink-0" />
                        <div className="flex-1 space-y-1">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Skeleton className="h-5 w-24 shrink-0" />
                        <div className="flex-1 space-y-1">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-2/3" />
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          );
        })()}

        {/* Disclaimer */}
        <Card className="glass-card rounded-2xl border-0 mt-10">
          <CardContent className="p-5">
            <p className="text-gray-500 text-xs text-center leading-relaxed">
              <span className="font-semibold text-gray-600">{t.disclaimer}</span> {t.disclaimerText}
            </p>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-gray-400 text-xs mt-6">
          &copy;2025 {t.copyright}
          <br />
          <a href="mailto:team@customsai.co" className="hover:text-gray-600 transition-colors">team@customsai.co</a>
        </p>
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowUpgradeModal(false)}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Close button */}
            <button
              onClick={() => setShowUpgradeModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">{t.upgradeTitle}</h2>
              <p className="text-gray-500 text-sm mt-1">{t.upgradeSubtitle}</p>
            </div>

            {/* Featured Growth Plan */}
            <div className="border-2 border-gray-900 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">Growth</h3>
                  <p className="text-gray-500 text-sm">300 {t.classificationsPerMonth}</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-gray-900">฿4,990</span>
                  <span className="text-gray-500 text-sm">{t.perMonth}</span>
                </div>
              </div>
              <Button
                onClick={() => handleStartTrial("growth")}
                disabled={isCheckingOut}
                className="w-full h-11 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-medium cursor-pointer disabled:cursor-not-allowed"
              >
                {isCheckingOut ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  </span>
                ) : (
                  t.startFreeTrial
                )}
              </Button>
              <p className="text-center text-gray-400 text-xs mt-2">{t.trialNote}</p>
            </div>

            {/* Other Plans */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                onClick={() => handleStartTrial("professional")}
                disabled={isCheckingOut}
                className="p-3 border border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-colors text-left disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
              >
                <p className="font-medium text-gray-900 text-sm">Professional</p>
                <p className="text-gray-500 text-xs">1,000 {t.classificationsPerMonth}</p>
                <p className="text-gray-900 font-semibold text-sm mt-1">฿9,990{t.perMonth}</p>
              </button>
              <button
                onClick={() => handleStartTrial("business")}
                disabled={isCheckingOut}
                className="p-3 border border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-colors text-left disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
              >
                <p className="font-medium text-gray-900 text-sm">Business</p>
                <p className="text-gray-500 text-xs">3,000 {t.classificationsPerMonth}</p>
                <p className="text-gray-900 font-semibold text-sm mt-1">฿24,990{t.perMonth}</p>
              </button>
            </div>

            {/* View All Plans */}
            <a
              href="/pricing"
              className="block text-center text-gray-500 hover:text-gray-700 text-sm transition-colors"
            >
              {t.viewAllPlans}
            </a>
          </div>
        </div>
      )}
    </main>
  );
}
