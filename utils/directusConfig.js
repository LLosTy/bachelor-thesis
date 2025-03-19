// utils/directusConfig.js
import { createDirectus, rest, staticToken } from "@directus/sdk";

// Initialize Directus SDK for client-side use
const directusUrl =
  process.env.NEXT_PUBLIC_DIRECTUS_URL || "http://localhost:8055";
const directusToken = process.env.NEXT_PUBLIC_DIRECTUS_TOKEN;

// Create a public Directus instance (without authentication)
export const publicDirectus = createDirectus(directusUrl).with(rest());

// Create an authenticated Directus instance (with token if available)
const directus = directusToken
  ? createDirectus(directusUrl).with(rest()).with(staticToken(directusToken))
  : publicDirectus;

// Simplified auth check function
export const authenticateDirectus = async () => {
  return directus;
};

// Generate the filter parameters for the Directus filter syntax
export const generateFilterParam = (filters) => {
  const filterParams = {
    _and: [],
  };

  // Add make filter if specified
  if (filters.make) {
    filterParams._and.push({
      make: {
        _eq: filters.make,
      },
    });
  }

  // Add model filter if specified
  if (filters.model) {
    filterParams._and.push({
      model: {
        _eq: filters.model,
      },
    });
  }

  // Add year filter if specified
  if (filters.year) {
    filterParams._and.push({
      year: {
        _eq: parseInt(filters.year),
      },
    });
  }

  // Add price range filter if specified
  if (filters.price) {
    const [minPrice, maxPrice] = filters.price.split("-").map(Number);

    if (!isNaN(minPrice)) {
      filterParams._and.push({
        price: {
          _gte: minPrice,
        },
      });
    }

    if (!isNaN(maxPrice)) {
      filterParams._and.push({
        price: {
          _lte: maxPrice,
        },
      });
    }
  }

  // Add mileage range filters if specified
  if (filters.mileageFrom && !isNaN(parseInt(filters.mileageFrom))) {
    filterParams._and.push({
      mileage: {
        _gte: parseInt(filters.mileageFrom),
      },
    });
  }

  if (filters.mileageTo && !isNaN(parseInt(filters.mileageTo))) {
    filterParams._and.push({
      mileage: {
        _lte: parseInt(filters.mileageTo),
      },
    });
  }

  // Add engine type filter if specified
  if (filters.engineType) {
    filterParams._and.push({
      engine_type: {
        _eq: filters.engineType.toLowerCase(), // Ensure lowercase to match DB format
      },
    });
  }

  // If no filters applied, return empty object
  if (filterParams._and.length === 0) {
    return {};
  }

  return filterParams;
};

// Export the Directus instance as default
export default directus;
