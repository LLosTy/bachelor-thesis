"use client";

import { useState, useEffect, useMemo } from "react";
import { CarSearchForm } from "@/components/CarSearchForm";
import { CarListings } from "@/components/CarListings";
import { formatters } from "@/utils/formatters";
import { cookieUtils } from "@/utils/cookieUtils";
import CarFilter from "@/components/CarFilter";

export default function CarSearchApp() {
  const [carListings, setCarListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const [sortOption, setSortOption] = useState("none");

  // Load cached results and search history when component mounts
  useEffect(() => {
    if (cookieUtils.canUseLocalStorage()) {
      const cachedResults = localStorage.getItem("carSearchResults");
      const savedHistory = localStorage.getItem("searchHistory");
      const savedSort = localStorage.getItem("carSortOption");

      if (cachedResults) {
        setCarListings(JSON.parse(cachedResults));
      }

      if (savedHistory) {
        setSearchHistory(JSON.parse(savedHistory));
      }

      if (savedSort) {
        setSortOption(savedSort);
      }
    }
  }, []);

  // Save sort option to localStorage when it changes
  useEffect(() => {
    if (cookieUtils.canUseLocalStorage()) {
      localStorage.setItem("carSortOption", sortOption);
    }
  }, [sortOption]);

  // Sort cars based on the selected option
  const sortedCarListings = useMemo(() => {
    if (!carListings.length) return [];

    const carsToSort = [...carListings]; // Create a copy to avoid mutating the original array

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
  }, [carListings, sortOption]);

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

      // If no cache hit or can't use localStorage, make the API call to Directus
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

  // Handle filter-based search results
  const handleFilterResults = (results) => {
    setCarListings(results);

    // Store results in localStorage if we can
    if (cookieUtils.canUseLocalStorage()) {
      localStorage.setItem("carSearchResults", JSON.stringify(results));
    }
  };

  // Handle sort option change
  const handleSort = (option) => {
    setSortOption(option);
  };

  // Optional: Clear cache when component unmounts
  useEffect(() => {
    return () => {
      if (cookieUtils.canUseLocalStorage()) {
        // Uncomment if you want to clear cache on unmount
        // localStorage.removeItem("carSearchResults");
        // localStorage.removeItem("searchHistory");
        // localStorage.removeItem("carSortOption");
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Natural language search */}
        <CarSearchForm
          onSearch={handleSearch}
          loading={loading}
          initialValue={searchHistory.length > 0 ? searchHistory[0] : ""}
        />

        {/* Results display with sorting */}
        <div className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CarListings
            cars={sortedCarListings}
            formatPrice={formatters.formatPrice}
            formatMileage={formatters.formatMileage}
            onSort={handleSort}
            currentSort={sortOption}
          />
        </div>

        {/* Advanced filter component (floating button and sheet) */}
        <CarFilter onFilterResults={handleFilterResults} />
      </div>
    </div>
  );
}
