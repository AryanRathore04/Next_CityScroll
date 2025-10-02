"use client";

import { useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface PWAHookResult {
  isInstallable: boolean;
  isInstalled: boolean;
  isOnline: boolean;
  installApp: () => Promise<void>;
  canShare: boolean;
  share: (data: ShareData) => Promise<void>;
}

export const usePWA = (): PWAHookResult => {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Check if app is already installed
    const checkInstalled = () => {
      const isInStandaloneMode =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true;
      setIsInstalled(isInStandaloneMode);
    };

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      toast({
        title: "App Installed!",
        description: "CityScroll has been installed on your device",
      });
    };

    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "You're offline",
        description: "Some features may be limited",
        variant: "destructive",
      });
    };

    checkInstalled();

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const installApp = async (): Promise<void> => {
    if (!deferredPrompt) {
      toast({
        title: "Installation not available",
        description:
          "This app is already installed or your browser doesn't support installation",
        variant: "destructive",
      });
      return;
    }

    try {
      await deferredPrompt.prompt();

      // Wrap userChoice in a try-catch as it can reject with an Event object
      try {
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === "accepted") {
          toast({
            title: "Installing app...",
            description: "CityScroll is being installed",
          });
        }
      } catch (userChoiceError) {
        // User dismissed the prompt - this is expected behavior, not an error
        console.debug("User dismissed install prompt");
      }

      setDeferredPrompt(null);
      setIsInstallable(false);
    } catch (error) {
      // Only log actual errors, not user dismissals
      if (
        error &&
        typeof error === "object" &&
        "name" in error &&
        error.name !== "AbortError"
      ) {
        console.error("Error installing app:", error);
        toast({
          title: "Installation failed",
          description: "There was an error installing the app",
          variant: "destructive",
        });
      }
    }
  };

  const canShare = typeof navigator !== "undefined" && "share" in navigator;

  const share = async (data: ShareData): Promise<void> => {
    if (!canShare) {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(data.url || "");
        toast({
          title: "Link copied!",
          description: "Link has been copied to clipboard",
        });
      } catch (error) {
        console.error("Error copying to clipboard:", error);
      }
      return;
    }

    try {
      await navigator.share(data);
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        console.error("Error sharing:", error);
        toast({
          title: "Sharing failed",
          description: "There was an error sharing the content",
          variant: "destructive",
        });
      }
    }
  };

  return {
    isInstallable,
    isInstalled,
    isOnline,
    installApp,
    canShare,
    share,
  };
};
