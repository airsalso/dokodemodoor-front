import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";
import { AppearanceProvider } from "@/context/AppearanceContext";
import { AuthProvider } from "@/context/AuthContext";
import { TokenRefreshProvider } from "@/components/TokenRefreshProvider";

export const metadata: Metadata = {
  title: "DokodemoDoor | AI-Powered Penetration Testing",
  description: "Next-generation automated penetration testing engine with real-time AI feedback.",
};

import { JetBrains_Mono, Outfit, Inter, Noto_Sans_KR, Roboto } from "next/font/google";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono-jb",
  display: 'swap',
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: 'swap',
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: 'swap',
});

const noto = Noto_Sans_KR({
  subsets: ["latin"],
  variable: "--font-noto",
  weight: ['400', '500', '700', '900'],
  display: 'swap',
});

const roboto = Roboto({
  subsets: ["latin"],
  variable: "--font-roboto",
  weight: ['400', '500', '700'],
  display: 'swap',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${jetbrainsMono.variable} ${outfit.variable} ${inter.variable} ${noto.variable} ${roboto.variable}`}>
      <body className="font-sans antialiased text-foreground">
        <AuthProvider>
          <TokenRefreshProvider>
            <LanguageProvider>
              <AppearanceProvider>
                <div className="flex min-h-screen">
                  <main className="flex-1 flex flex-col">
                    <Suspense fallback={null}>
                      {children}
                    </Suspense>
                  </main>
                </div>
              </AppearanceProvider>
            </LanguageProvider>
          </TokenRefreshProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
