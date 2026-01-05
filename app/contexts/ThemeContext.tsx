"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getUserDataByUid, updateThemePreference } from "../lib/users";
import { useAuth } from "./AuthContext";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");
  const [isInitialized, setIsInitialized] = useState(false);

  // Load theme preference from database or localStorage on mount
  useEffect(() => {
    async function loadTheme() {
      if (user?.uid) {
        // User is logged in, try to load from database
        try {
          const userData = await getUserDataByUid(user.uid);
          if (userData?.themePreference) {
            setThemeState(userData.themePreference);
            setIsInitialized(true);
            return;
          }
        } catch (error) {
          console.error('Error loading theme from database:', error);
        }
      }
      
      // Fallback to localStorage
      const stored = localStorage.getItem("theme") as Theme | null;
      if (stored) {
        setThemeState(stored);
      }
      setIsInitialized(true);
    }
    
    loadTheme();
  }, [user?.uid]);

  // Custom setTheme that syncs to both localStorage and database
  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("theme", newTheme);
    
    // Save to database if user is logged in
    if (user?.uid) {
      try {
        await updateThemePreference(user.uid, newTheme);
      } catch (error) {
        console.error('Error saving theme to database:', error);
      }
    }
  };

  useEffect(() => {
    const root = window.document.documentElement;

    if (theme === "system") {
      root.style.colorScheme = "light dark";
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      setResolvedTheme(systemTheme);
    } else {
      root.style.colorScheme = theme;
      setResolvedTheme(theme);
    }

    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    if (theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      const systemTheme = e.matches ? "dark" : "light";
      setResolvedTheme(systemTheme);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
