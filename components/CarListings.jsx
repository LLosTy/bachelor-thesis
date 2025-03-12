import { CarCard } from "./CarCard";

export const CarListings = ({ cars, formatPrice, formatMileage }) => {
  if (!cars.length) {
    return (
      <div className="alert alert-info">
        No cars found matching your criteria.
      </div>
    );
  }

  return (
    <div className="row g-4">
      {cars.map((car) => {
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
  );
};
