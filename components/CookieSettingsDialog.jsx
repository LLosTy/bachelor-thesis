"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export function CookieSettingsDialog({
  open,
  onOpenChange,
  preferences,
  setPreferences,
  onSave,
  onAcceptAll,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cookie Settings</DialogTitle>
          <DialogDescription>
            We use cookies to enhance your browsing experience and analyze our
            traffic. Please choose your preferences below.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="space-y-6">
            {/* Essential Cookies */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="essential" className="font-medium">
                  Essential Cookies
                </Label>
                <p className="text-sm text-muted-foreground">
                  Required for the website to function properly
                </p>
              </div>
              <Switch id="essential" checked={preferences.essential} disabled />
            </div>

            {/* Functional Cookies */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="functional" className="font-medium">
                  Functional Cookies
                </Label>
                <p className="text-sm text-muted-foreground">
                  Enhance website functionality and personalization
                </p>
              </div>
              <Switch
                id="functional"
                checked={preferences.functional}
                onCheckedChange={(checked) =>
                  setPreferences({
                    ...preferences,
                    functional: checked,
                  })
                }
              />
            </div>

            {/* Analytics Cookies */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="analytics" className="font-medium">
                  Analytics Cookies
                </Label>
                <p className="text-sm text-muted-foreground">
                  Help us understand how visitors interact with the website
                </p>
              </div>
              <Switch
                id="analytics"
                checked={preferences.analytics}
                onCheckedChange={(checked) =>
                  setPreferences({
                    ...preferences,
                    analytics: checked,
                  })
                }
              />
            </div>

            {/* Marketing Cookies */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="marketing" className="font-medium">
                  Marketing Cookies
                </Label>
                <p className="text-sm text-muted-foreground">
                  Used to deliver personalized advertisements
                </p>
              </div>
              <Switch
                id="marketing"
                checked={preferences.marketing}
                onCheckedChange={(checked) =>
                  setPreferences({
                    ...preferences,
                    marketing: checked,
                  })
                }
              />
            </div>
          </div>
        </div>
        <DialogFooter className="flex justify-between sm:justify-between">
          <Button variant="outline" onClick={onSave}>
            Accept selected
          </Button>
          <Button onClick={onAcceptAll}>Accept all</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
