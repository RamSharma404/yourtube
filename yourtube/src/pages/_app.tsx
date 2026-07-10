import Header from "@/components/Header";
import OtpVerificationModal from "@/components/OtpVerificationModal";
import Sidebar from "@/components/Sidebar";
import { Toaster } from "@/components/ui/sonner";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import type { NextComponentType, NextPageContext } from "next";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { UserProvider, useUser } from "../lib/AuthContext";

interface AppShellProps {
  Component: NextComponentType<NextPageContext, any, any>;
  pageProps: AppProps["pageProps"];
}

function TopLoadingBar() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleStart = () => setLoading(true);
    const handleComplete = () => setLoading(false);

    router.events.on("routeChangeStart", handleStart);
    router.events.on("routeChangeComplete", handleComplete);
    router.events.on("routeChangeError", handleComplete);

    return () => {
      router.events.off("routeChangeStart", handleStart);
      router.events.off("routeChangeComplete", handleComplete);
      router.events.off("routeChangeError", handleComplete);
    };
  }, [router]);

  if (!loading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 h-1 bg-red-600 z-[9999] overflow-hidden">
      <div className="h-full bg-red-400 w-full origin-left animate-[loading_1s_ease-in-out_infinite]" style={{ animation: "loading 1.5s infinite linear" }}>
        <style jsx>{`
          @keyframes loading {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        `}</style>
      </div>
    </div>
  );
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
      <TopLoadingBar />
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
