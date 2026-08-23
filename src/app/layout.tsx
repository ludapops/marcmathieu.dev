import type { Metadata } from "next";
import { Geist, Zilla_Slab } from "next/font/google";
import { MotionDirector } from "@/components/motion/MotionDirector";
import { Navigation } from "@/components/navigation/Navigation";
import { SceneClient } from "@/components/scene/SceneClient";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const zillaSlab = Zilla_Slab({
  variable: "--font-zilla-slab",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://marcmathieu.dev"),
  title: {
    default: "Marc Mathieu | Senior Frontend Engineer",
    template: "%s | Marc Mathieu",
  },
  description:
    "Senior frontend engineer building complex product interfaces with care.",
  alternates: {
    canonical: "/",
  },
  authors: [{ name: "Marc Mathieu", url: "https://marcmathieu.dev" }],
  creator: "Marc Mathieu",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "Marc Mathieu",
    title: "Marc Mathieu | Senior Frontend Engineer",
    description:
      "Senior frontend engineer building complex product interfaces with care.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Marc Mathieu | Senior Frontend Engineer",
    description:
      "Senior frontend engineer building complex product interfaces with care.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${zillaSlab.variable}`}>
      <body>
        <SceneClient />
        <MotionDirector />
        <Navigation />
        {children}
      </body>
    </html>
  );
}
