"use client";
import PageTracker from "@/components/page-tracker";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { Analytics } from "@vercel/analytics/react";
import { ThemeProvider } from "next-themes";
import Script from "next/script";
import { Fragment, PropsWithChildren, useEffect } from "react";

export default function ThemeLayout({
  children,
  overrideTheme,
  overrideThemeVariables,
}: PropsWithChildren<{
  overrideTheme?: "dark" | "light";
  overrideThemeVariables?: Record<string, string>;
}>) {
  useEffect(() => {
    if (overrideThemeVariables && typeof window === "undefined") {
      Object.entries(overrideThemeVariables).forEach(([key, value]) => {
        document.body.style.setProperty(key, value);
      });
    }
  }, [overrideThemeVariables]);

  return (
    <>
      <ThemeProvider
        forcedTheme={overrideTheme}
        enableColorScheme
        attribute="class"
      >
        <TooltipProvider>
          <Fragment>{children}</Fragment>
        </TooltipProvider>
        <Toaster />
      </ThemeProvider>
      <Analytics />
      <PageTracker />
      <Script async defer src="https://buttons.github.io/buttons.js" />
    </>
  );
}
