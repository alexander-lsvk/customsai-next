"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useLanguage } from "@/components/clerk-provider-with-locale";
import { CircleCheck, CheckCircle } from "lucide-react";

const translations = {
  en: {
    title: "Welcome to Customs AI!",
    subtitle: "Your subscription has been activated successfully.",
    trialInfo: "Your 7-day free trial has started. You won't be charged until the trial ends.",
    features: "What you can do now:",
    feature1: "Classify products with AI-powered accuracy",
    feature2: "Access detailed reasoning and alternatives",
    startButton: "Start Classifying",
  },
  th: {
    title: "ยินดีต้อนรับสู่ Customs AI!",
    subtitle: "การสมัครสมาชิกของคุณเปิดใช้งานเรียบร้อยแล้ว",
    trialInfo: "ช่วงทดลองใช้ฟรี 7 วันของคุณเริ่มต้นแล้ว จะไม่เรียกเก็บเงินจนกว่าจะหมดช่วงทดลอง",
    features: "สิ่งที่คุณทำได้ตอนนี้:",
    feature1: "จำแนกสินค้าด้วยความแม่นยำระดับ AI",
    feature2: "เข้าถึงเหตุผลโดยละเอียดและทางเลือกอื่น",
    startButton: "เริ่มจำแนก",
  },
};

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const { language } = useLanguage();
  const t = translations[language];

  useEffect(() => {
    if (sessionId) {
      console.log("Checkout session completed:", sessionId);
    }
  }, [sessionId]);

  return (
    <main className="gradient-bg min-h-screen flex flex-col items-center justify-center px-4 py-16">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 md:p-12 max-w-lg w-full text-center border border-gray-200 shadow-lg">
        <div className="w-16 h-16 bg-green-0 rounded-full flex items-center justify-center mx-auto mb-6">
          <CircleCheck className="w-16 h-16 text-green-600" />
        </div>

        <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-3">
          {t.title}
        </h1>
        <p className="text-gray-600 mb-4">
          {t.subtitle}
        </p>
        <p className="text-sm text-green-600 font-medium mb-8 bg-green-50 rounded-lg py-2 px-4">
          {t.trialInfo}
        </p>

        {/* <div className="text-left mb-8">
          <p className="text-sm font-medium text-gray-700 mb-3">{t.features}</p>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
              {t.feature1}
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
              {t.feature2}
            </li>
          </ul>
        </div> */}

        <a
          href="/"
          className="inline-block w-full py-3 bg-gray-900 text-white rounded-full font-medium hover:bg-gray-800 transition-colors"
        >
          {t.startButton}
        </a>
      </div>
    </main>
  );
}
