"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Heart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";

export const CarCard = ({ car, formatPrice, formatMileage }) => {
  const router = useRouter();
  const [thumbnailUrl, setThumbnailUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    setThumbnailUrl(null);
    setIsLoading(true);

    if (!car.images) {
      setIsLoading(false);
      return;
    }

    fetch(
      `http://localhost:8055/items/images_files?filter[images_id][_eq]=${car.images}&filter[sort][_eq]=1&fields=directus_files_id`
    )
      .then((response) => {
        if (!response.ok)
          throw new Error(`Failed to fetch: ${response.status}`);
        return response.json();
      })
      .then((data) => {
        if (data.data && data.data.length > 0) {
          setThumbnailUrl(
            `http://localhost:8055/assets/${data.data[0].directus_files_id}`
          );
        }
      })
      .catch((error) => console.error("Error:", error.message))
      .finally(() => setIsLoading(false));
  }, [car.id, car.images]);

  const toggleFavorite = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorite(!isFavorite);
  };

  return (
    <Card
      className="overflow-hidden group cursor-pointer p-0"
      onClick={() => router.push(`/${car.id}`)}
    >
      <div className="relative aspect-[4/3] bg-muted">
        {isLoading ? (
          <Skeleton className="w-full h-full absolute" />
        ) : thumbnailUrl ? (
          <Image
            src={thumbnailUrl}
            alt={`${car.make} ${car.model}`}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            unoptimized={true}
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full text-muted-foreground">
            No image
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 bg-background/80 hover:bg-background"
          onClick={toggleFavorite}
        >
          <Heart
            className={`h-4 w-4 ${
              isFavorite ? "fill-red-500 text-red-500" : ""
            }`}
          />
        </Button>
      </div>
      <CardContent className="p-4">
        <h3 className="font-medium">
          {car.year} {car.make} {car.model}
        </h3>
        <p className="text-sm text-muted-foreground">
          {car.engine_type} {car.trim || car.body_type || "N/A"}
        </p>
        <div className="mt-2 flex justify-between items-center">
          <span className="font-bold">{formatPrice(car.price)}</span>
          <span className="text-sm text-muted-foreground">
            {formatMileage(car.mileage)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
