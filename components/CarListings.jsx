"use client";

import { useState, useMemo } from "react";
import { CarCard } from "./CarCard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowDownNarrowWide,
  Info,
  DollarSign,
  Calendar,
  Gauge,
  Zap,
  Leaf,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const CarListings = ({ cars, formatPrice, formatMileage }) => {
  if (!cars.length) {
    return (
      <Alert variant="info" className="mb-6">
        <Info className="h-4 w-4" />
        <AlertDescription>
          No cars found matching your criteria.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mt-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cars.map((car) => (
            <CarCard
              key={car.id}
              car={car}
              formatPrice={formatPrice}
              formatMileage={formatMileage}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
