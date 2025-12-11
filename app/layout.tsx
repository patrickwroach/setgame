import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "./contexts/AuthContext";
import { GameProvider } from "./contexts/GameContext";
import AuthGuard from "./components/AuthGuard";
import Navigation from "./components/Navigation";

export const metadata: Metadata = {
  title: "Set Set Set",
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
        <AuthProvider>
          <GameProvider>
            <AuthGuard>
              <div className="flex flex-col min-h-screen">
                <Navigation />
                <main>
                  {children}
                </main>
              </div>
            </AuthGuard>
          </GameProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
