import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Set Game",
  description: "Browser-based version of the card game Set",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-gradient-to-br from-blue-50 to-purple-50 min-h-screen">
        {children}
      </body>
    </html>
  );
}
