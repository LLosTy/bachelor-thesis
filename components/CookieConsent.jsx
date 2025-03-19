"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CookieSettingsDialog } from "./CookieSettingsDialog";

export default function CookieConsent() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [preferences, setPreferences] = useState({
    essential: true,
    functional: false,
    analytics: false,
    marketing: false,
  });

  // Initialize state from localStorage only once
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedPreferences = localStorage.getItem("cookieConsent");
        if (!savedPreferences) {
          setShowBanner(true);
        } else {
          setPreferences(JSON.parse(savedPreferences));
          // Do not show banner if preferences exist
          setShowBanner(false);
        }
      } catch (error) {
        console.error("Error accessing localStorage:", error);
      } finally {
        // Mark as initialized regardless of outcome
        setIsInitialized(true);
      }
    }
  }, []);

  const handleAcceptAll = () => {
    const allAccepted = {
      essential: true,
      functional: true,
      analytics: true,
      marketing: true,
    };
    setPreferences(allAccepted);
    localStorage.setItem("cookieConsent", JSON.stringify(allAccepted));
    setShowBanner(false);
    setOpenModal(false);
  };

  const handleSavePreferences = () => {
    localStorage.setItem("cookieConsent", JSON.stringify(preferences));
    setShowBanner(false);
    setOpenModal(false);
  };

  // Return null until initialization is complete to prevent flashing
  if (!isInitialized) {
    return null;
  }

  return (
    <>
      {/* Settings Dialog - Always available */}
      <CookieSettingsDialog
        open={openModal}
        onOpenChange={setOpenModal}
        preferences={preferences}
        setPreferences={setPreferences}
        onSave={handleSavePreferences}
        onAcceptAll={handleAcceptAll}
      />

      {/* Floating Settings Button - Only shown when banner is hidden */}
      {!showBanner && (
        <div className="fixed bottom-4 right-4 z-50">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full shadow-md"
            onClick={() => setOpenModal(true)}
          >
            Cookie Settings
          </Button>
        </div>
      )}

      {/* Initial Banner - Only shown when needed */}
      {showBanner && (
        <div className="fixed bottom-[10%] left-1/2 transform -translate-x-1/2 z-50 max-w-[90%] w-auto">
          <Card className="shadow-lg">
            <CardContent className="p-4">
              <p className="text-center text-sm font-light mb-3">
                Will you allow us to use cookies?
              </p>
              <div className="flex gap-3 justify-center">
                <Button size="sm" onClick={handleAcceptAll}>
                  Allow cookies
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setOpenModal(true)}
                >
                  Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
