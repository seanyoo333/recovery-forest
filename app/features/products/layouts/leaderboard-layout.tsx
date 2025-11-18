import type { Route } from "./+types/leaderboard-layout";

import { Outlet, data, useOutletContext } from "react-router";
import { z } from "zod";

const searchParamsSchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
});

export const loader = async ({ request }: Route.LoaderArgs) => {
  const url = new URL(request.url);
  const { success, data: parsedData } = searchParamsSchema.safeParse(
    Object.fromEntries(url.searchParams),
  );
  if (!success) {
    throw data(
      {
        error_code: "Invalid_page",
        message: "Invalid page",
      },
      { status: 400 },
    );
  }

  return { page: parsedData.page };
};

export default function LeaderboardLayout() {
  const { isLoggedIn } = useOutletContext<{
    isLoggedIn: boolean;
  }>();
  return <Outlet context={{ isLoggedIn }} />;
}
