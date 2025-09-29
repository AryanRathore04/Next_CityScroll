"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Download,
  Share2,
  Smartphone,
  Wifi,
  WifiOff,
  X,
  Home,
  Calendar,
  MapPin,
} from "lucide-react";
import { usePWA } from "@/hooks/usePWA";
import { toast } from "@/hooks/use-toast";

export const PWAInstallPrompt: React.FC = () => {
  const { isInstallable, isInstalled, isOnline, installApp, canShare, share } =
    usePWA();
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  React.useEffect(() => {
    // Show install prompt after a delay if installable and not dismissed
    const timer = setTimeout(() => {
      if (isInstallable && !dismissed && !isInstalled) {
        setShowPrompt(true);
      }
    }, 10000); // Show after 10 seconds

    return () => clearTimeout(timer);
  }, [isInstallable, dismissed, isInstalled]);

  const handleInstall = async () => {
    await installApp();
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
  };

  const handleShare = async () => {
    await share({
      title: "CityScroll - Beauty & Salon Booking",
      text: "Book beauty and salon services instantly with CityScroll",
      url: window.location.origin,
    });
  };

  // Don't show anything if already installed or not installable
  if (isInstalled || (!isInstallable && !canShare)) return null;

  return (
    <>
      {/* Floating Install Button */}
      {isInstallable && !showPrompt && !dismissed && (
        <div className="fixed bottom-4 right-4 z-50">
          <Button
            onClick={() => setShowPrompt(true)}
            className="rounded-full shadow-lg hover:shadow-xl transition-shadow"
            size="lg"
          >
            <Download className="h-4 w-4 mr-2" />
            Install App
          </Button>
        </div>
      )}

      {/* Connection Status Indicator */}
      {!isOnline && (
        <div className="fixed top-4 right-4 z-50">
          <Badge variant="destructive" className="flex items-center gap-2">
            <WifiOff className="h-3 w-3" />
            Offline
          </Badge>
        </div>
      )}

      {/* Install Prompt Dialog */}
      <Dialog open={showPrompt} onOpenChange={setShowPrompt}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Install CityScroll
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl text-white">✂️</span>
              </div>
              <h3 className="text-lg font-semibold">Get the full experience</h3>
              <p className="text-muted-foreground text-sm">
                Install CityScroll for faster access, offline features, and
                native app experience
              </p>
            </div>

            {/* Features */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Wifi className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium">Offline Access</div>
                  <div className="text-muted-foreground text-xs">
                    View bookings even when you're offline
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Home className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <div className="font-medium">Home Screen Access</div>
                  <div className="text-muted-foreground text-xs">
                    Quick access from your home screen
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <div className="font-medium">Push Notifications</div>
                  <div className="text-muted-foreground text-xs">
                    Get reminders for your appointments
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={handleDismiss}
                className="flex-1"
              >
                Maybe Later
              </Button>
              {isInstallable && (
                <Button onClick={handleInstall} className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Install
                </Button>
              )}
            </div>

            {/* Share Button */}
            {canShare && (
              <Button variant="ghost" onClick={handleShare} className="w-full">
                <Share2 className="h-4 w-4 mr-2" />
                Share App
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export const PWAStatusBar: React.FC = () => {
  const { isInstalled, isOnline } = usePWA();

  if (!isInstalled) return null;

  return (
    <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
            <Smartphone className="h-3 w-3" />
          </div>
          <span className="text-sm font-medium">CityScroll App</span>
        </div>

        <div className="flex items-center gap-2">
          {isOnline ? (
            <Badge
              variant="secondary"
              className="bg-green-500/20 text-green-100"
            >
              <Wifi className="h-3 w-3 mr-1" />
              Online
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-red-500/20 text-red-100">
              <WifiOff className="h-3 w-3 mr-1" />
              Offline
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
};
