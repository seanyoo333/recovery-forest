import type { Route } from "./+types/dashboard-metabolic-fuel";

import { format, subDays } from "date-fns";
import { useMemo, useState } from "react";
import { Link } from "react-router";

import { Button } from "~/core/components/ui/button";
import makeServerClient from "~/core/lib/supa-client.server";
import { getLoggedInUserId } from "~/features/users/queries";

import { MetabolicFuelBlockingMap } from "../components/metabolic-fuel-blocking-map";
import {
  getIngredientEvidenceByDateRange,
  getTodayIngredientEvidence,
} from "../queries";

export const meta: Route.MetaFunction = () => {
  return [{ title: `대사 안정화 | ${import.meta.env.VITE_APP_NAME}` }];
};

export async function loader({ request }: Route.LoaderArgs) {
  const [client] = makeServerClient(request);
  const userId = await getLoggedInUserId(client);

  if (!userId) {
    return {
      evidenceData: {
        today: [],
        week7: [],
        month30: [],
      },
    };
  }

  try {
    const today = format(new Date(), "yyyy-MM-dd");
    const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");
    const week7Start = format(subDays(new Date(), 7), "yyyy-MM-dd");
    const month30Start = format(subDays(new Date(), 30), "yyyy-MM-dd");

    const [todayEvidence, week7Evidence, month30Evidence] = await Promise.all([
      getTodayIngredientEvidence(client, userId, today),
      getIngredientEvidenceByDateRange(client, userId, week7Start, yesterday),
      getIngredientEvidenceByDateRange(client, userId, month30Start, yesterday),
    ]);

    return {
      evidenceData: {
        today: todayEvidence.map((ev) => ({
          ingredient_id: ev.ingredient_id,
          ingredient_name: ev.ingredient_name,
          target_slug: ev.target_slug,
          strength: ev.strength,
          study_type: ev.study_type,
        })),
        week7: week7Evidence.map((ev) => ({
          ingredient_id: ev.ingredient_id,
          ingredient_name: ev.ingredient_name,
          target_slug: ev.target_slug,
          strength: ev.strength,
          study_type: ev.study_type,
        })),
        month30: month30Evidence.map((ev) => ({
          ingredient_id: ev.ingredient_id,
          ingredient_name: ev.ingredient_name,
          target_slug: ev.target_slug,
          strength: ev.strength,
          study_type: ev.study_type,
        })),
      },
    };
  } catch (error) {
    console.error("Failed to load metabolic fuel data:", error);
    return {
      evidenceData: {
        today: [],
        week7: [],
        month30: [],
      },
    };
  }
}

export default function DashboardMetabolicFuel({
  loaderData,
}: Route.ComponentProps) {
  const { evidenceData } = loaderData;
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "all">("30d");

  const currentEvidenceData = useMemo(() => {
    switch (timeRange) {
      case "7d":
        return evidenceData.week7;
      case "30d":
        return evidenceData.month30;
      case "all":
        return [...evidenceData.month30, ...evidenceData.today];
      default:
        return evidenceData.month30;
    }
  }, [timeRange, evidenceData]);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">대사 안정화</h1>
        <Link to="/my/dashboard/health-habits">
          <Button variant="outline" size="sm">
            천연물 입력
          </Button>
        </Link>
      </div>
      <MetabolicFuelBlockingMap
        evidenceData={currentEvidenceData}
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
      />
    </div>
  );
}
