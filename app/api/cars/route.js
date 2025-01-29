import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY, // Note: Changed to server-side env variable
});

export async function POST(request) {
  try {
    const { query } = await request.json();

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant that converts natural language queries about cars into JSON filters.
                   For "affordable cars", return a filter for cars under $30,000.
                   Only respond with the JSON filter object, nothing else.
                   Example format: {"price": {"_lte": 30000}}`,
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
          `http://localhost:8055/items/engine_specs?filter[car_listing_id][_eq]=${car.id}`
        );
        const engineData = await engineResponse.json();

        // Get images
        const imagesResponse = await fetch(
          `http://localhost:8055/items/images?filter[car_listing_id][_eq]=${car.id}`
        );
        const imagesData = await imagesResponse.json();

        return {
          ...car,
          thumbnail: imagesData.data[0]?.thumbnail || null,
          horsepower: engineData.data[0]?.horsepower || "N/A",
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
