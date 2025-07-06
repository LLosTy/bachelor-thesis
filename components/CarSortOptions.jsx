// components/CarSortOptions.jsx
import { useState } from "react";

export const CarSortOptions = ({ onSort }) => {
  const [currentSort, setCurrentSort] = useState("none");

  const sortOptions = [
    { value: "none", label: "Default" },
    { value: "price_asc", label: "Cheapest" },
    { value: "price_desc", label: "Most expensive" },
    { value: "year_desc", label: "Newest" },
    { value: "mileage_asc", label: "Lowest mileage" },
    { value: "mileage_desc", label: "Highest mileage" },
    { value: "horsepower_desc", label: "Highest HP" },
    { value: "fuel_economy_combined_asc", label: "Fuel economy: Low to High" },
  ];

  const handleSortChange = (e) => {
    const selectedSort = e.target.value;
    setCurrentSort(selectedSort);
    onSort(selectedSort);
  };

  return (
    <div className="mb-4 d-flex justify-content-end">
      <div className="d-flex align-items-center">
        <label htmlFor="sortOptions" className="me-2 text-secondary">
          Sort by:
        </label>
        <select
          id="sortOptions"
          className="form-select form-select-sm"
          value={currentSort}
          onChange={handleSortChange}
          style={{ width: "auto" }}
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
