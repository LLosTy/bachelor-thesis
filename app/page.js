// app.page.js
"use client";

import { useState, useEffect, useCallback } from "react";
import { CarSearchForm } from "@/components/CarSearchForm";
import { CarListings } from "@/components/CarListings";
import { PaginationControls } from "@/components/PaginationControls";
import { formatters } from "@/utils/formatters";
import { cookieUtils } from "@/utils/cookieUtils";
import CarFilter from "@/components/CarFilter";

export default function CarSearchApp() {
  const [carListings, setCarListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const [sortOption, setSortOption] = useState("none");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(3); // Set to 3 for testing
  const [currentQuery, setCurrentQuery] = useState("");

  // Save state to localStorage
  const saveToLocalStorage = useCallback((key, value) => {
    if (cookieUtils.canUseLocalStorage()) {
      if (typeof value === "object") {
        localStorage.setItem(key, JSON.stringify(value));
      } else {
        localStorage.setItem(key, value.toString());
      }
    }
  }, []);

  // Load cached results and search history when component mounts
  useEffect(() => {
    const loadInitialData = () => {
      if (cookieUtils.canUseLocalStorage()) {
        const cachedResults = localStorage.getItem("carSearchResults");
        const savedHistory = localStorage.getItem("searchHistory");
        const savedSort = localStorage.getItem("carSortOption");
        const savedPage = localStorage.getItem("currentPage");
        const savedItemsPerPage = localStorage.getItem("itemsPerPage");
        const savedQuery = localStorage.getItem("currentQuery");
        const savedPaginationInfo = localStorage.getItem("paginationInfo");

        let pageToLoad = 1;
        let limitToUse = 3;
        let queryToUse = "";

        if (savedQuery) {
          queryToUse = savedQuery;
          setCurrentQuery(savedQuery);
        }

        if (savedHistory) {
          const parsedHistory = JSON.parse(savedHistory);
          setSearchHistory(parsedHistory);

          // If no saved query but we have history, use the first item
          if (!queryToUse && parsedHistory.length > 0) {
            queryToUse = parsedHistory[0];
            setCurrentQuery(queryToUse);
          }
        }

        if (savedSort) {
          setSortOption(savedSort);
        }

        if (savedPage) {
          const parsedPage = parseInt(savedPage, 10);
          setCurrentPage(parsedPage);
          pageToLoad = parsedPage;
        }

        if (savedItemsPerPage) {
          const parsedLimit = parseInt(savedItemsPerPage, 10);
          setItemsPerPage(parsedLimit);
          limitToUse = parsedLimit;
        }

        if (savedPaginationInfo) {
          const paginationInfo = JSON.parse(savedPaginationInfo);
          setTotalPages(paginationInfo.totalPages);
          setTotalItems(paginationInfo.totalItems);
        }

        if (cachedResults) {
          setCarListings(JSON.parse(cachedResults));
        }

        // If we have a query, load the data
        if (queryToUse) {
          // We use a small timeout to ensure the state is updated before fetching
          setTimeout(() => {
            fetchCars(queryToUse, pageToLoad, limitToUse);
          }, 0);
        }
      }
    };

    loadInitialData();
  }, []);

  // Save current query and pagination settings to localStorage
  useEffect(() => {
    if (currentQuery) saveToLocalStorage("currentQuery", currentQuery);
    saveToLocalStorage("currentPage", currentPage);
    saveToLocalStorage("itemsPerPage", itemsPerPage);

    // Only save pagination info if we have actual data
    if (totalPages > 0 && totalItems > 0) {
      saveToLocalStorage("paginationInfo", {
        currentPage,
        totalPages,
        totalItems,
        limit: itemsPerPage,
      });
    }
  }, [
    currentQuery,
    currentPage,
    itemsPerPage,
    totalPages,
    totalItems,
    saveToLocalStorage,
  ]);

  // Save sort option to localStorage
  useEffect(() => {
    saveToLocalStorage("carSortOption", sortOption);
  }, [sortOption, saveToLocalStorage]);

  // Helper function to update search history
  const updateSearchHistory = useCallback(
    (query) => {
      // Create a new array to avoid direct state mutation
      const newHistory = [
        query,
        ...searchHistory.filter((item) => item !== query),
      ];

      // Limit history to 10 items
      const limitedHistory = newHistory.slice(0, 10);

      // Update state and localStorage
      setSearchHistory(limitedHistory);
      saveToLocalStorage("searchHistory", limitedHistory);
    },
    [searchHistory, saveToLocalStorage]
  );

  // Function to fetch cars with pagination using Directus approach
  const fetchCars = useCallback(
    async (query, page, limit) => {
      if (!query) return;

      // Create a cache key based on the request parameters
      const cacheKey = `cars_${query}_page${page}_limit${limit}`;

      // Check if we have cached data
      if (cookieUtils.canUseLocalStorage()) {
        const cachedData = sessionStorage.getItem(cacheKey);
        if (cachedData) {
          const data = JSON.parse(cachedData);
          setCarListings(data.cars);

          if (data.pagination) {
            setTotalPages(data.pagination.totalPages);
            setTotalItems(data.pagination.totalItems);
          }

          return; // Return early, no need to fetch again
        }
      }

      setLoading(true);

      try {
        const response = await fetch("/api/cars", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query, page, limit }),
        });

        // Check if the response is ok before trying to parse JSON
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`API error (${response.status}):`, errorText);
          throw new Error(
            `API returned status ${response.status}: ${errorText}`
          );
        }

        // Get response as text first for debugging
        const responseText = await response.text();

        // Make sure we have a valid JSON response
        if (!responseText || responseText.trim() === "") {
          console.error("API returned empty response");
          throw new Error("Empty response from server");
        }

        // Try to parse the JSON
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error("Failed to parse JSON response:", parseError);
          console.error("Response text:", responseText);
          throw new Error("Invalid JSON response from server");
        }

        if (data.cars) {
          // Save the response data
          setCarListings(data.cars);
          saveToLocalStorage("carSearchResults", data.cars);

          // Update pagination info if available
          if (data.pagination) {
            const paginationInfo = data.pagination;
            setTotalPages(paginationInfo.totalPages);
            setTotalItems(paginationInfo.totalItems);
            saveToLocalStorage("paginationInfo", paginationInfo);
          }

          // Update search history
          updateSearchHistory(query);

          // Cache the response data
          if (cookieUtils.canUseLocalStorage()) {
            sessionStorage.setItem(cacheKey, JSON.stringify(data));
          }
        } else {
          // If we didn't get cars data but the request was successful
          console.warn("API response missing cars data:", data);
          setCarListings([]);
        }
      } catch (error) {
        console.error("Error fetching cars:", error);
        // Optionally show an error message to the user
      } finally {
        setLoading(false);
      }
    },
    [saveToLocalStorage, updateSearchHistory]
  );

  // Handle search
  const handleSearch = useCallback(
    async (query) => {
      setCurrentQuery(query);
      setCurrentPage(1); // Reset to first page
      fetchCars(query, 1, itemsPerPage);
    },
    [fetchCars, itemsPerPage]
  );

  // Handle page change
  const handlePageChange = useCallback(
    (newPage) => {
      if (newPage === currentPage) return;

      setCurrentPage(newPage);
      fetchCars(currentQuery, newPage, itemsPerPage);

      // Scroll to top when changing pages
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [currentPage, currentQuery, fetchCars, itemsPerPage]
  );

  // Handle items per page change
  const handleItemsPerPageChange = useCallback(
    (newLimit) => {
      if (newLimit === itemsPerPage) return;

      setItemsPerPage(newLimit);
      setCurrentPage(1); // Reset to first page

      if (currentQuery) {
        fetchCars(currentQuery, 1, newLimit);
      }
    },
    [currentQuery, fetchCars, itemsPerPage]
  );

  // Handle filter-based search results
  const handleFilterResults = useCallback(
    (results) => {
      setCarListings(results);
      setCurrentPage(1);

      const calculatedTotalPages =
        Math.ceil(results.length / itemsPerPage) || 1;
      setTotalPages(calculatedTotalPages);
      setTotalItems(results.length);

      saveToLocalStorage("carSearchResults", results);
      saveToLocalStorage("paginationInfo", {
        currentPage: 1,
        totalPages: calculatedTotalPages,
        totalItems: results.length,
        limit: itemsPerPage,
      });
    },
    [itemsPerPage, saveToLocalStorage]
  );

  // Sort cars based on the selected option
  const sortedCarListings = useCallback(() => {
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

  // Handle sort option change
  const handleSort = useCallback((option) => {
    setSortOption(option);
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

        {/* Items per page selector */}
        {carListings.length > 0 && (
          <div className="mt-4 flex justify-end">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Items per page:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  const newLimit = parseInt(e.target.value, 10);
                  handleItemsPerPageChange(newLimit);
                }}
                className="h-8 py-0 rounded-md border-gray-300 focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              >
                <option value="3">3</option>
                <option value="6">6</option>
                <option value="12">12</option>
                <option value="24">24</option>
              </select>
            </div>
          </div>
        )}

        {/* Results display with sorting */}
        <div className="mt-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CarListings
            cars={sortedCarListings()}
            formatPrice={formatters.formatPrice}
            formatMileage={formatters.formatMileage}
          />

          {/* Pagination controls */}
          {carListings.length > 0 && (
            <div className="mt-8">
              <div className="text-center mb-2 text-sm text-gray-600">
                Showing {Math.min(itemsPerPage, carListings.length)} of{" "}
                {totalItems} cars • Page {currentPage} of {totalPages}
              </div>
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </div>

        {/* Advanced filter component (floating button and sheet) */}
        <CarFilter onFilterResults={handleFilterResults} />
      </div>
    </div>
  );
}
