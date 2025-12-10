import type { Route } from "./+types/landing";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router";

import { Badge } from "~/core/components/ui/badge";
import { BlurFade } from "~/core/components/ui/blur-fade";
import { Button } from "~/core/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/core/components/ui/card";
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
          isSelected ? "shadow-2xl ring-2 shadow-yellow-400/50 ring-yellow-400/30" : ""
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
          <Badge className="border-transparent bg-[#03C75A] text-white hover:bg-[#03C75A]">{testimonial.source}</Badge>
          {testimonial.rating ? (
            <div className="flex items-center gap-1 text-yellow-500">
              {Array.from({ length: testimonial.rating }).map((_, i) => (
                <span key={i}>★</span>
              ))}
            </div>
          ) : null}
        </div>
        <CardDescription className="text-base leading-relaxed">{testimonial.content}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="font-semibold">{testimonial.name}</div>
          <div className="text-muted-foreground mt-2 text-sm">{testimonial.detail}</div>
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
          <DialogDescription>슈파베이스 testimonial 버킷에 저장된 실제 후기 캡처입니다.</DialogDescription>
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
              <Button variant="ghost" size="icon" onClick={handlePrev} aria-label="이전 후기">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-muted-foreground text-sm">
                {activeIndex + 1} / {images.length}
              </div>
              <Button variant="ghost" size="icon" onClick={handleNext} aria-label="다음 후기">
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
 */
export const meta: Route.MetaFunction = () => {
  return [
    {
      title: "Evidence Base - 암 방지 근거로 삶을 설계하는 통합의학 건강관리 플랫폼",
    },
    {
      name: "description",
      content:
        "암 경험자와 보호자를 위해 논문·가이드라인·임상 경험을 바탕으로 건강보조제, 산림치유, 생활습관 솔루션을 제공하는 통합의학 플랫폼입니다.",
    },
  ];
};

/**
 * Loader function for server-side data fetching
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
 */
export async function action({ request }: Route.ActionArgs) {
  return {
    success: true,
  };
}

/**
 * Landing page component
 */
export default function Landing({ loaderData }: Route.ComponentProps) {
  const [selectedAudienceIndex, setSelectedAudienceIndex] = useState<number | null>(null);
  const navigate = useNavigate();

  const primaryCtaLabel = loaderData.isAuthenticated
    ? "홈으로 이동"
    : "무료 회원가입 후 '암 방지 근거 리포트' 받아보기";

  const secondaryCtaLabel = "암 방지 근거 스타터 패키지 살펴보기";

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
      content: "모든 건강 정보를 한 곳에서 관리할 수 있어 편리하고, AI 추천 기능이 정말 정확해서 만족합니다.",
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

  const testimonialGallery: Record<"product" | "program", TestimonialGalleryItem[]> = {
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
      description: "과학적 근거를 바탕으로 암 예방을 위한 건강 관리를 하고 싶은 분",
      usageExample: {
        title: "암 예방 관심자를 위한 서비스 이용 방법",
        steps: [
          "증거 기반 블로그를 통해 암 예방에 관한 최신 정보를 확인하세요.",
          "AI 건강 분석 기능으로 현재 건강 상태를 평가받으세요.",
          "검증된 건강 보조제를 통해 예방에 도움이 되는 제품을 찾아보세요.",
          "커뮤니티에서 다른 예방 관심자들과 정보를 공유하세요.",
          "정기적으로 건강 지표를 추적하여 변화를 모니터링하세요.",
        ],
      },
    },
    {
      title: "암 경험자",
      description: "지속적인 건강 관리가 필요한 암 경험자",
      usageExample: {
        title: "암 경험자를 위한 서비스 이용 방법",
        steps: [
          "혈액검사 결과를 업로드하여 AI 분석을 받으세요.",
          "전문가 추천 제품을 통해 회복과 재발 방지에 도움이 되는 제품을 확인하세요.",
          "산림치유 프로그램에 참여하여 정신적·신체적 회복을 도모하세요.",
          "커뮤니티에서 다른 경험자들과 경험을 공유하고 위로를 받으세요.",
          "건강 대시보드를 통해 지속적으로 건강 상태를 관리하세요.",
        ],
      },
    },
    {
      title: "암 경험자 보호자",
      description: "암 경험자를 위한 통합의학적 건강 관리를 도와주고 싶은 분",
      usageExample: {
        title: "암 경험자 보호자를 위한 서비스 이용 방법",
        steps: [
          "플랫폼의 통합의학 정보를 학습하여 올바른 건강 관리를 도와주세요.",
          "전문가 네트워크를 통해 신뢰할 수 있는 정보를 확인하세요.",
          "검증된 제품 정보를 통해 안전한 제품을 선택하도록 도와주세요.",
          "산림치유 프로그램 예약 및 관리 기능을 활용하세요.",
          "건강 데이터를 함께 관리하여 지속적인 모니터링을 지원하세요.",
        ],
      },
    },
    {
      title: "자발적 학습자",
      description: "자발적 학습을 통해 건강 관리를 하고 싶은 분",
      usageExample: {
        title: "자발적 학습자를 위한 서비스 이용 방법",
        steps: [
          "증거 기반 블로그를 통해 최신 건강 정보를 학습하세요.",
          "커뮤니티 토론에 참여하여 다양한 관점을 배우세요.",
          "AI 챗봇을 통해 궁금한 건강 정보를 질문하고 답변을 받으세요.",
          "제품 리뷰와 전문가 평가를 통해 제품에 대한 지식을 쌓으세요.",
          "건강 추적 기능으로 학습한 내용을 실천하고 효과를 확인하세요.",
        ],
      },
    },
  ];

  const problemItems = [
    {
      title: "정보가 너무 많아 혼란스러운 분",
      description: "유튜브·카페·지인 조언이 모두 달라서, 무엇을 믿어야 할지 모르겠나요?",
      detail: "Evidence Base는 논문·가이드라인·임상 경험을 바탕으로 신뢰할 수 있는 정보를 선별합니다.",
    },
    {
      title: "재발이 가장 두려운 암 경험자",
      description: "치료는 끝났지만, 재발 걱정 때문에 생활습관과 보조제 선택에 항상 불안하신가요?",
      detail: "‘암 방지 근거’를 바탕으로 생활습관·보조제·산림치유를 함께 설계해 드립니다.",
    },
    {
      title: "보호자로서 도와주고 싶지만 막막한 분",
      description: "무엇을 해주면 도움이 될지, 어디까지 도와야 할지 고민되시나요?",
      detail: "보호자를 위한 가이드와 프로그램 안내를 통해, 함께 건강 여정을 설계할 수 있습니다.",
    },
  ];

  const faqItems = [
    {
      question: "현재 항암·표적치료·호르몬치료 중인데, 건강 보조제를 함께 써도 되나요?",
      answer:
        "Evidence Base는 통합의학적 관점에서 ‘암 방지 근거’를 정리해 드리지만, 개별 약·보조제의 병용 여부는 반드시 주치의와 상의 후 결정하셔야 합니다. 플랫폼에서는 논문·가이드라인·사례를 제공하여, 의료진과의 대화를 준비하는 데 도움을 드립니다.",
    },
    {
      question: "의사 처방이나 진단을 대신해 주나요?",
      answer:
        "아니요. 본 서비스는 질병의 진단·치료·예방을 위한 의료행위가 아니며, 어떠한 처방도 대신하지 않습니다. 사용자가 스스로 정보를 이해하고, 의료진과의 상담에 참고할 수 있도록 돕는 것을 목표로 합니다.",
    },
    {
      question: "‘암 방지 근거’는 어떤 자료를 말하나요?",
      answer:
        "peer-reviewed 논문, 국제·국내 가이드라인, 통합의학·기능의학 관련 임상 자료, 실제 현장에서의 경험 데이터를 기반으로 정리한 근거를 말합니다. 각 콘텐츠에는 가능한 한 출처와 참고 자료를 명시합니다.",
    },
    {
      question: "산림치유 프로그램은 어떤 분께 적합한가요?",
      answer:
        "암 경험자, 보호자, 암 예방 관심자를 포함해 스트레스·불안이 높거나 회복이 필요한 분들께 적합합니다. 다만 특정 질환이나 증상이 있는 경우, 참가 전 담당 의료진과 상담을 권장드립니다.",
    },
    {
      question: "내 건강 데이터와 개인정보는 안전하게 보호되나요?",
      answer:
        "플랫폼은 국내·국제 보안 기준을 참고하여 데이터를 안전하게 저장하고, 최소한의 정보만 수집합니다. 민감한 정보는 동의하신 범위 내에서만 활용되며, 언제든지 수정·삭제를 요청하실 수 있습니다.",
    },
  ];

  return (
    <div className="w-full">
      {/* Hero Section - Main Service Introduction */}
      <section className="relative flex min-h-[640px] w-full flex-col items-center justify-center gap-6 overflow-hidden px-4 py-20">
        <div className="container mx-auto">
          <BlurFade delay={0.1} duration={0.6} inView>
            <div className="mb-4 flex justify-center">
              <Badge variant="secondary" className="text-xs font-semibold">
                암 경험자를 위한 증거 기반 통합의학 플랫폼
              </Badge>
            </div>
            <div className="text-muted-foreground mb-4 text-center text-xs">
              <span className="rounded-full border px-3 py-1 text-[11px] font-medium">
                암 방지 근거로 삶을 설계하다
              </span>
            </div>
            <div className="mb-8 text-center">
              <h1 className="mb-6 text-4xl font-extrabold tracking-tight md:text-6xl lg:text-7xl">
                암 경험자를 위한
                <br />
                <span className="from-primary to-primary/70 bg-gradient-to-r bg-clip-text text-transparent">
                  &apos;암 방지 근거&apos; 기반 건강 관리
                </span>
              </h1>
              <p className="text-muted-foreground mx-auto mb-6 max-w-2xl text-lg md:text-xl">
                유튜브·카페 정보에 휘둘리지 않고,
                <br />
                논문과 가이드라인, 실제 임상 경험을 바탕으로
                <br />
                건강 보조제·산림치유·생활습관을 함께 설계해 드립니다.
              </p>
              <p className="text-muted-foreground mx-auto mb-8 max-w-2xl text-sm md:text-base">
                암 경험자와 보호자가 재발 걱정은 줄이고, 일상을 더 오래 건강하게 누릴 수 있도록
                <br />
                Evidence Base가 통합의학적 건강관리를 도와드립니다.
              </p>
            </div>

            {/* Hero Image (Miricanvas Hero Banner) */}
            <div className="mb-8 flex justify-center">
              {/* 
                TODO: 미리캔버스로 제작한 히어로 배너 이미지로 교체하세요.
                예: 암 경험자·보호자·숲·데이터(그래프)가 조화된 느낌의 메인 비주얼
              */}
              <img
                src="/images/landing-hero-evidence-base.jpg"
                alt="암 방지 근거 기반 통합의학 건강관리 플랫폼 히어로 이미지"
                className="h-auto w-full max-w-4xl rounded-xl object-cover shadow-xl"
                loading="lazy"
                onError={(e) => {
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
                {primaryCtaLabel}
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => {
                  navigate("/products");
                }}
              >
                {secondaryCtaLabel}
              </Button>
            </div>

            <p className="text-muted-foreground mx-auto mt-4 max-w-md text-center text-xs">
              * 가입만 해도, 암 방지 관점에서 꼭 체크해야 할 생활습관·보충제· 산림치유 체크리스트를 보내드립니다.
            </p>
          </BlurFade>
        </div>
        <Ripple mainCircleSize={250} mainCircleOpacity={0.2} numCircles={10} />
      </section>

      {/* Problem / Empathy Section */}
      <section className="bg-muted/40 py-16">
        <div className="container mx-auto px-4">
          <BlurFade delay={0.2} duration={0.6} inView>
            <div className="mb-10 text-center">
              <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">이런 고민, 하고 계신가요?</h2>
              <p className="text-muted-foreground mx-auto max-w-2xl text-sm md:text-base">
                암 치료는 끝났지만, 정보는 넘쳐나고 마음은 더 불안해지는 시기. Evidence Base는 바로 이 지점에서
                출발했습니다.
              </p>
            </div>
          </BlurFade>
          <div className="grid gap-6 md:grid-cols-3">
            {problemItems.map((item, index) => (
              <BlurFade key={item.title} delay={0.3 + index * 0.1} duration={0.6} inView>
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                    <CardDescription className="text-sm">{item.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm leading-relaxed">{item.detail}</p>
                  </CardContent>
                </Card>
              </BlurFade>
            ))}
          </div>
        </div>
      </section>

      {/* Main Service Benefits Section */}
      <section className="container mx-auto px-4 py-20">
        <BlurFade delay={0.2} duration={0.6} inView>
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">Evidence Base를 선택해야 하는 이유</h2>
            <p className="text-muted-foreground mx-auto max-w-2xl">
              암 방지 근거를 중심으로, 생활습관·보충제·산림치유를 하나의 그림으로 연결합니다.
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
                  유튜브·카페 정보가 아닌, 논문·가이드라인·임상 경험을 바탕으로 정리된 암 방지 근거만 제공합니다.
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
                  통합의학·기능의학·산림치유 등 다양한 전문가의 검토를 거쳐 신뢰도를 높였습니다.
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
                  혈액검사·생활습관 데이터를 바탕으로, 나에게 맞는 위험 신호와 관리 전략을 제안합니다.
                </CardDescription>
              </CardHeader>
            </Card>
          </BlurFade>

          <BlurFade delay={0.6} duration={0.6} inView>
            <Card className="neon-card cursor-pointer">
              <CardHeader>
                <div className="mb-2 text-3xl">🌲</div>
                <CardTitle>산림치유 통합</CardTitle>
                <CardDescription>자연 기반 치유 프로그램으로, 스트레스·우울·수면 문제를 함께 다룹니다.</CardDescription>
              </CardHeader>
            </Card>
          </BlurFade>

          <BlurFade delay={0.7} duration={0.6} inView>
            <Card className="neon-card cursor-pointer">
              <CardHeader>
                <div className="mb-2 text-3xl">💊</div>
                <CardTitle>검증된 건강 보조제</CardTitle>
                <CardDescription>
                  암 경험자에게 특히 민감한 성분·용량·상호작용을 고려하여 보충제를 선별합니다.
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
                  최신 연구 결과와 임상 경험을 반영해, 암 방지 근거를 끊임없이 갱신합니다.
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
              <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">Evidence Base, 이렇게 사용하세요</h2>
              <p className="text-muted-foreground mx-auto max-w-2xl">
                간단한 4단계로, 암 방지 관점의 건강 관리 루틴을 설계하실 수 있습니다.
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
                <p className="text-muted-foreground text-sm">간단한 정보 입력으로 무료 회원가입을 완료하세요.</p>
              </div>
            </BlurFade>

            <BlurFade delay={0.4} duration={0.6} inView>
              <div className="text-center">
                <div className="bg-primary text-primary-foreground mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold">
                  2
                </div>
                <h3 className="mb-2 text-xl font-semibold">건강 프로필 등록</h3>
                <p className="text-muted-foreground text-sm">
                  암 경험 여부, 치료 이력, 기본 건강 정보를 업데이트해 주세요.
                </p>
              </div>
            </BlurFade>

            <BlurFade delay={0.5} duration={0.6} inView>
              <div className="text-center">
                <div className="bg-primary text-primary-foreground mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold">
                  3
                </div>
                <h3 className="mb-2 text-xl font-semibold">암 방지 근거 탐색</h3>
                <p className="text-muted-foreground text-sm">
                  블로그·AI 분석·전문가 콘텐츠를 통해, 나에게 맞는 암 방지 근거를 찾아보세요.
                </p>
              </div>
            </BlurFade>

            <BlurFade delay={0.6} duration={0.6} inView>
              <div className="text-center">
                <div className="bg-primary text-primary-foreground mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold">
                  4
                </div>
                <h3 className="mb-2 text-xl font-semibold">실천 & 추적</h3>
                <p className="text-muted-foreground text-sm">
                  선정된 건강 보조제·산림치유·생활습관을 실천하고, 대시보드로 변화를 추적하세요.
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
            <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">이런 분들께 특히 도움이 됩니다</h2>
            <p className="text-muted-foreground mx-auto max-w-2xl">
              암 예방 관심자, 암 경험자, 보호자, 자발적 학습자까지 — 각자에게 맞는 이용 가이드를 제공합니다.
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
              onSelect={() => setSelectedAudienceIndex(selectedAudienceIndex === index ? null : index)}
            />
          ))}
        </div>
        {selectedAudienceIndex !== null && (
          <BlurFade delay={0.1} duration={0.5} direction="up" offset={20} inView>
            <div className="mt-8">
              <Card className="bg-muted/50">
                <CardHeader>
                  <CardTitle className="mx-auto max-w-2xl text-left text-2xl md:text-3xl">
                    {audienceData[selectedAudienceIndex].usageExample.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="mx-auto max-w-2xl space-y-4">
                    {audienceData[selectedAudienceIndex].usageExample.steps.map((step: string, stepIndex: number) => (
                      <li key={stepIndex} className="text-muted-foreground flex items-start gap-3">
                        <span className="bg-primary text-primary-foreground mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
                          {stepIndex + 1}
                        </span>
                        <span className="text-base leading-relaxed">{step}</span>
                      </li>
                    ))}
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
            <div className="mb-10 text-center">
              <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
                암 방지 근거를 중심으로, 세 가지 축을 연결합니다
              </h2>
              <p className="text-muted-foreground mx-auto max-w-2xl">
                플랫폼 · 건강 보조제 · 산림치유 — 서로 떨어져 있던 요소들을 하나의 여정으로 묶어 드립니다.
              </p>
            </div>
          </BlurFade>

          {/* 3축 솔루션 인포그래픽 이미지 섹션 (Miricanvas) */}
          <BlurFade delay={0.25} duration={0.6} inView>
            <div className="mx-auto mb-10 max-w-3xl">
              {/* 
                TODO: 미리캔버스로 '3축 솔루션 인포그래픽' 제작 후 교체
                예: 중앙에 '암 방지 근거', 세 갈래로 플랫폼/제품/산림치유 흐름도
              */}
              <img
                src="/images/landing-solutions-infographic.jpg"
                alt="플랫폼 · 제품 · 산림치유 3축 솔루션 인포그래픽"
                className="h-auto w-full rounded-xl border object-cover shadow-md"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
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
                  <CardTitle className="text-2xl md:text-3xl">통합 건강 관리 플랫폼</CardTitle>
                  <CardDescription className="text-base">
                    암 경험자의 건강 데이터를 한 곳에 모으고, 암 방지 관점으로 해석하는 대시보드
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-muted-foreground space-y-3 text-sm md:text-base">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">✓</span>
                      <span>혈액검사·생활습관·증상 기록을 한 화면에서 관리</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">✓</span>
                      <span>AI 기반 개인 맞춤형 암 방지 근거 리포트 제공</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">✓</span>
                      <span>전문가와의 상담 준비를 돕는 질문 리스트 정리</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">✓</span>
                      <span>커뮤니티를 통한 정보 공유와 정서적 지지</span>
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
                  <CardTitle className="text-2xl md:text-3xl">검증된 건강 보조제 큐레이션</CardTitle>
                  <CardDescription className="text-base">
                    암 경험자의 민감한 상황을 고려해, 과학적 근거와 안전성을 함께 보는 보충제 추천 서비스
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-muted-foreground space-y-3 text-sm md:text-base">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">✓</span>
                      <span>논문·가이드라인 기반 성분 검토 및 안전성 정보 제공</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">✓</span>
                      <span>실제 사용자 후기와 전문가 코멘트를 함께 제공</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">✓</span>
                      <span>개인 건강 프로필에 맞는 제품 우선 추천</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">✓</span>
                      <span>성분·용량·복용 타이밍까지 한눈에 비교</span>
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
                  <CardTitle className="text-2xl md:text-3xl">산림치유 프로그램</CardTitle>
                  <CardDescription className="text-base">
                    암 경험자의 몸과 마음을 위한, 자연·과학·심리를 아우르는 산림치유 솔루션
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-muted-foreground space-y-3 text-sm md:text-base">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">✓</span>
                      <span>검증된 산림치유 시설·프로그램 정보 제공</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">✓</span>
                      <span>산림치유지도사·통합의학 전문가와의 협력 프로그램</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">✓</span>
                      <span>HRV 등 데이터를 활용한 스트레스·회복 모니터링</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">✓</span>
                      <span>개인·가족·소규모 그룹별 맞춤형 프로그램 구성</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </Link>
          </BlurFade>
        </div>
      </section>

      {/* Representative Offer Section - 암 방지 근거 스타터 패키지 */}
      <section className="bg-primary/5 py-20">
        <div className="container mx-auto px-4">
          <BlurFade delay={0.2} duration={0.6} inView>
            <div className="mx-auto mb-10 max-w-3xl text-center">
              <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
                처음이라면, 이 패키지부터 시작해 보세요
              </h2>
              <p className="text-muted-foreground text-sm md:text-base">
                재발 걱정은 크지만, 어디서부터 정리해야 할지 막막하다면
                <br />
                &apos;암 방지 근거 스타터 패키지&apos;로 첫걸음을 도와드립니다.
              </p>
            </div>
          </BlurFade>

          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <BlurFade delay={0.3} duration={0.6} inView>
              <Card className="h-full">
                <CardHeader>
                  <Badge variant="secondary" className="mb-3 w-fit">
                    대표 오퍼
                  </Badge>
                  <CardTitle className="text-2xl md:text-3xl">암 방지 근거 스타터 패키지</CardTitle>
                  <CardDescription className="text-sm md:text-base">
                    암 경험자를 위한 핵심 보충제 + 생활습관 가이드 + 산림치유 체험 쿠폰을 한 번에 담은 입문 패키지
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="text-muted-foreground space-y-2 text-sm md:text-base">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>대표 보충제 1~2종 (예: 초고용량 커큐민 등)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>암 방지 관점에서 정리한 생활습관·식단·운동 체크리스트 소책자(PDF)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>산림치유/생활습관 프로그램 1회 체험 쿠폰</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>AI 기반 기본 건강 리포트(베타) 제공</span>
                    </li>
                  </ul>
                  <Separator className="my-4" />
                  <div className="space-y-1 text-sm md:text-base">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold tracking-tight">₩000,000</span>
                      <span className="text-muted-foreground text-xs">* 예시 금액, 추후 실제 가격으로 교체</span>
                    </div>
                    <p className="text-muted-foreground text-xs md:text-sm">
                      정기 구독·재구매 고객에게는 추가 혜택과 맞춤 상담을 제공합니다.
                    </p>
                  </div>

                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <Button
                      className="flex-1"
                      onClick={() => {
                        navigate("/products");
                      }}
                    >
                      스타터 패키지 자세히 보기
                    </Button>
                    <Button className="flex-1" variant="outline" asChild>
                      <Link to="/contact">전문가와 상의하고 시작하기</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </BlurFade>

            {/* Representative Offer Image (Miricanvas) */}
            <BlurFade delay={0.4} duration={0.6} inView>
              <div className="mx-auto max-w-md">
                {/* 
                  TODO: 미리캔버스로 '암 방지 근거 스타터 패키지' 상세 이미지 제작 후 교체
                  - 구성품 사진, 포함 서비스, 혜택을 한 장에 정리한 상세페이지형 이미지
                */}
                <img
                  src="/images/landing-starter-package.jpg"
                  alt="암 방지 근거 스타터 패키지 구성 이미지"
                  className="bg-background h-auto w-full rounded-xl border object-cover shadow-lg"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
                <p className="text-muted-foreground mt-3 text-center text-xs">
                  * 이미지는 예시입니다. 실제 구성·디자인은 추후 업데이트될 수 있습니다.
                </p>
              </div>
            </BlurFade>
          </div>
        </div>
      </section>

      {/* Feature Highlights Section */}
      <section className="container mx-auto px-4 py-20">
        <BlurFade delay={0.2} duration={0.6} inView>
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">Evidence Base만의 차별화된 기능</h2>
            <p className="text-muted-foreground mx-auto max-w-2xl">
              단순 정보 제공을 넘어, 암 경험자의 실제 삶에 스며드는 기능들을 제공합니다.
            </p>
          </div>
        </BlurFade>

        <div className="grid gap-8 md:grid-cols-2">
          {[
            {
              title: "AI 건강 분석",
              description:
                "혈액검사 결과와 건강 데이터를 AI가 분석하여, 암 방지 관점에서 꼭 짚어야 할 위험 신호와 관리 포인트를 요약해 드립니다.",
              icon: "🤖",
            },
            {
              title: "전문가 네트워크",
              description:
                "통합의학·기능의학 전문가와 산림치유지도사가 함께 개발한 콘텐츠로, 현장의 경험이 녹아 있습니다.",
              icon: "👨‍⚕️",
            },
            {
              title: "제품 리뷰 시스템",
              description:
                "실제 암 경험자들의 상세 후기와 전문가 코멘트를 함께 제공해, 보충제 선택의 불안을 줄여 드립니다.",
              icon: "⭐",
            },
            {
              title: "커뮤니티 활동",
              description:
                "비슷한 상황의 사람들과 경험·정보·감정을 나누며, 혼자라는 느낌을 줄이고 회복 여정을 함께 갑니다.",
              icon: "💬",
            },
            {
              title: "건강 추적",
              description:
                "수면·에너지·기분·통증 등 일상의 변화를 기록하고, 중장기적인 추세를 통해 개선 효과를 확인할 수 있습니다.",
              icon: "📈",
            },
            {
              title: "맞춤형 추천",
              description:
                "연령, 암 종류, 치료 단계, 생활환경에 따라 각기 다른 추천을 제공하여, 나에게 맞는 실천을 찾도록 돕습니다.",
              icon: "🎯",
            },
          ].map((feature, index) => (
            <BlurFade key={feature.title} delay={0.3 + index * 0.1} duration={0.6} inView>
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
              <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">실제 사용자 후기와 사례</h2>
              <p className="text-muted-foreground mx-auto max-w-2xl">
                네이버 쇼핑몰과 네이버 폼에서 수집한 실제 후기입니다. 체력, 수면, 불안, 회복 등 어떤 변화들이 있었는지
                확인해 보세요.
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
                    <h3 className="text-2xl font-semibold md:text-3xl">{group.description}</h3>
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
                  images={group.category === "제품 후기" ? testimonialGallery.product : testimonialGallery.program}
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
            <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">Evidence Base의 약속</h2>
            <p className="text-muted-foreground mx-auto max-w-2xl">
              암 경험자의 시간과 불안을 가볍게 여기지 않겠습니다. 근거와 투명성, 안전성을 기준으로 정보를 선별합니다.
            </p>
          </div>
        </BlurFade>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: "과학적 검증",
              description: "모든 정보는 peer-reviewed 연구, 가이드라인, 임상 자료를 바탕으로 합니다.",
            },
            {
              title: "전문가 검토",
              description: "의료진과 건강 전문가들이 직접 검토한 콘텐츠만 제공하며, 추측성 정보는 지양합니다.",
            },
            {
              title: "투명한 출처 공개",
              description: "가능한 한 정보 출처를 명시하고, 한계와 주의사항도 함께 안내합니다.",
            },
            {
              title: "지속적인 업데이트",
              description: "새로운 근거가 나오면 과거 내용을 그대로 두지 않고, 업데이트 사실을 투명하게 알립니다.",
            },
          ].map((item, index) => (
            <BlurFade key={item.title} delay={0.3 + index * 0.1} duration={0.6} inView>
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
                <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">이 서비스를 개발한 이유</h2>
                <p className="text-muted-foreground text-sm md:text-base">
                  “우리 가족에게 정말 도움이 되는 선택을 하고 있는 걸까?”
                  <br />암 경험자의 가족으로서 직접 겪은 질문에서 Evidence Base는 시작되었습니다.
                </p>
              </div>
            </BlurFade>

            <BlurFade delay={0.3} duration={0.6} inView>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-muted-foreground space-y-4 text-sm leading-relaxed md:text-base">
                    <p>
                      오늘날 건강 정보는 넘쳐나지만, 그중 많은 부분이 과학적 근거 없이 퍼지고 있습니다. 특히 암
                      경험자에게는 작은 선택도 심리적으로 매우 무겁게 다가옵니다.
                    </p>
                    <p>
                      Evidence Base는 암 경험자와 보호자가 보다 안전하고 합리적인 선택을 할 수 있도록 돕기 위해
                      탄생했습니다. 치료를 대체하는 것이 아니라, 치료 사이와 이후의 긴 시간을 어떻게 살아갈지에 초점을
                      맞춥니다.
                    </p>
                    <p>
                      우리는 모든 사용자가 신뢰할 수 있는, 검증된 정보에 접근할 수 있어야 한다고 믿습니다. 따라서 모든
                      정보와 추천은 과학적 검증 과정을 거치며, 전문가들의 검토를 받습니다. 동시에, 실제 현장에서 느끼는
                      고민과 감정도 함께 다루려 합니다.
                    </p>
                    <p>
                      Evidence Base는 단순한 정보 제공 플랫폼이 아니라, 암 경험자의 일상을 함께 걷는 회복 파트너가
                      되고자 합니다.
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
            <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">Evidence Base 팀 이야기</h2>
            <p className="text-muted-foreground mx-auto max-w-2xl">
              의료·데이터·소프트웨어·산림치유 전문가가 함께 만든, 작은 통합의학 팀입니다.
            </p>
          </div>
        </BlurFade>

        <div className="mx-auto max-w-4xl">
          <BlurFade delay={0.3} duration={0.6} inView>
            <Card>
              <CardContent className="pt-6">
                <div className="text-muted-foreground space-y-4 text-sm leading-relaxed md:text-base">
                  <p>
                    Evidence Base는 건강과 기술에 열정을 가진 사람들로 구성되어 있습니다. 의료진, 데이터 과학자,
                    소프트웨어 엔지니어, 산림치유 전문가 등 다양한 분야의 전문가들이 협력하여 플랫폼을 개발하고
                    있습니다.
                  </p>
                  <p>
                    우리 팀의 공통점은 &quot;암 경험자의 시간을 소중하게 생각한다&quot;는 점입니다. 똑같은 질문을 여러
                    번 반복하지 않도록, 이미 한 번 조사한 내용을 다음 사람은 더 쉽게 볼 수 있도록, 데이터와 콘텐츠를
                    구조화하고 있습니다.
                  </p>
                  <p>
                    Evidence Base는 완성된 것이 아니라, 사용자와 함께 계속 성장하는 서비스입니다. 더 나은 근거, 더
                    이해하기 쉬운 설명, 더 안전한 선택을 위해 끊임없이 업데이트해 나가겠습니다.
                  </p>
                </div>
              </CardContent>
            </Card>
          </BlurFade>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-muted/40 py-20">
        <div className="container mx-auto px-4">
          <BlurFade delay={0.2} duration={0.6} inView>
            <div className="mb-10 text-center">
              <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">자주 묻는 질문</h2>
              <p className="text-muted-foreground mx-auto max-w-2xl text-sm md:text-base">
                암 경험자와 보호자분들이 가장 많이 물어보시는 질문을 정리했습니다. 이 외의 궁금한 점은 언제든지 문의해
                주세요.
              </p>
            </div>
          </BlurFade>

          <div className="mx-auto max-w-3xl space-y-4">
            {faqItems.map((item, index) => (
              <BlurFade key={item.question} delay={0.25 + index * 0.05} duration={0.5} inView>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm md:text-base">Q. {item.question}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-xs leading-relaxed md:text-sm">{item.answer}</p>
                  </CardContent>
                </Card>
              </BlurFade>
            ))}
          </div>
        </div>
      </section>

      {/* Compliance Notice Section */}
      <section className="container mx-auto px-4 py-16">
        <BlurFade delay={0.2} duration={0.6} inView>
          <div className="mb-10 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">중요한 안내사항</h2>
            <p className="text-muted-foreground mx-auto max-w-3xl text-xs md:text-sm">
              Evidence Base는 통합의학적 관점에서 암 경험자를 포함한 사용자들이 건강한 생활 습관을 만들고, 신뢰 가능한
              정보를 바탕으로 주체적으로 건강 관리를 수행하도록 돕는 것을 목적으로 합니다. 아래 사항을 반드시 확인해
              주세요.
            </p>
          </div>
        </BlurFade>

        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: "의료행위가 아닙니다",
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
            <BlurFade key={notice.title} delay={0.3 + index * 0.1} duration={0.6} inView>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="text-lg">{notice.title}</CardTitle>
                  <CardDescription className="text-sm leading-relaxed">{notice.description}</CardDescription>
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
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
                이제, 근거 있는 선택으로 건강한 일상을 설계해 보세요
              </h2>
              <p className="text-muted-foreground mb-8 text-sm md:text-lg">
                지금 가입하시면 암 방지 관점에서 꼭 짚어야 할 생활습관·보충제· 산림치유 체크리스트와 함께,
                <br />
                Evidence Base의 핵심 기능을 무료로 체험해 보실 수 있습니다.
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
                  <Link to="/contact">전문가에게 먼저 상담받기</Link>
                </Button>
              </div>
              <p className="text-muted-foreground mt-4 text-xs">
                * 언제든지 탈퇴·데이터 삭제를 요청하실 수 있으며, 광고성 메일 발송은 최소화합니다.
              </p>
            </div>
          </BlurFade>
        </div>
      </section>
    </div>
  );
}
