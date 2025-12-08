import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProviderWithLocale } from "@/components/clerk-provider-with-locale";
import { MixpanelProvider } from "@/components/mixpanel-provider";
import { FacebookPixel } from "@/components/facebook-pixel";
import { FirebaseAnalytics } from "@/components/firebase-analytics";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://customsai.co"),
  title: {
    default: "Customs AI - ค้นหาพิกัดศุลกากร HS Code ด้วย AI | Smart Customs Classification",
    template: "%s | Customs AI",
  },
  description:
    "ค้นหาพิกัดศุลกากร HS Code อัตโนมัติด้วย AI สำหรับการนำเข้า-ส่งออกสินค้า ASEAN ถูกต้อง รวดเร็ว ประหยัดเวลา | AI-powered HS code classification for Thailand imports & exports",
  keywords: [
    // Thai keywords
    "พิกัดศุลกากร",
    "HS Code",
    "HS Code ไทย",
    "ค้นหาพิกัดศุลกากร",
    "พิกัดศุลกากรไทย",
    "รหัสศุลกากร",
    "อัตราภาษีนำเข้า",
    "ภาษีศุลกากร",
    "นำเข้าส่งออก",
    "พิธีการศุลกากร",
    "ใบขนสินค้า",
    "กรมศุลกากร",
    "Customs AI",
    "AI พิกัดศุลกากร",
    // English keywords
    "Thailand HS Code",
    "Thai customs tariff",
    "ASEAN HS code lookup",
    "import export Thailand",
    "customs classification",
    "tariff code finder",
    "harmonized system code",
    "Thailand import duty",
    "customs clearance Thailand",
  ],
  authors: [{ name: "Customs AI" }],
  creator: "Customs AI",
  publisher: "Customs AI",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.svg",
    apple: "/og-image.png",
  },
  openGraph: {
    title: "Customs AI - ค้นหาพิกัดศุลกากร HS Code ด้วย AI",
    description:
      "ค้นหาพิกัดศุลกากร HS Code อัตโนมัติด้วย AI สำหรับการนำเข้า-ส่งออกสินค้า ถูกต้อง รวดเร็ว ประหยัดเวลา",
    url: "https://customsai.co",
    siteName: "Customs AI",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Customs AI - ค้นหาพิกัดศุลกากร HS Code ด้วย AI",
      },
    ],
    locale: "th_TH",
    alternateLocale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Customs AI - ค้นหาพิกัดศุลกากร HS Code ด้วย AI",
    description:
      "ค้นหาพิกัดศุลกากร HS Code อัตโนมัติด้วย AI สำหรับการนำเข้า-ส่งออกสินค้า ถูกต้อง รวดเร็ว",
    images: ["/og-image.png"],
    creator: "@customsai",
  },
  alternates: {
    canonical: "https://customsai.co",
    languages: {
      "th-TH": "https://customsai.co",
      "en-US": "https://customsai.co",
    },
  },
  category: "Business",
  verification: {
    // Add these when you have them
    // google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
  },
};

// JSON-LD structured data for SEO
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Customs AI",
  alternateName: "ค้นหาพิกัดศุลกากร AI",
  description:
    "ค้นหาพิกัดศุลกากร HS Code อัตโนมัติด้วย AI สำหรับการนำเข้า-ส่งออกสินค้า",
  url: "https://customsai.co",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "THB",
    description: "5 free credits to start",
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.8",
    ratingCount: "100",
  },
  author: {
    "@type": "Organization",
    name: "Customs AI",
    url: "https://customsai.co",
  },
  inLanguage: ["th", "en"],
  keywords:
    "พิกัดศุลกากร, HS Code, ค้นหาพิกัดศุลกากร, Thailand customs, import export",
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Customs AI",
  alternateName: "Customs AI Thailand",
  url: "https://customsai.co",
  logo: "https://customsai.co/og-image.png",
  contactPoint: {
    "@type": "ContactPoint",
    email: "team@customsai.co",
    contactType: "customer service",
    availableLanguage: ["Thai", "English"],
  },
  sameAs: [],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans`}
      >
        <ClerkProviderWithLocale>
          <FacebookPixel />
          <FirebaseAnalytics />
          <MixpanelProvider>{children}</MixpanelProvider>
        </ClerkProviderWithLocale>
      </body>
    </html>
  );
}
