import type { Route } from "./+types/leaderboard-page";

import { DateTime } from "luxon";
import { Link } from "react-router";

import { Hero } from "~/core/components/hero";
import { Button } from "~/core/components/ui/button";
import makeServerClient from "~/core/lib/supa-client.server";

import { ProductCard } from "../components/product-card";
import { getProductsByDateRange } from "../queries";

export const meta: Route.MetaFunction = () => {
  return [
    { title: "Leaderboard | EVASE" },
    { name: "description", content: "Top natural products leaderboard" },
  ];
};

export const loader = async ({ request }: Route.LoaderArgs) => {
  const [client, headers] = makeServerClient(request);
  const [dailyProducts, weeklyProducts, monthlyProducts, yearlyProducts] =
    await Promise.all([
      getProductsByDateRange(client, {
        startDate: DateTime.now().startOf("day"),
        endDate: DateTime.now().endOf("day"),
        limit: 7,
      }),
      getProductsByDateRange(client, {
        startDate: DateTime.now().startOf("week"),
        endDate: DateTime.now().endOf("week"),
        limit: 7,
      }),
      getProductsByDateRange(client, {
        startDate: DateTime.now().startOf("month"),
        endDate: DateTime.now().endOf("month"),
        limit: 7,
      }),
      getProductsByDateRange(client, {
        startDate: DateTime.now().startOf("year"),
        endDate: DateTime.now().endOf("year"),
        limit: 7,
      }),
    ]);
  return { dailyProducts, weeklyProducts, monthlyProducts, yearlyProducts };
};

export default function LeaderboardPage({ loaderData }: Route.ComponentProps) {
  return (
    <div className="space-y-20">
      <Hero
        title="추천 천연물질"
        subtitle="Evidence Base가 추천하는 천연물질(Natural Products)"
      />
      {/* <div className="grid gap-4 md:grid-cols-3">
        <div>
          <h2 className="text-3xl leading-tight font-bold tracking-tight">
            오늘의 인기 상품
          </h2>
          <p className="text-foreground text-xl font-light">
            EVASE가 추천하는 오늘의 인기 상품을 확인해보세요.
          </p>
        </div>
        {loaderData.dailyProducts.map((product) => (
          <ProductCard
            key={product.product_id.toString()}
            id={product.product_id.toString()}
            name={product.name}
            description={product.tagline}
            reviewsCount={product.reviews}
            viewsCount={product.views}
            promotedFrom={product.promoted_from}
            isUpvoted={product.is_upvoted}
            votesCount={product.upvotes}
          />
        ))}
        <Button variant="link" asChild className="self-center text-lg">
          <Link to="/products/leaderboards/daily">
            다른 모든 상품 보기 &rarr;
          </Link>
        </Button>
      </div> */}
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <h2 className="text-3xl leading-tight font-bold tracking-tight">
            주간 인기 순위
          </h2>
          <p className="text-foreground text-xl font-light">
            Evidence Base에서 가장 주목받고 있는 천연물질
          </p>
        </div>
        {loaderData.weeklyProducts.map((product) => (
          <ProductCard
            key={product.product_id.toString()}
            id={product.product_id.toString()}
            name={product.name}
            description={product.tagline}
            reviewsCount={product.reviews}
            viewsCount={product.views}
            votesCount={product.upvotes}
            isUpvoted={product.is_upvoted}
            promotedFrom={product.promoted_from}
          />
        ))}
        <Button variant="link" asChild className="self-center text-lg">
          <Link to="/products/leaderboards/weekly">
            다른 모든 천연물질 보기 &rarr;
          </Link>
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <h2 className="text-3xl leading-tight font-bold tracking-tight">
            월간 인기 순위
          </h2>
          <p className="text-foreground text-xl font-light">
            Evidence Base에서 가장 주목받고 있는 천연물질
          </p>
        </div>
        {loaderData.monthlyProducts.map((product) => (
          <ProductCard
            key={product.product_id.toString()}
            id={product.product_id.toString()}
            name={product.name}
            description={product.tagline}
            reviewsCount={product.reviews}
            viewsCount={product.views}
            votesCount={product.upvotes}
            isUpvoted={product.is_upvoted}
            promotedFrom={product.promoted_from}
          />
        ))}
        <Button variant="link" asChild className="self-center text-lg">
          <Link to="/products/leaderboards/monthly">
            다른 모든 천연물질 보기 &rarr;
          </Link>
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <h2 className="text-3xl leading-tight font-bold tracking-tight">
            연간 인기 순위
          </h2>
          <p className="text-foreground text-xl font-light">
            Evidence Base에서 가장 주목받고 있는 천연물질
          </p>
        </div>
        {loaderData.yearlyProducts.map((product) => (
          <ProductCard
            key={product.product_id.toString()}
            id={product.product_id.toString()}
            name={product.name}
            description={product.tagline}
            reviewsCount={product.reviews}
            viewsCount={product.views}
            votesCount={product.upvotes}
            isUpvoted={product.is_upvoted}
            promotedFrom={product.promoted_from}
          />
        ))}
        <Button variant="link" asChild className="self-center text-lg">
          <Link to="/products/leaderboards/yearly">
            다른 모든 천연물질 보기 &rarr;
          </Link>
        </Button>
      </div>
    </div>
  );
}
