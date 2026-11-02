import "./globals.css";

import type { Metadata } from "next";
import { Manrope } from "next/font/google";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
});

export const metadata: Metadata = {
  description: "Frontend Mentor Advice Generator App, built with Next.js",
  icons: {
    icon: "/favicon-32x32.png",
  },
  title: "Advice Generator App | Frontend Mentor | Nextjs",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html className={`${manrope.variable} h-full antialiased`} lang="en">
      <body className="bg-dark-blue flex min-h-dvh flex-col">{children}</body>
    </html>
  );
}
