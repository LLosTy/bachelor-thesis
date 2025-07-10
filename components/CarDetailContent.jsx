"use client";

import { useState } from "react";
import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  Phone,
  FileText,
  Zap,
  Package,
  Clock,
  Cog,
  Calendar,
  Gauge,
  Fuel,
  Coins,
} from "lucide-react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

import CarFeaturesList from "./CarFeaturesList";

// Subcomponents for clarity
function CarBreadcrumb({ carName }) {
  return (
    <Breadcrumb className="mb-6">
      <BreadcrumbList className="text-sm text-muted-foreground">
        <BreadcrumbItem>
          <BreadcrumbLink href="/" className="hover:underline">
            Home
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>{carName}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function CarTitleSection({ carName, bodyType }) {
  return (
    <div className="mb-6">
      <h1 className="text-3xl md:text-4xl font-bold">{carName}</h1>
      <Badge variant="outline" className="mt-2">
        {bodyType}
      </Badge>
    </div>
  );
}

function CarImagesSection({
  car,
  carName,
  currentImageIndex,
  setCurrentImageIndex,
  handlePrevImage,
  handleNextImage,
}) {
  return (
    <div className="w-full">
      <Card className="border-0 shadow-none">
        <CardContent className="p-0">
          <div className="relative rounded-xl overflow-hidden mb-4">
            <AspectRatio ratio={16 / 9}>
              {car.images_urls && car.images_urls.length > 0 ? (
                <Image
                  src={car.images_urls[currentImageIndex] || "/placeholder.svg"}
                  alt={carName}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full bg-muted">
                  <span className="text-muted-foreground">
                    No image available
                  </span>
                </div>
              )}
              {car.images_urls && car.images_urls.length > 1 && (
                <>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full opacity-80 hover:opacity-100"
                    onClick={handlePrevImage}
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full opacity-80 hover:opacity-100"
                    onClick={handleNextImage}
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                </>
              )}
            </AspectRatio>
          </div>
          {car.images_urls && car.images_urls.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {car.images_urls.map((imageUrl, index) => (
                <div
                  key={index}
                  className={`relative rounded-md overflow-hidden cursor-pointer flex-shrink-0 w-24 h-16 border-2 ${
                    index === currentImageIndex
                      ? "border-primary"
                      : "border-transparent"
                  }`}
                  onClick={() => setCurrentImageIndex(index)}
                >
                  <AspectRatio ratio={4 / 3}>
                    <Image
                      src={imageUrl || "/placeholder.svg"}
                      alt={`${carName} view ${index + 1}`}
                      fill
                      className={`object-cover transition-all ${
                        currentImageIndex === index ? "ring-2 ring-primary" : ""
                      }`}
                      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                    />
                  </AspectRatio>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CarDetailsSection({ formattedPrice, car, formattedMileage }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card className={"bg-black text-white"}>
        <CardContent className="flex items-center h-full gap-2">
          <Coins className="text-white" />
          <CardTitle className="text-3xl font-bold">{formattedPrice}</CardTitle>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6 flex items-center gap-3">
          <Calendar className="h-5 w-5 text-primary" />
          <div>
            <span className="text-sm text-muted-foreground block">Year</span>
            <span className="font-medium">{car.year}</span>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6 flex items-center gap-3">
          <Gauge className="h-5 w-5 text-primary" />
          <div>
            <span className="text-sm text-muted-foreground block">Mileage</span>
            <span className="font-medium">{formattedMileage} </span>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6 flex items-center gap-3">
          <Fuel className="h-5 w-5 text-primary" />
          <div>
            <span className="text-sm text-muted-foreground block">Engine</span>
            <span className="font-medium">{car.engine_type}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CarTabsSection({ car, formattedMileage }) {
  return (
    <Tabs defaultValue="overview">
      <TabsList className="grid grid-cols-3 w-full">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="features">Features</TabsTrigger>
        <TabsTrigger value="specifications">Specifications</TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="mt-6">
        <div className="space-y-4">
          {car.overview ? (
            <>
              {car.overview.overview_text
                .split("\n\n")
                .map((paragraph, index) => (
                  <p key={index} className="mb-4">
                    {paragraph}
                  </p>
                ))}
            </>
          ) : (
            <p>No overview available</p>
          )}
        </div>
      </TabsContent>
      <TabsContent value="features" className="mt-6">
        <ScrollArea className="h-full">
          <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
            <CarFeaturesList features={car.features} />
          </div>
        </ScrollArea>
      </TabsContent>
      <TabsContent value="specifications" className="mt-6">
        <div className="space-y-4">
          {car.engine_specs && car.engine_type !== "electric" && (
            <>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">Engine</h3>
                      <p className="text-sm text-muted-foreground">
                        {car.engine_specs.displacement}cc,{" "}
                        {car.engine_specs.cylinders} cylinders,{" "}
                        {car.engine_type}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <Cog className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">Transmission</h3>
                      <p className="text-sm text-muted-foreground">
                        {car.engine_specs.transmission}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <Cog className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">Fuel Consumption</h3>
                      <p className="text-sm text-muted-foreground">
                        {car.engine_specs.fuel_consumption}l / 100kms
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 p-2 rounded-full">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Performance</h3>
                  <p className="text-sm text-muted-foreground">
                    {car.engine_specs.horsepower} horsepower
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 p-2 rounded-full">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Body Type</h3>
                  <p className="text-sm text-muted-foreground">
                    {car.body_type}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 p-2 rounded-full">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Year</h3>
                  <p className="text-sm text-muted-foreground">
                    {car.year} model
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  );
}

function ContactCard({ subject, body, handleCall }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Contact Us</CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="space-y-3">
          <a
            href={`mailto:contact.us@carapp.com?subject=${subject}&body=${body}`}
          >
            <Button className="w-full mb-2" size="lg">
              Contact Us
            </Button>
          </a>
          <Button
            variant="outline"
            className="w-full"
            size="lg"
            onClick={handleCall}
          >
            <Phone className="mr-2 h-4 w-4" />
            Call Dealer
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function CarDetailContent({
  car,
  carName,
  formattedPrice,
  formattedMileage,
}) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? car.images_urls.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === car.images_urls.length - 1 ? 0 : prev + 1
    );
  };

  const subject = encodeURIComponent(`Inquiry about ${carName}`);
  const linkUrl = process.env.NEXT_PUBLIC_URL;
  const body = encodeURIComponent(
    `Hello,\nI'm interested in the ${carName} listed for ${formattedPrice} at: ${linkUrl}/${car.id}`
  );

  const handleCall = () => {
    window.location.href = "tel:+1234567890"; // Replace with actual phone number
  };

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8 md:px-6 lg:px-8">
      <CarBreadcrumb carName={carName} />
      <CarTitleSection carName={carName} bodyType={car.body_type} />
      <div className="flex flex-col gap-8">
        <CarImagesSection
          car={car}
          carName={carName}
          currentImageIndex={currentImageIndex}
          setCurrentImageIndex={setCurrentImageIndex}
          handlePrevImage={handlePrevImage}
          handleNextImage={handleNextImage}
        />
        <div className="w-full h-64">
          <CarDetailsSection
            formattedPrice={formattedPrice}
            car={car}
            formattedMileage={formattedMileage}
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <CarTabsSection car={car} formattedMileage={formattedMileage} />
            </div>
            <div className="md:col-span-1">
              <ContactCard
                subject={subject}
                body={body}
                handleCall={handleCall}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
