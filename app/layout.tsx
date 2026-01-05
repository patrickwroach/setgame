import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "./contexts/AuthContext";
import { GameProvider } from "./contexts/GameContext";
import { ThemeProvider } from "./contexts/ThemeContext";
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
      <body className="bg-linear-to-br from-tertiary to-secondary min-h-screen">
        <AuthProvider>
          <ThemeProvider>
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
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
