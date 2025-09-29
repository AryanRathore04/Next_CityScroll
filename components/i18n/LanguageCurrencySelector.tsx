"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Globe,
  DollarSign,
  MapPin,
  Check,
  Smartphone,
  Languages,
} from "lucide-react";
import { useLocalization } from "@/lib/i18n/LocalizationProvider";
import { languages, currencies, regions } from "@/lib/i18n/config";

export const LanguageCurrencySelector: React.FC = () => {
  const {
    language,
    currency,
    region,
    setLanguage,
    setCurrency,
    setRegion,
    t,
    formatPrice,
    isRTL,
  } = useLocalization();

  const [showSelector, setShowSelector] = useState(false);

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang as any);
  };

  const handleCurrencyChange = (newCurrency: string) => {
    setCurrency(newCurrency as any);
  };

  const handleRegionChange = (newRegion: string) => {
    setRegion(newRegion);

    // Auto-update currency and language based on region
    const regionInfo = regions[newRegion as keyof typeof regions];
    if (regionInfo) {
      setCurrency(regionInfo.defaultCurrency as keyof typeof currencies as any);
      if (language === "en" || !languages[language]) {
        setLanguage(
          regionInfo.defaultLanguage as keyof typeof languages as any,
        );
      }
    }
  };

  return (
    <>
      {/* Compact Selector Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowSelector(true)}
        className="flex items-center gap-2 px-3"
      >
        <Globe className="h-4 w-4" />
        <span className="hidden sm:inline">{languages[language].flag}</span>
        <span className="hidden md:inline">{languages[language].name}</span>
        <span className="text-muted-foreground">
          {currencies[currency].symbol}
        </span>
      </Button>

      {/* Full Selector Dialog */}
      <Dialog open={showSelector} onOpenChange={setShowSelector}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              {t("settings.regionLanguage")} Region & Language Settings
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Current Selection Summary */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{languages[language].flag}</div>
                    <div>
                      <div className="font-semibold">
                        {languages[language].name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {currencies[currency].name} (
                        {currencies[currency].symbol})
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold">
                      {formatPrice(99)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Sample price
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Region Selection */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Region
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(regions).map(([regionName, regionInfo]) => (
                  <Card
                    key={regionName}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      region === regionName
                        ? "ring-2 ring-primary bg-primary/5"
                        : "hover:border-primary/50"
                    }`}
                    onClick={() => handleRegionChange(regionName)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold">{regionName}</div>
                          <div className="text-sm text-muted-foreground">
                            {
                              currencies[
                                regionInfo.defaultCurrency as keyof typeof currencies
                              ].symbol
                            }{" "}
                            {
                              currencies[
                                regionInfo.defaultCurrency as keyof typeof currencies
                              ].name
                            }
                          </div>
                        </div>
                        {region === regionName && (
                          <Check className="h-5 w-5 text-primary" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <Separator />

            {/* Language Selection */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Languages className="h-5 w-5" />
                Language
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {Object.entries(languages).map(([langCode, langInfo]) => (
                  <Button
                    key={langCode}
                    variant={language === langCode ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleLanguageChange(langCode)}
                    className="flex items-center gap-2 justify-start h-auto p-3"
                  >
                    <span className="text-lg">{langInfo.flag}</span>
                    <span className="text-xs">{langInfo.name}</span>
                  </Button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Currency Selection */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Currency
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.entries(currencies).map(([currCode, currInfo]) => (
                  <Button
                    key={currCode}
                    variant={currency === currCode ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleCurrencyChange(currCode)}
                    className="flex items-center gap-2 justify-start h-auto p-3"
                  >
                    <span className="font-mono text-lg">{currInfo.symbol}</span>
                    <div className="text-left">
                      <div className="font-semibold text-xs">{currCode}</div>
                      <div className="text-xs text-muted-foreground">
                        {currInfo.name}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            {/* RTL Support Note */}
            {isRTL && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-blue-800">
                      Right-to-left (RTL) layout is now active for better Arabic
                      reading experience.
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowSelector(false)}>
                {t("action.cancel")}
              </Button>
              <Button onClick={() => setShowSelector(false)}>
                {t("action.save")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
