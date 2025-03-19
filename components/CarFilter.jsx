"use client";

import React, { useState, useEffect } from "react";
import { Filter, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  fetchMakes,
  fetchModelsByMake,
  fetchYears,
  fetchEngineTypes,
  getPriceRangeOptions,
  searchCars,
} from "../services/carApiService";

const CarFilter = ({ onFilterResults }) => {
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
  const [open, setOpen] = useState(false);

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

  // Handle select changes (for shadcn/ui Select component)
  const handleSelectChange = (name, value) => {
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

      // Close the sheet
      setOpen(false);
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
    <form onSubmit={handleSubmit}>
      {error.search && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error.search}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <div>
          <Label
            htmlFor="makeSelect"
            className="text-sm font-medium mb-1.5 block"
          >
            Make
          </Label>
          <Select
            name="make"
            value={filters.make}
            onValueChange={(value) => handleSelectChange("make", value)}
            disabled={loading.makes}
          >
            <SelectTrigger id="makeSelect" className="w-full shadow-sm">
              <SelectValue placeholder="All Makes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Makes</SelectItem>
              {makes.map((make) => (
                <SelectItem key={make} value={make}>
                  {make}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {loading.makes && (
            <div className="flex items-center mt-2 text-primary">
              <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              <span className="text-xs">Loading makes...</span>
            </div>
          )}
          {error.makes && (
            <p className="text-xs text-destructive mt-1">{error.makes}</p>
          )}
        </div>

        <div>
          <Label
            htmlFor="modelSelect"
            className="text-sm font-medium mb-1.5 block"
          >
            Model
          </Label>
          <Select
            name="model"
            value={filters.model}
            onValueChange={(value) => handleSelectChange("model", value)}
            disabled={!filters.make || loading.models}
          >
            <SelectTrigger id="modelSelect" className="w-full shadow-sm">
              <SelectValue placeholder="All Models" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Models</SelectItem>
              {loading.models ? (
                <SelectItem value="" disabled>
                  Loading models...
                </SelectItem>
              ) : (
                models.map((model) => (
                  <SelectItem key={model} value={model}>
                    {model}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {loading.models && (
            <div className="flex items-center mt-2 text-primary">
              <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              <span className="text-xs">Loading models...</span>
            </div>
          )}
          {error.models && (
            <p className="text-xs text-destructive mt-1">{error.models}</p>
          )}
        </div>

        <div>
          <Label
            htmlFor="yearSelect"
            className="text-sm font-medium mb-1.5 block"
          >
            Year
          </Label>
          <Select
            name="year"
            value={filters.year}
            onValueChange={(value) => handleSelectChange("year", value)}
            disabled={loading.years}
          >
            <SelectTrigger id="yearSelect" className="w-full shadow-sm">
              <SelectValue placeholder="Any Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Any Year</SelectItem>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {loading.years && (
            <div className="flex items-center mt-2 text-primary">
              <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              <span className="text-xs">Loading years...</span>
            </div>
          )}
          {error.years && (
            <p className="text-xs text-destructive mt-1">{error.years}</p>
          )}
        </div>

        <div>
          <Label
            htmlFor="priceSelect"
            className="text-sm font-medium mb-1.5 block"
          >
            Price
          </Label>
          <Select
            name="price"
            value={filters.price}
            onValueChange={(value) => handleSelectChange("price", value)}
          >
            <SelectTrigger id="priceSelect" className="w-full shadow-sm">
              <SelectValue placeholder="Any Price" />
            </SelectTrigger>
            <SelectContent>
              {priceRanges.map((range) => (
                <SelectItem key={range.value} value={range.value}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-sm font-medium mb-1.5 block">
            Mileage (km)
          </Label>
          <div className="flex items-center space-x-2">
            <Input
              type="text"
              id="mileageFrom"
              name="mileageFrom"
              placeholder="From"
              value={filters.mileageFrom}
              onChange={handleMileageChange}
              className="shadow-sm"
            />
            <span className="text-muted-foreground">—</span>
            <Input
              type="text"
              id="mileageTo"
              name="mileageTo"
              placeholder="To"
              value={filters.mileageTo}
              onChange={handleMileageChange}
              className="shadow-sm"
            />
          </div>
        </div>

        <div>
          <Label
            htmlFor="engineTypeSelect"
            className="text-sm font-medium mb-1.5 block"
          >
            Engine Type
          </Label>
          <Select
            name="engineType"
            value={filters.engineType}
            onValueChange={(value) => handleSelectChange("engineType", value)}
            disabled={loading.engineTypes}
          >
            <SelectTrigger id="engineTypeSelect" className="w-full shadow-sm">
              <SelectValue placeholder="Any Engine" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Any Engine</SelectItem>
              {engineTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {loading.engineTypes && (
            <div className="flex items-center mt-2 text-primary">
              <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              <span className="text-xs">Loading engine types...</span>
            </div>
          )}
          {error.engineTypes && (
            <p className="text-xs text-destructive mt-1">{error.engineTypes}</p>
          )}
        </div>

        <div className="flex gap-2 mt-5">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            className="flex-1"
          >
            <X className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <Button
            type="submit"
            variant="destructive"
            disabled={loading.search}
            className="flex-1"
          >
            {loading.search ? (
              <>
                <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Searching
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Search
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );

  return (
    <>
      {/* Filter Toggle Button */}
      <Button
        variant="primary"
        className="fixed bottom-0 left-0 m-3 rounded-full h-[50px] w-[50px] p-0 flex items-center justify-center shadow-lg z-50"
        onClick={() => setOpen(true)}
      >
        <Filter className="h-5 w-5" />
        <span className="sr-only">Open Filters</span>
      </Button>

      {/* Sheet (replacement for Offcanvas) */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-[320px] sm:w-[380px]">
          <SheetHeader className="border-b pb-4">
            <SheetTitle className="flex items-center">
              <Filter className="mr-2 h-5 w-5" />
              Car Filters
            </SheetTitle>
          </SheetHeader>
          <div className="mt-5">
            <FilterContent />
          </div>
          <SheetClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </SheetClose>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default CarFilter;
