import { Metadata } from "next";

export const metadata: Metadata = {
  title: "เกี่ยวกับเรา - About | Customs AI",
  description:
    "เรียนรู้เกี่ยวกับ Customs AI ระบบค้นหาพิกัดศุลกากร HS Code ด้วย AI | Learn about our AI-powered customs classification system",
  openGraph: {
    title: "เกี่ยวกับเรา - About | Customs AI",
    description:
      "เรียนรู้เกี่ยวกับ Customs AI ระบบค้นหาพิกัดศุลกากร HS Code ด้วย AI",
    url: "https://customsai.co/about",
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
