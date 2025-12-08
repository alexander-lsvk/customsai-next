import { Metadata } from "next";

export const metadata: Metadata = {
  title: "ติดต่อเรา - Contact | Customs AI",
  description:
    "ติดต่อทีมงาน Customs AI สอบถามเกี่ยวกับระบบค้นหาพิกัดศุลกากร | Contact Customs AI team for support and inquiries",
  openGraph: {
    title: "ติดต่อเรา - Contact | Customs AI",
    description: "ติดต่อทีมงาน Customs AI สอบถามเกี่ยวกับระบบค้นหาพิกัดศุลกากร",
    url: "https://customsai.co/contact",
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
