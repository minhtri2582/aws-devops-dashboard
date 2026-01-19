import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AWS Core Dashboard",
  description: "Unified AWS Infrastructure Monitor",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-950 text-slate-50`}>
        <div className="min-h-screen">
          <main className="w-full bg-slate-950">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
