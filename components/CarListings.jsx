// components/CarListings.jsx
import { useState, useMemo } from "react";
import { CarCard } from "./CarCard";
import { CarSortOptions } from "./CarSortOptions";

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

  const handleSort = (option) => {
    setSortOption(option);
  };

  if (!cars.length) {
    return (
      <div className="alert alert-info">
        No cars found matching your criteria.
      </div>
    );
  }

  return (
    <div>
      <CarSortOptions onSort={handleSort} />

      <div className="row g-4">
        {sortedCars.map((car) => {
          // Create a processed car object that works with both data sources
          const processedCar = {
            ...car,
            // Keep existing thumbnail if it exists, otherwise extract from images_id
            thumbnail:
              car.thumbnail ||
              (car.images_id && car.images_id[0]
                ? car.images_id[0].thumbnail
                : null),
          };

          return (
            <div key={car.id} className="col-md-6 col-lg-4">
              <CarCard
                car={processedCar}
                formatPrice={formatPrice}
                formatMileage={formatMileage}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
