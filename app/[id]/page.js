// app/[id]/page.js
import { notFound } from "next/navigation";

async function getCarListing(id) {
  try {
    //Todo: add url from .env in the future
    const baseUrl = "http://localhost:8055";

    // Fetch car listing with related engine specs and images
    const response = await fetch(
      `${baseUrl}/items/CarListings/${id}?fields=*,engine_specs.*,images.*`,
      {
        headers: {
          "Content-Type": "application/json",
          // Add authorization header if required
          // 'Authorization': `Bearer ${process.env.DIRECTUS_API_TOKEN}`
        },
      }
    );

    if (!response.ok) return null;
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Error fetching car listing:", error);
    return null;
  }
}

export default async function CarDetailPage({ params }) {
  const car = await getCarListing(params.id);

  if (!car) {
    notFound();
  }
  return (
    <div>
      <h1>
        {car.year} {car.make} {car.model}
      </h1>

      <div>
        <h2>Basic Information</h2>
        <p>Price: {car.price.toLocaleString()}</p>
        <p>Year: {car.year}</p>
        <p>Make: {car.make}</p>
        <p>Model: {car.model}</p>
        <p>Body Type: {car.body_type}</p>
        <p>Mileage: {car.mileage.toLocaleString()} miles</p>
        <p>Engine Type: {car.engine_type}</p>
      </div>

      {car.engine_specs && (
        <div>
          <h2>Engine Specifications</h2>
          <p>Displacement: {car.engine_specs[0].displacement}cc</p>
          <p>Horsepower: {car.engine_specs[0].horsepower}hp</p>
          <p>Cylinders: {car.engine_specs[0].cylinders}</p>
        </div>
      )}

      {car.images && car.images.length > 0 && (
        <div>
          <h2>Images</h2>
          {car.images.map((image) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={image.id}
              src={`${process.env.NEXT_PUBLIC_DIRECTUS_URL}/assets/${image.thumbnail}`}
              alt={`${car.year} ${car.make} ${car.model}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Optional: Generate static params if you want to statically generate some pages
export async function generateStaticParams() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_DIRECTUS_URL;
    const response = await fetch(`${baseUrl}/items/CarListings`);
    const data = await response.json();

    return data.data.map((car) => ({
      id: car.id.toString(),
    }));
  } catch (error) {
    console.error("Error generating static params:", error);
    return [];
  }
}
