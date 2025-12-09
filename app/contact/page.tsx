"use client";

import { useLanguage } from "@/components/clerk-provider-with-locale";
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
  useAuth,
} from "@clerk/nextjs";
import { Mail, MessageSquare, Clock } from "lucide-react";

const translations = {
  en: {
    brand: "Customs AI",
    pricing: "Pricing",
    history: "History",
    about: "About",
    contact: "Contact",
    signIn: "Sign in",
    signUp: "Sign up",
    title: "Contact Us",
    subtitle: "We're here to help with any questions",
    emailTitle: "Email Support",
    emailDesc: "Send us an email and we'll respond within 24 hours",
    emailAddress: "team@customsai.co",
    responseTitle: "Response Time",
    responseDesc: "We typically respond within a few hours during business hours (9 AM - 6 PM ICT)",
    faqTitle: "Common Questions",
    faq1Q: "How accurate is the classification?",
    faq1A: "Our AI achieves 95%+ accuracy on standard products. For complex cases, we provide detailed reasoning and alternative codes.",
    faq2Q: "Do you support bulk classification?",
    faq2A: "Yes! Business plan subscribers have access to bulk classification via our API.",
    faq3Q: "Can I get a refund?",
    faq3A: "Yes, we offer a 7-day free trial on all plans. If you're not satisfied, cancel before the trial ends and you won't be charged.",
    faq4Q: "Which countries do you support?",
    faq4A: "We support Thai customs (8-digit HS codes) and international 6-digit codes. More countries coming soon.",
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
    title: "ติดต่อเรา",
    subtitle: "เราพร้อมช่วยเหลือทุกคำถาม",
    emailTitle: "สนับสนุนทางอีเมล",
    emailDesc: "ส่งอีเมลถึงเราและเราจะตอบกลับภายใน 24 ชั่วโมง",
    emailAddress: "team@customsai.co",
    responseTitle: "เวลาตอบกลับ",
    responseDesc: "เรามักจะตอบกลับภายในไม่กี่ชั่วโมงในเวลาทำการ (9.00 - 18.00 น.)",
    faqTitle: "คำถามที่พบบ่อย",
    faq1Q: "การจำแนกแม่นยำแค่ไหน?",
    faq1A: "AI ของเรามีความแม่นยำ 95%+ สำหรับสินค้าทั่วไป สำหรับกรณีซับซ้อน เราให้เหตุผลโดยละเอียดและรหัสทางเลือก",
    faq2Q: "รองรับการจำแนกแบบกลุ่มหรือไม่?",
    faq2A: "รองรับ! ผู้สมัครแผน Business สามารถเข้าถึงการจำแนกแบบกลุ่มผ่าน API ของเรา",
    faq3Q: "ขอคืนเงินได้หรือไม่?",
    faq3A: "ได้ เรามีทดลองใช้ฟรี 7 วันในทุกแผน หากคุณไม่พอใจ ยกเลิกก่อนหมดช่วงทดลองและจะไม่ถูกเรียกเก็บเงิน",
    faq4Q: "รองรับประเทศใดบ้าง?",
    faq4A: "เรารองรับศุลกากรไทย (รหัส HS 8 หลัก) และรหัสสากล 6 หลัก ประเทศอื่นๆ เร็วๆ นี้",
    copyright: "Customs AI สงวนลิขสิทธิ์",
  },
};

export default function ContactPage() {
  const { language, toggleLanguage } = useLanguage();
  const { isSignedIn } = useAuth();
  const t = translations[language];

  const faqs = [
    { q: t.faq1Q, a: t.faq1A },
    { q: t.faq2Q, a: t.faq2A },
    { q: t.faq3Q, a: t.faq3A },
    { q: t.faq4Q, a: t.faq4A },
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

        {/* Contact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200 text-center">
            <Mail className="w-10 h-10 text-gray-900 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-900 mb-2">{t.emailTitle}</h3>
            <p className="text-gray-600 text-sm mb-4">{t.emailDesc}</p>
            <a
              href={`mailto:${t.emailAddress}`}
              className="text-gray-900 font-medium hover:underline"
            >
              {t.emailAddress}
            </a>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200 text-center">
            <Clock className="w-10 h-10 text-gray-900 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-900 mb-2">{t.responseTitle}</h3>
            <p className="text-gray-600 text-sm">{t.responseDesc}</p>
          </div>
        </div>

        {/* FAQ */}
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
            {t.faqTitle}
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white/60 backdrop-blur-sm rounded-xl p-5 border border-gray-200"
              >
                <h3 className="font-medium text-gray-900 mb-2">{faq.q}</h3>
                <p className="text-gray-600 text-sm">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <p className="text-center text-gray-400 text-xs mt-16">
        &copy;2025 {t.copyright}
      </p>
    </main>
  );
}
