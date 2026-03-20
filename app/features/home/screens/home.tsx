/**
 * Home Page Component
 *
 * This file implements the main landing page of the application with internationalization support.
 * It demonstrates the use of i18next for multi-language content, React Router's data API for
 * server-side rendering, and responsive design with Tailwind CSS.
 *
 * Key features:
 * - Server-side translation with i18next
 * - Client-side translation with useTranslation hook
 * - SEO-friendly metadata using React Router's meta export
 * - Responsive typography with Tailwind CSS
 */
import type { Route } from "./+types/home";

import { DateTime, Settings } from "luxon";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { Badge } from "~/core/components/ui/badge";
import { BlurFade } from "~/core/components/ui/blur-fade";
import { Button } from "~/core/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/core/components/ui/card";
import { Ripple } from "~/core/components/ui/ripple";
import i18next from "~/core/lib/i18next.server";
import makeServerClient from "~/core/lib/supa-client.server";
import { getBlogPostsMeta } from "~/features/blog/queries";
import { ClinicCard } from "~/features/clinic/components/clinic-card";
import { getClinics } from "~/features/clinic/queries";
import { PostCard } from "~/features/community/components/post-card";
import { getPosts } from "~/features/community/queries";
import { BlogCard } from "~/features/home/components/blog-card";
import { IngredientCard } from "~/features/natural-ingredients/components/ingredient-card";
import { getNaturalIngredients } from "~/features/natural-ingredients/queries";
import { TeamCard } from "~/features/teams/components/team-card";
import { getTeams } from "~/features/teams/queries";

/**
 * Interface defining the structure of MDX frontmatter
 *
 * Each MDX blog post file must include these metadata fields in its frontmatter:
 * - title: The title of the blog post
 * - description: A brief summary of the post content
 * - date: Publication date (used for sorting)
 * - category: The post category for filtering/grouping
 * - author: The name of the post author
 * - slug: URL-friendly identifier for the post
 */
interface BlogPost {
  title: string;
  description: string;
  date: string;
  category: string;
  author: string;
  slug: string;
}

/**
 * Meta function for setting page metadata
 *
 * This function generates SEO-friendly metadata for the home page using data from the loader.
 * It sets:
 * - Page title from translated "home.title" key
 * - Meta description from translated "home.subtitle" key
 *
 * The metadata is language-specific based on the user's locale preference.
 *
 * @param data - Data returned from the loader function containing translated title and subtitle
 * @returns Array of metadata objects for the page
 */
export const meta: Route.MetaFunction = ({ data }) => {
  return [
    { title: data?.title },
    { name: "description", content: data?.subtitle },
  ];
};

/**
 * Loader function for server-side data fetching
 *
 * This function is executed on the server before rendering the component.
 * It:
 * 1. Extracts the user's locale from the request (via cookies or Accept-Language header)
 * 2. Creates a translation function for that specific locale
 * 3. Returns translated strings for the page title and subtitle
 *
 * This approach ensures that even on first load, users see content in their preferred language,
 * which improves both user experience and SEO (search engines see localized content).
 *
 * @param request - The incoming HTTP request containing locale information
 * @returns Object with translated title and subtitle strings
 */
export async function loader({ request }: Route.LoaderArgs) {
  // Get a translation function for the user's locale from the request
  const t = await i18next.getFixedT(request);

  // Create Supabase client for server-side operations
  const [client, headers] = makeServerClient(request);
  const {
    data: { user },
  } = await client.auth.getUser();

  const ingredients = await getNaturalIngredients(client, {
    limit: 7,
  });

  // 블로그 포스트 로드 - 메타데이터만 DB에서 조회 (MDX 다운로드 없음)
  const blogPostsMeta = await getBlogPostsMeta(client);

  // Convert to BlogPost format and take first 8
  const recentBlogPosts: BlogPost[] = blogPostsMeta.slice(0, 8).map((meta) => ({
    title: meta.title,
    description: meta.description,
    date: meta.date,
    category: meta.category,
    author: meta.author,
    slug: meta.slug,
  }));

  const posts = await getPosts(client, {
    limit: 7,
    sorting: "newest",
  });

  const clinics = await getClinics(client, { limit: 11 });
  const teams = await getTeams(client, { limit: 7 });

  // Return translated strings and ingredient data
  return {
    title: t("home.title"),
    subtitle: t("home.subtitle"),
    isAuthenticated: !!user,
    ingredients,
    blogPosts: recentBlogPosts,
    posts,
    clinics,
    teams,
  };
}

/**
 * Home page component
 *
 * This is the main landing page component of the application. It displays a simple,
 * centered layout with a headline and subtitle, both internationalized using i18next.
 *
 * Features:
 * - Uses the useTranslation hook for client-side translation
 * - Implements responsive design with Tailwind CSS
 * - Maintains consistent translations between server and client
 *
 * The component is intentionally simple to serve as a starting point for customization.
 * It demonstrates the core patterns used throughout the application:
 * - Internationalization
 * - Responsive design
 * - Clean, semantic HTML structure
 *
 * @returns JSX element representing the home page
 */
export default function Home({ loaderData }: Route.ComponentProps) {
  // Get the translation function for the current locale
  const { t } = useTranslation();
  const primaryCtaHref = loaderData.isAuthenticated
    ? "/my/dashboard/health"
    : "/join";
  const habitsCtaHref = loaderData.isAuthenticated
    ? "/my/dashboard/health-habits"
    : "/join";
  const reportCtaHref = loaderData.isAuthenticated
    ? "/my/dashboard/health/report"
    : "/join";

  return (
    <>
      <div className="w-full space-y-24 pb-20">
        <section className="relative overflow-hidden py-20 md:py-28">
          <div className="mx-auto flex max-w-6xl flex-col gap-10">
            <BlurFade delay={0.1} duration={0.8} inView>
              <div className="mx-auto max-w-4xl text-center">
                <Badge
                  variant="secondary"
                  className="mb-4 text-xs font-semibold"
                >
                  암 치료 이후 공백을 해결하는 데이터 기반 AI 건강관리 지원
                  솔루션
                </Badge>
                <h1 className="text-4xl font-extrabold tracking-tight lg:text-6xl">
                  {t("home.title")}
                </h1>
                <h2 className="text-muted-foreground mx-auto mt-4 max-w-3xl text-xl leading-relaxed md:text-2xl">
                  {t("home.subtitle")}
                </h2>
              </div>
            </BlurFade>

            <BlurFade delay={0.2} duration={0.8} inView>
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  {
                    step: "01",
                    title: "데이터 기록과 시각화",
                    description:
                      "건강 데이터를 기록하고 시각화해, 일상 속에서 건강관리 습관을 만들 수 있도록 돕습니다.",
                  },
                  {
                    step: "02",
                    title: "데이터·논문 기반 분석",
                    description:
                      "내 데이터와 근거 자료를 함께 살펴보며, 더 신뢰할 수 있는 건강관리 방향을 정리합니다.",
                  },
                  {
                    step: "03",
                    title: "AI 분석·조언과 전문가 연결",
                    description:
                      "AI 기반 분석과 전문가 연결을 통해 혼자 판단하기 어려운 건강관리의 부담을 줄입니다.",
                  },
                ].map((item) => (
                  <Card key={item.step} className="neon-card h-full border">
                    <CardHeader>
                      <div className="text-primary text-sm font-semibold">
                        {item.step}
                      </div>
                      <CardTitle className="text-xl">{item.title}</CardTitle>
                      <CardDescription className="text-sm leading-relaxed">
                        {item.description}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </BlurFade>

            <BlurFade delay={0.3} duration={0.8} inView>
              <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
                <Card className="neon-card border">
                  <CardHeader>
                    <CardTitle className="text-2xl">
                      이런 분들을 위한 서비스입니다
                    </CardTitle>
                    <CardDescription className="text-base">
                      치료 이후 무엇을, 어떻게 관리해야 할지 막막한 순간에
                      시작할 수 있는 생활관리 도구입니다.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-3 sm:grid-cols-2">
                    {[
                      "암 치료 이후 건강관리의 공백이 불안한 분",
                      "검사 결과와 생활 데이터를 꾸준히 기록하고 싶은 분",
                      "근거 기반으로 건강관리 방향을 정리하고 싶은 분",
                      "혼자 결정하기보다 AI 분석과 전문가 연결이 필요한 분",
                    ].map((item) => (
                      <div
                        key={item}
                        className="bg-muted/50 rounded-xl border p-4 text-sm leading-relaxed"
                      >
                        {item}
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="rainbow-card border">
                  <CardHeader>
                    <CardTitle className="text-2xl">
                      바로 시작해 보세요
                    </CardTitle>
                    <CardDescription className="text-base">
                      건강정보 입력부터 생활습관 기록, 맞춤 건강 보고서 요청까지
                      한 흐름으로 이어집니다.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3">
                    <Button size="lg" asChild>
                      <Link to={primaryCtaHref}>
                        {loaderData.isAuthenticated
                          ? "건강정보 입력 시작하기"
                          : "무료가입 후 건강정보 입력하기"}
                      </Link>
                    </Button>
                    <Button size="lg" variant="outline" asChild>
                      <Link to={habitsCtaHref}>생활습관 기록하기</Link>
                    </Button>
                    <Button size="lg" variant="outline" asChild>
                      <Link to={reportCtaHref}>맞춤 건강 보고서 요청하기</Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </BlurFade>

            <Ripple
              mainCircleSize={210}
              mainCircleOpacity={0.24}
              numCircles={8}
            />
          </div>
        </section>
        <BlurFade delay={0.25} duration={1} inView>
          <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2.5 text-center md:space-y-0 md:text-left">
              <h2 className="text-center text-3xl leading-10 font-bold tracking-tight md:text-5xl md:leading-tight">
                핫 이슈
              </h2>
              <p className="text-foreground text-center text-lg font-light md:text-xl">
                <span className="font-bold">Evidence Base</span>의 최근 핫 이슈
              </p>
              <Button variant="link" asChild className="p-0 text-lg">
                <Link
                  to="/community"
                  className="block w-full text-center md:text-center"
                >
                  Explore all discussions &rarr;
                </Link>
              </Button>
            </div>
            {loaderData.posts.map((post) => (
              <PostCard
                key={post.post_id}
                id={post.post_id}
                title={post.title}
                author={post.author_name}
                authorUsername={post.author_username}
                authorAvatarUrl={post.author_avatar}
                category={post.topic}
                postedAt={post.created_at}
                votesCount={post.upvotes}
                isUpvoted={post.is_upvoted}
                expanded
              />
            ))}
          </div>
        </BlurFade>
        <BlurFade delay={0.25} duration={1} inView>
          <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2.5 text-center md:space-y-0 md:text-left">
              <h2 className="text-center text-3xl leading-10 font-bold tracking-tight md:text-5xl md:leading-tight">
                추천 블로그
              </h2>
              <p className="text-foreground text-center text-lg font-light md:text-xl">
                <span className="font-bold">Evidence Base</span>의 최신 프리미엄
                블로그 포스트
              </p>
              <Button variant="link" asChild className="p-0 text-lg">
                <Link
                  to="/blog"
                  className="block w-full text-center md:text-center"
                >
                  {" "}
                  Explore all blog posts &rarr;
                </Link>
              </Button>
            </div>
            {loaderData.blogPosts.map((blogPost) => (
              <BlogCard
                key={blogPost.slug}
                title={blogPost.title}
                description={blogPost.description}
                category={blogPost.category}
                author={blogPost.author}
                date={blogPost.date}
                slug={blogPost.slug}
              />
            ))}
          </div>
        </BlurFade>
        <BlurFade delay={0.25} duration={1} inView>
          <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2.5 text-center md:space-y-0 md:text-left">
              <h2 className="text-center text-3xl leading-10 font-bold tracking-tight md:text-5xl md:leading-tight">
                천연물질
              </h2>
              <p className="text-foreground text-center text-lg font-light md:text-xl">
                <span className="font-bold">Evidence Base</span>에서 주목받고
                있는 천연물질
              </p>
              <Button variant="link" asChild className="p-0 text-lg">
                <Link
                  to="/natural-ingredients"
                  className="block w-full text-center md:text-center"
                >
                  전체 천연물질 보기 &rarr;
                </Link>
              </Button>
            </div>
            {loaderData.ingredients.map((ingredient) => (
              <IngredientCard
                key={ingredient.id}
                slug={ingredient.slug}
                name={ingredient.display_name}
                description={
                  ingredient.tagline ?? ingredient.description ?? undefined
                }
                tagline={ingredient.tagline}
                picture={ingredient.picture}
              />
            ))}
          </div>
        </BlurFade>
        {/*         <BlurFade delay={0.25} duration={1} inView>
          <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2.5 text-center md:space-y-0 md:text-left">
              <h2 className="text-3xl leading-10 font-bold tracking-tight md:text-5xl md:leading-tight">
                추천 병원
              </h2>
              <p className="text-foreground text-lg font-light md:text-xl">
                <span className="font-bold">Evidence Base</span>에서 오늘의 추천
                병원을 확인해보세요.
              </p>
              <Button variant="link" asChild className="p-0 text-lg">
                <Link to="/clinics" className="pl-0">
                  Explore all clinics &rarr;
                </Link>
              </Button>
            </div>
            {loaderData.clinics.map((clinic) => (
              <ClinicCard
                key={clinic.clinic_id}
                id={clinic.clinic_id}
                clinicName={clinic.clinic_name}
                clinicLogoUrl={clinic.clinic_logo}
                clinicLocation={clinic.clinic_location}
                clinicType={clinic.clinic_type}
                clinicLevel={clinic.level}
                overview={clinic.overview}
                location={clinic.clinic_location}
                createdAt={clinic.created_at}
              />
            ))}
          </div>
        </BlurFade>
        <BlurFade delay={0.25} duration={1} inView>
          <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2.5 text-center md:space-y-0 md:text-left">
              <h2 className="text-3xl leading-10 font-bold tracking-tight md:text-5xl md:leading-tight">
                인기 전문가 그룹
              </h2>
              <p className="text-foreground text-lg font-light md:text-xl">
                <span className="font-bold">Evidence Base</span>에서 오늘의 인기
                전문가 그룹을 확인해보세요.
              </p>
              <Button variant="link" asChild className="p-0 text-lg">
                <Link prefetch="viewport" to="/teams" className="pl-0">
                  Explore all expert teams &rarr;
                </Link>
              </Button>
            </div>
            {loaderData.teams.map((team) => (
              <TeamCard
                key={team.team_leader_id}
                id={team.team_leader_id}
                teamName={team.team_name}
                leaderUsername={team.team_leader?.name || "Unknown"}
                leaderAvatarUrl={team.team_leader?.avatar}
                leaderPosition={team.team_position}
                targets={team.target}
              />
            ))}
          </div>
        </BlurFade> */}
      </div>
    </>
  );
}

/* leaderUsername={team.team_leader_id.username}

leaderAvatarUrl={team.team_leader_id.avatar} */
