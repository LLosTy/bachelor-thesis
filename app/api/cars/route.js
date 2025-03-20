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

    let filter;
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a helpful assistant that converts natural language queries about cars into JSON filters.
                     Only use fields that exist in the schema provided below.
                     Use lowercase for make of car.
                     For "affordable cars", return a filter for cars under $30,000.
                     Only respond with the JSON filter object, nothing else. Also differentiate between types of cars.
                     For example: "fun" should be something with a little more performace or be with a body type that would allow a 
                     more sporty drive. "Economic" should be a car with good gas mileage.
                     Take into consideration that the data is for the european market in the czech republic.
                     "Gas" should be "gasoline".
                     The available schema is a json of my directus db, adjust the filter for directus and not json.
                     Fields are fields in a table of a certain name.
                     Example format: {"price": {"_lte": 30000}}
                     {"engine_specs": {"horsepower": {"_gte": 200}}}

                     Available schema:
                     ${JSON.stringify(schema, null, 2)}

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
      } catch (filterParseError) {
        console.error("Error parsing OpenAI filter:", filterParseError);
        console.error("OpenAI response:", responseContent);
        return NextResponse.json(
          {
            error: "Failed to parse filter from AI",
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

    try {
      // Get total count for pagination
      const totalCountResult = await directus.request(
        aggregate("car_listings", {
          aggregate: { count: "*" },
          filter: filter,
        })
      );

      const totalCount = totalCountResult[0]?.count || 0;

      // Get paginated data
      const cars = await directus.request(
        readItems("car_listings", {
          fields: ["*", "engine_specs.*", "images"],
          filter: filter,
          limit: limit,
          page: page,
        })
      );

      // Process the data to include horsepower directly
      const processedCars = cars.map((car) => ({
        ...car,
        horsepower: car.engine_specs?.horsepower || "N/A",
      }));

      // Calculate total pages
      const totalPages = Math.max(1, Math.ceil(totalCount / limit));

      // Create the final response
      const finalResponse = {
        cars: processedCars,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: totalCount,
          limit,
        },
      };

      return NextResponse.json(finalResponse);
    } catch (directusError) {
      console.error("Directus API error:", directusError);

      // If Directus SDK fails, implement fallback approach
      return NextResponse.json(
        {
          error: "Database connection error",
          details: directusError.message,
          cars: [],
          pagination: {
            currentPage: page,
            totalPages: 1,
            totalItems: 0,
            limit,
          },
        },
        { status: 500 }
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
