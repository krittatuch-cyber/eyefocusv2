import type { Metadata } from "next";
import { I18nProvider } from "@/lib/i18n-context";
import "./globals.css";

export const metadata: Metadata = {
  title: "Eye Focus — Optical Shop Management System",
  description: "SaaS สำหรับจัดการร้านแว่นตา ครบวงจร",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className="h-full antialiased">
      <head>
        {/* Prevent FOUC: apply saved theme before React hydrates */}
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            var t = localStorage.getItem('eyefocus_theme');
            if (t === 'dark') {
              document.documentElement.classList.add('dark');
              document.documentElement.setAttribute('data-theme','dark');
            } else {
              document.documentElement.setAttribute('data-theme','light');
            }
          } catch(e){}
        `}} />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <I18nProvider>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
