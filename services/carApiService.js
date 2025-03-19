// services/carApiService.js
import directus, {
  generateFilterParam,
  authenticateDirectus,
  publicDirectus,
} from "../utils/directusConfig";
import { readItems } from "@directus/sdk";
import { cookieUtils } from "@/utils/cookieUtils";

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

// Cache storage
const cache = {
  makes: {
    data: null,
    timestamp: null,
  },
  models: {},
  years: {
    data: null,
    timestamp: null,
  },
  engineTypes: {
    data: null,
    timestamp: null,
  },
};

/**
 * Check if cache is valid
 */
function isCacheValid(cacheItem) {
  return (
    cacheItem.data !== null &&
    cacheItem.timestamp !== null &&
    Date.now() - cacheItem.timestamp < CACHE_DURATION
  );
}

/**
 * Save to localStorage if available and user has given consent
 */
function saveToLocalStorage(key, data) {
  if (cookieUtils.canUseLocalStorage()) {
    localStorage.setItem(
      `vehicle_filter_${key}`,
      JSON.stringify({
        data,
        timestamp: Date.now(),
      })
    );
  }
}

/**
 * Load from localStorage if available and user has given consent
 */
function loadFromLocalStorage(key) {
  if (cookieUtils.canUseLocalStorage()) {
    const stored = localStorage.getItem(`vehicle_filter_${key}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Date.now() - parsed.timestamp < CACHE_DURATION) {
        return parsed.data;
      }
    }
  }
  return null;
}

/**
 * Fetch all unique car makes from the CarListings collection
 */
export async function fetchMakes() {
  // Check memory cache first
  if (isCacheValid(cache.makes)) {
    return cache.makes.data;
  }

  // Then check localStorage
  const localData = loadFromLocalStorage("makes");
  if (localData) {
    cache.makes = {
      data: localData,
      timestamp: Date.now(),
    };
    return localData;
  }

  try {
    const response = await publicDirectus.request(
      readItems("car_listings", {
        fields: ["make"],
        limit: -1,
        groupBy: ["make"],
        sort: ["make"],
      })
    );

    // Extract unique makes and sort them
    const makes = response.map((item) => item.make).filter(Boolean);

    // Update cache
    cache.makes = {
      data: makes,
      timestamp: Date.now(),
    };

    // Save to localStorage
    saveToLocalStorage("makes", makes);

    return makes;
  } catch (error) {
    console.error("Error fetching car makes:", error);
    throw error;
  }
}

/**
 * Fetch models for a specific make
 */
export async function fetchModelsByMake(make) {
  if (!make) return [];

  // Check memory cache first
  if (cache.models[make] && isCacheValid(cache.models[make])) {
    return cache.models[make].data;
  }

  // Then check localStorage
  const localData = loadFromLocalStorage(`models_${make}`);
  if (localData) {
    cache.models[make] = {
      data: localData,
      timestamp: Date.now(),
    };
    return localData;
  }

  try {
    const response = await publicDirectus.request(
      readItems("car_listings", {
        fields: ["model"],
        filter: {
          make: {
            _eq: make,
          },
        },
        limit: -1,
        groupBy: ["model"],
        sort: ["model"],
      })
    );

    // Extract models and filter out any null values
    const models = response.map((item) => item.model).filter(Boolean);

    // Update cache
    cache.models[make] = {
      data: models,
      timestamp: Date.now(),
    };

    // Save to localStorage
    saveToLocalStorage(`models_${make}`, models);

    return models;
  } catch (error) {
    console.error(`Error fetching models for make ${make}:`, error);
    throw error;
  }
}

/**
 * Fetch all unique years from the CarListings collection
 */
export async function fetchYears() {
  // Check memory cache first
  if (isCacheValid(cache.years)) {
    return cache.years.data;
  }

  // Then check localStorage
  const localData = loadFromLocalStorage("years");
  if (localData) {
    cache.years = {
      data: localData,
      timestamp: Date.now(),
    };
    return localData;
  }

  try {
    const response = await publicDirectus.request(
      readItems("car_listings", {
        fields: ["year"],
        limit: -1,
        groupBy: ["year"],
        sort: ["-year"], // Descending order (newest first)
      })
    );

    // Extract years and filter out any null values
    const years = response.map((item) => item.year).filter(Boolean);

    // Update cache
    cache.years = {
      data: years,
      timestamp: Date.now(),
    };

    // Save to localStorage
    saveToLocalStorage("years", years);

    return years;
  } catch (error) {
    console.error("Error fetching years:", error);
    throw error;
  }
}

/**
 * Fetch all unique engine types from the CarListings collection
 */
export async function fetchEngineTypes() {
  // Check memory cache first
  if (isCacheValid(cache.engineTypes)) {
    return cache.engineTypes.data;
  }

  // Then check localStorage
  const localData = loadFromLocalStorage("engineTypes");
  if (localData) {
    cache.engineTypes = {
      data: localData,
      timestamp: Date.now(),
    };
    return localData;
  }

  try {
    const response = await publicDirectus.request(
      readItems("car_listings", {
        fields: ["engine_type"],
        limit: -1,
        groupBy: ["engine_type"],
        sort: ["engine_type"],
      })
    );

    // Extract engine types and filter out any null values
    const engineTypes = response
      .map((item) => item.engine_type)
      .filter(Boolean);

    // Update cache
    cache.engineTypes = {
      data: engineTypes,
      timestamp: Date.now(),
    };

    // Save to localStorage
    saveToLocalStorage("engineTypes", engineTypes);

    return engineTypes;
  } catch (error) {
    console.error("Error fetching engine types:", error);
    throw error;
  }
}

/**
 * Search for cars with the specified filters
 */
export async function searchCars(filters, page = 1, limit = 10) {
  try {
    const directusInstance = await authenticateDirectus();
    const filterParams = generateFilterParam(filters);

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    const response = await directusInstance.request(
      readItems("car_listings", {
        fields: [
          "id",
          "make",
          "model",
          "year",
          "price",
          "mileage",
          "engine_type",
          "body_type",
          "images",
          "engine_specs.horsepower",
        ],
        filter: filterParams,
        sort: ["-date_created"],
        limit: limit,
        offset: offset,
        meta: "*",
      })
    );

    // Process the cars to include horsepower directly
    const processedCars = response.map((car) => ({
      ...car,
      horsepower: car.engine_specs?.horsepower || "N/A",
    }));

    // Note: Filter count might be accessed differently in v19
    // You might need to adjust this based on the actual response structure
    const totalCount = response.meta?.filter_count || response.length;

    return {
      data: processedCars,
      meta: {
        total: totalCount,
        page: page,
        limit: limit,
        pageCount: Math.ceil(totalCount / limit),
      },
    };
  } catch (error) {
    console.error("Error searching cars:", error);
    throw error;
  }
}

/**
 * Get predefined price range options
 */
export function getPriceRangeOptions() {
  return [
    { value: "", label: "Any Price" },
    { value: "0-100000", label: "Up to 100,000 Kč" },
    { value: "0-200000", label: "Up to 200,000 Kč" },
    { value: "0-300000", label: "Up to 300,000 Kč" },
    { value: "0-500000", label: "Up to 500,000 Kč" },
    { value: "0-750000", label: "Up to 750,000 Kč" },
    { value: "0-1000000", label: "Up to 1,000,000 Kč" },
    { value: "0-1500000", label: "Up to 1,500,000 Kč" },
    { value: "0-2000000", label: "Up to 2,000,000 Kč" },
    { value: "2000000-", label: "2,000,000+ Kč" },
  ];
}

/**
 * Clear all cache items
 */
export function clearCache() {
  // Clear memory cache
  cache.makes = { data: null, timestamp: null };
  cache.models = {};
  cache.years = { data: null, timestamp: null };
  cache.engineTypes = { data: null, timestamp: null };

  // Clear localStorage if available
  if (cookieUtils.canUseLocalStorage()) {
    localStorage.removeItem("vehicle_filter_makes");
    localStorage.removeItem("vehicle_filter_years");
    localStorage.removeItem("vehicle_filter_engineTypes");

    // Clear model caches
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith("vehicle_filter_models_")) {
        localStorage.removeItem(key);
      }
    });
  }
}
