"use client";
import PageTracker from "@/components/page-tracker";
import { Toaster } from "@/components/ui/sonner";
import ThemeProvider from "@/context/theme-provider";
import { cn } from "@/lib/utils";
import { Analytics } from "@vercel/analytics/react";
import { getCookie } from "cookies-next";
import { Inter } from "next/font/google";
import Script from "next/script";
import { Fragment, PropsWithChildren } from "react";
const inter = Inter({ subsets: ["latin"] });
export default function ThemeLayout({
  children,
  overrideTheme,
  disableToggle,
  overrideThemeVariables,
}: PropsWithChildren<{
  overrideTheme?: "dark" | "light";
  disableToggle?: boolean;
  overrideThemeVariables?: Record<string, string>;
}>) {
  const cookieTheme = getCookie("theme");
  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
  const theme = overrideTheme ?? cookieTheme ?? systemTheme;
  const style = overrideThemeVariables ?? {};

  return (
    <body
      className={cn(inter.className, theme)}
      style={style}
      suppressHydrationWarning
    >
      <ThemeProvider
        defaultTheme={theme as "dark" | "light"}
        disableToggle={disableToggle}
      >
        <Fragment>{children}</Fragment>
        <Toaster />
      </ThemeProvider>
      <Analytics />
      <PageTracker />
      <Script async defer src="https://buttons.github.io/buttons.js" />
    </body>
  );
}
