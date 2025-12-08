import { Metadata } from "next";

export const metadata: Metadata = {
  title: "ประวัติการค้นหา - History | Customs AI",
  description:
    "ดูประวัติการค้นหาพิกัดศุลกากร HS Code ของคุณ | View your HS code classification history",
  openGraph: {
    title: "ประวัติการค้นหา - History | Customs AI",
    description: "ดูประวัติการค้นหาพิกัดศุลกากร HS Code ของคุณ",
    url: "https://customsai.co/history",
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function HistoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
