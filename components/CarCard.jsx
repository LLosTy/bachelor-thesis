import Image from "next/image";
import { useEffect, useState } from "react";

export const CarCard = ({ car, formatPrice, formatMileage }) => {
  const [thumbnailUrl, setThumbnailUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Reset states when car changes
    setThumbnailUrl(null);
    setIsLoading(true);

    const fetchThumbnail = async () => {
      // Don't attempt to fetch if car.images is not available
      if (!car.images) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `http://localhost:8055/items/images_files?filter[images_id][_eq]=${car.images}&filter[sort][_eq]=1&fields=directus_files_id`
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch thumbnail: ${response.status}`);
        }

        const data = await response.json();

        if (data.data && data.data.length > 0) {
          setThumbnailUrl(
            `http://localhost:8055/assets/${data.data[0].directus_files_id}`
          );
        }
      } catch (error) {
        console.error("Error fetching thumbnail:", error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchThumbnail();
  }, [car.id, car.images]);

  return (
    <a href={`${car.id}`} className="text-decoration-none">
      <div className="card h-100 shadow">
        <div className="position-relative" style={{ height: "200px" }}>
          {thumbnailUrl ? (
            <Image
              src={thumbnailUrl}
              alt={`${car.make} ${car.model}`}
              fill
              className="card-img-top"
              style={{ objectFit: "cover" }}
              unoptimized={true}
              loading="lazy"
            />
          ) : (
            <div className="d-flex justify-content-center align-items-center h-100 bg-light">
              <span className="text-muted">
                {isLoading ? "Loading..." : "No image available"}
              </span>
            </div>
          )}
        </div>
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
