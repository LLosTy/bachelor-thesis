// app.page.js
"use client";

import { useState, useEffect, useCallback } from "react";
import { CarSearchForm } from "@/components/CarSearchForm";
import { CarListings } from "@/components/CarListings";
import { PaginationControls } from "@/components/PaginationControls";
import { formatters } from "@/utils/formatters";
import { cookieUtils } from "@/utils/cookieUtils";
import CarFilter from "@/components/CarFilter";
import {
  ArrowDownNarrowWide,
  DollarSign,
  Calendar,
  Gauge,
  Zap,
  Leaf,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function CarSearchApp() {
  const [carListings, setCarListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchHistory, setSearchHistory] = useState([]);
  const [sortOption, setSortOption] = useState("none");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(3);
  const [currentQuery, setCurrentQuery] = useState("");

  // Add state to track filter mode vs search mode
  const [isFilterMode, setIsFilterMode] = useState(false);
  const [filteredResults, setFilteredResults] = useState([]);
  const [currentFilters, setCurrentFilters] = useState(null);

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

  // Helper function to update search history
  const updateSearchHistory = useCallback(
    (query) => {
      const newHistory = [
        query,
        ...searchHistory.filter((item) => item !== query),
      ];
      const limitedHistory = newHistory.slice(0, 10);
      setSearchHistory(limitedHistory);
      saveToLocalStorage("searchHistory", limitedHistory);
    },
    [searchHistory, saveToLocalStorage]
  );

  // Function to fetch cars with pagination
  const fetchCars = useCallback(
    async (query, page, limit, fetchAll = false) => {
      if (!query) return;
      if (loading) return;
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/cars", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query,
            page: 1,
            limit: fetchAll ? 100 : limit,
          }),
        });
        if (!response.ok) {
          const errorText = await response.text();
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { error: "Unknown error occurred" };
          }
          let errorMessage = "An error occurred while fetching cars";
          if (response.status === 503) {
            errorMessage =
              "Database service is currently unavailable. Please try again later.";
          } else if (response.status === 400) {
            errorMessage = errorData.error || "Invalid request";
          } else if (response.status === 401) {
            errorMessage =
              "Authentication failed. Please check your configuration.";
          } else if (response.status === 403) {
            errorMessage = "Access denied. Please check your permissions.";
          } else if (response.status === 404) {
            errorMessage = "Resource not found.";
          }
          setError(errorMessage);
          setCarListings([]);
          setTotalPages(1);
          setTotalItems(0);
          return;
        }
        const data = await response.json();
        if (data.cars) {
          if (fetchAll) {
            // Store all results in memory and paginate in memory
            setFilteredResults(data.cars);
            setIsFilterMode(true);
            setCurrentFilters(null);
            setCurrentPage(1);
            setTotalItems(data.cars.length);
            const calculatedTotalPages = Math.max(
              1,
              Math.ceil(data.cars.length / itemsPerPage)
            );
            setTotalPages(calculatedTotalPages);
            setCarListings(data.cars.slice(0, itemsPerPage));
          } else {
            setCarListings(data.cars);
            setError(null);
            saveToLocalStorage("carSearchResults", data.cars);
            if (data.pagination) {
              const paginationInfo = data.pagination;
              setTotalPages(paginationInfo.totalPages);
              setTotalItems(paginationInfo.totalItems);
              saveToLocalStorage("paginationInfo", paginationInfo);
            }
            updateSearchHistory(query);
          }
        } else {
          setCarListings([]);
          setError("No cars found for your search");
        }
      } catch (error) {
        setError(error.message || "An error occurred while fetching cars");
        setCarListings([]);
        setTotalPages(1);
        setTotalItems(0);
      } finally {
        setLoading(false);
      }
    },
    [saveToLocalStorage, updateSearchHistory, loading, itemsPerPage]
  );

  // Load cached results and search history when component mounts
  useEffect(() => {
    if (cookieUtils.canUseLocalStorage()) {
      const cachedResults = localStorage.getItem("carSearchResults");
      const savedHistory = localStorage.getItem("searchHistory");
      const savedSort = localStorage.getItem("carSortOption");
      const savedPage = localStorage.getItem("currentPage");
      const savedItemsPerPage = localStorage.getItem("itemsPerPage");
      const savedQuery = localStorage.getItem("currentQuery");
      const savedPaginationInfo = localStorage.getItem("paginationInfo");
      const savedIsFilterMode = localStorage.getItem("isFilterMode");
      const savedFilteredResults = localStorage.getItem("filteredResults");
      const savedCurrentFilters = localStorage.getItem("currentFilters");

      if (savedHistory) {
        setSearchHistory(JSON.parse(savedHistory));
      }
      if (savedSort) {
        setSortOption(savedSort);
      }
      let page = 1;
      let perPage = 3;
      if (savedPage) {
        page = parseInt(savedPage, 10);
        setCurrentPage(page);
      }
      if (savedItemsPerPage) {
        perPage = parseInt(savedItemsPerPage, 10);
        setItemsPerPage(perPage);
      }
      if (savedPaginationInfo) {
        const paginationInfo = JSON.parse(savedPaginationInfo);
        setTotalPages(paginationInfo.totalPages);
        setTotalItems(paginationInfo.totalItems);
      }
      if (savedIsFilterMode === "true" && savedFilteredResults) {
        // Restore filter mode and filtered results
        const filtered = JSON.parse(savedFilteredResults);
        setFilteredResults(filtered);
        setIsFilterMode(true);
        // Calculate correct slice for the saved page
        const startIndex = (page - 1) * perPage;
        const endIndex = startIndex + perPage;
        setCarListings(filtered.slice(startIndex, endIndex));
        if (savedCurrentFilters) {
          setCurrentFilters(JSON.parse(savedCurrentFilters));
        }
      } else if (cachedResults) {
        setCarListings(JSON.parse(cachedResults));
      }
      if (savedQuery) {
        setCurrentQuery(savedQuery);
      }
    }
  }, []);

  // Save current query and pagination settings to localStorage
  useEffect(() => {
    if (currentQuery) saveToLocalStorage("currentQuery", currentQuery);
    saveToLocalStorage("currentPage", currentPage);
    saveToLocalStorage("itemsPerPage", itemsPerPage);
    saveToLocalStorage("isFilterMode", isFilterMode);
    if (isFilterMode) {
      saveToLocalStorage("filteredResults", filteredResults);
      saveToLocalStorage("currentFilters", currentFilters);
    }
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
    isFilterMode,
    filteredResults,
    currentFilters,
  ]);

  // Save sort option to localStorage
  useEffect(() => {
    saveToLocalStorage("carSortOption", sortOption);
  }, [sortOption, saveToLocalStorage]);

  // Handle search
  const handleSearch = useCallback(
    async (query) => {
      setCurrentQuery(query);
      setCurrentPage(1);
      setError(null);
      setIsFilterMode(false);
      setFilteredResults([]);
      setCurrentFilters(null);
      setTimeout(() => {
        fetchCars(query, 1, itemsPerPage, true);
      }, 100);
    },
    [fetchCars, itemsPerPage]
  );

  // Handle page change
  const handlePageChange = useCallback(
    (newPage) => {
      if (newPage === currentPage) return;

      setCurrentPage(newPage);
      setError(null);

      if (isFilterMode) {
        // In filter mode, paginate the filtered results
        const startIndex = (newPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedResults = filteredResults.slice(startIndex, endIndex);
        setCarListings(paginatedResults);
      } else {
        // In search mode, fetch from API
        fetchCars(currentQuery, newPage, itemsPerPage);
      }

      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [
      currentPage,
      currentQuery,
      fetchCars,
      itemsPerPage,
      isFilterMode,
      filteredResults,
    ]
  );

  // Handle items per page change
  const handleItemsPerPageChange = useCallback(
    (newLimit) => {
      if (newLimit === itemsPerPage) return;

      setItemsPerPage(newLimit);
      setCurrentPage(1);
      setError(null);

      if (isFilterMode) {
        // In filter mode, recalculate pagination for filtered results
        const calculatedTotalPages =
          Math.ceil(filteredResults.length / newLimit) || 1;
        setTotalPages(calculatedTotalPages);
        setTotalItems(filteredResults.length);

        // Show first page of filtered results
        const paginatedResults = filteredResults.slice(0, newLimit);
        setCarListings(paginatedResults);
      } else if (currentQuery) {
        // In search mode, fetch from API
        fetchCars(currentQuery, 1, newLimit);
      }
    },
    [currentQuery, fetchCars, itemsPerPage, isFilterMode, filteredResults]
  );

  // Handle filter-based search results
  const handleFilterResults = useCallback(
    (results, filters) => {
      setFilteredResults(results);
      setCurrentPage(1);
      setError(null);
      setIsFilterMode(true); // Switch to filter mode
      setCurrentFilters(filters); // Store the current filters

      const calculatedTotalPages =
        Math.ceil(results.length / itemsPerPage) || 1;
      setTotalPages(calculatedTotalPages);
      setTotalItems(results.length);

      // Show first page of filtered results
      const paginatedResults = results.slice(0, itemsPerPage);
      setCarListings(paginatedResults);

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

  // Helper to get sort option text
  const getSortOptionText = () => {
    switch (sortOption) {
      case "price_asc":
        return "Price: Low to High";
      case "price_desc":
        return "Price: High to Low";
      case "year_desc":
        return "Newest First";
      case "mileage_asc":
        return "Mileage: Low to High";
      case "mileage_desc":
        return "Mileage: High to Low";
      case "horsepower_desc":
        return "Horsepower: High to Low";
      case "fuel_economy_combined_asc":
        return "Fuel economy: Low to High";
      case "none":
        return "Default";
      default:
        return "Sort by";
    }
  };

  // Sorting function
  const sortCars = (cars, sortOption) => {
    if (!cars || !cars.length) return [];
    const carsToSort = [...cars];
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
      case "fuel_economy_combined_asc":
        return carsToSort.sort((a, b) => {
          const aVal = a.engine_specs?.fuel_consumption ?? Infinity;
          const bVal = b.engine_specs?.fuel_consumption ?? Infinity;
          return aVal - bVal;
        });
      default:
        return carsToSort;
    }
  };

  // Compute the full sorted list (either filtered or from API)
  const fullSortedCars = isFilterMode
    ? sortCars(filteredResults, sortOption)
    : sortCars(carListings, sortOption);

  // Paginate the sorted list
  const paginatedSortedCars = fullSortedCars.slice(
    (currentPage - 1) * itemsPerPage,
    (currentPage - 1) * itemsPerPage + itemsPerPage
  );

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Natural language search */}
        <CarSearchForm
          onSearch={handleSearch}
          loading={loading}
          initialValue={searchHistory.length > 0 ? searchHistory[0] : ""}
        />

        {/* Error display */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* Items per page selector and sorting dropdown */}
        {fullSortedCars.length > 0 && (
          <CarSortAndPaginationControls
            sortOption={sortOption}
            setSortOption={setSortOption}
            getSortOptionText={getSortOptionText}
            itemsPerPage={itemsPerPage}
            handleItemsPerPageChange={handleItemsPerPageChange}
          />
        )}

        {/* Results display with sorting */}
        <div className="mt-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CarListings
            cars={paginatedSortedCars}
            formatPrice={formatters.formatPrice}
            formatMileage={formatters.formatMileage}
          />

          {/* Pagination controls */}
          {fullSortedCars.length > 0 && (
            <div className="mt-8">
              <div className="text-center mb-2 text-sm text-gray-600">
                Showing {paginatedSortedCars.length} of {totalItems} cars • Page{" "}
                {currentPage} of {totalPages}
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

function CarSortAndPaginationControls({
  sortOption,
  setSortOption,
  getSortOptionText,
  itemsPerPage,
  handleItemsPerPageChange,
}) {
  return (
    <>
      {/* Sorting dropdown above */}
      <div className="mt-4 flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-[240px] justify-between">
              {getSortOptionText()}
              <ArrowDownNarrowWide className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[240px]">
            <DropdownMenuLabel>Sort Options</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => setSortOption("none")}>
                Default
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSortOption("price_asc")}>
                {" "}
                <DollarSign className="mr-2 h-4 w-4" />{" "}
                <span>Price: Low to High</span>{" "}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortOption("price_desc")}>
                {" "}
                <DollarSign className="mr-2 h-4 w-4" />{" "}
                <span>Price: High to Low</span>{" "}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSortOption("year_desc")}>
                {" "}
                <Calendar className="mr-2 h-4 w-4" /> <span>Newest First</span>{" "}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSortOption("mileage_asc")}>
                {" "}
                <Gauge className="mr-2 h-4 w-4" />{" "}
                <span>Mileage: Low to High</span>{" "}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortOption("mileage_desc")}>
                {" "}
                <Gauge className="mr-2 h-4 w-4" />{" "}
                <span>Mileage: High to Low</span>{" "}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setSortOption("horsepower_desc")}
              >
                {" "}
                <Zap className="mr-2 h-4 w-4" />{" "}
                <span>Horsepower: High to Low</span>{" "}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setSortOption("fuel_economy_combined_asc")}
              >
                {" "}
                <Leaf className="mr-2 h-4 w-4" />{" "}
                <span>Fuel economy: Low to High</span>{" "}
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {/* Items per page selector below */}
      <div className="mt-2 flex justify-end">
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
    </>
  );
}
