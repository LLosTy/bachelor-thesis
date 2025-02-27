"use client";
import { useState, useEffect } from "react";
import { CarSearchForm } from "@/components/CarSearchForm";
import { CarListings } from "@/components/CarListings";
import { formatters } from "@/utils/formatters";

export default function CarSearchApp() {
  const [carListings, setCarListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastSearchQuery, setLastSearchQuery] = useState("");

  // Load cached results and last search query when component mounts
  useEffect(() => {
    const cachedResults = localStorage.getItem("carSearchResults");
    const savedQuery = localStorage.getItem("lastSearchQuery");

    if (cachedResults) {
      setCarListings(JSON.parse(cachedResults));
    }

    if (savedQuery) {
      setLastSearchQuery(savedQuery);
    }
  }, []);

  const handleSearch = async (query) => {
    setLoading(true);
    try {
      // First check if we have cached results for this query
      const cachedQuery = localStorage.getItem("lastSearchQuery");
      const cachedResults = localStorage.getItem("carSearchResults");

      // If the query matches the cached query and we have results, use them
      if (query === cachedQuery && cachedResults) {
        setCarListings(JSON.parse(cachedResults));
        setLoading(false);
        return;
      }

      // If no cache hit, make the API call
      const response = await fetch("/api/cars", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();
      if (data.cars) {
        // Cache the new results
        localStorage.setItem("carSearchResults", JSON.stringify(data.cars));
        localStorage.setItem("lastSearchQuery", query);
        setLastSearchQuery(query);
        setCarListings(data.cars);
      }
    } catch (error) {
      console.error("Error:", error);
      // If there's an error, try to fall back to cached results
      const cachedResults = localStorage.getItem("carSearchResults");
      if (cachedResults) {
        setCarListings(JSON.parse(cachedResults));
      }
    }
    setLoading(false);
  };

  // Optional: Clear cache when component unmounts
  useEffect(() => {
    return () => {
      // Uncomment if you want to clear cache on unmount
      // localStorage.removeItem("carSearchResults");
      // localStorage.removeItem("lastSearchQuery");
    };
  }, []);

  return (
    <div className="container-fluid bg-light min-vh-100 py-5">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <CarSearchForm
            onSearch={handleSearch}
            loading={loading}
            initialValue={lastSearchQuery}
          />
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
