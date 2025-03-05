import React, { useState, useEffect } from "react";

const CarFilterComponent = () => {
  const [filters, setFilters] = useState({
    make: "",
    model: "",
    year: "",
    price: "",
    mileageFrom: "",
    mileageTo: 150000,
    engineType: "",
  });

  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(false);

  // Sample data - replace with actual API calls
  const makes = ["Škoda", "Volkswagen", "Toyota", "BMW", "Audi", "Mercedes"];
  const years = Array.from(
    { length: 30 },
    (_, i) => new Date().getFullYear() - i
  );
  const engineTypes = ["Gasoline", "Diesel", "Electric", "Hybrid", "LPG"];

  // Fetch models based on selected make
  useEffect(() => {
    if (!filters.make) {
      setModels([]);
      return;
    }

    // Replace with actual API call to your Directus backend
    setLoading(true);

    // Simulating API call
    setTimeout(() => {
      // Example models mapping - replace with actual data from your API
      const modelsByMake = {
        Škoda: ["Octavia", "Fabia", "Superb", "Kodiaq", "Karoq"],
        Volkswagen: ["Golf", "Passat", "Tiguan", "Polo", "Arteon"],
        Toyota: ["Corolla", "RAV4", "Yaris", "Camry", "C-HR"],
        BMW: ["3 Series", "5 Series", "X3", "X5", "7 Series"],
        Audi: ["A4", "A6", "Q5", "Q7", "A3"],
        Mercedes: ["C-Class", "E-Class", "GLC", "A-Class", "S-Class"],
      };

      setModels(modelsByMake[filters.make] || []);
      setLoading(false);
    }, 300);
  }, [filters.make]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  // Handler for mileage inputs
  const handleMileageChange = (e) => {
    const { name, value } = e.target;
    // Only allow numbers or empty string
    if (value === "" || /^\d+$/.test(value)) {
      setFilters((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Replace with your actual search implementation
    console.log("Searching with filters:", filters);
    // Call your search API with filters

    // Close the offcanvas on mobile after search (using Bootstrap's API)
    if (typeof window !== "undefined") {
      const offcanvasElement = document.getElementById("filterOffcanvas");
      const offcanvas = bootstrap.Offcanvas.getInstance(offcanvasElement);
      if (offcanvas) {
        offcanvas.hide();
      }
    }
  };

  const handleReset = () => {
    setFilters({
      make: "",
      model: "",
      year: "",
      price: "",
      mileageFrom: "",
      mileageTo: 150000,
      engineType: "",
    });
  };

  const FilterContent = () => (
    <form onSubmit={handleSubmit} className="needs-validation">
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
            onChange={handleChange}
          >
            <option value="">All Makes</option>
            {makes.map((make) => (
              <option key={make} value={make}>
                {make}
              </option>
            ))}
          </select>
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
            onChange={handleChange}
            disabled={!filters.make || loading}
          >
            <option value="">All Models</option>
            {loading ? (
              <option disabled>Loading models...</option>
            ) : (
              models.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))
            )}
          </select>
          {loading && (
            <div
              className="spinner-border spinner-border-sm text-primary mt-2"
              role="status"
            >
              <span className="visually-hidden">Loading...</span>
            </div>
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
            onChange={handleChange}
          >
            <option value="">Any Year</option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
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
            onChange={handleChange}
          >
            <option value="">Any Price</option>
            <option value="0-5000">€0 - €5,000</option>
            <option value="5000-10000">€5,000 - €10,000</option>
            <option value="10000-15000">€10,000 - €15,000</option>
            <option value="15000-20000">€15,000 - €20,000</option>
            <option value="20000-30000">€20,000 - €30,000</option>
            <option value="30000+">€30,000+</option>
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
            onChange={handleChange}
          >
            <option value="">Any Engine</option>
            {engineTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
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
          >
            <i className="bi bi-search"></i> Search
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
        data-bs-backdrop="false"
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

export default CarFilterComponent;
