"use client";
import React, { useState, useEffect } from "react";
import {
  fetchMakes,
  fetchModelsByMake,
  fetchYears,
  fetchEngineTypes,
  getPriceRangeOptions,
  searchCars,
} from "../services/carApiService";

const VehicleFilter = ({ onFilterResults }) => {
  // Filter state
  const [filters, setFilters] = useState({
    make: "",
    model: "",
    year: "",
    price: "",
    mileageFrom: "",
    mileageTo: "",
    engineType: "",
  });

  // Data state
  const [makes, setMakes] = useState([]);
  const [models, setModels] = useState([]);
  const [years, setYears] = useState([]);
  const [engineTypes, setEngineTypes] = useState([]);
  const [priceRanges] = useState(getPriceRangeOptions());

  // UI state
  const [loading, setLoading] = useState({
    makes: false,
    models: false,
    years: false,
    engineTypes: false,
    search: false,
  });
  const [error, setError] = useState({
    makes: null,
    models: null,
    years: null,
    engineTypes: null,
    search: null,
  });

  // Fetch makes on component mount
  useEffect(() => {
    const loadInitialData = async () => {
      await Promise.all([loadMakes(), loadYears(), loadEngineTypes()]);
    };

    loadInitialData();
  }, []);

  // Load makes with error handling
  const loadMakes = async () => {
    setLoading((prev) => ({ ...prev, makes: true }));
    setError((prev) => ({ ...prev, makes: null }));

    try {
      const makesData = await fetchMakes();
      setMakes(makesData);
    } catch (err) {
      console.error("Failed to load makes", err);
      setError((prev) => ({
        ...prev,
        makes: "Failed to load car makes. Please try again.",
      }));
    } finally {
      setLoading((prev) => ({ ...prev, makes: false }));
    }
  };

  // Load years with error handling
  const loadYears = async () => {
    setLoading((prev) => ({ ...prev, years: true }));
    setError((prev) => ({ ...prev, years: null }));

    try {
      const yearsData = await fetchYears();
      setYears(yearsData);
    } catch (err) {
      console.error("Failed to load years", err);
      setError((prev) => ({
        ...prev,
        years: "Failed to load years. Please try again.",
      }));
    } finally {
      setLoading((prev) => ({ ...prev, years: false }));
    }
  };

  // Load engine types with error handling
  const loadEngineTypes = async () => {
    setLoading((prev) => ({ ...prev, engineTypes: true }));
    setError((prev) => ({ ...prev, engineTypes: null }));

    try {
      const engineTypesData = await fetchEngineTypes();
      // Convert to title case for display if they aren't already
      const formattedEngineTypes = engineTypesData.map((type) =>
        typeof type === "string"
          ? type.charAt(0).toUpperCase() + type.slice(1)
          : type
      );
      setEngineTypes(formattedEngineTypes);
    } catch (err) {
      console.error("Failed to load engine types", err);
      setError((prev) => ({
        ...prev,
        engineTypes: "Failed to load engine types. Please try again.",
      }));
    } finally {
      setLoading((prev) => ({ ...prev, engineTypes: false }));
    }
  };

  // Fetch models when make changes
  useEffect(() => {
    const loadModels = async () => {
      if (!filters.make) {
        setModels([]);
        return;
      }

      setLoading((prev) => ({ ...prev, models: true }));
      setError((prev) => ({ ...prev, models: null }));

      try {
        const modelsData = await fetchModelsByMake(filters.make);
        setModels(modelsData);
      } catch (err) {
        console.error(`Failed to load models for ${filters.make}`, err);
        setError((prev) => ({
          ...prev,
          models: `Failed to load models for ${filters.make}. Please try again.`,
        }));
      } finally {
        setLoading((prev) => ({ ...prev, models: false }));
      }
    };

    // Reset model selection when make changes
    setFilters((prev) => ({ ...prev, model: "" }));
    loadModels();
  }, [filters.make]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  // Handle mileage inputs to only accept numbers
  const handleMileageChange = (e) => {
    const { name, value } = e.target;
    // Only allow numbers or empty string
    if (value === "" || /^\d+$/.test(value)) {
      setFilters((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading((prev) => ({ ...prev, search: true }));
    setError((prev) => ({ ...prev, search: null }));

    try {
      const results = await searchCars(filters, 1, 10);

      // Pass results to parent component
      if (typeof onFilterResults === "function") {
        onFilterResults(results.data);
      }

      // Close the offcanvas on mobile after search using a programmatically triggered button
      if (typeof window !== "undefined") {
        // Create a temporary button with the proper data attributes
        const closeButton = document.createElement("button");
        closeButton.setAttribute("type", "button");
        closeButton.setAttribute("data-bs-dismiss", "offcanvas");
        closeButton.setAttribute("data-bs-target", "#filterOffcanvas");
        closeButton.style.display = "none";

        // Add to body, click it, then remove it
        document.body.appendChild(closeButton);
        closeButton.click();
        document.body.removeChild(closeButton);
      }
    } catch (err) {
      console.error("Error searching cars", err);
      setError((prev) => ({
        ...prev,
        search: "Failed to search cars. Please try again later.",
      }));
    } finally {
      setLoading((prev) => ({ ...prev, search: false }));
    }
  };

  // Reset all filters
  const handleReset = () => {
    setFilters({
      make: "",
      model: "",
      year: "",
      price: "",
      mileageFrom: "",
      mileageTo: "",
      engineType: "",
    });

    // If onFilterResults is provided, call it with empty array to clear results
    if (typeof onFilterResults === "function") {
      onFilterResults([]);
    }
  };

  const FilterContent = () => (
    <form onSubmit={handleSubmit} className="needs-validation">
      {error.search && (
        <div className="alert alert-danger mb-3" role="alert">
          {error.search}
        </div>
      )}

      <div className="d-flex flex-column gap-3">
        <div>
          <label htmlFor="makeSelect" className="form-label mb-1 fw-medium">
            Make
          </label>
          <select
            id="makeSelect"
            className="form-select shadow-sm"
            name="make"
            value={filters.make}
            onChange={handleInputChange}
            disabled={loading.makes}
          >
            <option value="">All Makes</option>
            {makes.map((make) => (
              <option key={make} value={make}>
                {make}
              </option>
            ))}
          </select>
          {loading.makes && (
            <div
              className="spinner-border spinner-border-sm text-primary mt-2"
              role="status"
            >
              <span className="visually-hidden">Loading makes...</span>
            </div>
          )}
          {error.makes && (
            <div className="text-danger mt-1 small">{error.makes}</div>
          )}
        </div>

        <div>
          <label htmlFor="modelSelect" className="form-label mb-1 fw-medium">
            Model
          </label>
          <select
            id="modelSelect"
            className="form-select shadow-sm"
            name="model"
            value={filters.model}
            onChange={handleInputChange}
            disabled={!filters.make || loading.models}
          >
            <option value="">All Models</option>
            {loading.models ? (
              <option disabled>Loading models...</option>
            ) : (
              models.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))
            )}
          </select>
          {loading.models && (
            <div
              className="spinner-border spinner-border-sm text-primary mt-2"
              role="status"
            >
              <span className="visually-hidden">Loading models...</span>
            </div>
          )}
          {error.models && (
            <div className="text-danger mt-1 small">{error.models}</div>
          )}
        </div>

        <div>
          <label htmlFor="yearSelect" className="form-label mb-1 fw-medium">
            Year
          </label>
          <select
            id="yearSelect"
            className="form-select shadow-sm"
            name="year"
            value={filters.year}
            onChange={handleInputChange}
            disabled={loading.years}
          >
            <option value="">Any Year</option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          {loading.years && (
            <div
              className="spinner-border spinner-border-sm text-primary mt-2"
              role="status"
            >
              <span className="visually-hidden">Loading years...</span>
            </div>
          )}
          {error.years && (
            <div className="text-danger mt-1 small">{error.years}</div>
          )}
        </div>

        <div>
          <label htmlFor="priceSelect" className="form-label mb-1 fw-medium">
            Price
          </label>
          <select
            id="priceSelect"
            className="form-select shadow-sm"
            name="price"
            value={filters.price}
            onChange={handleInputChange}
          >
            {priceRanges.map((range) => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-2">
          <label className="form-label fw-medium">Mileage (km)</label>
          <div className="d-flex gap-2 align-items-center">
            <div className="flex-grow-1">
              <input
                type="text"
                className="form-control shadow-sm"
                id="mileageFrom"
                name="mileageFrom"
                placeholder="From"
                value={filters.mileageFrom}
                onChange={handleMileageChange}
                aria-label="Minimum mileage"
              />
            </div>
            <div className="text-muted">—</div>
            <div className="flex-grow-1">
              <input
                type="text"
                className="form-control shadow-sm"
                id="mileageTo"
                name="mileageTo"
                placeholder="To"
                value={filters.mileageTo}
                onChange={handleMileageChange}
                aria-label="Maximum mileage"
              />
            </div>
          </div>
        </div>

        <div>
          <label
            htmlFor="engineTypeSelect"
            className="form-label mb-1 fw-medium"
          >
            Engine Type
          </label>
          <select
            id="engineTypeSelect"
            className="form-select shadow-sm"
            name="engineType"
            value={filters.engineType}
            onChange={handleInputChange}
            disabled={loading.engineTypes}
          >
            <option value="">Any Engine</option>
            {engineTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          {loading.engineTypes && (
            <div
              className="spinner-border spinner-border-sm text-primary mt-2"
              role="status"
            >
              <span className="visually-hidden">Loading engine types...</span>
            </div>
          )}
          {error.engineTypes && (
            <div className="text-danger mt-1 small">{error.engineTypes}</div>
          )}
        </div>

        <div className="d-flex gap-2 mt-3">
          <button
            type="button"
            className="btn btn-outline-secondary flex-grow-1 d-flex align-items-center justify-content-center gap-1"
            onClick={handleReset}
          >
            <i className="bi bi-x-circle"></i> Reset
          </button>
          <button
            type="submit"
            className="btn btn-danger flex-grow-1 d-flex align-items-center justify-content-center gap-1"
            disabled={loading.search}
          >
            {loading.search ? (
              <div className="spinner-border spinner-border-sm" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            ) : (
              <>
                <i className="bi bi-search"></i> Search
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );

  return (
    <>
      {/* Filter Toggle Button */}
      <button
        className="btn btn-primary position-fixed bottom-0 start-0 m-3 rounded-circle d-flex align-items-center justify-content-center shadow-lg"
        style={{ zIndex: 1045, width: "50px", height: "50px" }}
        type="button"
        data-bs-toggle="offcanvas"
        data-bs-target="#filterOffcanvas"
        aria-controls="filterOffcanvas"
        title="Open Filters"
      >
        <i className="bi bi-funnel-fill fs-4"></i>
      </button>

      {/* Offcanvas Filter */}
      <div
        className="offcanvas offcanvas-start"
        data-bs-scroll="true"
        data-bs-backdrop="true"
        tabIndex="-1"
        id="filterOffcanvas"
        aria-labelledby="filterOffcanvasLabel"
      >
        <div className="offcanvas-header border-bottom">
          <h5 className="offcanvas-title" id="filterOffcanvasLabel">
            <i className="bi bi-funnel-fill me-2"></i>
            Car Filters
          </h5>
          <button
            type="button"
            className="btn-close"
            data-bs-dismiss="offcanvas"
            aria-label="Close"
          ></button>
        </div>
        <div className="offcanvas-body">
          <FilterContent />
        </div>
      </div>
    </>
  );
};

export default VehicleFilter;
