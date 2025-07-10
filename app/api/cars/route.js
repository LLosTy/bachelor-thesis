import { NextResponse } from "next/server";
import OpenAI from "openai";
import { readFileSync } from "fs";
import path from "path";
import directus from "@/utils/directusConfig";
import { readItems, aggregate } from "@directus/sdk";

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});

const schemaPath = path.join(
  process.cwd(),
  "app",
  "api",
  "cars",
  "simplified_schema.json"
);

let schema;
try {
  schema = JSON.parse(readFileSync(schemaPath, "utf8"));
} catch (error) {
  console.error("Error reading file:", error.message);
  schema = null;
}

// Helper function to check if Directus is available
async function checkDirectusConnection() {
  try {
    await directus.request(
      readItems("car_listings", {
        fields: ["id", "make", "model"],
        limit: 1,
      })
    );
    return true;
  } catch (error) {
    console.error("Directus connection check failed:", error);
    return false;
  }
}

// Helper function to parse and normalize the filter from OpenAI response
function parseAndNormalizeFilter(responseContent) {
  let filter = JSON.parse(responseContent);

  // If the filter is an array, convert it to an _and filter
  if (Array.isArray(filter)) {
    filter = { _and: filter };
  }

  // If the filter is empty or only contains empty objects, use undefined to show all cars
  if (
    !filter ||
    Object.keys(filter).length === 0 ||
    (typeof filter === "object" &&
      Object.values(filter).every(
        (v) => !v || (typeof v === "object" && Object.keys(v).length === 0)
      ))
  ) {
    filter = undefined;
  }

  return filter;
}

// Helper function to validate the filter to ensure it only uses valid fields
function validateFilter(filter) {
  const validFields = [
    "make",
    "model",
    "year",
    "body_type",
    "mileage",
    "price",
    "engine_type",
    "engine_specs",
    "features",
    "images",
    "horsepower",
    "user_created",
    "date_created",
    "user_updated",
    "date_updated",
  ];

  const validOperators = [
    "_eq",
    "_neq",
    "_lt",
    "_lte",
    "_gt",
    "_gte",
    "_in",
    "_contains",
    "_and",
    "_or",
    "_not",
  ];

  const _validate = (obj, parentKey = null) => {
    // Skip validation for arrays - they contain values, not field names
    if (Array.isArray(obj)) {
      return;
    }

    for (const key in obj) {
      // If we're inside the "features" object, skip field name validation for its children
      if (parentKey === "features") {
        // But still validate recursively in case of nested operators
        if (typeof obj[key] === "object" && obj[key] !== null) {
          _validate(obj[key], parentKey);
        }
        continue;
      }

      // Check if it's a valid field or operator
      if (!validFields.includes(key) && !validOperators.includes(key)) {
        console.error(`Invalid field in filter: ${key}`);
        throw new Error(`Invalid field: ${key}`);
      }
      if (typeof obj[key] === "object" && obj[key] !== null) {
        _validate(obj[key], key);
      }
    }
  };

  _validate(filter);
}

// Helper to get total count for pagination
async function getTotalCount(filter) {
  const totalCountResult = await directus.request(
    aggregate("car_listings", {
      aggregate: { count: "*" },
      ...(filter && Object.keys(filter).length > 0 ? { filter } : {}),
    })
  );
  return totalCountResult[0]?.count || 0;
}

// Helper to get matching car IDs for features filter
async function getMatchingCarIdsForFeatures(featuresFilter) {
  const matchingFeatures = await directus.request(
    readItems("features", {
      fields: ["car_listings_id"],
      filter: featuresFilter,
      limit: -1,
    })
  );
  return matchingFeatures
    .map((item) => item.car_listings_id)
    .flat()
    .filter(Boolean);
}

// Helper to build the final filter, handling features sub-query
async function buildFinalFilter(filter) {
  if (filter && filter.features) {
    try {
      const featuresFilter = filter.features;
      delete filter.features;
      const matchingCarIds = await getMatchingCarIdsForFeatures(featuresFilter);
      if (matchingCarIds.length > 0) {
        if (Object.keys(filter).length > 0) {
          return { _and: [filter, { id: { _in: matchingCarIds } }] };
        } else {
          return { id: { _in: matchingCarIds } };
        }
      } else {
        return { id: { _eq: "non_existent_id_for_features" } };
      }
    } catch (error) {
      console.error("Error in features sub-query:", error);
      return { id: { _eq: "error_blocking_id_features" } };
    }
  }
  return filter;
}

// Helper to get paginated cars
async function getPaginatedCars(finalFilter, limit, safePage) {
  return directus.request(
    readItems("car_listings", {
      fields: ["*", { engine_specs: ["*"] }, { images: ["*"] }],
      ...(finalFilter && Object.keys(finalFilter).length > 0
        ? { filter: finalFilter }
        : {}),
      limit: limit,
      page: safePage,
    })
  );
}

// Helper to process car data (e.g., add horsepower)
function processCars(cars) {
  return cars.map((car) => ({
    ...car,
    horsepower: car.engine_specs?.horsepower || "N/A",
  }));
}

// Helper to format pagination object
function formatPagination(currentPage, totalPages, totalItems, limit) {
  return {
    currentPage,
    totalPages,
    totalItems,
    limit,
  };
}

// Helper to handle Directus errors
function handleDirectusError(directusError, page, limit) {
  let errorMessage = "Database connection error";
  let statusCode = 500;

  if (directusError.message?.includes("ECONNREFUSED")) {
    errorMessage = "Database server is not responding";
    statusCode = 503;
  } else if (directusError.message?.includes("401")) {
    errorMessage = "Database authentication failed";
    statusCode = 401;
  } else if (directusError.message?.includes("403")) {
    errorMessage = "Database access denied";
    statusCode = 403;
  } else if (directusError.message?.includes("404")) {
    errorMessage = "Database resource not found";
    statusCode = 404;
  }

  return NextResponse.json(
    {
      error: errorMessage,
      details: directusError.message,
      cars: [],
      pagination: formatPagination(page, 1, 0, limit),
    },
    { status: statusCode }
  );
}

export async function POST(request) {
  if (!schema) {
    return NextResponse.json(
      {
        error: "Failed to read schema file",
        cars: [],
        pagination: { currentPage: 1, totalPages: 1, totalItems: 0, limit: 10 },
      },
      { status: 500 }
    );
  }

  try {
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error("Error parsing request body:", parseError);
      return NextResponse.json(
        {
          error: "Invalid JSON in request body",
          cars: [],
          pagination: {
            currentPage: 1,
            totalPages: 1,
            totalItems: 0,
            limit: 10,
          },
        },
        { status: 400 }
      );
    }

    const query = body.query || "";
    const page = Math.max(1, parseInt(body.page || 1, 10));
    const limit = Math.max(1, parseInt(body.limit || 3, 10));

    // Check if we have a valid query
    if (!query.trim()) {
      return NextResponse.json(
        {
          error: "No search query provided",
          cars: [],
          pagination: {
            currentPage: page,
            totalPages: 1,
            totalItems: 0,
            limit,
          },
        },
        { status: 400 }
      );
    }

    const schemaString = JSON.stringify(schema, null, 2);

    let filter;
    try {
      const completion = await openai.chat.completions.create({
        model: "chatgpt-4o-latest",
        messages: [
          {
            role: "system",
            content: `You are a helpful assistant that converts natural language queries about cars into JSON filters.
                     IMPORTANT: Only use fields that exist in the car_listings collection schema provided below.
                     NEVER reference fields that don't exist in the schema.
                     
                     Use lowercase for make of car.
                     For "affordable cars", return a filter for cars under 500000 CZK.
                     Also differentiate between types of cars.
                     
                     Respond with ONLY a valid JSON object, with no explanation, no markdown, and no code block. Just raw, parsable JSON.
                     
                     For example: "fun" should be something with a little more performance or be with a body type that would allow a 
                     more sporty drive. "Economic" should be a car with good gas mileage.
                     Take into consideration that the data is for the european market in the czech republic.
                     "Gas" should be "gasoline".
                     
                     Example format: 
                     {"price": {"_lte": 300000}}
                     {"engine_specs": {"horsepower": {"_gte": 200}}}
                     {"make": {"_eq": "bmw"}}
                     {"body_type": {"_in": ["suv", "hatchback"]}}
                     
                     Use slang brand names and **translate them** to official names:
                      - "vw" → "volkswagen"  
                      - "mercedes" → "mercedes-benz"  
                      - "beemer", "bimmer", "bmw" → "bmw"  

                      Car features are available in collection features, make sure to take note of this

                     Available schema:
                     ${schemaString}

                     Available operators:
                     _eq: Equal
                     _neq: Not equal
                     _lt: Less than
                     _lte: Less than or equal to
                     _gt: Greater than
                     _gte: Greater than or equal to
                     _in: In array
                     _contains: Contains string`,
          },
          { role: "user", content: query },
        ],
      });

      const responseContent = completion.choices[0].message.content;
      try {
        filter = parseAndNormalizeFilter(responseContent);
        validateFilter(filter);
      } catch (filterParseError) {
        console.error(
          "Error parsing or validating OpenAI filter:",
          filterParseError
        );
        console.error("OpenAI response:", responseContent);
        return NextResponse.json(
          {
            error: "Failed to parse or validate filter from AI",
            details: filterParseError.message,
            cars: [],
            pagination: { currentPage: 1, totalPages: 1, totalItems: 0, limit },
          },
          { status: 500 }
        );
      }
    } catch (openaiError) {
      console.error("OpenAI API error:", openaiError);
      return NextResponse.json(
        {
          error: "AI service error",
          cars: [],
          pagination: { currentPage: 1, totalPages: 1, totalItems: 0, limit },
        },
        { status: 500 }
      );
    }

    // Check Directus connection before proceeding
    const isDirectusAvailable = await checkDirectusConnection();
    if (!isDirectusAvailable) {
      return NextResponse.json(
        {
          error: "Database service unavailable",
          message:
            "Please check your Directus configuration and try again later.",
          cars: [],
          pagination: formatPagination(page, 1, 0, limit),
        },
        { status: 503 }
      );
    }

    try {
      // Get total count for pagination
      const totalItems = await getTotalCount(filter);
      const totalPages = Math.max(1, Math.ceil(totalItems / limit));
      // Ensure that the requested page number for pagination is always within valid bounds
      const safePage = Math.min(Math.max(1, page), totalPages);

      // Build the final filter, handling features if present
      const finalFilter = await buildFinalFilter(filter);

      // Get paginated data for the safe page
      const cars = await getPaginatedCars(finalFilter, limit, safePage);

      // Process the data to include horsepower directly
      const processedCars = processCars(cars);

      // Create the final response
      const finalResponse = {
        cars: processedCars,
        pagination: formatPagination(safePage, totalPages, totalItems, limit),
      };

      return NextResponse.json(finalResponse);
    } catch (directusError) {
      console.error("Directus API error:", directusError);
      return handleDirectusError(directusError, page, limit);
    }
  } catch (error) {
    console.error("Unexpected error in API:", error);
    return NextResponse.json(
      {
        error: "Failed to process request",
        details: error.message,
        stack: process.env.NODE_ENV !== "production" ? error.stack : undefined,
        cars: [],
        pagination: { currentPage: 1, totalPages: 1, totalItems: 0, limit: 3 },
      },
      { status: 500 }
    );
  }
}
