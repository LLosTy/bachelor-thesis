"use client";
import { useState, useEffect } from "react";
import { CarSearchForm } from "@/components/CarSearchForm";
import { CarListings } from "@/components/CarListings";
import { formatters } from "@/utils/formatters";
import { cookieUtils } from "@/utils/cookieUtils";

export default function CarSearchApp() {
  const [carListings, setCarListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);

  // Load cached results and search history when component mounts
  useEffect(() => {
    if (cookieUtils.canUseLocalStorage()) {
      const cachedResults = localStorage.getItem("carSearchResults");
      const savedHistory = localStorage.getItem("searchHistory");

      if (cachedResults) {
        setCarListings(JSON.parse(cachedResults));
      }

      if (savedHistory) {
        setSearchHistory(JSON.parse(savedHistory));
      }
    }
  }, []);

  // Helper function to update search history
  const updateSearchHistory = (query) => {
    // Create a new array to avoid direct state mutation
    const newHistory = [
      query,
      ...searchHistory.filter((item) => item !== query),
    ];

    // Limit history to 10 items
    const limitedHistory = newHistory.slice(0, 10);

    // Update state and localStorage
    setSearchHistory(limitedHistory);
    if (cookieUtils.canUseLocalStorage()) {
      localStorage.setItem("searchHistory", JSON.stringify(limitedHistory));
    }
  };

  const handleSearch = async (query) => {
    setLoading(true);
    try {
      // First check if we have cached results for this query and can use localStorage
      if (cookieUtils.canUseLocalStorage()) {
        const latestQuery = searchHistory.length > 0 ? searchHistory[0] : null;
        const cachedResults = localStorage.getItem("carSearchResults");

        // If the query matches the latest query and we have results, use them
        if (query === latestQuery && cachedResults) {
          setCarListings(JSON.parse(cachedResults));
          setLoading(false);
          return;
        }
      }

      // If no cache hit or can't use localStorage, make the API call
      const response = await fetch("/api/cars", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();
      if (data.cars) {
        // Only cache if we have permission
        if (cookieUtils.canUseLocalStorage()) {
          localStorage.setItem("carSearchResults", JSON.stringify(data.cars));
          updateSearchHistory(query);
        }
        setCarListings(data.cars);
      }
    } catch (error) {
      console.error("Error:", error);
      // If there's an error and we can use localStorage, try to fall back to cached results
      if (cookieUtils.canUseLocalStorage()) {
        const cachedResults = localStorage.getItem("carSearchResults");
        if (cachedResults) {
          setCarListings(JSON.parse(cachedResults));
        }
      }
    }
    setLoading(false);
  };

  // Optional: Clear cache when component unmounts
  useEffect(() => {
    return () => {
      if (cookieUtils.canUseLocalStorage()) {
        // Uncomment if you want to clear cache on unmount
        // localStorage.removeItem("carSearchResults");
        // localStorage.removeItem("searchHistory");
      }
    };
  }, []);

  return (
    <div className="container-fluid bg-light min-vh-100 py-5">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <CarSearchForm
            onSearch={handleSearch}
            loading={loading}
            initialValue={searchHistory.length > 0 ? searchHistory[0] : ""}
            searchHistory={searchHistory}
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
