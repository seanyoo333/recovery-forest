import type { Route } from "./+types/programs-page";

import { ChevronDownIcon } from "lucide-react";
import { Form, Link, data, useSearchParams } from "react-router";
import { z } from "zod";

import { Hero } from "~/core/components/hero";
import { Button } from "~/core/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "~/core/components/ui/dropdown-menu";
import { Input } from "~/core/components/ui/input";
import makeServerClient from "~/core/lib/supa-client.server";

import { getTopics } from "../../community/queries";
import { ProgramCard } from "../components/program-card";
import { getPrograms } from "../queries";

export const meta: Route.MetaFunction = () => {
  return [{ title: "Programs | Evidence Base" }];
};

const searchParamsSchema = z.object({
  sorting: z
    .enum(["newest", "upcoming", "recruiting"])
    .optional()
    .default("newest"),
  keyword: z.string().optional(),
  isFree: z.enum(["all", "free", "paid"]).optional().default("all"),
  topic: z.string().optional(),
});

const SORT_OPTIONS = ["newest", "upcoming", "recruiting"] as const;
const FREE_OPTIONS = ["all", "free", "paid"] as const;

export const loader = async ({ request }: Route.LoaderArgs) => {
  const url = new URL(request.url);
  const { success, data: parsedData } = searchParamsSchema.safeParse(
    Object.fromEntries(url.searchParams),
  );

  if (!success) {
    throw data(
      {
        error_code: "Invalid search params",
        message: "Invalid search params",
      },
      {
        status: 400,
      },
    );
  }

  const [client, headers] = makeServerClient(request);
  const [topicsData, programs] = await Promise.all([
    getTopics(client),
    getPrograms(client, { limit: 100 }),
  ]);

  // 클라이언트 사이드 필터링 (실제로는 서버에서 처리하는 것이 좋음)
  let filteredPrograms = programs;

  if (parsedData.keyword) {
    filteredPrograms = filteredPrograms.filter(
      (program) =>
        program.program_name
          .toLowerCase()
          .includes(parsedData.keyword!.toLowerCase()) ||
        program.program_description
          .toLowerCase()
          .includes(parsedData.keyword!.toLowerCase()) ||
        program.program_location
          .toLowerCase()
          .includes(parsedData.keyword!.toLowerCase()),
    );
  }

  if (parsedData.isFree !== "all") {
    filteredPrograms = filteredPrograms.filter((program) =>
      parsedData.isFree === "free" ? program.is_free : !program.is_free,
    );
  }

  if (parsedData.topic) {
    // topic slug로 topic_id 찾기
    const selectedTopic = topicsData.find(
      (topic) => topic.slug === parsedData.topic,
    );
    if (selectedTopic && "topic_id" in selectedTopic) {
      filteredPrograms = filteredPrograms.filter(
        (program) => program.topic_id === (selectedTopic as any).topic_id,
      );
    }
  }

  // 정렬
  if (parsedData.sorting === "upcoming") {
    filteredPrograms = filteredPrograms.sort(
      (a, b) =>
        new Date(a.program_date_start).getTime() -
        new Date(b.program_date_start).getTime(),
    );
  } else if (parsedData.sorting === "recruiting") {
    // 모집중인 프로그램을 우선으로 정렬
    const now = new Date();
    filteredPrograms = filteredPrograms.sort((a, b) => {
      const aRecruiting =
        new Date(a.program_recruitment_start) <= now &&
        new Date(a.program_recruitment_end) >= now;
      const bRecruiting =
        new Date(b.program_recruitment_start) <= now &&
        new Date(b.program_recruitment_end) >= now;
      if (aRecruiting && !bRecruiting) return -1;
      if (!aRecruiting && bRecruiting) return 1;
      return 0;
    });
  }

  return { programs: filteredPrograms, topics: topicsData };
};

export default function ProgramsPage({ loaderData }: Route.ComponentProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const sorting = searchParams.get("sorting") || "newest";
  const isFree = searchParams.get("isFree") || "all";
  const keyword = searchParams.get("keyword") || "";
  const topic = searchParams.get("topic") || "";

  return (
    <div className="space-y-20">
      <Hero
        title="건강 프로그램"
        subtitle="전문가가 제공하는 다양한 건강 프로그램에 참여하세요. 건강한 삶을 위한 첫 걸음을 시작해보세요."
      />
      <div className="grid grid-cols-1 items-start gap-10 md:grid-cols-6 md:gap-40">
        <div className="space-y-10 md:col-span-4">
          <div className="flex flex-col justify-between gap-10 md:flex-row md:gap-0">
            <div className="w-full space-y-5">
              <div className="flex items-center gap-5">
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center gap-1">
                    <span className="text-sm capitalize">
                      {sorting === "newest"
                        ? "최신순"
                        : sorting === "upcoming"
                          ? "일정순"
                          : "모집중"}
                    </span>
                    <ChevronDownIcon className="size-5" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {SORT_OPTIONS.map((option) => (
                      <DropdownMenuCheckboxItem
                        className="cursor-pointer capitalize"
                        key={option}
                        onCheckedChange={(checked: boolean) => {
                          if (checked) {
                            searchParams.set("sorting", option);
                            setSearchParams(searchParams);
                          }
                        }}
                      >
                        {option === "newest"
                          ? "최신순"
                          : option === "upcoming"
                            ? "일정순"
                            : "모집중"}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center gap-1">
                    <span className="text-sm">
                      {isFree === "all"
                        ? "전체"
                        : isFree === "free"
                          ? "무료"
                          : "유료"}
                    </span>
                    <ChevronDownIcon className="size-5" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {FREE_OPTIONS.map((option) => (
                      <DropdownMenuCheckboxItem
                        className="cursor-pointer"
                        key={option}
                        onCheckedChange={(checked: boolean) => {
                          if (checked) {
                            searchParams.set("isFree", option);
                            setSearchParams(searchParams);
                          }
                        }}
                      >
                        {option === "all"
                          ? "전체"
                          : option === "free"
                            ? "무료"
                            : "유료"}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <Form className="w-full md:w-2/3">
                <Input
                  type="text"
                  name="keyword"
                  placeholder="프로그램 검색"
                  defaultValue={keyword}
                />
              </Form>
            </div>
          </div>
          <div className="space-y-5">
            {loaderData.programs.map((program) => (
              <ProgramCard
                key={program.program_id}
                id={program.program_id}
                programName={program.program_name}
                programLocation={program.program_location}
                programAddress={program.program_address}
                programDescription={program.program_description}
                programNotice={program.program_notice}
                programImage={program.program_image}
                isFree={program.is_free}
                programUrl={program.program_url}
                programDateStart={program.program_date_start}
                programTimeStart={program.program_time_start}
                programTimeEnd={program.program_time_end}
                programRecruitmentStart={program.program_recruitment_start}
                programRecruitmentEnd={program.program_recruitment_end}
                expanded
              />
            ))}
            {loaderData.programs.length === 0 && (
              <div className="col-span-full">
                <p className="text-muted-foreground text-lg font-semibold">
                  검색 결과가 없습니다. 검색어를 수정하거나{" "}
                  <Button variant={"link"} asChild className="p-0 text-lg">
                    <Link to="/programs">초기화</Link>
                  </Button>{" "}
                  해보세요.
                </p>
              </div>
            )}
          </div>
        </div>
        <aside className="space-y-5 md:col-span-2">
          <span className="text-muted-foreground text-sm font-bold uppercase">
            Topics
          </span>
          <div className="flex flex-col items-start gap-2">
            {loaderData.topics.map((topic) => (
              <Button
                asChild
                variant={"link"}
                key={topic.slug}
                className="pl-0"
              >
                <Link to={`/programs?topic=${topic.slug}`}>{topic.name}</Link>
              </Button>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
