"use client";

import { useLanguage } from "@/components/clerk-provider-with-locale";
import {
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
  useAuth,
} from "@clerk/nextjs";
import { Zap, Shield, Globe, Brain, CheckCircle } from "lucide-react";

const translations = {
  en: {
    brand: "Customs AI",
    pricing: "Pricing",
    history: "History",
    about: "About",
    contact: "Contact",
    getStarted: "Get Started",
    title: "How It Works",
    subtitle: "AI-powered HS code classification for customs brokers",
    heroDescription: "Customs AI uses advanced artificial intelligence to analyze product descriptions and determine the most accurate HS (Harmonized System) codes for customs declarations.",
    step1Title: "1. Describe Your Product",
    step1Desc: "Enter a detailed description of your product in any language. Include materials, function, and intended use for best results.",
    step2Title: "2. AI Analysis",
    step2Desc: "Our AI analyzes your description against millions of trade records and the complete HS nomenclature to find the best match.",
    step3Title: "3. Get Your HS Code",
    step3Desc: "Receive the recommended HS code with confidence score, reasoning, and alternative codes for edge cases.",
    featuresTitle: "Why Choose Customs AI",
    feature1Title: "Fast & Accurate",
    feature1Desc: "Get classifications in seconds with 95%+ accuracy on standard products",
    feature2Title: "Multi-Language",
    feature2Desc: "Enter descriptions in Thai, English, Chinese, or any language",
    feature3Title: "Smart Reasoning",
    feature3Desc: "Understand why a code was selected with detailed explanations",
    feature4Title: "Thai Customs Ready",
    feature4Desc: "Optimized for Thai customs requirements and local regulations",
    ctaTitle: "Ready to try it?",
    ctaButton: "Start Classifying",
    copyright: "Customs AI. All rights reserved.",
  },
  th: {
    brand: "Customs AI",
    pricing: "ราคา",
    history: "ประวัติ",
    about: "เกี่ยวกับ",
    contact: "ติดต่อ",
    getStarted: "เริ่มต้นใช้งาน",
    title: "วิธีการทำงาน",
    subtitle: "การจำแนกพิกัดศุลกากรด้วย AI สำหรับตัวแทนศุลกากร",
    heroDescription: "Customs AI ใช้ปัญญาประดิษฐ์ขั้นสูงในการวิเคราะห์คำอธิบายสินค้าและกำหนดรหัส HS (Harmonized System) ที่แม่นยำที่สุดสำหรับการสำแดงศุลกากร",
    step1Title: "1. อธิบายสินค้าของคุณ",
    step1Desc: "ใส่คำอธิบายสินค้าของคุณอย่างละเอียดในภาษาใดก็ได้ ระบุวัสดุ ฟังก์ชัน และการใช้งานเพื่อผลลัพธ์ที่ดีที่สุด",
    step2Title: "2. การวิเคราะห์ด้วย AI",
    step2Desc: "AI ของเราวิเคราะห์คำอธิบายของคุณกับบันทึกการค้าหลายล้านรายการและ HS nomenclature ทั้งหมดเพื่อหาการจับคู่ที่ดีที่สุด",
    step3Title: "3. รับรหัส HS ของคุณ",
    step3Desc: "รับรหัส HS ที่แนะนำพร้อมคะแนนความเชื่อมั่น เหตุผล และรหัสทางเลือกสำหรับกรณีพิเศษ",
    featuresTitle: "ทำไมต้องเลือก Customs AI",
    feature1Title: "รวดเร็วและแม่นยำ",
    feature1Desc: "รับการจำแนกภายในไม่กี่วินาทีด้วยความแม่นยำ 95%+ สำหรับสินค้าทั่วไป",
    feature2Title: "หลายภาษา",
    feature2Desc: "ใส่คำอธิบายเป็นภาษาไทย อังกฤษ จีน หรือภาษาใดก็ได้",
    feature3Title: "อธิบายเหตุผลอย่างชาญฉลาด",
    feature3Desc: "เข้าใจว่าทำไมรหัสถูกเลือกด้วยคำอธิบายโดยละเอียด",
    feature4Title: "พร้อมสำหรับศุลกากรไทย",
    feature4Desc: "ปรับให้เหมาะกับข้อกำหนดศุลกากรไทยและกฎระเบียบท้องถิ่น",
    ctaTitle: "พร้อมที่จะลองใช้หรือยัง?",
    ctaButton: "เริ่มจำแนก",
    copyright: "Customs AI สงวนลิขสิทธิ์",
  },
};

export default function AboutPage() {
  const { language, toggleLanguage } = useLanguage();
  const { isSignedIn } = useAuth();
  const t = translations[language];

  const features = [
    { icon: Zap, title: t.feature1Title, desc: t.feature1Desc },
    { icon: Globe, title: t.feature2Title, desc: t.feature2Desc },
    { icon: Brain, title: t.feature3Title, desc: t.feature3Desc },
    { icon: Shield, title: t.feature4Title, desc: t.feature4Desc },
  ];

  return (
    <main className="gradient-bg min-h-screen flex flex-col items-center px-4 pb-16">
      {/* Navbar */}
      <nav className="w-full h-14 mb-16">
        <div className="flex items-center justify-between h-full max-w-3xl mx-auto">
          <div className="flex items-center gap-6">
            <a href="/" className="text-lg font-semibold text-gray-900 hover:text-gray-700 transition-colors tracking-tighter">{t.brand}</a>
            <a href="/pricing" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">{t.pricing}</a>
            {isSignedIn && (
              <a href="/history" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">{t.history}</a>
            )}
            <a href="/about" className="text-sm font-medium text-gray-900">{t.about}</a>
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
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-semibold text-gray-900 mb-4 tracking-tight">
            {t.title}
          </h1>
          <p className="text-gray-500 text-lg mb-6">{t.subtitle}</p>
          <p className="text-gray-600 max-w-2xl mx-auto">{t.heroDescription}</p>
        </div>

        {/* Steps */}
        <div className="space-y-6 mb-16">
          {[
            { title: t.step1Title, desc: t.step1Desc },
            { title: t.step2Title, desc: t.step2Desc },
            { title: t.step3Title, desc: t.step3Desc },
          ].map((step, index) => (
            <div
              key={index}
              className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200 flex gap-4"
            >
              <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center flex-shrink-0 text-sm font-medium">
                {index + 1}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">{step.title.replace(/^\d+\.\s*/, "")}</h3>
                <p className="text-gray-600 text-sm">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Features */}
        <div className="mb-16">
          <h2 className="text-2xl font-semibold text-gray-900 mb-8 text-center">
            {t.featuresTitle}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white/60 backdrop-blur-sm rounded-xl p-5 border border-gray-200"
              >
                <feature.icon className="w-8 h-8 text-gray-900 mb-3" />
                <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center bg-gray-900 rounded-2xl p-10">
          <h2 className="text-2xl font-semibold text-white mb-6">
            {t.ctaTitle}
          </h2>
          <a
            href="/"
            className="inline-block px-8 py-3 bg-white text-gray-900 rounded-full font-medium hover:bg-gray-100 transition-colors"
          >
            {t.ctaButton}
          </a>
        </div>
      </div>

      {/* Footer */}
      <p className="text-center text-gray-400 text-xs mt-16">
        &copy;2025 {t.copyright}
      </p>
    </main>
  );
}
