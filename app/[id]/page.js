// app/[id]/page.js
import { notFound } from "next/navigation";
import Image from "next/image";

const baseUrl = process.env.NEXT_PUBLIC_DIRECTUS_URL;

async function getCarListing(id) {
  try {
    // Fetch car listing with related engine specs
    const response = await fetch(
      `${baseUrl}/items/car_listings/${id}?fields=*,engine_specs.*`,
      {
        headers: {
          "Content-Type": "application/json",
          // Add authorization header if required
          // 'Authorization': `Bearer ${process.env.DIRECTUS_API_TOKEN}`
        },
      }
    );

    if (!response.ok) return null;
    const carData = await response.json();

    // Fetch the images associated with this car listing
    const imagesResponse = await fetch(
      `${baseUrl}/items/images?filter[car_listings_id][_eq]=${id}&fields=id`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!imagesResponse.ok) {
      carData.data.thumbnail = null;
      return carData.data;
    }

    const imagesData = await imagesResponse.json();

    // If there are images, fetch the one with sort: 1 (thumbnail)
    if (imagesData.data && imagesData.data.length > 0) {
      const imagesId = imagesData.data[0].id;

      const thumbnailResponse = await fetch(
        `${baseUrl}/items/images_files?filter[images_id][_eq]=${imagesId}&filter[sort][_eq]=1&fields=directus_files_id`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (thumbnailResponse.ok) {
        const thumbnailData = await thumbnailResponse.json();

        if (thumbnailData.data && thumbnailData.data.length > 0) {
          carData.data.thumbnail = thumbnailData.data[0].directus_files_id;
        } else {
          carData.data.thumbnail = null;
        }
      } else {
        carData.data.thumbnail = null;
      }
    } else {
      carData.data.thumbnail = null;
    }

    return carData.data;
  } catch (error) {
    console.error("Error fetching car listing:", error);
    return null;
  }
}

export default async function CarDetailPage({ params }) {
  const { id } = params;
  const car = await getCarListing(id);

  if (!car) {
    notFound();
  }

  return (
    <div>
      <h1>
        {car.year} {car.make} {car.model}
      </h1>

      {car.thumbnail && (
        <div>
          <Image
            src={`${baseUrl}/assets/${car.thumbnail}`}
            alt={`${car.year} ${car.make} ${car.model}`}
            width={800}
            height={600}
            style={{ maxWidth: "100%", height: "auto" }}
            priority
          />
        </div>
      )}

      <div>
        <h2>Basic Information</h2>
        <p>Price: ${car.price ? car.price.toLocaleString() : "N/A"}</p>
        <p>Year: {car.year}</p>
        <p>Make: {car.make}</p>
        <p>Model: {car.model}</p>
        <p>Body Type: {car.body_type}</p>
        <p>
          Mileage: {car.mileage ? car.mileage.toLocaleString() : "N/A"} miles
        </p>
        <p>Engine Type: {car.engine_type}</p>
      </div>

      {car.engine_specs && (
        <div>
          <h2>Engine Specifications</h2>
          <p>Displacement: {car.engine_specs.displacement}cc</p>
          <p>Horsepower: {car.engine_specs.horsepower}hp</p>
          <p>Cylinders: {car.engine_specs.cylinders}</p>
        </div>
      )}
    </div>
  );
}

// Optional: Generate static params if you want to statically generate some pages
export async function generateStaticParams() {
  try {
    const response = await fetch(`${baseUrl}/items/car_listings`);
    const data = await response.json();

    return data.data.map((car) => ({
      id: car.id.toString(),
    }));
  } catch (error) {
    console.error("Error generating static params:", error);
    return [];
  }
}
