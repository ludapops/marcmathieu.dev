import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});
const description =
  "Senior frontend engineer. Complex products, carefully made. Explore Marc Mathieu’s work on AG1, Battlefield Portal Builder, and BeautyNexos.";
export const metadata: Metadata = {
  metadataBase: new URL("https://marcmathieu.dev"),
  title: {
    default: "Marc Mathieu | Senior Frontend Engineer",
    template: "%s | Marc Mathieu",
  },
  description,
  alternates: { canonical: "/" },
  authors: [{ name: "Marc Mathieu", url: "https://marcmathieu.dev" }],
  creator: "Marc Mathieu",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "Marc Mathieu",
    title: "Marc Mathieu | Senior Frontend Engineer",
    description,
  },
  twitter: {
    card: "summary_large_image",
    title: "Marc Mathieu | Senior Frontend Engineer",
    description,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={geist.variable}>
      <body>{children}</body>
    </html>
  );
}
