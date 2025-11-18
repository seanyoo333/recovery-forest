/**
 * Landing Page Component
 *
 * This file implements the main landing page for external customer acquisition.
 * It showcases the platform's services, benefits, features, and guides users
 * through the signup process.
 *
 * Key features:
 * - Hero section with main service introduction
 * - Service benefits and advantages
 * - Service usage guide
 * - Target audience information
 * - Feature highlights
 * - Customer testimonials and use cases
 * - Quality assurance
 * - Development background and team story
 * - Service overviews (Platform, Products, Forest Therapy)
 * - Signup and application methods
 */
import type { Route } from "./+types/landing";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router";

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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/core/components/ui/dialog";
import { Ripple } from "~/core/components/ui/ripple";
import { Separator } from "~/core/components/ui/separator";
import makeServerClient from "~/core/lib/supa-client.server";

/**
 * Target Audience Item Interface
 */
interface TargetAudienceItem {
  title: string;
  description: string;
  usageExample: {
    title: string;
    steps: string[];
  };
}

interface TestimonialItem {
  name: string;
  content: string;
  source: string;
  category: "제품 후기" | "산림치유 후기";
  detail: string;
  rating?: number;
  link?: string;
}

interface TestimonialGalleryItem {
  src: string;
  caption?: string;
}

/**
 * Target Audience Card Component
 *
 * This component renders a clickable card that shows yellow glow effect
 * when clicked and displays usage examples below.
 */
function TargetAudienceCard({
  item,
  index,
  isSelected,
  onSelect,
}: {
  item: TargetAudienceItem;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <BlurFade delay={0.3 + index * 0.1} duration={0.6} inView>
      <Card
        className={`cursor-pointer transition-all duration-200 ${
          isSelected
            ? "shadow-2xl ring-2 shadow-yellow-400/50 ring-yellow-400/30"
            : ""
        }`}
        onClick={onSelect}
      >
        <CardHeader>
          <CardTitle className="text-lg">{item.title}</CardTitle>
          <CardDescription>{item.description}</CardDescription>
        </CardHeader>
      </Card>
    </BlurFade>
  );
}

function TestimonialCard({ testimonial }: { testimonial: TestimonialItem }) {
  return (
    <Card className="rainbow-card flex h-full flex-col justify-between">
      <CardHeader>
        <div className="mb-3 flex items-center justify-between">
          <Badge className="border-transparent bg-[#03C75A] text-white hover:bg-[#03C75A]">
            {testimonial.source}
          </Badge>
          {testimonial.rating ? (
            <div className="flex items-center gap-1 text-yellow-500">
              {Array.from({ length: testimonial.rating }).map((_, i) => (
                <span key={i}>★</span>
              ))}
            </div>
          ) : null}
        </div>
        <CardDescription className="text-base leading-relaxed">
          {testimonial.content}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="font-semibold">{testimonial.name}</div>
          <div className="text-muted-foreground mt-2 text-sm">
            {testimonial.detail}
          </div>
        </div>
        {testimonial.link ? (
          <Button variant="link" className="px-0 text-xs" asChild>
            <a href={testimonial.link} target="_blank" rel="noreferrer">
              원본 후기 보러가기 →
            </a>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

function TestimonialGalleryDialog({
  triggerLabel,
  images,
}: {
  triggerLabel: string;
  images: TestimonialGalleryItem[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  if (images.length === 0) {
    return null;
  }

  function handlePrev() {
    setActiveIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }

  function handleNext() {
    setActiveIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) setActiveIndex(0);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" className="mt-8 flex items-center gap-2">
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{triggerLabel}</DialogTitle>
          <DialogDescription>
            슈파베이스 testimonial 버킷에 저장된 실제 후기 캡처입니다.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-muted/40 relative overflow-hidden rounded-lg border">
            <img
              src={images[activeIndex]?.src}
              alt={`${triggerLabel} ${activeIndex + 1}`}
              className="h-[420px] w-full object-cover"
              loading="lazy"
            />
            {images[activeIndex]?.caption ? (
              <div className="absolute inset-x-0 bottom-0 bg-black/60 p-3 text-sm text-white">
                {images[activeIndex]?.caption}
              </div>
            ) : null}
          </div>
          {images.length > 1 ? (
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePrev}
                aria-label="이전 후기"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-muted-foreground text-sm">
                {activeIndex + 1} / {images.length}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNext}
                aria-label="다음 후기"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Meta function for setting page metadata
 *
 * This function generates SEO-friendly metadata for the landing page.
 *
 * @returns Array of metadata objects for the page
 */
export const meta: Route.MetaFunction = () => {
  return [
    {
      title: "Evidence Base - 건강과 웰빙을 위한 증거 기반 플랫폼",
    },
    {
      name: "description",
      content:
        "Evidence Base는 플랫폼, 제품, 산림치유 서비스를 통해 건강과 웰빙을 증거 기반으로 제공하는 혁신적인 플랫폼입니다.",
    },
  ];
};

/**
 * Loader function for server-side data fetching
 *
 * This function is executed on the server before rendering the component.
 * For a landing page, we may not need to fetch data, but we keep the structure
 * for consistency and future extensibility.
 *
 * @param request - The incoming HTTP request
 * @returns Object with any necessary data for the landing page
 */
export async function loader({ request }: Route.LoaderArgs) {
  const [client] = makeServerClient(request);
  const {
    data: { user },
  } = await client.auth.getUser();

  return {
    timestamp: new Date().toISOString(),
    isAuthenticated: !!user,
  };
}

/**
 * Action function for form submissions
 *
 * This function handles form submissions from the landing page.
 * Currently returns a simple success response, but can be extended
 * to handle newsletter signups, contact forms, etc.
 *
 * @param request - The incoming HTTP request with form data
 * @returns Response indicating success or error
 */
export async function action({ request }: Route.ActionArgs) {
  // Handle form submissions here if needed
  // For now, return a simple success response
  return {
    success: true,
  };
}

/**
 * Landing page component
 *
 * This component renders a comprehensive landing page designed to convert
 * external visitors into registered users. It includes multiple sections
 * that progressively build trust and demonstrate value.
 *
 * @returns JSX element representing the landing page
 */
export default function Landing({ loaderData }: Route.ComponentProps) {
  const [selectedAudienceIndex, setSelectedAudienceIndex] = useState<
    number | null
  >(null);
  const navigate = useNavigate();

  const testimonialData: TestimonialItem[] = [
    {
      name: "김○○님",
      content:
        "AI 분석 기능이 정말 유용했습니다. 혈액검사 결과를 바탕으로 개인 맞춤형 건강 관리 계획을 받을 수 있어서 만족합니다.",
      rating: 5,
      source: "네이버 쇼핑몰",
      category: "제품 후기",
      detail: "구매 제품: MCS 초고용량 커큐민",
      link: "https://smartstore.naver.com",
    },
    {
      name: "이○○님",
      content:
        "전문가 추천 제품을 통해 효과를 확인할 수 있었고, 커뮤니티에서 비슷한 상황의 분들과 정보를 공유할 수 있어 도움이 됩니다.",
      rating: 5,
      source: "네이버 쇼핑몰",
      category: "제품 후기",
      detail: "구매 제품: 통합 건강 보조제 패키지",
    },
    {
      name: "박○○님",
      content:
        "산림치유 프로그램을 통해 스트레스가 많이 완화되었고, 정기적으로 참여하면서 건강이 개선되는 것을 느꼈습니다.",
      source: "네이버 폼",
      category: "산림치유 후기",
      detail: "참여 프로그램: 치유 워크숍 4주차",
    },
    {
      name: "최○○님",
      content:
        "증거 기반 정보만 제공되어 신뢰할 수 있고, 제품 리뷰 시스템을 통해 실제 효과를 확인한 후 구매할 수 있어 좋습니다.",
      rating: 5,
      source: "네이버 쇼핑몰",
      category: "제품 후기",
      detail: "구매 제품: 프리미엄 면역 케어 세트",
    },
    {
      name: "정○○님",
      content:
        "모든 건강 정보를 한 곳에서 관리할 수 있어 편리하고, AI 추천 기능이 정말 정확해서 만족합니다.",
      rating: 5,
      source: "네이버 쇼핑몰",
      category: "제품 후기",
      detail: "구매 서비스: AI 건강 리포트 구독",
    },
    {
      name: "강○○님",
      content:
        "건강 추적 기능으로 시간에 따른 변화를 확인할 수 있어 동기부여가 되고, 전문가 네트워크를 통해 신뢰할 수 있는 정보를 얻을 수 있습니다.",
      source: "네이버 폼",
      category: "산림치유 후기",
      detail: "참여 서비스: 데이터 기반 코칭 프로그램",
    },
  ];

  const testimonialBucketBaseUrl =
    import.meta.env.VITE_SUPABASE_TESTIMONIAL_BASE_URL ??
    "https://your-supabase-project.supabase.co/storage/v1/object/public/testimonial";

  const testimonialGallery: Record<
    "product" | "program",
    TestimonialGalleryItem[]
  > = {
    product: [
      {
        src: `${testimonialBucketBaseUrl}/product/product-review-01.png`,
        caption: "MCS 초고용량 커큐민 구매 인증 캡처",
      },
      {
        src: `${testimonialBucketBaseUrl}/product/product-review-02.png`,
        caption: "AI 건강 분석 리포트 후기",
      },
      {
        src: `${testimonialBucketBaseUrl}/product/product-review-03.png`,
        caption: "전문가 추천 제품 사용 후기",
      },
      {
        src: `${testimonialBucketBaseUrl}/product/product-review-04.png`,
      },
      {
        src: `${testimonialBucketBaseUrl}/product/product-review-05.png`,
      },
    ],
    program: [
      {
        src: `${testimonialBucketBaseUrl}/program/forest-review-01.png`,
        caption: "산림치유 세션 참여 인증",
      },
      {
        src: `${testimonialBucketBaseUrl}/program/forest-review-02.png`,
        caption: "프로그램 만족도 설문 캡처",
      },
      {
        src: `${testimonialBucketBaseUrl}/program/forest-review-03.png`,
        caption: "데이터 기반 코칭 프로그램 후기",
      },
    ],
  };

  const audienceData: TargetAudienceItem[] = [
    {
      title: "암 예방 관심자",
      description:
        "과학적 근거를 바탕으로 암 예방을 위한 건강 관리를 하고 싶은 분",
      usageExample: {
        title: "암 예방 관심자를 위한 서비스 이용 방법",
        steps: [
          "증거 기반 블로그를 통해 암 예방에 관한 최신 정보를 확인하세요",
          "AI 건강 분석 기능으로 현재 건강 상태를 평가받으세요",
          "검증된 건강 제품을 통해 예방에 도움이 되는 제품을 찾아보세요",
          "커뮤니티에서 다른 예방 관심자들과 정보를 공유하세요",
          "정기적으로 건강 지표를 추적하여 변화를 모니터링하세요",
        ],
      },
    },
    {
      title: "암 경험자",
      description: "지속적인 건강 관리가 필요한 암 경험자",
      usageExample: {
        title: "암 경험자를 위한 서비스 이용 방법",
        steps: [
          "혈액검사 결과를 업로드하여 AI 분석을 받으세요",
          "전문가 추천 제품을 통해 회복에 도움이 되는 제품을 확인하세요",
          "산림치유 프로그램에 참여하여 정신적 회복을 도모하세요",
          "커뮤니티에서 다른 경험자들과 경험을 공유하고 위로를 받으세요",
          "건강 대시보드를 통해 지속적으로 건강 상태를 관리하세요",
        ],
      },
    },
    {
      title: "암 경험자 보호자",
      description: "암 경험자를 위한 통합의학적 건강 관리를 도와주고 싶은 분",
      usageExample: {
        title: "암 경험자 보호자를 위한 서비스 이용 방법",
        steps: [
          "플랫폼의 통합의학 정보를 학습하여 올바른 건강 관리를 도와주세요",
          "전문가 네트워크를 통해 신뢰할 수 있는 정보를 확인하세요",
          "검증된 제품 정보를 통해 안전한 제품을 선택하도록 도와주세요",
          "산림치유 프로그램 예약 및 관리 기능을 활용하세요",
          "건강 데이터를 함께 관리하여 지속적인 모니터링을 지원하세요",
        ],
      },
    },
    {
      title: "자발적 학습자",
      description: "자발적 학습을 통해 건강 관리를 하고 싶은 분",
      usageExample: {
        title: "자발적 학습자를 위한 서비스 이용 방법",
        steps: [
          "증거 기반 블로그를 통해 최신 건강 정보를 학습하세요",
          "커뮤니티 토론에 참여하여 다양한 관점을 배우세요",
          "AI 챗봇을 통해 궁금한 건강 정보를 질문하고 답변을 받으세요",
          "제품 리뷰와 전문가 평가를 통해 제품에 대한 지식을 쌓으세요",
          "건강 추적 기능으로 학습한 내용을 실천하고 효과를 확인하세요",
        ],
      },
    },
  ];

  return (
    <div className="w-full">
      {/* Hero Section - Main Service Introduction */}
      <section className="relative flex min-h-[600px] w-full flex-col items-center justify-center gap-6 overflow-hidden px-4 py-20">
        <div className="container mx-auto">
          <BlurFade delay={0.1} duration={0.6} inView>
            <div className="mb-8 text-center">
              <Badge variant="secondary" className="mb-4 text-sm font-semibold">
                증거 기반 건강 플랫폼
              </Badge>
              <h1 className="mb-6 text-4xl font-extrabold tracking-tight md:text-6xl lg:text-7xl">
                암 경험자를 위한
                <br />
                <span className="from-primary to-primary/60 bg-gradient-to-r bg-clip-text text-transparent">
                  건강 관리법은 따로 있다!
                </span>
              </h1>
              <p className="text-muted-foreground mx-auto mb-8 max-w-2xl text-lg md:text-xl">
                과학적 근거와 전문가 검증을 통해 건강과 웰빙을 위한 최적의
                솔루션을 제공합니다. 플랫폼, 제품, 산림치유 서비스를 통해 당신의
                건강을 증거 기반으로 관리하세요.
              </p>
            </div>
            {/* Hero Image */}
            <div className="mb-8 flex justify-center">
              <img
                src="/images/landing1.jpg"
                alt="Evidence Base 건강 관리 플랫폼"
                className="h-auto w-full max-w-4xl rounded-lg object-cover shadow-lg"
                onError={(e) => {
                  // 이미지 로드 실패 시 숨김 처리
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button
                size="lg"
                onClick={() => {
                  if (loaderData.isAuthenticated) {
                    navigate("/");
                  } else {
                    navigate("/join");
                  }
                }}
              >
                {loaderData.isAuthenticated
                  ? "홈으로 이동"
                  : "회원가입 후 빠르게 시작하기"}
              </Button>
            </div>
          </BlurFade>
        </div>
        <Ripple mainCircleSize={250} mainCircleOpacity={0.2} numCircles={10} />
      </section>

      {/* Main Service Benefits Section */}
      <section className="container mx-auto px-4 py-20">
        <BlurFade delay={0.2} duration={0.6} inView>
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
              Evidence Base의 주요 장점
            </h2>
            <p className="text-muted-foreground mx-auto max-w-2xl">
              과학적 근거와 전문가 검증을 바탕으로 한 신뢰할 수 있는 건강 솔루션
            </p>
          </div>
        </BlurFade>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <BlurFade delay={0.3} duration={0.6} inView>
            <Card className="neon-card cursor-pointer">
              <CardHeader>
                <div className="mb-2 text-3xl">🔬</div>
                <CardTitle>증거 기반 접근</CardTitle>
                <CardDescription>
                  모든 정보와 추천은 과학적 연구와 전문가 검증을 거칩니다
                </CardDescription>
              </CardHeader>
            </Card>
          </BlurFade>

          <BlurFade delay={0.4} duration={0.6} inView>
            <Card className="neon-card cursor-pointer">
              <CardHeader>
                <div className="mb-2 text-3xl">👥</div>
                <CardTitle>전문가 네트워크</CardTitle>
                <CardDescription>
                  검증된 전문가와 의료진이 직접 관리하는 신뢰할 수 있는 정보
                </CardDescription>
              </CardHeader>
            </Card>
          </BlurFade>

          <BlurFade delay={0.5} duration={0.6} inView>
            <Card className="neon-card cursor-pointer">
              <CardHeader>
                <div className="mb-2 text-3xl">📊</div>
                <CardTitle>개인화된 분석</CardTitle>
                <CardDescription>
                  AI 기반 분석을 통해 개인 맞춤형 건강 관리 솔루션 제공
                </CardDescription>
              </CardHeader>
            </Card>
          </BlurFade>

          <BlurFade delay={0.6} duration={0.6} inView>
            <Card className="neon-card cursor-pointer">
              <CardHeader>
                <div className="mb-2 text-3xl">🌲</div>
                <CardTitle>산림치유 프로그램</CardTitle>
                <CardDescription>
                  자연 기반 치유 프로그램으로 몸과 마음의 건강 회복
                </CardDescription>
              </CardHeader>
            </Card>
          </BlurFade>

          <BlurFade delay={0.7} duration={0.6} inView>
            <Card className="neon-card cursor-pointer">
              <CardHeader>
                <div className="mb-2 text-3xl">💊</div>
                <CardTitle>검증된 제품 추천</CardTitle>
                <CardDescription>
                  효과가 입증된 건강 제품만을 엄선하여 추천
                </CardDescription>
              </CardHeader>
            </Card>
          </BlurFade>

          <BlurFade delay={0.8} duration={0.6} inView>
            <Card className="neon-card cursor-pointer">
              <CardHeader>
                <div className="mb-2 text-3xl">🔄</div>
                <CardTitle>지속적인 업데이트</CardTitle>
                <CardDescription>
                  최신 연구 결과와 트렌드를 반영한 지속적인 정보 업데이트
                </CardDescription>
              </CardHeader>
            </Card>
          </BlurFade>
        </div>
      </section>

      {/* Service Usage Guide Section */}
      <section className="bg-muted/50 py-20">
        <div className="container mx-auto px-4">
          <BlurFade delay={0.2} duration={0.6} inView>
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
                서비스 이용 방법
              </h2>
              <p className="text-muted-foreground mx-auto max-w-2xl">
                간단한 4단계로 현명하게 Evidence Base를 이용하세요
              </p>
            </div>
          </BlurFade>

          <div className="grid gap-8 md:grid-cols-4">
            <BlurFade delay={0.3} duration={0.6} inView>
              <div className="text-center">
                <div className="bg-primary text-primary-foreground mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold">
                  1
                </div>
                <h3 className="mb-2 text-xl font-semibold">회원가입</h3>
                <p className="text-muted-foreground">
                  간단한 정보 입력으로 무료 회원가입을 완료하세요
                </p>
              </div>
            </BlurFade>

            <BlurFade delay={0.4} duration={0.6} inView>
              <div className="text-center">
                <div className="bg-primary text-primary-foreground mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold">
                  2
                </div>
                <h3 className="mb-2 text-xl font-semibold">프로필 설정</h3>
                <p className="text-muted-foreground">
                  건강 정보를 업데이트 하여 개인화된 서비스를 받으세요
                </p>
              </div>
            </BlurFade>

            <BlurFade delay={0.5} duration={0.6} inView>
              <div className="text-center">
                <div className="bg-primary text-primary-foreground mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold">
                  3
                </div>
                <h3 className="mb-2 text-xl font-semibold">서비스 이용</h3>
                <p className="text-muted-foreground">
                  블로그와 커뮤니티를 통해 건강 정보를 공유하고 소통하세요
                </p>
              </div>
            </BlurFade>

            <BlurFade delay={0.5} duration={0.6} inView>
              <div className="text-center">
                <div className="bg-primary text-primary-foreground mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold">
                  4
                </div>
                <h3 className="mb-2 text-xl font-semibold">서비스 이용</h3>
                <p className="text-muted-foreground">
                  맞춤 추천 서비스와 AI 분석을 받고 건강 관리를 시작하세요
                </p>
              </div>
            </BlurFade>
          </div>
        </div>
      </section>

      {/* Target Audience Section */}
      <section className="container mx-auto px-4 py-20">
        <BlurFade delay={0.2} duration={0.6} inView>
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
              이런 분들께 도움이 됩니다
            </h2>
            <p className="text-muted-foreground mx-auto max-w-2xl">
              Evidence Base는 다양한 건강 관리 목표를 가진 분들을 지원합니다
            </p>
          </div>
        </BlurFade>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {audienceData.map((item, index) => (
            <TargetAudienceCard
              key={item.title}
              item={item}
              index={index}
              isSelected={selectedAudienceIndex === index}
              onSelect={() =>
                setSelectedAudienceIndex(
                  selectedAudienceIndex === index ? null : index,
                )
              }
            />
          ))}
        </div>
        {selectedAudienceIndex !== null && (
          <BlurFade
            delay={0.1}
            duration={0.5}
            direction="up"
            offset={20}
            inView
          >
            <div className="mt-8">
              <Card className="bg-muted/50">
                <CardHeader>
                  <CardTitle className="mx-auto max-w-2xl text-left text-2xl md:text-3xl">
                    {audienceData[selectedAudienceIndex].usageExample.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="mx-auto max-w-2xl space-y-4">
                    {audienceData[selectedAudienceIndex].usageExample.steps.map(
                      (step: string, stepIndex: number) => (
                        <li
                          key={stepIndex}
                          className="text-muted-foreground flex items-start gap-3"
                        >
                          <span className="bg-primary text-primary-foreground mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
                            {stepIndex + 1}
                          </span>
                          <span className="text-base leading-relaxed">
                            {step}
                          </span>
                        </li>
                      ),
                    )}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </BlurFade>
        )}
      </section>

      {/* Service Overview Sections */}
      <section className="bg-muted/50 py-20">
        <div className="container mx-auto px-4">
          <BlurFade delay={0.2} duration={0.6} inView>
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
                서비스 개요
              </h2>
              <p className="text-muted-foreground mx-auto max-w-2xl">
                Evidence Base의 세 가지 핵심 서비스를 소개합니다
              </p>
            </div>
          </BlurFade>

          {/* Platform Overview */}
          <BlurFade delay={0.3} duration={0.6} inView>
            <Link to="/my/dashboard" className="block">
              <Card className="rainbow-card mb-8 cursor-pointer">
                <CardHeader>
                  <Badge variant="secondary" className="mb-2 w-fit">
                    서비스 개요 1
                  </Badge>
                  <CardTitle className="text-2xl md:text-3xl">
                    통합 건강 관리 플랫폼
                  </CardTitle>
                  <CardDescription className="text-base">
                    모든 건강 정보와 서비스를 한 곳에서 관리할 수 있는 통합
                    플랫폼
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-muted-foreground space-y-3">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">✓</span>
                      <span>건강 데이터 통합 관리 및 분석 대시보드</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">✓</span>
                      <span>AI 기반 개인 맞춤형 건강 추천 시스템</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">✓</span>
                      <span>전문가와의 소통 및 상담 기능</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">✓</span>
                      <span>커뮤니티를 통한 건강 정보 공유</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </Link>
          </BlurFade>

          {/* Products Overview */}
          <BlurFade delay={0.4} duration={0.6} inView>
            <Link to="/products" className="block">
              <Card className="rainbow-card mb-8 cursor-pointer">
                <CardHeader>
                  <Badge variant="secondary" className="mb-2 w-fit">
                    서비스 개요 2
                  </Badge>
                  <CardTitle className="text-2xl md:text-3xl">
                    검증된 건강 제품 추천
                  </CardTitle>
                  <CardDescription className="text-base">
                    효과가 입증된 건강 제품만을 엄선하여 추천하는 서비스
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-muted-foreground space-y-3">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">✓</span>
                      <span>과학적 연구 기반 제품 검증 및 리뷰</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">✓</span>
                      <span>전문가 추천 및 사용자 후기 기반 평가</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">✓</span>
                      <span>개인 건강 상태에 맞는 제품 추천</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">✓</span>
                      <span>제품 비교 및 상세 정보 제공</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </Link>
          </BlurFade>

          {/* Forest Therapy Overview */}
          <BlurFade delay={0.5} duration={0.6} inView>
            <Link to="/teams" className="block">
              <Card className="rainbow-card cursor-pointer">
                <CardHeader>
                  <Badge variant="secondary" className="mb-2 w-fit">
                    서비스 개요 3
                  </Badge>
                  <CardTitle className="text-2xl md:text-3xl">
                    산림치유 프로그램
                  </CardTitle>
                  <CardDescription className="text-base">
                    자연의 힘을 활용한 과학적 산림치유 프로그램 제공
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-muted-foreground space-y-3">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">✓</span>
                      <span>검증된 산림치유 프로그램 및 시설 정보</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">✓</span>
                      <span>전문 산림치유 지도사와의 맞춤형 프로그램</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">✓</span>
                      <span>스트레스 완화 및 정신 건강 개선 효과</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">✓</span>
                      <span>개인 및 그룹 프로그램 예약 및 관리</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </Link>
          </BlurFade>
        </div>
      </section>

      {/* Feature Highlights Section */}
      <section className="container mx-auto px-4 py-20">
        <BlurFade delay={0.2} duration={0.6} inView>
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
              주요 기능 및 특징
            </h2>
            <p className="text-muted-foreground mx-auto max-w-2xl">
              Evidence Base만의 차별화된 기능들을 만나보세요
            </p>
          </div>
        </BlurFade>

        <div className="grid gap-8 md:grid-cols-2">
          {[
            {
              title: "AI 건강 분석",
              description:
                "혈액검사 결과와 건강 데이터를 AI가 분석하여 개인 맞춤형 건강 리포트를 제공합니다.",
              icon: "🤖",
            },
            {
              title: "전문가 네트워크",
              description:
                "검증된 의료진과 건강 전문가들이 직접 관리하는 신뢰할 수 있는 정보를 제공합니다.",
              icon: "👨‍⚕️",
            },
            {
              title: "제품 리뷰 시스템",
              description:
                "실제 사용자들의 상세한 리뷰와 전문가 평가를 통해 신뢰할 수 있는 제품 정보를 제공합니다.",
              icon: "⭐",
            },
            {
              title: "커뮤니티 활동",
              description:
                "건강에 관심 있는 사용자들과 정보를 공유하고 경험을 나눌 수 있는 활발한 커뮤니티를 운영합니다.",
              icon: "💬",
            },
            {
              title: "건강 추적",
              description:
                "시간에 따른 건강 지표 변화를 추적하고 관리하여 건강 개선 효과를 확인할 수 있습니다.",
              icon: "📈",
            },
            {
              title: "맞춤형 추천",
              description:
                "개인의 건강 상태와 목표에 맞는 제품, 프로그램, 정보를 지능적으로 추천합니다.",
              icon: "🎯",
            },
          ].map((feature, index) => (
            <BlurFade
              key={feature.title}
              delay={0.3 + index * 0.1}
              duration={0.6}
              inView
            >
              <Card className="neon-card cursor-pointer">
                <CardHeader>
                  <div className="mb-2 text-3xl">{feature.icon}</div>
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            </BlurFade>
          ))}
        </div>
      </section>

      {/* Customer Testimonials Section */}
      <section className="bg-muted/50 py-20">
        <div className="container mx-auto px-4">
          <BlurFade delay={0.2} duration={0.6} inView>
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
                사용자 후기 및 사례
              </h2>
              <p className="text-muted-foreground mx-auto max-w-2xl">
                네이버 쇼핑몰과 네이버 폼에서 수집한 실제 고객 후기입니다.
              </p>
            </div>
          </BlurFade>

          {[
            {
              title: "제품 후기",
              description: "네이버 쇼핑몰에서 검증된 고객 후기입니다.",
              category: "제품 후기" as const,
            },
            {
              title: "산림치유 후기",
              description: "네이버 폼을 통해 받은 프로그램 체험 후기입니다.",
              category: "산림치유 후기" as const,
            },
          ].map((group) => (
            <div key={group.title} className="mb-14">
              <BlurFade delay={0.3} duration={0.6} inView>
                <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <Badge variant="outline" className="mb-2 w-fit">
                      {group.title}
                    </Badge>
                    <h3 className="text-2xl font-semibold md:text-3xl">
                      {group.description}
                    </h3>
                  </div>
                </div>
              </BlurFade>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {testimonialData
                  .filter((item) => item.category === group.category)
                  .map((testimonial, index) => (
                    <BlurFade
                      key={`${testimonial.name}-${testimonial.category}`}
                      delay={0.3 + index * 0.1}
                      duration={0.6}
                      inView
                    >
                      <TestimonialCard testimonial={testimonial} />
                    </BlurFade>
                  ))}
              </div>
              <div className="mt-8 flex justify-center">
                <TestimonialGalleryDialog
                  triggerLabel={`${group.title} 캡처 더보기`}
                  images={
                    group.category === "제품 후기"
                      ? testimonialGallery.product
                      : testimonialGallery.program
                  }
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Quality Assurance Section */}
      <section className="container mx-auto px-4 py-20">
        <BlurFade delay={0.2} duration={0.6} inView>
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
              서비스에 대한 약속
            </h2>
            <p className="text-muted-foreground mx-auto max-w-2xl">
              Evidence Base는 신뢰할 수 있는 건강 정보를 제공하기 위해 엄격한
              기준을 적용합니다
            </p>
          </div>
        </BlurFade>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: "과학적 검증",
              description:
                "모든 정보는 peer-reviewed 연구와 과학적 근거를 바탕으로 합니다",
            },
            {
              title: "전문가 검토",
              description:
                "의료진과 건강 전문가들이 직접 검토하고 승인한 정보만 제공합니다",
            },
            {
              title: "투명한 정보",
              description:
                "정보 출처와 검증 과정을 투명하게 공개하여 신뢰성을 보장합니다",
            },
            {
              title: "지속적 업데이트",
              description:
                "최신 연구 결과를 반영하여 정보의 정확성을 지속적으로 유지합니다",
            },
          ].map((item, index) => (
            <BlurFade
              key={item.title}
              delay={0.3 + index * 0.1}
              duration={0.6}
              inView
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
              </Card>
            </BlurFade>
          ))}
        </div>
      </section>

      {/* Development Background Section */}
      <section className="bg-muted/50 py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl">
            <BlurFade delay={0.2} duration={0.6} inView>
              <div className="mb-8 text-center">
                <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
                  서비스를 개발한 이유
                </h2>
                <p className="text-muted-foreground">
                  건강 정보의 혼란 속에서 신뢰할 수 있는 증거 기반 솔루션을
                  제공하고자 합니다
                </p>
              </div>
            </BlurFade>

            <BlurFade delay={0.3} duration={0.6} inView>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-muted-foreground space-y-4">
                    <p>
                      오늘날 건강 정보는 넘쳐나지만, 그 중 많은 부분이 과학적
                      근거 없이 퍼지고 있습니다. Evidence Base는 이러한 문제를
                      해결하기 위해 탄생했습니다.
                    </p>
                    <p>
                      우리는 모든 사용자가 신뢰할 수 있는, 검증된 건강 정보에
                      접근할 수 있어야 한다고 믿습니다. 따라서 모든 정보와
                      추천은 엄격한 과학적 검증 과정을 거치며, 전문가들의 검토를
                      받습니다.
                    </p>
                    <p>
                      또한 개인 맞춤형 건강 관리를 통해 각자의 건강 목표를
                      달성할 수 있도록 지원합니다. AI 기술과 전문가 네트워크를
                      결합하여 최적의 건강 솔루션을 제공하는 것이 우리의
                      목표입니다.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </BlurFade>
          </div>
        </div>
      </section>

      {/* Team Story Section */}
      <section className="container mx-auto px-4 py-20">
        <BlurFade delay={0.2} duration={0.6} inView>
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
              만든 사람 이야기
            </h2>
            <p className="text-muted-foreground mx-auto max-w-2xl">
              Evidence Base를 만든 팀을 소개합니다
            </p>
          </div>
        </BlurFade>

        <div className="mx-auto max-w-4xl">
          <BlurFade delay={0.3} duration={0.6} inView>
            <Card>
              <CardContent className="pt-6">
                <div className="text-muted-foreground space-y-4">
                  <p>
                    Evidence Base는 건강과 기술에 열정을 가진 전문가들로 구성된
                    팀이 만들었습니다. 의료진, 데이터 과학자, 소프트웨어
                    엔지니어, 산림치유 전문가 등 다양한 분야의 전문가들이
                    협력하여 개발했습니다.
                  </p>
                  <p>
                    우리 팀은 개인의 건강이 삶의 질에 직접적인 영향을 미친다고
                    믿습니다. 따라서 과학적 근거와 전문가 지식을 바탕으로
                    사용자들이 건강한 선택을 할 수 있도록 돕는 것이 우리의
                    사명입니다.
                  </p>
                  <p>
                    Evidence Base는 단순한 정보 제공 플랫폼을 넘어, 사용자들의
                    건강 개선을 위한 파트너가 되고자 합니다. 지속적인 연구와
                    개발을 통해 더 나은 서비스를 제공하기 위해 노력하고
                    있습니다.
                  </p>
                </div>
              </CardContent>
            </Card>
          </BlurFade>
        </div>
      </section>

      {/* Compliance Notice Section */}
      <section className="container mx-auto px-4 py-16">
        <BlurFade delay={0.2} duration={0.6} inView>
          <div className="mb-10 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
              주의사항
            </h2>
            <p className="text-muted-foreground mx-auto max-w-3xl text-sm md:text-base">
              Evidence Base는 통합의학적 관점에서 암 경험자를 포함한 사용자들이
              건강한 생활 습관을 만들고, 신뢰 가능한 정보를 바탕으로 주체적으로
              건강 관리를 수행하도록 돕는 것을 목적으로 합니다. 아래 사항을
              반드시 확인해주세요.
            </p>
          </div>
        </BlurFade>

        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: "진단/치료 목적이 아님",
              description:
                "제공되는 건강 보조제, 강의, 산림치유 프로그램은 질병의 진단·치료·예방을 위한 것이 아니며, 의료행위를 대체하지 않습니다.",
            },
            {
              title: "증거 기반 정보 제공",
              description:
                "모든 콘텐츠는 통합의학적 연구 및 임상 자료를 바탕으로 하며, 사용자가 스스로 정보를 판단하고 생활에 적용할 수 있도록 돕습니다.",
            },
            {
              title: "전문가 상담 권장",
              description:
                "기존 치료나 복용약과의 상호작용은 전문의와 상담 후 결정해야 하며, 이상 반응 발생 시 즉시 전문 의료진의 진료를 받으시기 바랍니다.",
            },
          ].map((notice, index) => (
            <BlurFade
              key={notice.title}
              delay={0.3 + index * 0.1}
              duration={0.6}
              inView
            >
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="text-lg">{notice.title}</CardTitle>
                  <CardDescription className="text-sm leading-relaxed">
                    {notice.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            </BlurFade>
          ))}
        </div>
      </section>

      {/* CTA Section - Signup and Application */}
      <section className="bg-primary/5 py-20">
        <div className="container mx-auto px-4">
          <BlurFade delay={0.2} duration={0.6} inView>
            <BlurFade className="mx-auto max-w-3xl text-center">
              <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
                지금 바로 시작하세요
              </h2>
              <p className="text-muted-foreground mb-8 text-lg">
                Evidence Base와 함께 건강한 삶을 시작하세요. 무료로 가입하고
                모든 기능을 체험해보세요.
              </p>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button
                  size="lg"
                  onClick={() => {
                    if (loaderData.isAuthenticated) {
                      navigate("/");
                    } else {
                      navigate("/join");
                    }
                  }}
                >
                  {loaderData.isAuthenticated ? "홈으로 이동" : "무료 회원가입"}
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/contact">문의하기</Link>
                </Button>
              </div>
            </BlurFade>
          </BlurFade>
        </div>
      </section>
    </div>
  );
}
