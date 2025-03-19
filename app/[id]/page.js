import { notFound } from "next/navigation";
import { CarDetailContent } from "@/components/CarDetailContent";
import { formatters } from "@/utils/formatters";

const baseUrl = process.env.NEXT_PUBLIC_DIRECTUS_URL;

async function getCarListing(id) {
  try {
    // Fetch car listing with related engine specs
    const response = await fetch(
      `${baseUrl}/items/car_listings/${id}?fields=*,engine_specs.*`,
      {
        headers: {
          "Content-Type": "application/json",
        },
        next: { revalidate: 3600 }, // Cache for 1 hour
      }
    );

    if (!response.ok) return null;
    const carData = await response.json();

    // Fetch all images for this car
    const imagesResponse = await fetch(
      `${baseUrl}/items/images_files?filter[images_id][_eq]=${carData.data.images}&fields=directus_files_id,sort`,
      {
        headers: {
          "Content-Type": "application/json",
        },
        next: { revalidate: 3600 },
      }
    );

    if (!imagesResponse.ok) {
      carData.data.images_urls = [];
      return carData.data;
    }

    const imagesData = await imagesResponse.json();

    // Map all images to their URLs
    if (imagesData.data && imagesData.data.length > 0) {
      carData.data.images_urls = imagesData.data.map(
        (img) => `${baseUrl}/assets/${img.directus_files_id}`
      );

      // Sort images by the sort field
      carData.data.images_urls.sort((a, b) => {
        const sortA =
          imagesData.data.find(
            (img) => `${baseUrl}/assets/${img.directus_files_id}` === a
          )?.sort || 0;
        const sortB =
          imagesData.data.find(
            (img) => `${baseUrl}/assets/${img.directus_files_id}` === b
          )?.sort || 0;
        return sortA - sortB;
      });
    } else {
      carData.data.images_urls = [];
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

  // Format price and mileage using the formatters utility
  const formattedPrice = formatters.formatPrice(car.price);
  const formattedMileage = formatters.formatMileage(car.mileage);

  // Capitalize make and model for display
  const capitalizedMake = car.make
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  const carName = `${car.year} ${capitalizedMake} ${car.model}`;

  return (
    <CarDetailContent
      car={car}
      carName={carName}
      formattedPrice={formattedPrice}
      formattedMileage={formattedMileage}
      baseUrl={baseUrl}
    />
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
