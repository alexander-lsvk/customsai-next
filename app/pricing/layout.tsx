import { Metadata } from "next";

export const metadata: Metadata = {
  title: "ราคาแพ็กเกจ - Pricing | Customs AI",
  description:
    "ดูแพ็กเกจราคาค้นหาพิกัดศุลกากร HS Code เริ่มต้นทดลองใช้ฟรี 7 วัน | View pricing plans for AI-powered HS code classification. Start with a 7-day free trial.",
  openGraph: {
    title: "ราคาแพ็กเกจ - Pricing | Customs AI",
    description:
      "ดูแพ็กเกจราคาค้นหาพิกัดศุลกากร HS Code เริ่มต้นทดลองใช้ฟรี 7 วัน",
    url: "https://customsai.co/pricing",
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
