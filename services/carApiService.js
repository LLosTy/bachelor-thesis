// services/carApiService.js

import directus, { publicDirectus } from "../utils/directusConfig";
import { readItems } from "@directus/sdk";
import { cookieUtils } from "@/utils/cookieUtils";

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

// In-memory cache storage
const cache = {
  makes: null,
  models: {},
  years: null,
  engineTypes: null,
  bodyTypes: null,
  transmissionTypes: null,
};

/**
 * Helper to fetch unique values for a given field with caching
 */
async function fetchUniqueFieldValues(fieldName, cacheKey, options = {}) {
  const cached = loadFromCache(cacheKey);
  if (cached) return cached;

  try {
    const response = await publicDirectus.request(
      readItems("car_listings", {
        fields: [fieldName],
        limit: -1,
        groupBy: [fieldName],
        sort: [options.sort || fieldName],
        ...(options.filter && { filter: options.filter }),
      })
    );

    const values = response.map((item) => item[fieldName]).filter(Boolean);

    saveToCache(cacheKey, values);
    return values;
  } catch (error) {
    console.error(`--- Detailed Error Fetching [${cacheKey}] ---`);
    console.error(`Field Name Requested: ${fieldName}`);
    if (error.errors) {
      console.error(
        "Directus SDK Errors:",
        JSON.stringify(error.errors, null, 2)
      );
    } else {
      console.error("Full Error Object:", error);
    }
    console.error(`--------------------------------------------`);
    throw error;
  }
}

/**
 * Fetches unique transmission types directly from the 'engine_specs' collection.
 */
async function fetchTransmissionsFromEngineSpecs() {
  const cacheKey = "transmission_values";
  const cached = loadFromCache(cacheKey);
  if (cached) return cached;

  try {
    const response = await publicDirectus.request(
      readItems("engine_specs", {
        fields: ["transmission"],
        limit: -1,
        groupBy: ["transmission"],
        sort: ["transmission"],
      })
    );
    const values = response.map((item) => item.transmission).filter(Boolean);
    saveToCache(cacheKey, values);
    return values;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

/**
 * Check cache (memory and localStorage)
 */
function loadFromCache(key) {
  if (cache[key] && Date.now() - cache[key].timestamp < CACHE_DURATION) {
    return cache[key].data;
  }
  if (cookieUtils.canUseLocalStorage()) {
    const stored = localStorage.getItem(`vehicle_filter_${key}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Date.now() - parsed.timestamp < CACHE_DURATION) {
        cache[key] = parsed; // Update memory cache
        return parsed.data;
      }
    }
  }
  return null;
}

/**
 * Save to cache (memory and localStorage)
 */
function saveToCache(key, data) {
  const cacheItem = { data, timestamp: Date.now() };
  cache[key] = cacheItem;
  if (cookieUtils.canUseLocalStorage()) {
    localStorage.setItem(`vehicle_filter_${key}`, JSON.stringify(cacheItem));
  }
}

// --- API Functions ---

export const fetchMakes = () => fetchUniqueFieldValues("make", "makes");
export const fetchYears = () =>
  fetchUniqueFieldValues("year", "years", { sort: "-year" });
export const fetchEngineTypes = () =>
  fetchUniqueFieldValues("engine_type", "engineTypes");
export const fetchBodyTypes = () =>
  fetchUniqueFieldValues("body_type", "bodyTypes");
export const fetchTransmissionTypes = async () =>
  await fetchTransmissionsFromEngineSpecs();

/**
 * Fetch models for specific makes
 * @param {string[]} makes - An array of car makes
 */
export async function fetchModelsByMake(makes) {
  if (!makes || makes.length === 0) return [];

  const cacheKey = `models_${[...makes].sort().join("_")}`;
  const cached = loadFromCache(cacheKey);
  if (cached) return cached;

  try {
    const response = await publicDirectus.request(
      readItems("car_listings", {
        fields: ["model"],
        filter: {
          make: {
            _in: makes,
          },
        },
        limit: -1,
        groupBy: ["model"],
        sort: ["model"],
      })
    );

    const models = response.map((item) => item.model).filter(Boolean);
    saveToCache(cacheKey, models);
    return models;
  } catch (error) {
    console.error(
      `Error fetching models for makes ${makes.join(", ")}:`,
      error
    );
    throw error;
  }
}

/**
 * Search for cars with the specified filters
 * Using two-step filtering for relational fields for robustness.
 */
export async function searchCars(filters, page = 1, limit = 10) {
  try {
    const filterConditions = [];

    // Multi-select fields
    if (filters.make?.length > 0) {
      filterConditions.push({ make: { _in: filters.make } });
    }
    if (filters.model?.length > 0) {
      filterConditions.push({ model: { _in: filters.model } });
    }
    if (filters.engineType?.length > 0) {
      filterConditions.push({ engine_type: { _in: filters.engineType } });
    }
    if (filters.bodyType?.length > 0) {
      filterConditions.push({ body_type: { _in: filters.bodyType } });
    }

    // --- Handling Transmission Filter (Two-step approach) ---
    if (filters.transmissionType?.length > 0) {
      try {
        const transmissionSubFilter = {
          transmission: { _in: filters.transmissionType },
        };

        const matchingEngineSpecs = await publicDirectus.request(
          readItems("engine_specs", {
            fields: ["id"],
            filter: transmissionSubFilter,
            limit: -1,
          })
        );
        const matchingEngineSpecIds = matchingEngineSpecs.map(
          (item) => item.id
        );

        if (matchingEngineSpecIds.length > 0) {
          filterConditions.push({
            engine_specs: { _in: matchingEngineSpecIds },
          });
        } else {
          filterConditions.push({
            id: { _eq: "non_existent_id_for_transmission" },
          });
        }
      } catch (error) {
        console.error("Error in transmission sub-query:", error);
        filterConditions.push({
          id: { _eq: "error_blocking_id_transmission" },
        });
      }
    }

    // Range fields
    const addRangeFilter = (field, from, to) => {
      if (from || to) {
        const range = {};
        if (from) range._gte = from;
        if (to) range._lte = to;
        filterConditions.push({ [field]: range });
      }
    };

    addRangeFilter("year", filters.yearFrom, filters.yearTo);
    addRangeFilter("price", filters.priceFrom, filters.priceTo);
    addRangeFilter("mileage", filters.mileageFrom, filters.mileageTo);

    // --- Handling Fuel Consumption Filter (Two-step approach) ---
    if (filters.maxFuelEconomy && filters.maxFuelEconomy !== "any") {
      try {
        const fuelConsumptionSubFilter = {
          fuel_consumption: { _lte: parseFloat(filters.maxFuelEconomy) },
        };

        const matchingEngineSpecs = await publicDirectus.request(
          readItems("engine_specs", {
            fields: ["id"],
            filter: fuelConsumptionSubFilter,
            limit: -1,
          })
        );
        const matchingEngineSpecIds = matchingEngineSpecs.map(
          (item) => item.id
        );

        if (matchingEngineSpecIds.length > 0) {
          filterConditions.push({
            engine_specs: { _in: matchingEngineSpecIds },
          });
        } else {
          filterConditions.push({ id: { _eq: "non_existent_id_for_fuel" } });
        }
      } catch (error) {
        console.error("Error in fuel consumption sub-query:", error);
        filterConditions.push({ id: { _eq: "error_blocking_id_fuel" } });
      }
    }

    const finalFilter =
      filterConditions.length > 0 ? { _and: filterConditions } : {};

    const offset = (page - 1) * limit;

    const response = await publicDirectus.request(
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
          "engine_specs.transmission", // Still fetch for display
          "engine_specs.fuel_consumption", // Still fetch for display
        ],
        filter: finalFilter,
        sort: ["-date_created"],
        limit: limit,
        offset: offset,
        meta: "filter_count",
      })
    );

    const items = Array.isArray(response) ? response : response.data;
    const meta = Array.isArray(response)
      ? { filter_count: items.length }
      : response.meta;

    return {
      data: items,
      meta: {
        total: meta.filter_count,
        page: page,
        limit: limit,
        pageCount: Math.ceil(meta.filter_count / limit),
      },
    };
  } catch (error) {
    console.error("--- Critical Error in searchCars main query ---", error);
    throw error;
  }
}

export function getFuelEconomyOptions() {
  return [
    { value: "5", label: "Up to 5 L/100km" },
    { value: "7", label: "Up to 7 L/100km" },
    { value: "9", label: "Up to 9 L/100km" },
    { value: "12", label: "Up to 12 L/100km" },
    { value: "15", label: "Up to 15 L/100km" },
  ];
}
