import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/providers";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Xetrius — PSL Fan Quests",
  description: "Complete team quests, earn onchain status. The PSL fan quest platform.",
  icons: {
    icon: "/xetrius_logo.png",
    apple: "/xetrius_logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <Providers>
          <Navbar />
          <main className="flex-1">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
