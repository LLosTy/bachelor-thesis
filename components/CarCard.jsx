import Image from "next/image";

export const CarCard = ({ car, formatPrice, formatMileage }) => {
  return (
    <a href={`${car.id}`} className="text-decoration-none">
      <div className="card h-100 shadow">
        {car.thumbnail && (
          <div className="position-relative" style={{ height: "200px" }}>
            <Image
              src={`http://localhost:8055/assets/${car.thumbnail}`}
              alt={`${car.make} ${car.model}`}
              fill
              className="card-img-top"
              style={{ objectFit: "cover" }}
              unoptimized={true}
              loading="lazy"
            />
          </div>
        )}
        <div className="card-body">
          <h5 className="card-title fw-bold">
            {car.year} {car.make} {car.model}
          </h5>
          <div className="card-text">
            <p className="mb-2">
              <strong>Price:</strong> {formatPrice(car.price)}
            </p>
            <p className="mb-2">
              <strong>Mileage:</strong> {formatMileage(car.mileage)}
            </p>
            <p className="mb-0">
              <strong>Horsepower:</strong> {car.horsepower || "N/A"} hp
            </p>
          </div>
        </div>
      </div>
    </a>
  );
};
