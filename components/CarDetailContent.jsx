"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Phone,
  FileText,
  Zap,
  Package,
  Clock,
  Shield,
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHead,
  TableRow,
} from "@/components/ui/table";

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

  const handleCall = () => {
    window.location.href = "tel:+1234567890"; // Replace with actual phone number
  };

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8 md:px-6 lg:px-8">
      {/* Breadcrumb */}
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

      {/* Car Title Section */}
      <div className="mb-6">
        <h1 className="text-3xl md:text-4xl font-bold">{carName}</h1>
        <Badge variant="outline" className="mt-2">
          {car.body_type}
        </Badge>
      </div>

      {/* Main Content */}
      <div className="flex flex-col gap-8">
        {/* Car Images Section - Full Width */}
        <div className="w-full">
          <Card className="border-0 shadow-none">
            <CardContent className="p-0">
              <div className="relative rounded-xl overflow-hidden mb-4">
                <AspectRatio ratio={16 / 9}>
                  {car.images_urls && car.images_urls.length > 0 ? (
                    <Image
                      src={
                        car.images_urls[currentImageIndex] || "/placeholder.svg"
                      }
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
                            currentImageIndex === index
                              ? "ring-2 ring-primary"
                              : ""
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

        {/* Car Details Section - Below Image */}
        <div className="w-full h-64">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className={"bg-black text-white"}>
              {/* <CardHeader className="pb-2">
                <CardDescription>Price</CardDescription>
              </CardHeader> */}
              <CardContent className="flex items-center h-full gap-2">
                <Coins className="text-white" />
                <CardTitle className="text-3xl font-bold">
                  {formattedPrice}
                </CardTitle>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 flex items-center gap-3">
                <Calendar className="h-5 w-5 text-primary" />
                <div>
                  <span className="text-sm text-muted-foreground block">
                    Year
                  </span>
                  <span className="font-medium">{car.year}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 flex items-center gap-3">
                <Gauge className="h-5 w-5 text-primary" />
                <div>
                  <span className="text-sm text-muted-foreground block">
                    Mileage
                  </span>
                  <span className="font-medium">{formattedMileage} </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 flex items-center gap-3">
                <Fuel className="h-5 w-5 text-primary" />
                <div>
                  <span className="text-sm text-muted-foreground block">
                    Engine
                  </span>
                  <span className="font-medium">{car.engine_type}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              {/* Tabs Section */}
              <Tabs defaultValue="overview">
                <TabsList className="grid grid-cols-3 w-full">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="features">Features</TabsTrigger>
                  <TabsTrigger value="history">History</TabsTrigger>
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
                      /* Optional fallback content if overview doesn't exist */
                      <p>No overview available</p>
                    )}
                  </div>

                  {/* Image Grid */}
                </TabsContent>
                <TabsContent value="features" className="mt-6">
                  <ScrollArea className="h-full">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {car.engine_specs && (
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
                                    {car.engine_specs.cylinders} cylinders
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
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
                        </>
                      )}
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
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="history" className="mt-6">
                  <div className="space-y-4">
                    <Card>
                      <CardContent className="p-4 flex items-center gap-4">
                        <FileText className="h-10 w-10 text-primary" />
                        <div>
                          <h3 className="font-medium">Service History</h3>
                          <p className="text-sm text-muted-foreground">
                            Complete maintenance records available upon request
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 flex items-center gap-4">
                        <Shield className="h-10 w-10 text-primary" />
                        <div>
                          <h3 className="font-medium">Vehicle Inspection</h3>
                          <p className="text-sm text-muted-foreground">
                            This vehicle has passed our comprehensive inspection
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <div className="md:col-span-1">
              {/* Additional Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Specifications</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell className="text-muted-foreground">
                          Make
                        </TableCell>
                        <TableCell className="font-medium text-right">
                          {car.make}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-muted-foreground">
                          Model
                        </TableCell>
                        <TableCell className="font-medium text-right">
                          {car.model}
                        </TableCell>
                      </TableRow>
                      {car.engine_specs && (
                        <>
                          <TableRow>
                            <TableCell className="text-muted-foreground">
                              Displacement
                            </TableCell>
                            <TableCell className="font-medium text-right">
                              {car.engine_specs.displacement}cc
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="text-muted-foreground">
                              Cylinders
                            </TableCell>
                            <TableCell className="font-medium text-right">
                              {car.engine_specs.cylinders}
                            </TableCell>
                          </TableRow>
                        </>
                      )}
                    </TableBody>
                  </Table>

                  <Separator />

                  {/* CTA Buttons */}
                  <div className="space-y-3">
                    <Link href="/contact">
                      <Button className="w-full" size="lg">
                        Contact Us
                      </Button>
                    </Link>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
