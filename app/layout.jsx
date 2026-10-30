import { Inter_Tight, Instrument_Serif } from "next/font/google";
import { BRAND } from "@/lib/brand";
import { siteUrl } from "@/lib/site";

const sans = Inter_Tight({ subsets: ["latin"], variable: "--ff-sans", display: "swap" });
const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--ff-serif",
  display: "swap",
});

const site = siteUrl();

export const metadata = {
  metadataBase: new URL(site),
  title: { default: `${BRAND.name} | Premium Technology`, template: `%s | ${BRAND.name}` },
  description: BRAND.description,
  applicationName: BRAND.name,
  appleWebApp: { title: BRAND.name, statusBarStyle: "black-translucent" },
  openGraph: { type: "website", siteName: BRAND.name, locale: "en_GH" },
  twitter: { card: "summary_large_image" },
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0e1112" },
  ],
};

// Runs before first paint: applies the saved/system theme (no flash) and
// flags that JS is available so reveal animations never hide content without it.
const bootScript = `(function(){var d=document.documentElement;d.classList.add("js");try{var t=localStorage.getItem("lt_theme");if(t!=="light"&&t!=="dark"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}d.dataset.theme=t}catch(e){d.dataset.theme="light"}})();`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
