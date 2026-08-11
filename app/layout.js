import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  metadataBase: new URL("https://hookship-ak-dac3.vercel.app"),
  title: "Hookship | Webhook Delivery Simulator",
  description: "Test webhook destinations, inspect delivery results, and retry failed events from a simple dashboard.",
  keywords: ["webhook simulator", "Next.js", "React", "JavaScript", "developer tools"],
  authors: [{ name: "Akash", url: "https://github.com/ak-sh1" }],
  alternates: { canonical: "/" },
  openGraph: {
    title: "Hookship | Webhook Delivery Simulator",
    description: "Test webhook destinations, inspect JSON payloads, and retry failed events.",
    url: "/",
    siteName: "Hookship",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Hookship | Webhook Delivery Simulator",
    description: "Test webhook destinations, inspect JSON payloads, and retry failed events.",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body>
    </html>
  );
}
