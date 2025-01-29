"use client";
import { useState } from "react";
import { CarSearchForm } from "@/components/CarSearchForm";
import { CarListings } from "@/components/CarListings";
import { formatters } from "@/utils/formatters";

export default function CarSearchApp() {
  const [carListings, setCarListings] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (query) => {
    setLoading(true);
    try {
      const response = await fetch("/api/cars", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();
      if (data.cars) {
        setCarListings(data.cars);
      }
    } catch (error) {
      console.error("Error:", error);
    }
    setLoading(false);
  };

  return (
    <div className="container-fluid bg-light min-vh-100 py-5">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <CarSearchForm onSearch={handleSearch} loading={loading} />
          <CarListings
            cars={carListings}
            formatPrice={formatters.formatPrice}
            formatMileage={formatters.formatMileage}
          />
        </div>
      </div>
    </div>
  );
}
