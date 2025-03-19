"use client";

import React from "react";

const CarFeaturesList = ({ features }) => {
  // Filter out non-feature fields
  const nonFeatureFields = [
    "car_listing_id",
    "car_listings_id",
    "date_created",
    "date_updated",
    "id",
    "user_created",
    "user_updated",
  ];

  // Create a filtered features object
  const filteredFeatures = Object.entries(features)
    .filter(
      ([key, value]) =>
        !nonFeatureFields.includes(key) &&
        typeof value === "boolean" &&
        value === true
    )
    .map(([key]) => {
      // Convert snake_case to Title Case with spaces
      return key
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    });

  return (
    <div className="p-4 bg-neutral-100 rounded-lg">
      <h3 className="text-lg font-semibold mb-3">Features</h3>
      {filteredFeatures.length > 0 ? (
        <ul className="list-disc pl-5 space-y-1">
          {filteredFeatures.map((feature, index) => (
            <li key={index} className="text-gray-800">
              {feature}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500 italic">No features available</p>
      )}
    </div>
  );
};

export default CarFeaturesList;
