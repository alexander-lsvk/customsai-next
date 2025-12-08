"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/components/clerk-provider-with-locale";
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton, useAuth } from "@clerk/nextjs";
import { Check } from "lucide-react";

const translations = {
  en: {
    brand: "Customs AI",
    signIn: "Sign in",
    signUp: "Sign up",
    pricing: "Pricing",
    about: "About",
    history: "History",
    heroTitle: "Simple, transparent pricing",
    heroSubtitle: "Choose the plan that fits your business. All plans include our AI-powered HS code classification.",
    monthly: "/month",
    classifications: "classifications",
    freeTrial: "7-day free trial",
    getStarted: "Start Free Trial",
    subscribing: "Processing...",
    mostPopular: "Most Popular",
    currentPlan: "Current Plan",
    managePlan: "Manage Plan",
    changePlan: "Change Plan",
    features: {
      classifications: "classifications/month",
      smartReasoning: "Smart reasoning for tricky cases",
      tariffDisplay: "Full tariff schedule display",
      historyExport: "Classification history & export",
      apiAccess: "API access",
      prioritySupport: "Priority email support",
      dedicatedSupport: "Dedicated account manager",
      bulkProcessing: "Bulk classification processing",
    },
    plans: {
      growth: {
        name: "Growth",
        description: "Perfect for small brokers getting started",
      },
      professional: {
        name: "Professional",
        description: "For growing teams with higher volume",
      },
      business: {
        name: "Business",
        description: "Advanced features for large operations",
      },
    },
    faq: {
      title: "Frequently Asked Questions",
      q1: "How accurate is the HS code classification?",
      a1: "Our AI achieves 95%+ accuracy on standard products. For complex cases, we provide detailed reasoning and alternative codes to help you make the final decision.",
      q2: "Can I upgrade or downgrade my plan?",
      a2: "Yes, you can change your plan at any time. Changes take effect at the start of your next billing cycle.",
      q3: "What payment methods do you accept?",
      a3: "We accept all major credit cards, bank transfers, and PromptPay for Thai customers.",
      q4: "Is there a free trial?",
      a4: "Yes! All plans include a 7-day free trial. You'll need to enter payment details, but won't be charged until the trial ends.",
    },
    cta: {
      title: "Ready to streamline your customs workflow?",
      subtitle: "Start your 7-day free trial. Payment details required.",
      button: "Start Free Trial",
    },
    copyright: "Customs AI. All rights reserved.",
  },
  th: {
    brand: "Customs AI",
    signIn: "เข้าสู่ระบบ",
    signUp: "สมัครสมาชิก",
    pricing: "ราคา",
    about: "เกี่ยวกับ",
    history: "ประวัติ",
    heroTitle: "ราคาที่เรียบง่ายและโปร่งใส",
    heroSubtitle: "เลือกแผนที่เหมาะกับธุรกิจของคุณ ทุกแผนรวม AI จำแนกพิกัดศุลกากร",
    monthly: "/เดือน",
    classifications: "ครั้ง",
    freeTrial: "ทดลองใช้ฟรี 7 วัน",
    getStarted: "เริ่มทดลองใช้ฟรี",
    subscribing: "กำลังดำเนินการ...",
    mostPopular: "ยอดนิยม",
    currentPlan: "แผนปัจจุบัน",
    managePlan: "จัดการแผน",
    changePlan: "เปลี่ยนแผน",
    features: {
      classifications: "การจำแนก/เดือน",
      smartReasoning: "อธิบายเหตุผลสำหรับกรณีซับซ้อน",
      tariffDisplay: "แสดงรายละเอียดอัตราภาษีเต็มรูปแบบ",
      historyExport: "ประวัติการจำแนกและส่งออกข้อมูล",
      apiAccess: "เชื่อมต่อ API",
      prioritySupport: "สนับสนุนทางอีเมลแบบด่วน",
      dedicatedSupport: "ผู้จัดการบัญชีเฉพาะ",
      bulkProcessing: "ประมวลผลแบบกลุ่ม",
    },
    plans: {
      growth: {
        name: "Growth",
        description: "เหมาะสำหรับตัวแทนรายเล็กที่เพิ่งเริ่มต้น",
      },
      professional: {
        name: "Professional",
        description: "สำหรับทีมที่กำลังเติบโตและมีปริมาณงานสูง",
      },
      business: {
        name: "Business",
        description: "ฟีเจอร์ขั้นสูงสำหรับการดำเนินงานขนาดใหญ่",
      },
    },
    faq: {
      title: "คำถามที่พบบ่อย",
      q1: "ความแม่นยำในการจำแนกพิกัดเป็นอย่างไร?",
      a1: "AI ของเรามีความแม่นยำ 95%+ สำหรับสินค้าทั่วไป สำหรับกรณีซับซ้อน เราให้เหตุผลโดยละเอียดและรหัสทางเลือกเพื่อช่วยคุณตัดสินใจ",
      q2: "สามารถอัปเกรดหรือดาวน์เกรดแผนได้หรือไม่?",
      a2: "ได้ คุณสามารถเปลี่ยนแผนได้ตลอดเวลา การเปลี่ยนแปลงจะมีผลในรอบบิลถัดไป",
      q3: "รับชำระเงินด้วยวิธีใดบ้าง?",
      a3: "เรารับบัตรเครดิตหลักทุกประเภท โอนเงินผ่านธนาคาร และ PromptPay สำหรับลูกค้าไทย",
      q4: "มีทดลองใช้ฟรีหรือไม่?",
      a4: "มี! ทุกแผนรวมทดลองใช้ฟรี 7 วัน ต้องกรอกข้อมูลบัตรเครดิต แต่จะไม่เรียกเก็บเงินจนกว่าจะหมดช่วงทดลอง",
    },
    cta: {
      title: "พร้อมที่จะปรับปรุงขั้นตอนการทำงานศุลกากรของคุณหรือยัง?",
      subtitle: "เริ่มทดลองใช้ฟรี 7 วัน ต้องกรอกข้อมูลการชำระเงิน",
      button: "เริ่มทดลองใช้ฟรี",
    },
    copyright: "Customs AI. สงวนลิขสิทธิ์",
  },
};

const plans = [
  {
    id: "growth",
    price: 4990,
    credits: 300,
    features: (t: typeof translations.en.features) => [
      `300 ${t.classifications}`,
      t.smartReasoning,
      t.tariffDisplay,
      t.historyExport,
    ],
  },
  {
    id: "professional",
    price: 9990,
    credits: 1000,
    popular: true,
    features: (t: typeof translations.en.features) => [
      `1,000 ${t.classifications}`,
      t.smartReasoning,
      t.tariffDisplay,
      t.historyExport,
      t.prioritySupport,
      t.bulkProcessing,
    ],
  },
  {
    id: "business",
    price: 24990,
    credits: 3000,
    features: (t: typeof translations.en.features) => [
      `3,000 ${t.classifications}`,
      t.smartReasoning,
      t.tariffDisplay,
      t.historyExport,
      t.prioritySupport,
      t.bulkProcessing,
      t.apiAccess,
      t.dedicatedSupport,
    ],
  },
];

export default function PricingPage() {
  const { language, toggleLanguage } = useLanguage();
  const { isSignedIn } = useAuth();
  const t = translations[language];
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);
  const [isPlanStatusLoaded, setIsPlanStatusLoaded] = useState(false);

  useEffect(() => {
    // isSignedIn is undefined while Clerk is loading, true/false when determined
    if (isSignedIn === undefined) {
      return; // Still loading auth state
    }

    if (isSignedIn) {
      fetch("/api/user/credits")
        .then((res) => res.json())
        .then((data) => {
          console.log("Fetched credits data:", data);
          if (data.plan && data.plan !== "free") {
            setCurrentPlan(data.plan);
            console.log("Set currentPlan to:", data.plan);
          }
        })
        .catch((err) => {
          console.error("Error fetching credits:", err);
        })
        .finally(() => {
          setIsPlanStatusLoaded(true);
        });
    } else {
      // Not signed in, no need to fetch plan
      setIsPlanStatusLoaded(true);
    }
  }, [isSignedIn]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(language === "th" ? "th-TH" : "en-US").format(price);
  };

  const handleSubscribe = async (planId: string) => {
    if (!isSignedIn) return;

    setLoadingPlan(planId);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Checkout error:", error);
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleManagePlan = async () => {
    setIsLoadingPortal(true);
    try {
      const response = await fetch("/api/stripe/portal", {
        method: "POST",
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Portal error:", error);
    } finally {
      setIsLoadingPortal(false);
    }
  };

  return (
    <main className="gradient-bg min-h-screen flex flex-col items-center px-4 pb-16">
      {/* Navbar */}
      <nav className="w-full h-14 mb-16">
        <div className="flex items-center justify-between h-full max-w-3xl mx-auto">
          <div className="flex items-center gap-6">
            <a href="/" className="text-lg font-semibold text-gray-900 hover:text-gray-700 transition-colors tracking-tighter">{t.brand}</a>
            <a href="/pricing" className="text-sm font-medium text-gray-900">{t.pricing}</a>
            <a href="/history" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">{t.history}</a>
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

      {/* Hero */}
      <div className="text-center mb-16 max-w-3xl">
        <h1 className="text-4xl md:text-5xl font-semibold text-gray-900 mb-4 tracking-tight">
          {t.heroTitle}
        </h1>
        <p className="text-gray-500 text-lg">
          {t.heroSubtitle}
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full mb-20">
        {plans.map((plan) => {
          const planTranslation = t.plans[plan.id as keyof typeof t.plans];
          const isLoading = loadingPlan === plan.id;
          return (
            <div
              key={plan.id}
              className={`relative bg-white/80 backdrop-blur-sm rounded-2xl p-6 border ${
                plan.popular
                  ? "border-gray-900 ring-2 ring-gray-900"
                  : "border-gray-200"
              } shadow-lg shadow-black/5 flex flex-col`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gray-900 text-white text-xs font-medium rounded-full">
                  {t.mostPopular}
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {planTranslation.name}
                </h3>
                <p className="text-sm text-gray-500 min-h-[40px]">
                  {planTranslation.description}
                </p>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-gray-900">
                    ฿{formatPrice(plan.price)}
                  </span>
                  <span className="text-gray-500 text-sm">{t.monthly}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {formatPrice(plan.credits)} {t.classifications}
                </p>
                <p className="text-sm text-green-600 font-medium mt-2">
                  {t.freeTrial}
                </p>
              </div>

              <ul className="space-y-3 mb-8 flex-grow">
                {plan.features(t.features).map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                    <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Always show button - spinner while loading, then proper text */}
              {!isPlanStatusLoaded ? (
                <button
                  disabled
                  className={`w-full py-2.5 rounded-full text-sm font-medium cursor-not-allowed flex items-center justify-center ${
                    plan.popular
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-900"
                  }`}
                >
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </button>
              ) : isSignedIn && currentPlan === plan.id ? (
                <button
                  onClick={handleManagePlan}
                  disabled={isLoadingPortal}
                  className="w-full py-2.5 rounded-full text-sm font-medium bg-green-100 text-green-700 border-2 border-green-500 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isLoadingPortal ? (
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : t.managePlan}
                </button>
              ) : isSignedIn && currentPlan ? (
                <button
                  onClick={handleManagePlan}
                  disabled={isLoadingPortal}
                  className={`w-full py-2.5 rounded-full text-sm font-medium transition-colors cursor-pointer disabled:cursor-not-allowed flex items-center justify-center ${
                    plan.popular
                      ? "bg-gray-900 text-white hover:bg-gray-800"
                      : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                  }`}
                >
                  {isLoadingPortal ? (
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : t.changePlan}
                </button>
              ) : isSignedIn ? (
                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={loadingPlan === plan.id}
                  className={`w-full py-2.5 rounded-full text-sm font-medium transition-colors cursor-pointer disabled:cursor-not-allowed flex items-center justify-center ${
                    plan.popular
                      ? "bg-gray-900 text-white hover:bg-gray-800"
                      : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                  }`}
                >
                  {loadingPlan === plan.id ? (
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : t.getStarted}
                </button>
              ) : (
                <SignUpButton mode="modal">
                  <button
                    className={`w-full py-2.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                      plan.popular
                        ? "bg-gray-900 text-white hover:bg-gray-800"
                        : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                    }`}
                  >
                    {t.getStarted}
                  </button>
                </SignUpButton>
              )}
            </div>
          );
        })}
      </div>

      {/* FAQ Section */}
      <div className="max-w-3xl w-full mb-20">
        <h2 className="text-2xl font-semibold text-gray-900 mb-8 text-center">
          {t.faq.title}
        </h2>
        <div className="space-y-6">
          {[
            { q: t.faq.q1, a: t.faq.a1 },
            { q: t.faq.q2, a: t.faq.a2 },
            { q: t.faq.q3, a: t.faq.a3 },
            { q: t.faq.q4, a: t.faq.a4 },
          ].map((item, index) => (
            <div key={index} className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-gray-200">
              <h3 className="font-medium text-gray-900 mb-2">{item.q}</h3>
              <p className="text-gray-600 text-sm">{item.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-3xl w-full text-center bg-gray-900 rounded-2xl p-10 mb-12">
        <h2 className="text-2xl font-semibold text-white mb-3">
          {t.cta.title}
        </h2>
        <p className="text-gray-400 mb-6">
          {t.cta.subtitle}
        </p>
        {!isPlanStatusLoaded ? (
          <button
            disabled
            className="px-8 py-3 bg-white text-gray-900 rounded-full font-medium cursor-not-allowed min-w-[160px] flex items-center justify-center mx-auto"
          >
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </button>
        ) : isSignedIn && currentPlan ? (
          <button
            onClick={handleManagePlan}
            disabled={isLoadingPortal}
            className="px-8 py-3 bg-white text-gray-900 rounded-full font-medium hover:bg-gray-100 transition-colors cursor-pointer disabled:cursor-not-allowed min-w-[160px] flex items-center justify-center mx-auto"
          >
            {isLoadingPortal ? (
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : t.managePlan}
          </button>
        ) : isSignedIn ? (
          <button
            onClick={() => handleSubscribe("professional")}
            disabled={loadingPlan === "professional"}
            className="px-8 py-3 bg-white text-gray-900 rounded-full font-medium hover:bg-gray-100 transition-colors cursor-pointer disabled:cursor-not-allowed min-w-[160px] flex items-center justify-center mx-auto"
          >
            {loadingPlan === "professional" ? (
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : t.cta.button}
          </button>
        ) : (
          <SignUpButton mode="modal">
            <button className="px-8 py-3 bg-white text-gray-900 rounded-full font-medium hover:bg-gray-100 transition-colors cursor-pointer">
              {t.cta.button}
            </button>
          </SignUpButton>
        )}
      </div>

      {/* Footer */}
      <p className="text-center text-gray-400 text-xs">
        &copy;2025 {t.copyright}
        <br />
        <a href="mailto:team@customsai.co" className="hover:text-gray-600 transition-colors">team@customsai.co</a>
      </p>
    </main>
  );
}
