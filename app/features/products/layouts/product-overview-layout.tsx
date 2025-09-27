import type { Route } from "./+types/product-overview-layout";

import { ChevronsUpIcon, StarIcon } from "lucide-react";
import { Link, Outlet, useFetcher, useOutletContext } from "react-router";
import { NavLink } from "react-router";

import { Button } from "~/core/components/ui/button";
import { buttonVariants } from "~/core/components/ui/button";
import makeServerClient from "~/core/lib/supa-client.server";
import { cn } from "~/core/lib/utils";

import { getProductById } from "../queries";

export function meta({ data }: Route.MetaArgs) {
  return [
    { title: `${data.product.name} Overview | Evidence Base` },
    { name: "description", content: "View product details and information" },
  ];
}

export const loader = async ({
  request,
  params,
}: Route.LoaderArgs & { params: { productId: string } }) => {
  const [client, headers] = makeServerClient(request);
  const product = await getProductById(client, {
    productId: params.productId,
  });
  return { product };
};

export default function ProductOverviewLayout({
  loaderData,
}: Route.ComponentProps) {
  const fetcher = useFetcher();
  const context = useOutletContext<{ isLoggedIn: boolean }>();
  const isLoggedIn = context?.isLoggedIn ?? false;
  return (
    <div className="space-y-10">
      <div className="flex flex-col justify-between gap-10 md:flex-row md:gap-0">
        <div className="flex flex-col items-center gap-10 md:flex-row md:items-start">
          <div className="bg-primary/50 size-40 overflow-hidden rounded-xl shadow-xl">
            <img
              src={loaderData.product.picture}
              alt={loaderData.product.name}
              className="size-full object-cover"
            />
          </div>
          <div>
            <h1 className="text-center text-5xl font-bold md:text-left">
              {loaderData.product.name}
            </h1>
            <p className="text-center text-2xl font-light md:text-left">
              {loaderData.product.tagline}
            </p>
            <div className="mt-5 flex items-center justify-center gap-2 text-lg md:justify-start md:text-base">
              <div className="flex text-yellow-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <StarIcon
                    className="size-4"
                    fill={
                      i < Math.floor(loaderData.product.average_rating)
                        ? "currentColor"
                        : "none"
                    }
                  />
                ))}
              </div>
              <span className="text-muted-foreground">
                {loaderData.product.reviews} 리뷰
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2.5 md:flex-row md:gap-5">
          <Button
            variant={"secondary"}
            size="lg"
            asChild
            className="h-10 w-full px-10 md:h-14 md:w-auto md:text-lg"
          >
            <Link to={`/products/${loaderData.product.product_id}/visit`}>
              제품 사이트
            </Link>
          </Button>
          <fetcher.Form
            method="post"
            action={`/products/${loaderData.product.product_id}/upvote`}
          >
            <Button
              size="lg"
              className={cn({
                "GAP-2 flex h-10 w-full items-center px-10 font-semibold md:h-14 md:w-auto md:text-lg":
                  true,
                "border-white bg-white text-[#E11D48] hover:bg-white/90":
                  loaderData.product.is_upvoted,
              })}
            >
              <ChevronsUpIcon className="size-4" />
              추천 ({loaderData.product.upvotes})
            </Button>
          </fetcher.Form>
        </div>
      </div>
      <div className="flex gap-2.5">
        <NavLink
          end
          className={({ isActive }) =>
            cn(
              buttonVariants({ variant: "outline" }),
              isActive && "bg-accent text-foreground",
            )
          }
          to={`/products/${loaderData.product.product_id}/overview`}
        >
          Overview
        </NavLink>
        <NavLink
          className={({ isActive }) =>
            cn(
              buttonVariants({ variant: "outline" }),
              isActive && "bg-accent text-foreground",
            )
          }
          to={`/products/${loaderData.product.product_id}/reviews`}
        >
          Reviews
        </NavLink>
      </div>
      <div>
        <Outlet
          context={{
            product_id: loaderData.product.product_id,
            description: loaderData.product.description,
            how_it_works: loaderData.product.how_it_works,
            review_count: loaderData.product.reviews,
            isLoggedIn: isLoggedIn,
          }}
        />
      </div>
    </div>
  );
}
