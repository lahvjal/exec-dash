import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const telegraf = localFont({
  src: [
    {
      path: "../../public/font/Telegraf/PPTelegraf-Ultralight.woff2",
      weight: "200",
      style: "normal",
    },
    {
      path: "../../public/font/Telegraf/PPTelegraf-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/font/Telegraf/PPTelegraf-Bold.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../public/font/Telegraf/PPTelegraf-Ultrabold.woff2",
      weight: "800",
      style: "normal",
    },
    {
      path: "../../public/font/Telegraf/PPTelegraf-Black.woff2",
      weight: "900",
      style: "normal",
    },
  ],
  variable: "--font-telegraf",
});

export const metadata: Metadata = {
  title: "Aveyo KPI Dashboard",
  description: "Executive dashboard for tracking key performance indicators",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${telegraf.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}

