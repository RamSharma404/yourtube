import Header from "@/components/Header";
import OtpVerificationModal from "@/components/OtpVerificationModal";
import Sidebar from "@/components/Sidebar";
import { Toaster } from "@/components/ui/sonner";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import type { NextComponentType, NextPageContext } from "next";
import { useEffect } from "react";
import { UserProvider, useUser } from "../lib/AuthContext";

interface AppShellProps {
  Component: NextComponentType<NextPageContext, any, any>;
  pageProps: AppProps["pageProps"];
}

function AppShell({ Component, pageProps }: AppShellProps) {
  const { appTheme } = useUser();

  // Apply the shadcn `dark` class on <html> so every themed component,
  // including portaled dialogs and dropdowns, follows the app theme.
  useEffect(() => {
    document.documentElement.classList.toggle("dark", appTheme !== "light");
  }, [appTheme]);

  const shellClass = "min-h-screen bg-background text-foreground";

  return (
    <div className={shellClass}>
      <title>Your-Tube Clone</title>
      <Header />
      <OtpVerificationModal />
      <Toaster />
      <div className="flex">
        <Sidebar />
        <Component {...pageProps} />
      </div>
    </div>
  );
}

export default function App({ Component, pageProps }: AppProps) {
  return (
    <UserProvider>
      <AppShell Component={Component} pageProps={pageProps} />
    </UserProvider>
  );
}
