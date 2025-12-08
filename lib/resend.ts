import { Resend } from "resend";

export const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

type Language = "en" | "th";

const emailContent = {
  en: {
    subject: "Welcome to Customs AI - Your 5 Free Classifications Await!",
    preheader:
      "Start classifying HS codes instantly with AI-powered accuracy",
    greeting: (name: string) =>
      name ? `Hi ${name},` : "Hi there,",
    welcome: "Welcome to Customs AI!",
    intro:
      "Thank you for joining Customs AI - your AI-powered assistant for instant HS code classification. We help customs brokers and importers/exporters find accurate tariff codes in seconds.",
    whatWeDo: "What we do:",
    feature1: "Instant HS code classification using advanced AI",
    feature2: "Support for Thai and ASEAN customs regulations",
    feature3: "Detailed reasoning and alternative codes for edge cases",
    freeCredits: "Your 5 Free Classifications",
    freeCreditsDesc:
      "You have 5 free classifications to try our service. Experience the speed and accuracy of AI-powered customs classification.",
    benefits: "Why customs brokers love us:",
    benefit1Title: "Lightning Fast",
    benefit1Desc: "Get HS codes in seconds, not hours of manual research",
    benefit2Title: "Highly Reliable",
    benefit2Desc: "AI trained on millions of customs records for accuracy",
    benefit3Title: "Save Money & Time",
    benefit3Desc: "Reduce classification costs and free up your team",
    benefit4Title: "Reduce Errors",
    benefit4Desc: "Minimize costly customs delays and penalties",
    cta: "Start Classifying Now",
    trial:
      "Ready for more? Start your 7-day free trial with unlimited classifications.",
    feedback:
      "We'd love to hear what you think! Reply to this email with any questions or feedback.",
    signature: "The Customs AI Team",
    footer: "Customs AI - Smart Customs Classification",
    footerDesc: "AI-powered HS code classification for Thailand and ASEAN",
  },
  th: {
    subject: "ยินดีต้อนรับสู่ Customs AI - รับสิทธิ์ค้นหาฟรี 5 ครั้ง!",
    preheader: "เริ่มค้นหาพิกัดศุลกากร HS Code ได้ทันทีด้วย AI",
    greeting: (name: string) =>
      name ? `สวัสดีคุณ ${name}` : "สวัสดีครับ/ค่ะ",
    welcome: "ยินดีต้อนรับสู่ Customs AI!",
    intro:
      "ขอบคุณที่เข้าร่วม Customs AI - ผู้ช่วย AI สำหรับค้นหาพิกัดศุลกากร HS Code แบบทันที เราช่วยตัวแทนออกของและผู้นำเข้า-ส่งออกค้นหารหัสภาษีที่ถูกต้องภายในไม่กี่วินาที",
    whatWeDo: "สิ่งที่เราทำ:",
    feature1: "ค้นหาพิกัดศุลกากร HS Code ทันทีด้วย AI ขั้นสูง",
    feature2: "รองรับระเบียบศุลกากรไทยและอาเซียน",
    feature3: "อธิบายเหตุผลและพิกัดทางเลือกสำหรับกรณีพิเศษ",
    freeCredits: "สิทธิ์ค้นหาฟรี 5 ครั้ง",
    freeCreditsDesc:
      "คุณมีสิทธิ์ค้นหาฟรี 5 ครั้งเพื่อทดลองใช้บริการ สัมผัสความเร็วและความแม่นยำของการจำแนกพิกัดศุลกากรด้วย AI",
    benefits: "ทำไมตัวแทนออกของถึงชอบเรา:",
    benefit1Title: "รวดเร็วทันใจ",
    benefit1Desc: "ได้พิกัด HS Code ภายในวินาที ไม่ต้องค้นหาเป็นชั่วโมง",
    benefit2Title: "เชื่อถือได้สูง",
    benefit2Desc: "AI เรียนรู้จากข้อมูลศุลกากรนับล้านรายการเพื่อความแม่นยำ",
    benefit3Title: "ประหยัดเงินและเวลา",
    benefit3Desc: "ลดต้นทุนการจำแนกพิกัดและปลดปล่อยเวลาทีมงาน",
    benefit4Title: "ลดข้อผิดพลาด",
    benefit4Desc: "ลดความล่าช้าและค่าปรับจากศุลกากร",
    cta: "เริ่มค้นหาเลย",
    trial:
      "พร้อมใช้งานเพิ่มเติม? เริ่มทดลองใช้ฟรี 7 วันพร้อมการค้นหาไม่จำกัด",
    feedback:
      "เรายินดีรับฟังความคิดเห็นของคุณ! ตอบกลับอีเมลนี้หากมีคำถามหรือข้อเสนอแนะ",
    signature: "ทีมงาน Customs AI",
    footer: "Customs AI - ค้นหาพิกัดศุลกากรอัจฉริยะ",
    footerDesc: "ค้นหาพิกัดศุลกากร HS Code ด้วย AI สำหรับไทยและอาเซียน",
  },
};

export function getWelcomeEmailHtml(
  name: string | null,
  language: Language = "th"
): string {
  const t = emailContent[language];
  const displayName = name || "";

  return `
<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <title>${t.subject}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f5f5f5;
      -webkit-font-smoothing: antialiased;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .card {
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
      padding: 32px;
      text-align: center;
    }
    .logo {
      font-size: 24px;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: -0.5px;
    }
    .content {
      padding: 32px;
    }
    .greeting {
      font-size: 18px;
      color: #1f2937;
      margin-bottom: 8px;
    }
    .welcome {
      font-size: 24px;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 16px;
    }
    .intro {
      font-size: 15px;
      color: #4b5563;
      line-height: 1.6;
      margin-bottom: 24px;
    }
    .section-title {
      font-size: 14px;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 12px;
    }
    .feature-list {
      margin: 0 0 24px 0;
      padding: 0;
      list-style: none;
    }
    .feature-list li {
      font-size: 14px;
      color: #4b5563;
      padding: 8px 0 8px 24px;
      position: relative;
    }
    .feature-list li::before {
      content: "✓";
      position: absolute;
      left: 0;
      color: #10b981;
      font-weight: 600;
    }
    .credits-box {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 24px;
      text-align: center;
    }
    .credits-title {
      font-size: 18px;
      font-weight: 700;
      color: #92400e;
      margin-bottom: 8px;
    }
    .credits-desc {
      font-size: 14px;
      color: #a16207;
      line-height: 1.5;
    }
    .benefits-grid {
      margin-bottom: 24px;
    }
    .benefit-item {
      padding: 16px;
      background: #f9fafb;
      border-radius: 12px;
      margin-bottom: 12px;
    }
    .benefit-title {
      font-size: 15px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 4px;
    }
    .benefit-desc {
      font-size: 13px;
      color: #6b7280;
      line-height: 1.4;
    }
    .cta-button {
      display: inline-block;
      background: #1f2937;
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 9999px;
      font-size: 15px;
      font-weight: 600;
      text-align: center;
      margin: 24px 0;
    }
    .cta-button:hover {
      background: #374151;
    }
    .trial-note {
      font-size: 14px;
      color: #6b7280;
      text-align: center;
      margin-bottom: 24px;
      line-height: 1.5;
    }
    .feedback {
      font-size: 14px;
      color: #4b5563;
      line-height: 1.5;
      padding: 16px;
      background: #f0fdf4;
      border-radius: 12px;
      margin-bottom: 24px;
    }
    .signature {
      font-size: 14px;
      color: #1f2937;
      font-weight: 500;
    }
    .footer {
      padding: 24px 32px;
      background: #f9fafb;
      text-align: center;
      border-top: 1px solid #e5e7eb;
    }
    .footer-brand {
      font-size: 14px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 4px;
    }
    .footer-desc {
      font-size: 12px;
      color: #9ca3af;
    }
    .footer-email {
      font-size: 12px;
      color: #6b7280;
      margin-top: 8px;
    }
    .footer-email a {
      color: #1f2937;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <!-- Header -->
      <div class="header">
        <div class="logo">Customs AI</div>
      </div>

      <!-- Content -->
      <div class="content">
        <p class="greeting">${t.greeting(displayName)}</p>
        <h1 class="welcome">${t.welcome}</h1>
        <p class="intro">${t.intro}</p>

        <p class="section-title">${t.whatWeDo}</p>
        <ul class="feature-list">
          <li>${t.feature1}</li>
          <li>${t.feature2}</li>
          <li>${t.feature3}</li>
        </ul>

        <!-- Free Credits Box -->
        <div class="credits-box">
          <div class="credits-title">${t.freeCredits}</div>
          <p class="credits-desc">${t.freeCreditsDesc}</p>
        </div>

        <p class="section-title">${t.benefits}</p>
        <div class="benefits-grid">
          <div class="benefit-item">
            <div class="benefit-title">${t.benefit1Title}</div>
            <div class="benefit-desc">${t.benefit1Desc}</div>
          </div>
          <div class="benefit-item">
            <div class="benefit-title">${t.benefit2Title}</div>
            <div class="benefit-desc">${t.benefit2Desc}</div>
          </div>
          <div class="benefit-item">
            <div class="benefit-title">${t.benefit3Title}</div>
            <div class="benefit-desc">${t.benefit3Desc}</div>
          </div>
          <div class="benefit-item">
            <div class="benefit-title">${t.benefit4Title}</div>
            <div class="benefit-desc">${t.benefit4Desc}</div>
          </div>
        </div>

        <div style="text-align: center;">
          <a href="https://customsai.co" class="cta-button">${t.cta}</a>
        </div>

        <p class="trial-note">${t.trial}</p>

        <div class="feedback">${t.feedback}</div>

        <p class="signature">${t.signature}</p>
      </div>

      <!-- Footer -->
      <div class="footer">
        <div class="footer-brand">${t.footer}</div>
        <div class="footer-desc">${t.footerDesc}</div>
        <div class="footer-email">
          <a href="mailto:team@customsai.co">team@customsai.co</a>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
`;
}

export function getWelcomeEmailSubject(language: Language = "th"): string {
  return emailContent[language].subject;
}
