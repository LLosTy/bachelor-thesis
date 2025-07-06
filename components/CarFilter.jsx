// components/CarFilter.jsx
"use client";

import { useState, useEffect } from "react";
import { X, RotateCcw, Search, ChevronDown, Check, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  fetchMakes,
  fetchModelsByMake,
  fetchYears,
  fetchEngineTypes,
  fetchBodyTypes,
  fetchTransmissionTypes,
  getFuelEconomyOptions,
  searchCars, // Import searchCars
} from "../services/carApiService";

// Custom MultiSelect Popover Component - Fixed width and removed search
function MultiSelectPopover({
  options,
  selected,
  onSelectionChange,
  placeholder,
  loading = false,
}) {
  const [open, setOpen] = useState(false);

  const handleSelect = (value) => {
    const newSelected = selected.includes(value)
      ? selected.filter((item) => item !== value)
      : [...selected, value];
    onSelectionChange(newSelected);
  };

  const removeItem = (value, e) => {
    e.stopPropagation();
    const newSelected = selected.filter((item) => item !== value);
    onSelectionChange(newSelected);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-auto min-h-[40px] p-2 bg-white hover:bg-gray-50 border border-gray-300"
        >
          <div className="flex flex-wrap gap-1 flex-1">
            {selected.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              selected.map((item) => (
                <Badge key={item} variant="secondary" className="text-xs">
                  {item}
                  {/* Use span instead of button to avoid nesting */}
                  <span
                    className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer hover:bg-gray-200 p-0.5"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        removeItem(item, e);
                      }
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onClick={(e) => removeItem(item, e)}
                  >
                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </span>
                </Badge>
              ))
            )}
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0 z-[110] bg-white border border-gray-300 shadow-lg"
        align="start"
        style={{ width: "var(--radix-popover-trigger-width)" }}
      >
        <Command className="bg-white">
          {/* Removed CommandInput - no search functionality */}
          <CommandList className="bg-white">
            <CommandEmpty className="bg-white text-gray-500 p-2">
              {loading
                ? "Loading..."
                : `No ${placeholder.toLowerCase()} found.`}
            </CommandEmpty>
            <CommandGroup className="max-h-64 overflow-auto bg-white p-1">
              {options.map((option) => (
                <CommandItem
                  key={option}
                  value={option}
                  onSelect={() => handleSelect(option)}
                  className="bg-white hover:bg-gray-100 cursor-pointer px-2 py-1.5 rounded-sm"
                >
                  <Check
                    className={`mr-2 h-4 w-4 ${
                      selected.includes(option) ? "opacity-100" : "opacity-0"
                    }`}
                  />
                  {option}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default function CarFilter({ onFilterResults }) {
  // State to manage the Sheet's open/close status
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Filter state
  const [filters, setFilters] = useState({
    make: [],
    model: [],
    yearFrom: "",
    yearTo: "",
    priceFrom: "",
    priceTo: "",
    mileageFrom: "",
    mileageTo: "",
    engineType: [],
    bodyType: [],
    transmissionType: [],
    maxFuelEconomy: "any",
  });

  // Options state
  const [options, setOptions] = useState({
    makes: [],
    models: [],
    years: [],
    engineTypes: [],
    bodyTypes: [],
    transmissionTypes: [],
    fuelEconomyOptions: [],
  });

  // Loading state
  const [loading, setLoading] = useState({
    makes: false,
    models: false,
    years: false,
    engineTypes: false,
    bodyTypes: false,
    transmissionTypes: false,
  });

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Load models when makes change
  useEffect(() => {
    if (filters.make.length > 0) {
      loadModels(filters.make);
    } else {
      setOptions((prev) => ({ ...prev, models: [] }));
      setFilters((prev) => ({ ...prev, model: [] }));
    }
  }, [filters.make]);

  const loadInitialData = async () => {
    try {
      setLoading((prev) => ({
        ...prev,
        makes: true,
        years: true,
        engineTypes: true,
        bodyTypes: true,
        transmissionTypes: true,
      }));

      const [
        makes,
        years,
        engineTypes,
        bodyTypes,
        transmissionTypes,
        fuelEconomyOptions,
      ] = await Promise.all([
        fetchMakes(),
        fetchYears(),
        fetchEngineTypes(),
        fetchBodyTypes(),
        fetchTransmissionTypes(),
        getFuelEconomyOptions(),
      ]);

      setOptions({
        makes,
        models: [],
        years,
        engineTypes,
        bodyTypes,
        transmissionTypes,
        fuelEconomyOptions,
      });

      // Load models if makes are pre-selected (though not initially in this simplified version)
      if (filters.make.length > 0) {
        loadModels(filters.make);
      }
    } catch (error) {
      console.error("Error loading filter options:", error);
    } finally {
      setLoading((prev) => ({
        ...prev,
        makes: false,
        years: false,
        engineTypes: false,
        bodyTypes: false,
        transmissionTypes: false,
      }));
    }
  };

  const loadModels = async (makes) => {
    try {
      setLoading((prev) => ({ ...prev, models: true }));
      const models = await fetchModelsByMake(makes);
      setOptions((prev) => ({ ...prev, models }));
    } catch (error) {
      console.error("Error loading models:", error);
    } finally {
      setLoading((prev) => ({ ...prev, models: false }));
    }
  };

  const handleMultiSelectChange = (field, values) => {
    setFilters((prev) => ({ ...prev, [field]: values }));
  };

  const handleInputChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleReset = async () => {
    const resetFilters = {
      make: [],
      model: [],
      yearFrom: "",
      yearTo: "",
      priceFrom: "",
      priceTo: "",
      mileageFrom: "",
      mileageTo: "",
      engineType: [],
      bodyType: [],
      transmissionType: [],
      maxFuelEconomy: "any",
    };
    setFilters(resetFilters);
    // Also perform a search with reset filters
    const results = await searchCars(resetFilters);
    onFilterResults?.(results.data);
    setIsSheetOpen(false); // Close the sheet after reset and search
  };

  const handleSearch = async () => {
    try {
      const results = await searchCars(filters);
      onFilterResults?.(results.data); // Pass results to the parent component
    } catch (error) {
      console.error("Failed to search cars:", error);
      // Optionally, handle error display to the user
    } finally {
      setIsSheetOpen(false); // Close the sheet after search
    }
  };

  return (
    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-6 left-6 h-12 w-12 rounded-full shadow-lg bg-white hover:bg-gray-50 z-50 border-2"
        >
          <Filter className="h-5 w-5" />
          <span className="sr-only">Open filters</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 p-0 z-[100] bg-white">
        {/* Add overlay to prevent background interaction */}
        <div className="h-full flex flex-col bg-white">
          <SheetHeader className="border-b pb-4 sticky top-0 bg-white z-10 p-4">
            <SheetTitle className="flex items-center">
              <Filter className="mr-2 h-5 w-5" />
              Car Filters
            </SheetTitle>
            <SheetClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </SheetClose>
          </SheetHeader>

          {/* Filter Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-white">
            {/* Make */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Make</Label>
              <MultiSelectPopover
                options={options.makes}
                selected={filters.make}
                onSelectionChange={(values) =>
                  handleMultiSelectChange("make", values)
                }
                placeholder="Any Make"
                loading={loading.makes}
              />
            </div>

            {/* Model */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Model</Label>
              <MultiSelectPopover
                options={options.models}
                selected={filters.model}
                onSelectionChange={(values) =>
                  handleMultiSelectChange("model", values)
                }
                placeholder="Any Model"
                loading={loading.models}
              />
            </div>

            {/* Year Range */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Year</Label>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="From"
                  value={filters.yearFrom}
                  onChange={(e) =>
                    handleInputChange("yearFrom", e.target.value)
                  }
                  type="number"
                  className="flex-1 bg-white border-gray-300"
                />
                <span className="text-gray-400">—</span>
                <Input
                  placeholder="To"
                  value={filters.yearTo}
                  onChange={(e) => handleInputChange("yearTo", e.target.value)}
                  type="number"
                  className="flex-1 bg-white border-gray-300"
                />
              </div>
            </div>

            {/* Price Range */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Price (Kč)
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="From"
                  value={filters.priceFrom}
                  onChange={(e) =>
                    handleInputChange("priceFrom", e.target.value)
                  }
                  type="number"
                  className="flex-1 bg-white border-gray-300"
                />
                <span className="text-gray-400">—</span>
                <Input
                  placeholder="To"
                  value={filters.priceTo}
                  onChange={(e) => handleInputChange("priceTo", e.target.value)}
                  type="number"
                  className="flex-1 bg-white border-gray-300"
                />
              </div>
            </div>

            {/* Mileage Range */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Mileage (km)
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="From"
                  value={filters.mileageFrom}
                  onChange={(e) =>
                    handleInputChange("mileageFrom", e.target.value)
                  }
                  type="number"
                  className="flex-1 bg-white border-gray-300"
                />
                <span className="text-gray-400">—</span>
                <Input
                  placeholder="To"
                  value={filters.mileageTo}
                  onChange={(e) =>
                    handleInputChange("mileageTo", e.target.value)
                  }
                  type="number"
                  className="flex-1 bg-white border-gray-300"
                />
              </div>
            </div>

            {/* Engine Type */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Engine Type
              </Label>
              <MultiSelectPopover
                options={options.engineTypes}
                selected={filters.engineType}
                onSelectionChange={(values) =>
                  handleMultiSelectChange("engineType", values)
                }
                placeholder="Any Engine Type"
                loading={loading.engineTypes}
              />
            </div>

            {/* Body Type */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Body Type
              </Label>
              <MultiSelectPopover
                options={options.bodyTypes}
                selected={filters.bodyType}
                onSelectionChange={(values) =>
                  handleMultiSelectChange("bodyType", values)
                }
                placeholder="Any Body Type"
                loading={loading.bodyTypes}
              />
            </div>

            {/* Transmission */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Transmission
              </Label>
              <MultiSelectPopover
                options={options.transmissionTypes}
                selected={filters.transmissionType}
                onSelectionChange={(values) =>
                  handleMultiSelectChange("transmissionType", values)
                }
                placeholder="Any Transmission"
                loading={loading.transmissionTypes}
              />
            </div>

            {/* Max Fuel Economy */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Max Fuel Economy
              </Label>
              <Select
                value={filters.maxFuelEconomy}
                onValueChange={(value) =>
                  handleInputChange("maxFuelEconomy", value)
                }
              >
                <SelectTrigger className="w-full bg-white border-gray-300">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent className="z-[110] bg-white border border-gray-300 shadow-lg">
                  <SelectItem value="any">Any</SelectItem>
                  {options.fuelEconomyOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-gray-200 flex gap-2 bg-white">
            <Button
              variant="outline"
              onClick={handleReset}
              className="flex-1 bg-white hover:bg-gray-50 border-gray-300"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
            <Button
              onClick={handleSearch}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
