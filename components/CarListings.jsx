"use client";

import { useState, useMemo } from "react";
import { CarCard } from "./CarCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

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
        <Select value={sortOption} onValueChange={handleSort}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Default</SelectItem>
            <SelectItem value="price_asc">Price: Low to High</SelectItem>
            <SelectItem value="price_desc">Price: High to Low</SelectItem>
            <SelectItem value="year_desc">Newest First</SelectItem>
            <SelectItem value="mileage_asc">Mileage: Low to High</SelectItem>
            <SelectItem value="mileage_desc">Mileage: High to Low</SelectItem>
            <SelectItem value="horsepower_desc">
              Horsepower: High to Low
            </SelectItem>
          </SelectContent>
        </Select>
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
