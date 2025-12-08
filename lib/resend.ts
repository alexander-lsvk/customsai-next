import { Resend } from "resend";

export const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

type Language = "en" | "th";

const emailContent = {
  en: {
    subject: "Your Customs AI account is ready",
    greeting: (name: string) => (name ? `Hi ${name},` : "Hi,"),
    accountReady: "Your account has been created successfully.",
    youCanNow: "You can now:",
    action1: "Search for HS codes using AI",
    action2: "Get detailed reasoning and alternative codes",
    action3: "Save your classification history",
    creditsNote: "Your account includes 5 complimentary classifications.",
    getStarted: "Go to Customs AI",
    questions: "Questions? Just reply to this email.",
    thanks: "Thanks,",
    signature: "Customs AI Team",
  },
  th: {
    subject: "บัญชี Customs AI ของคุณพร้อมใช้งานแล้ว",
    greeting: (name: string) => (name ? `สวัสดีคุณ ${name}` : "สวัสดี"),
    accountReady: "บัญชีของคุณถูกสร้างเรียบร้อยแล้ว",
    youCanNow: "ตอนนี้คุณสามารถ:",
    action1: "ค้นหาพิกัดศุลกากร HS Code ด้วย AI",
    action2: "ดูเหตุผลและพิกัดทางเลือก",
    action3: "บันทึกประวัติการจำแนกพิกัด",
    creditsNote: "บัญชีของคุณมีสิทธิ์ค้นหา 5 ครั้ง",
    getStarted: "ไปที่ Customs AI",
    questions: "มีคำถาม? ตอบกลับอีเมลนี้ได้เลย",
    thanks: "ขอบคุณ",
    signature: "ทีม Customs AI",
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
  <title>${t.subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #ffffff;">
  <div style="max-width: 560px; margin: 0 auto; padding: 40px 20px;">

    <p style="font-size: 15px; color: #1f2937; line-height: 1.6; margin: 0 0 20px 0;">
      ${t.greeting(displayName)}
    </p>

    <p style="font-size: 15px; color: #374151; line-height: 1.6; margin: 0 0 20px 0;">
      ${t.accountReady}
    </p>

    <p style="font-size: 15px; color: #374151; line-height: 1.6; margin: 0 0 8px 0;">
      ${t.youCanNow}
    </p>

    <ul style="margin: 0 0 20px 0; padding-left: 20px; color: #374151; font-size: 15px; line-height: 1.8;">
      <li>${t.action1}</li>
      <li>${t.action2}</li>
      <li>${t.action3}</li>
    </ul>

    <p style="font-size: 14px; color: #6b7280; line-height: 1.6; margin: 0 0 24px 0;">
      ${t.creditsNote}
    </p>

    <p style="margin: 0 0 24px 0;">
      <a href="https://customsai.co" style="display: inline-block; background-color: #1f2937; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 9999px; font-size: 14px; font-weight: 500;">
        ${t.getStarted}
      </a>
    </p>

    <p style="font-size: 14px; color: #9ca3af; line-height: 1.6; margin: 0 0 24px 0;">
      ${t.questions}
    </p>

    <p style="font-size: 15px; color: #374151; line-height: 1.6; margin: 0;">
      ${t.thanks}<br>
      ${t.signature}
    </p>

  </div>
</body>
</html>
`;
}

export function getWelcomeEmailSubject(language: Language = "th"): string {
  return emailContent[language].subject;
}
