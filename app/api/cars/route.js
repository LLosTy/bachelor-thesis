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
        filter = JSON.parse(responseContent);

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
              (v) =>
                !v || (typeof v === "object" && Object.keys(v).length === 0)
            ))
        ) {
          filter = undefined;
        }

        // Validate the filter to ensure it only uses valid fields
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

        const validateFilter = (obj) => {
          // Skip validation for arrays - they contain values, not field names
          if (Array.isArray(obj)) {
            return;
          }

          for (const key in obj) {
            // Check if it's a valid field or operator
            if (!validFields.includes(key) && !validOperators.includes(key)) {
              console.error(`Invalid field in filter: ${key}`);
              throw new Error(`Invalid field: ${key}`);
            }
            if (typeof obj[key] === "object" && obj[key] !== null) {
              validateFilter(obj[key]);
            }
          }
        };

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
          pagination: {
            currentPage: page,
            totalPages: 1,
            totalItems: 0,
            limit,
          },
        },
        { status: 503 }
      );
    }

    try {
      // Get total count for pagination
      const totalCountResult = await directus.request(
        aggregate("car_listings", {
          aggregate: { count: "*" },
          ...(filter && Object.keys(filter).length > 0 ? { filter } : {}),
        })
      );

      const totalItems = totalCountResult[0]?.count || 0;
      const totalPages = Math.max(1, Math.ceil(totalItems / limit));

      // Clamp the requested page to the last valid page
      const safePage = Math.min(Math.max(1, page), totalPages);

      // Handle features filtering if present
      let finalFilter = filter;
      if (filter && filter.features) {
        try {
          // Extract features filter conditions
          const featuresFilter = filter.features;
          delete filter.features; // Remove from main filter

          // Find cars that have features matching the criteria
          const matchingFeatures = await directus.request(
            readItems("features", {
              fields: ["car_listings_id"],
              filter: featuresFilter,
              limit: -1,
            })
          );

          const matchingCarIds = matchingFeatures
            .map((item) => item.car_listings_id)
            .flat()
            .filter(Boolean);

          if (matchingCarIds.length > 0) {
            // Add car ID filter to main filter
            if (Object.keys(filter).length > 0) {
              finalFilter = { _and: [filter, { id: { _in: matchingCarIds } }] };
            } else {
              finalFilter = { id: { _in: matchingCarIds } };
            }
          } else {
            // No cars match the features criteria
            finalFilter = { id: { _eq: "non_existent_id_for_features" } };
          }
        } catch (error) {
          console.error("Error in features sub-query:", error);
          finalFilter = { id: { _eq: "error_blocking_id_features" } };
        }
      }

      // Get paginated data for the safe page
      const cars = await directus.request(
        readItems("car_listings", {
          fields: ["*", { engine_specs: ["*"] }, { images: ["*"] }],
          ...(finalFilter && Object.keys(finalFilter).length > 0
            ? { filter: finalFilter }
            : {}),
          limit: limit,
          page: safePage,
        })
      );

      // Process the data to include horsepower directly
      const processedCars = cars.map((car) => ({
        ...car,
        horsepower: car.engine_specs?.horsepower || "N/A",
      }));

      // Create the final response
      const finalResponse = {
        cars: processedCars,
        pagination: {
          currentPage: safePage,
          totalPages,
          totalItems,
          limit,
        },
      };

      return NextResponse.json(finalResponse);
    } catch (directusError) {
      console.error("Directus API error:", directusError);

      // Provide more specific error messages based on the error type
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
          pagination: {
            currentPage: page,
            totalPages: 1,
            totalItems: 0,
            limit,
          },
        },
        { status: statusCode }
      );
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
