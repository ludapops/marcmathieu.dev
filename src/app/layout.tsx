import type { Metadata } from "next";
import { Geist, Zilla_Slab } from "next/font/google";
import { ExperienceShell } from "@/components/experience/ExperienceShell";
import { IntroChrome } from "@/components/experience/IntroChrome";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  preload: false,
});

const zillaSlab = Zilla_Slab({
  variable: "--font-zilla-slab",
  subsets: ["latin"],
  weight: "500",
  preload: false,
});

const zillaSlabRegular = Zilla_Slab({
  variable: "--font-zilla-slab-regular",
  subsets: ["latin"],
  weight: "400",
  preload: false,
});

const zillaSlabBold = Zilla_Slab({
  variable: "--font-zilla-slab-bold",
  subsets: ["latin"],
  weight: "700",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL("https://marcmathieu.dev"),
  title: {
    default: "Marc Mathieu | Senior Frontend Engineer",
    template: "%s | Marc Mathieu",
  },
  description:
    "Senior frontend engineer leading product work from early decisions through production, with a focus on AI-assisted development and product interfaces.",
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
      "Senior frontend engineer leading product work from early decisions through production, with a focus on AI-assisted development and product interfaces.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Marc Mathieu | Senior Frontend Engineer",
    description:
      "Senior frontend engineer leading product work from early decisions through production, with a focus on AI-assisted development and product interfaces.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const introStateScript =
    process.env.NODE_ENV === "development"
      ? 'document.documentElement.dataset.introState="locked"'
      : 'try{document.documentElement.dataset.introState=sessionStorage.getItem("marc-portfolio-machine-intro-v3")==="seen"?"seen":"locked"}catch(e){document.documentElement.dataset.introState="locked"}';

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${zillaSlab.variable} ${zillaSlabRegular.variable} ${zillaSlabBold.variable}`}
      data-intro-state="pending"
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: introStateScript,
          }}
        />
        <noscript>
          <style>{`[data-intro-splash],[data-intro-backdrop],[data-intro-chrome]{display:none!important}[data-scene-shell]{z-index:1!important}[data-experience-content]{contain-intrinsic-size:none!important;content-visibility:visible!important;opacity:1!important;visibility:visible!important}`}</style>
        </noscript>
      </head>
      <body>
        <IntroChrome />
        <ExperienceShell>{children}</ExperienceShell>
      </body>
    </html>
  );
}
