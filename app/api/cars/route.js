import { NextResponse } from "next/server";
import OpenAI from "openai";
import { readFileSync } from "fs";
import path from "path";

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
  return NextResponse.json(
    { error: "Failed to read schema file" },
    { status: 500 }
  );
}

export async function POST(request) {
  try {
    const { query } = await request.json();

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant that converts natural language queries about cars into JSON filters.
                   Only use fields that exist in the schema provided below.
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

    const filter = JSON.parse(completion.choices[0].message.content);

    // Fetch car listings
    const response = await fetch(
      `http://localhost:8055/items/CarListings?filter=${JSON.stringify(filter)}`
    );
    const data = await response.json();

    // Add related data for each car
    const carsWithData = await Promise.all(
      data.data.map(async (car) => {
        // Get engine specs
        const engineResponse = await fetch(
          `http://localhost:8055/items/engine_specs/${car.engine_specs}`
        );
        const engineData = await engineResponse.json();

        // Get images
        const imagesResponse = await fetch(
          `http://localhost:8055/items/images/${car.images_id}`
        );
        const imagesData = await imagesResponse.json();

        return {
          ...car,
          thumbnail: imagesData.data?.thumbnail || null,
          horsepower: engineData.data?.horsepower || "N/A",
        };
      })
    );

    return NextResponse.json({ cars: carsWithData });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
