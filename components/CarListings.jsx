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
  const [sortOption, setSortOption] = useState("none");

  // Sort cars based on the selected option
  const sortedCars = useMemo(() => {
    if (!cars.length) return [];

    const carsToSort = [...cars]; // Create a copy to avoid mutating the original array

    switch (sortOption) {
      case "price_asc":
        return carsToSort.sort((a, b) => a.price - b.price);
      case "price_desc":
        return carsToSort.sort((a, b) => b.price - a.price);
      case "year_desc":
        return carsToSort.sort((a, b) => b.year - a.year);
      case "mileage_asc":
        return carsToSort.sort((a, b) => a.mileage - b.mileage);
      case "mileage_desc":
        return carsToSort.sort((a, b) => b.mileage - a.mileage);
      case "horsepower_desc":
        return carsToSort.sort((a, b) => b.horsepower - a.horsepower);
      default:
        return carsToSort; // Default sorting (no sorting)
    }
  }, [cars, sortOption]);

  const handleSort = (value) => {
    setSortOption(value);
  };

  // Helper function to get the current sort option text
  const getSortOptionText = () => {
    switch (sortOption) {
      case "price_asc":
        return "Price: Low to High";
      case "price_desc":
        return "Price: High to Low";
      case "year_desc":
        return "Newest First";
      case "mileage_asc":
        return "Mileage: Low to High";
      case "mileage_desc":
        return "Mileage: High to Low";
      case "horsepower_desc":
        return "Horsepower: High to Low";
      case "fuel_economy_combined_asc":
        return "Fuel economy: Low to High";
      case "none":
        return "Default";
      default:
        return "Sort by";
    }
  };

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
      <div className="flex justify-end mb-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-[200px] justify-between">
              {getSortOptionText()}
              <ArrowDownNarrowWide className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[200px]">
            <DropdownMenuLabel>Sort Options</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => handleSort("none")}>
                Default
              </DropdownMenuItem>
              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={() => handleSort("price_asc")}>
                <DollarSign className="mr-2 h-4 w-4" />
                <span>Price: Low to High</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort("price_desc")}>
                <DollarSign className="mr-2 h-4 w-4" />
                <span>Price: High to Low</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={() => handleSort("year_desc")}>
                <Calendar className="mr-2 h-4 w-4" />
                <span>Newest First</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={() => handleSort("mileage_asc")}>
                <Gauge className="mr-2 h-4 w-4" />
                <span>Mileage: Low to High</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort("mileage_desc")}>
                <Gauge className="mr-2 h-4 w-4" />
                <span>Mileage: High to Low</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={() => handleSort("horsepower_desc")}>
                <Zap className="mr-2 h-4 w-4" />
                <span>Horsepower: High to Low</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={() => handleSort("fuel_economy_combined_asc")}
              >
                <Leaf className="mr-2 h-4 w-4" />
                <span>Fuel economy: Low to High</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="mt-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedCars.map((car) => (
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
