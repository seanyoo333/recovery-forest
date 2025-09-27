/**
 * Dashboard Product Detail Screen
 *
 * This component displays detailed information about a specific product
 * that the user has purchased or is interested in.
 */
import type { Route } from "./+types/dashboard-product";

import { Badge } from "~/core/components/ui/badge";
import { Button } from "~/core/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/core/components/ui/card";
import { Separator } from "~/core/components/ui/separator";

export const meta: Route.MetaFunction = () => {
  return [
    {
      title: "Product Details | Dashboard",
    },
  ];
};

export default function DashboardProduct({ loaderData }: Route.ComponentProps) {
  // Mock data - 실제로는 loader에서 productId를 사용해 데이터를 가져와야 함
  const product = {
    id: "123",
    name: "Premium Product",
    description: "This is a high-quality product with amazing features.",
    price: 99.99,
    category: "Technology",
    status: "Active",
    purchaseDate: "2024-01-15",
    image: "/placeholder-product.jpg",
    features: [
      "Feature 1: Amazing functionality",
      "Feature 2: High performance",
      "Feature 3: Easy to use",
      "Feature 4: Great support",
    ],
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{product.name}</h1>
        <p className="text-muted-foreground">Product details and management</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Product Image */}
        <Card>
          <CardContent className="p-6">
            <div className="flex aspect-square items-center justify-center rounded-lg bg-gray-200">
              <span className="text-gray-500">Product Image</span>
            </div>
          </CardContent>
        </Card>

        {/* Product Information */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="font-medium">Price:</span>
                <span className="text-2xl font-bold">${product.price}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Category:</span>
                <Badge variant="outline">{product.category}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Status:</span>
                <Badge variant="default">{product.status}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Purchase Date:</span>
                <span>{product.purchaseDate}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{product.tagline}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Features</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {product.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator className="my-6" />

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button>Download</Button>
        <Button variant="outline">Share</Button>
        <Button variant="outline">Contact Support</Button>
      </div>
    </div>
  );
}
