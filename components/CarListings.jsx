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
      {cars.map((car) => (
        <div key={car.id} className="col-md-6 col-lg-4">
          <CarCard
            car={car}
            formatPrice={formatPrice}
            formatMileage={formatMileage}
          />
        </div>
      ))}
    </div>
  );
};
