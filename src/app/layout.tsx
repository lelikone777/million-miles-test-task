import type { Metadata } from "next";
import { ThemeInitScript } from "@/components/theme-init-script";
import { getSiteUrl } from "@/lib/seo";
import { IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  weight: ["400", "500", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  applicationName: "CarSensor Catalog",
  title: {
    default: "CarSensor Catalog",
    template: "%s | CarSensor Catalog",
  },
  description:
    "Каталог автомобилей с CarSensor: поиск, фильтры, карточки авто и почасовое обновление данных.",
  keywords: [
    "carsensor",
    "каталог автомобилей",
    "авто из японии",
    "car marketplace",
    "next.js",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: "/",
    siteName: "CarSensor Catalog",
    title: "CarSensor Catalog",
    description:
      "Каталог автомобилей с CarSensor: фильтры, детальные карточки и регулярный скраппинг данных.",
  },
  twitter: {
    card: "summary_large_image",
    title: "CarSensor Catalog",
    description:
      "Каталог автомобилей с CarSensor: фильтры, детальные карточки и регулярный скраппинг данных.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      data-theme="system"
      suppressHydrationWarning
      className={`${spaceGrotesk.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        <ThemeInitScript />
        {children}
      </body>
    </html>
  );
}

