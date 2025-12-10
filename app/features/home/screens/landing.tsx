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
      title: "Evidence Base - 암 경험자와 보호자를 위한 근거 기반 생활관리 정보 플랫폼",
    },
    {
      name: "description",
      content:
        "암 경험자와 보호자를 위해 논문·가이드라인·임상 자료를 이해하기 쉽게 정리하고, 건강기능식품·산림치유·생활습관 정보를 제공하는 통합형 생활관리 플랫폼입니다. 질병의 진단·치료·예방 목적이 아니며, 의료행위를 대체하지 않습니다.",
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

  const primaryCtaLabel = loaderData.isAuthenticated ? "홈으로 이동" : "무료가입 후, 암 이후 생활관리 가이드 받아보기";

  const secondaryCtaLabel = "암 이후, 생활관리 추천 패키지 살펴보기";

  const testimonialData: TestimonialItem[] = [
    {
      name: "김○○님",
      content:
        "AI 분석 기능을 통해 제 건강 데이터를 한눈에 볼 수 있어서, 주치의와 상담할 때 질문을 정리하는 데 큰 도움이 되었습니다.",
      rating: 5,
      source: "네이버 쇼핑몰",
      category: "제품 후기",
      detail: "구매 제품: MCS 초고용량 커큐민 (일반적인 건강관리 목적)",
      link: "https://smartstore.naver.com",
    },
    {
      name: "이○○님",
      content: "전문가가 정리해 준 자료 덕분에 어떤 보충제를 선택할지 스스로 판단하는 기준이 생겼습니다.",
      rating: 5,
      source: "네이버 쇼핑몰",
      category: "제품 후기",
      detail: "구매 제품: 통합 건강 보조제 패키지 (생활습관 관리 지원)",
    },
    {
      name: "박○○님",
      content: "산림치유 프로그램에서 몸을 움직이고, 자연 속에서 쉬는 시간만으로도 마음이 많이 가벼워졌습니다.",
      source: "네이버 폼",
      category: "산림치유 후기",
      detail: "참여 프로그램: 치유 워크숍 4주차 (스트레스 완화 · 일상 회복 지원)",
    },
    {
      name: "최○○님",
      content:
        "검증된 자료를 기반으로 정리된 정보라서, 인터넷 검색에 시간을 덜 쓰게 되고 생활관리에 집중할 수 있었어요.",
      rating: 5,
      source: "네이버 쇼핑몰",
      category: "제품 후기",
      detail: "구매 제품: 프리미엄 면역 케어 세트 (일반 면역·영양 관리용)",
    },
    {
      name: "정○○님",
      content: "건강 정보를 한 곳에서 관리하면서, 어떤 부분을 더 챙겨야 할지 감이 잡혔습니다.",
      rating: 5,
      source: "네이버 쇼핑몰",
      category: "제품 후기",
      detail: "구매 서비스: AI 생활관리 리포트 구독 (교육·참고용)",
    },
    {
      name: "강○○님",
      content: "산림치유와 생활습관 코칭을 함께 받으니, 저 자신을 돌보는 시간을 의도적으로 만들게 되었어요.",
      source: "네이버 폼",
      category: "산림치유 후기",
      detail: "참여 서비스: 생활습관 코칭 프로그램 (정신적·정서적 회복 지원)",
    },
  ];

  const testimonialBucketBaseUrl =
    import.meta.env.VITE_SUPABASE_TESTIMONIAL_BASE_URL ??
    "https://your-supabase-project.supabase.co/storage/v1/object/public/testimonial";

  const testimonialGallery: Record<"product" | "program", TestimonialGalleryItem[]> = {
    product: [
      {
        src: `${testimonialBucketBaseUrl}/product/product-review-01.png`,
        caption: "건강기능식품 구매 인증 캡처 (개인 경험은 사람마다 다를 수 있습니다)",
      },
      {
        src: `${testimonialBucketBaseUrl}/product/product-review-02.png`,
        caption: "생활관리 리포트에 대한 후기 (의료정보가 아닌 참고용 자료)",
      },
      {
        src: `${testimonialBucketBaseUrl}/product/product-review-03.png`,
        caption: "전문가가 정리한 정보에 대한 신뢰 후기",
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
        caption: "산림치유 프로그램 참여 인증 (정신적·정서적 회복 지원)",
      },
      {
        src: `${testimonialBucketBaseUrl}/program/forest-review-02.png`,
        caption: "프로그램 만족도 설문 캡처",
      },
      {
        src: `${testimonialBucketBaseUrl}/program/forest-review-03.png`,
        caption: "생활습관·정서 관리에 대한 긍정적 경험",
      },
    ],
  };

  const audienceData: TargetAudienceItem[] = [
    {
      title: "암 예방 관심자",
      description: "암 관련 연구·가이드라인을 바탕으로 건강한 생활습관을 만들고 싶은 분",
      usageExample: {
        title: "암 예방 관심자를 위한 서비스 이용 방법",
        steps: [
          "근거 기반 블로그를 통해 암과 생활습관에 대한 최신 연구 흐름을 확인하세요.",
          "AI 생활관리 분석 기능으로 현재 생활패턴과 건강상태를 점검해 보세요.",
          "일반적인 건강 관리에 도움을 줄 수 있는 건강기능식품 정보를 참고해 보세요.",
          "커뮤니티에서 다른 예방 관심자들과 경험과 고민을 나누어 보세요.",
          "정기적으로 건강 지표와 생활습관을 기록하며 변화를 추적해 보세요.",
        ],
      },
    },
    {
      title: "암 경험자",
      description: "치료 이후의 생활을 체계적으로 관리하고 싶은 암 경험자",
      usageExample: {
        title: "암 경험자를 위한 서비스 이용 방법",
        steps: [
          "혈액검사 결과 등을 정리해 업로드하고, 생활관리 관점에서 AI 분석 요약을 받아보세요.",
          "일반적인 건강 관리에 참고할 수 있는 보충제·영양 정보들을 비교해 보세요.",
          "산림치유 프로그램에 참여해 쉼·움직임·정서 회복의 시간을 가져보세요.",
          "커뮤니티에서 비슷한 경험을 가진 분들과 일상 관리 팁을 공유해 보세요.",
          "대시보드를 통해 수면·에너지·기분 등의 변화를 기록하고 돌아보세요.",
        ],
      },
    },
    {
      title: "암 경험자 보호자",
      description: "암 경험자의 일상 관리를 더 잘 돕고 싶은 보호자",
      usageExample: {
        title: "암 경험자 보호자를 위한 서비스 이용 방법",
        steps: [
          "플랫폼의 통합의학·생활관리 정보를 통해 전반적인 개념을 이해해 보세요.",
          "전문가 네트워크가 정리한 자료를 참고해, 주치의에게 물어볼 질문을 정리해 보세요.",
          "일반적인 건강관리용 건강기능식품 정보와 주의사항을 함께 확인하세요.",
          "산림치유 프로그램 예약·일정을 함께 관리하며 동행의 시간을 만들어 보세요.",
          "함께 건강 데이터를 기록하며, 지나친 불안보다는 균형 잡힌 생활을 목표로 해 보세요.",
        ],
      },
    },
    {
      title: "자발적 학습자",
      description: "연구·근거를 기반으로 건강 관리를 공부하고 싶은 분",
      usageExample: {
        title: "자발적 학습자를 위한 서비스 이용 방법",
        steps: [
          "근거 기반 블로그를 통해 논문 내용을 더 이해하기 쉽게 요약한 글을 읽어 보세요.",
          "커뮤니티 토론에 참여해 다양한 관점과 실제 경험을 들어보세요.",
          "AI 챗봇을 통해 궁금한 개념·용어를 질문하고, 이해를 넓혀 보세요.",
          "제품·프로그램 소개 페이지에서 참고 문헌·출처를 같이 확인해 보세요.",
          "직접 실천해 본 생활습관 변화를 기록하고, 어떤 점이 나에게 맞았는지 돌아보세요.",
        ],
      },
    },
  ];

  const problemItems = [
    {
      title: "정보가 너무 많아 혼란스러운 분",
      description: "유튜브·카페·SNS마다 말이 달라서, 무엇을 기준으로 삼아야 할지 막막하신가요?",
      detail:
        "Evidence Base는 논문·가이드라인·임상 자료를 바탕으로, 암과 관련된 생활습관·영양·정신건강 정보를 ‘참고용’으로 정리해 드립니다.",
    },
    {
      title: "암 이후 생활관리가 막막한 암 경험자",
      description: "치료는 끝났지만, 일상에서 무엇을 우선순위로 관리해야 할지 고민되시나요?",
      detail: "치료가 아닌 ‘생활관리’ 관점에서, 질문거리와 체크포인트를 정리할 수 있도록 도와드립니다.",
    },
    {
      title: "보호자로서 어떻게 도울지 고민되는 분",
      description: "도와주고 싶은 마음은 크지만, 어디까지 관여해야 할지 어렵게 느껴지시나요?",
      detail: "보호자를 위한 가이드와 프로그램 소개를 통해, 존중을 기반으로 한 동행 방식을 함께 고민합니다.",
    },
  ];

  const faqItems = [
    {
      question: "현재 항암·표적치료·호르몬치료 중인데, 건강기능식품을 함께 써도 되나요?",
      answer:
        "Evidence Base는 통합의학·기능의학 영역에서 논의되는 연구·자료를 정리해 드리지만, 개별 제품의 병용 여부나 용량 조정은 반드시 담당 의료진과 상의 후 결정하셔야 합니다. 플랫폼의 정보는 상담 전 질문을 정리하는 ‘참고용 자료’이며, 치료 변경·중단의 근거로 사용될 수 없습니다.",
    },
    {
      question: "Evidence Base에서 의사 처방이나 진단을 대신해 주나요?",
      answer:
        "아니요. 본 서비스는 질병의 진단·치료·예방을 위한 의료행위가 아니며, 어떠한 처방도 대신하지 않습니다. 사용자가 스스로 정보를 이해하고, 의료진과의 상담에 참고할 수 있도록 돕는 ‘생활관리·교육’ 플랫폼입니다.",
    },
    {
      question: "‘암 방지 근거’는 어떤 의미로 쓰이나요?",
      answer:
        "여기에서 사용하는 ‘암 방지 근거’란, 암과 관련된 생활습관·영양·운동·정신건강 등의 영역에서 연구·가이드라인·임상 자료에서 논의되는 내용을 ‘정보·교육’ 관점에서 정리한 것을 의미합니다. 개별 사용자에게 실제로 암 예방 또는 재발률 감소 효과를 보장한다는 의미가 아니며, 모든 내용은 의료진 상담과 함께 해석되어야 합니다.",
    },
    {
      question: "산림치유 프로그램은 치료 효과가 있나요?",
      answer:
        "산림치유 프로그램은 자연 환경을 활용해 스트레스 완화, 휴식, 정서적 회복을 돕기 위한 ‘생활습관·웰빙 프로그램’입니다. 의학적 치료 효과를 보장하지 않으며, 질병의 진단·치료·예방을 위한 것이 아닙니다. 특정 질환이나 증상이 있는 경우, 참가 전 반드시 담당 의료진과 상담을 권장드립니다.",
    },
    {
      question: "내 건강 데이터와 개인정보는 어떻게 보호되나요?",
      answer:
        "플랫폼은 국내·국제 보안 기준을 참고하여 데이터를 안전하게 저장하고, 필요한 최소한의 정보만 수집하려고 노력합니다. 민감한 정보는 동의하신 범위 내에서만 활용되며, 언제든지 수정·삭제를 요청하실 수 있습니다. 자세한 내용은 개인정보처리방침을 참고해 주세요.",
    },
  ];

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative flex min-h-[640px] w-full flex-col items-center justify-center gap-6 overflow-hidden px-4 py-20">
        <div className="container mx-auto">
          <BlurFade delay={0.1} duration={0.6} inView>
            <div className="mb-4 flex justify-center">
              <Badge variant="secondary" className="text-xs font-semibold">
                암 경험자와 보호자를 위한 근거 기반 생활관리 플랫폼
              </Badge>
            </div>
            <div className="mb-8 text-center">
              <h1 className="mb-6 text-4xl leading-tight font-extrabold tracking-tight md:text-6xl lg:text-7xl">
                암 이후의 삶을 위한
                <br />
                <span className="from-primary to-primary/70 bg-gradient-to-r bg-clip-text text-transparent">
                  증거 기반 생활습관
                </span>
              </h1>
              <p className="text-muted-foreground mx-auto mb-6 max-w-2xl text-lg md:text-xl">
                인터넷 정보에 휘둘리지 않고,
                <br />
                논문·가이드라인·임상 경험을 바탕으로 정리된 자료를 통해
                <br />
                나와 가족의 일상을 더 건강하게 관리할 수 있도록 돕습니다.
              </p>
              <p className="text-muted-foreground mx-auto mb-8 max-w-2xl text-sm md:text-base">
                ⚠️Evidence Base는 암 치료를 대신하지 않습니다. 다만, 암 이후의 긴 시간을 어떻게 살 것인지에 대해
                생활습관·영양·정신건강·치유 프로그램 정보를 한 곳에 모아 드립니다.
              </p>
            </div>

            {/* Hero Image */}
            <BlurFade delay={0.2} duration={0.6} inView>
              <div className="mb-10 flex justify-center">
                <div className="border-primary/20 relative w-full max-w-5xl overflow-hidden rounded-2xl border-2 shadow-2xl">
                  <img
                    src="/images/landing/landing hero1.png"
                    alt="암 이후 생활관리를 돕는 근거 기반 플랫폼 히어로 이미지"
                    className="h-auto w-full object-cover"
                    loading="eager"
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.src = "/images/landing/landing hero2.png";
                      target.onerror = () => {
                        target.src = "/images/landing/landing hero3.png";
                        target.onerror = () => {
                          target.style.display = "none";
                        };
                      };
                    }}
                  />
                  <div className="from-background/20 absolute inset-0 bg-gradient-to-t via-transparent to-transparent" />
                </div>
              </div>
            </BlurFade>

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
              * 제공되는 모든 정보·제품·프로그램은 질병의 진단·치료·예방을 위한 것이 아니며, 의료행위를 대체하지
              않습니다.
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
                암과 함께, 그리고 암 이후의 시간을 살아가는 분들이 가장 자주 나누는 고민들을 정리했습니다.
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

      {/* Main Service Benefits */}
      <section className="container mx-auto px-4 py-20">
        <BlurFade delay={0.2} duration={0.6} inView>
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">Evidence Base를 통해 얻을 수 있는 것</h2>
            <p className="text-muted-foreground mx-auto max-w-2xl">
              암 관련 연구·근거를 바탕으로, 생활 속에서 실천할 수 있는 방향성을 찾도록 돕습니다.
            </p>
          </div>
        </BlurFade>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <BlurFade delay={0.3} duration={0.6} inView>
            <Card className="neon-card cursor-pointer">
              <CardHeader>
                <div className="mb-2 text-3xl">🔬</div>
                <CardTitle>근거 기반 정리</CardTitle>
                <CardDescription>
                  논문·가이드라인·임상 자료를 기반으로, 암 이후 생활과 관련된 정보를 이해하기 쉽게 정리합니다.
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
                  통합의학·기능의학·산림치유 전문가가 참고할 만한 자료와 관점을 함께 제공합니다.
                </CardDescription>
              </CardHeader>
            </Card>
          </BlurFade>

          <BlurFade delay={0.5} duration={0.6} inView>
            <Card className="neon-card cursor-pointer">
              <CardHeader>
                <div className="mb-2 text-3xl">📊</div>
                <CardTitle>생활관리 관점 분석</CardTitle>
                <CardDescription>
                  건강 데이터와 생활습관 정보를 바탕으로, 어떤 부분을 더 살펴볼지 ‘체크포인트’를 제안합니다.
                </CardDescription>
              </CardHeader>
            </Card>
          </BlurFade>

          <BlurFade delay={0.6} duration={0.6} inView>
            <Card className="neon-card cursor-pointer">
              <CardHeader>
                <div className="mb-2 text-3xl">🌲</div>
                <CardTitle>산림치유 정보</CardTitle>
                <CardDescription>
                  자연 속에서 쉬고, 움직이고, 호흡을 정리하는 산림치유 프로그램 정보를 제공합니다. (치료 목적 아님)
                </CardDescription>
              </CardHeader>
            </Card>
          </BlurFade>

          <BlurFade delay={0.7} duration={0.6} inView>
            <Card className="neon-card cursor-pointer">
              <CardHeader>
                <div className="mb-2 text-3xl">💊</div>
                <CardTitle>일반 건강관리용 보조제 정보</CardTitle>
                <CardDescription>
                  일반적인 건강관리·영양보충에 사용할 수 있는 건강기능식품에 대한 정보를 제공합니다. (암 치료·예방 목적
                  아님)
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
                  새로운 연구·자료가 나오면 요약·정리하여, 최신 흐름을 따라갈 수 있도록 돕습니다.
                </CardDescription>
              </CardHeader>
            </Card>
          </BlurFade>
        </div>
      </section>

      {/* Usage Guide */}
      <section className="bg-muted/50 py-20">
        <div className="container mx-auto px-4">
          <BlurFade delay={0.2} duration={0.6} inView>
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
                Evidence Base, 이렇게 활용해 보세요
              </h2>
              <p className="text-muted-foreground mx-auto max-w-2xl">
                복잡한 결정을 대신 내려주지는 않지만, 스스로 더 나은 질문을 던지고 선택을 정리하는 데 도움이 됩니다.
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
                <p className="text-muted-foreground text-sm">
                  간단한 정보 입력으로 무료 회원가입 후, 나에게 맞는 콘텐츠를 받아보세요.
                </p>
              </div>
            </BlurFade>

            <BlurFade delay={0.4} duration={0.6} inView>
              <div className="text-center">
                <div className="bg-primary text-primary-foreground mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold">
                  2
                </div>
                <h3 className="mb-2 text-xl font-semibold">건강·생활 프로필 등록</h3>
                <p className="text-muted-foreground text-sm">
                  암 경험 여부, 치료 이력, 생활습관 등을 정리해 두면, 정보·콘텐츠를 보는 기준이 생깁니다.
                </p>
              </div>
            </BlurFade>

            <BlurFade delay={0.5} duration={0.6} inView>
              <div className="text-center">
                <div className="bg-primary text-primary-foreground mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold">
                  3
                </div>
                <h3 className="mb-2 text-xl font-semibold">근거 기반 콘텐츠 탐색</h3>
                <p className="text-muted-foreground text-sm">
                  블로그·리포트·제품·프로그램 페이지에서, 연구·근거와 함께 정리된 정보를 확인해 보세요.
                </p>
              </div>
            </BlurFade>

            <BlurFade delay={0.6} duration={0.6} inView>
              <div className="text-center">
                <div className="bg-primary text-primary-foreground mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold">
                  4
                </div>
                <h3 className="mb-2 text-xl font-semibold">실천 & 상담 준비</h3>
                <p className="text-muted-foreground text-sm">
                  실천 가능한 부분부터 하나씩 적용해 보고, 의료진 상담 시 질문·우려사항을 정리하는 데 참고해 보세요.
                </p>
              </div>
            </BlurFade>
          </div>
        </div>
      </section>

      {/* Target Audience */}
      <section className="container mx-auto px-4 py-20">
        <BlurFade delay={0.2} duration={0.6} inView>
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">이런 분들께 특히 도움이 됩니다</h2>
            <p className="text-muted-foreground mx-auto max-w-2xl">
              암 예방 관심자, 암 경험자, 보호자, 자발적 학습자까지 — 각자에게 맞는 활용 예시를 준비했습니다.
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

      {/* Service Overview + Miricanvas infographic 자리 */}
      <section className="bg-muted/50 py-20">
        <div className="container mx-auto px-4">
          <BlurFade delay={0.2} duration={0.6} inView>
            <div className="mb-10 text-center">
              <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">암 이후 생활관리를 위한 세 가지 축</h2>
              <p className="text-muted-foreground mx-auto max-w-2xl">
                정보 플랫폼 · 건강기능식품 · 산림치유 프로그램을 하나의 여정으로 조합할 수 있도록 정리했습니다.
              </p>
            </div>
          </BlurFade>

          {/* Miricanvas 3축 인포그래픽 자리 */}
          <BlurFade delay={0.25} duration={0.6} inView>
            <div className="mx-auto mb-10 max-w-3xl">
              <img
                src="/images/landing-solutions-infographic.jpg"
                alt="정보 플랫폼 · 건강기능식품 · 산림치유 3축 인포그래픽"
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
                  <CardTitle className="text-2xl md:text-3xl">통합 생활관리 정보 플랫폼</CardTitle>
                  <CardDescription className="text-base">
                    건강 데이터와 생활습관을 정리하고, 암 관련 근거를 함께 살펴볼 수 있는 개인 대시보드
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-muted-foreground space-y-3 text-sm md:text-base">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">✓</span>
                      <span>혈액검사·생활습관·증상 기록을 한 화면에서 정리</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">✓</span>
                      <span>생활관리 관점에서 주목할 수 있는 지표들을 요약·시각화 (의료해석이 아닌 참고용)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">✓</span>
                      <span>의료진 상담 전 질문 리스트 정리에 활용 가능</span>
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
                  <CardTitle className="text-2xl md:text-3xl">일반적인 건강관리용 건강기능식품 큐레이션</CardTitle>
                  <CardDescription className="text-base">
                    암 치료가 아닌, 일상적인 건강관리·영양보충 관점에서 참고할 수 있는 건강기능식품 정보를 제공합니다.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-muted-foreground space-y-3 text-sm md:text-base">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">✓</span>
                      <span>연구·자료를 참고해 성분·용량·주의사항 등을 정리 (효과 보장 아님)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">✓</span>
                      <span>실제 사용자 후기와 전문가 코멘트를 함께 제공 (개인 경험은 사람마다 다름)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">✓</span>
                      <span>나의 건강 상태와 생활습관을 고려해 어떤 제품을 우선적으로 검토할지 참고 가능</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">✓</span>
                      <span>암 치료·재발 예방 효과를 주장하지 않으며, 의료진 상담과 함께 검토하는 것을 권장</span>
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
                  <CardTitle className="text-2xl md:text-3xl">산림치유 프로그램 안내</CardTitle>
                  <CardDescription className="text-base">
                    자연 속에서 걷고, 호흡하고, 머무는 시간을 통해 스트레스와 긴장을 완화하는 데 도움을 줄 수 있는
                    프로그램입니다.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-muted-foreground space-y-3 text-sm md:text-base">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">✓</span>
                      <span>검증된 산림치유 시설·프로그램 정보를 한눈에 보기</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">✓</span>
                      <span>산림치유지도사와 함께하는 활동으로, 휴식·움직임·정서 회복의 시간을 마련</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">✓</span>
                      <span>HRV 등 데이터를 활용해 스트레스 수준 변화를 ‘참고용으로’ 살펴볼 수 있습니다.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">✓</span>
                      <span>질병 치료 프로그램이 아니며, 참가 전 의료진 상담을 권장드립니다.</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </Link>
          </BlurFade>
        </div>
      </section>

      {/* Representative Offer Section */}
      <section className="bg-primary/5 py-20">
        <div className="container mx-auto px-4">
          <BlurFade delay={0.2} duration={0.6} inView>
            <div className="mx-auto mb-10 max-w-3xl text-center">
              <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
                처음이라면, 이렇게 가볍게 시작해 보세요
              </h2>
              <p className="text-muted-foreground text-sm md:text-base">
                암 이후 생활관리를 어떻게 시작해야 할지 막막하다면, 정보를 정리하고 일상을 돌아보는 데 초점을 맞춘
                &apos;암 이후 생활관리 스타터 패키지&apos;로 첫걸음을 도와드립니다.
              </p>
            </div>
          </BlurFade>

          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <BlurFade delay={0.3} duration={0.6} inView>
              <Card className="h-full">
                <CardHeader>
                  <Badge variant="secondary" className="mb-3 w-fit">
                    대표 오퍼 (예정)
                  </Badge>
                  <CardTitle className="text-2xl md:text-3xl">암 이후 생활관리 스타터 패키지</CardTitle>
                  <CardDescription className="text-sm md:text-base">
                    암 치료를 대체하는 패키지가 아니라, 암 이후의 긴 시간을 살아가는 데 도움이 되는
                    정보·건강기능식품·산림치유 체험을 함께 담은 구성입니다.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="text-muted-foreground space-y-2 text-sm md:text-base">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>일반적인 건강관리·영양보충 목적의 대표 건강기능식품 1~2종</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>암 이후 생활에서 자주 논의되는 생활습관·식단·운동 체크리스트 소책자(PDF)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>산림치유 또는 생활습관 프로그램 1회 체험 쿠폰 (스트레스 완화·쉼 중심)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>나의 생활패턴을 돌아볼 수 있는 기본 생활관리 리포트 (교육·참고용)</span>
                    </li>
                  </ul>
                  <Separator className="my-4" />
                  <div className="space-y-1 text-sm md:text-base">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold tracking-tight">₩000,000</span>
                      <span className="text-muted-foreground text-xs">
                        * 예시 금액입니다. 실제 구성과 가격은 추후 안내됩니다.
                      </span>
                    </div>
                    <p className="text-muted-foreground text-xs md:text-sm">
                      해당 패키지는 암의 진단·치료·재발 예방을 위한 프로그램이 아니며, 모든 선택은 반드시 담당 의료진과
                      상의 후 결정하시길 권장합니다.
                    </p>
                  </div>

                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <Button
                      className="flex-1"
                      onClick={() => {
                        navigate("/products");
                      }}
                    >
                      스타터 패키지 기획 의도 살펴보기
                    </Button>
                    <Button className="flex-1" variant="outline" asChild>
                      <Link to="/contact">나에게 맞는 구성인지 상담으로 먼저 확인하기</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </BlurFade>

            {/* Miricanvas 패키지 이미지 자리 */}
            <BlurFade delay={0.4} duration={0.6} inView>
              <div className="mx-auto max-w-md">
                <img
                  src="/images/landing-starter-package.jpg"
                  alt="암 이후 생활관리 스타터 패키지 구성 이미지 (예시)"
                  className="bg-background h-auto w-full rounded-xl border object-cover shadow-lg"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
                <p className="text-muted-foreground mt-3 text-center text-xs">
                  * 이미지는 이해를 돕기 위한 예시이며, 실제 구성·디자인과 다를 수 있습니다.
                </p>
              </div>
            </BlurFade>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="container mx-auto px-4 py-20">
        <BlurFade delay={0.2} duration={0.6} inView>
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">Evidence Base만의 기능</h2>
            <p className="text-muted-foreground mx-auto max-w-2xl">
              “치료”가 아니라 “생활관리·교육·정리”에 초점을 둔 기능들입니다.
            </p>
          </div>
        </BlurFade>

        <div className="grid gap-8 md:grid-cols-2">
          {[
            {
              title: "생활관리 관점 AI 분석",
              description:
                "혈액검사 결과와 건강 데이터를 기반으로, 생활습관 관리에서 참고할 수 있는 포인트를 요약합니다. 의료진의 진단·판단을 대신하지 않습니다.",
              icon: "🤖",
            },
            {
              title: "전문가 네트워크 관점",
              description:
                "통합의학·기능의학·산림치유 전문가들의 관점을 모아, 사용자가 스스로 공부하고 질문을 정리할 수 있도록 돕습니다.",
              icon: "👨‍⚕️",
            },
            {
              title: "제품·프로그램 리뷰 시스템",
              description:
                "실제 사용자 후기와 전문가 코멘트를 함께 제공해, 어떤 기준으로 선택할지 참고할 수 있도록 돕습니다. 개인 경험은 사람마다 다를 수 있습니다.",
              icon: "⭐",
            },
            {
              title: "커뮤니티 활동",
              description:
                "비슷한 경험을 가진 사람들과 일상·정보·감정을 나누며, 혼자가 아니라는 감각을 회복할 수 있습니다.",
              icon: "💬",
            },
            {
              title: "건강·생활지표 추적",
              description: "수면·에너지·기분·통증 등 일상의 변화를 기록하며, 내 삶의 패턴을 이해하는 데 도움을 줍니다.",
              icon: "📈",
            },
            {
              title: "맞춤형 정보 추천",
              description:
                "연령, 암 종류, 치료 단계, 생활환경 등을 고려해, 우선적으로 참고해 볼 만한 정보를 정리해 보여줍니다.",
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

      {/* Testimonials */}
      <section className="bg-muted/50 py-20">
        <div className="container mx-auto px-4">
          <BlurFade delay={0.2} duration={0.6} inView>
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">실제 사용자 후기와 경험</h2>
              <p className="text-muted-foreground mx-auto max-w-2xl">
                아래 후기는 개인의 경험으로, 모든 분께 동일한 경험이 보장되는 것은 아닙니다. 다만 어떤 방식으로 플랫폼을
                활용하고 계신지 참고해 보세요.
              </p>
            </div>
          </BlurFade>

          {[
            {
              title: "제품·서비스 활용 후기",
              description: "네이버 쇼핑몰에서 수집한, 일반적인 건강관리·생활관리 지원 관점의 후기입니다.",
              category: "제품 후기" as const,
            },
            {
              title: "산림치유·프로그램 후기",
              description: "네이버 폼을 통해 수집한, 산림치유·생활습관 프로그램 체험 후기입니다.",
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

      {/* Quality Assurance */}
      <section className="container mx-auto px-4 py-20">
        <BlurFade delay={0.2} duration={0.6} inView>
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">Evidence Base의 원칙</h2>
            <p className="text-muted-foreground mx-auto max-w-2xl">
              암 경험자의 시간을 가볍게 여기지 않기 위해 근거·투명성·안전성 세 가지 원칙을 지키려 합니다.
            </p>
          </div>
        </BlurFade>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: "근거 중심",
              description: "가능한 경우 peer-reviewed 연구·가이드라인·임상 자료를 참고하여 정보를 정리합니다.",
            },
            {
              title: "전문가 관여",
              description: "관련 분야 전문가의 검토를 통해, 과도한 주장이나 과장된 표현을 지양합니다.",
            },
            {
              title: "투명한 한계 공유",
              description:
                "자료의 한계와 불확실성을 함께 전달하며, 개별 상황에 따라 해석이 달라질 수 있음을 명시합니다.",
            },
            {
              title: "의료행위 대체 금지",
              description:
                "Evidence Base의 모든 정보·제품·프로그램은 의료행위를 대체하지 않으며, 치료 변경·중단·지연의 근거로 사용되어서는 안 됩니다.",
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

      {/* Founder Story Section */}
      <section id="founder-story" className="bg-muted/50 py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-5xl space-y-10">
            {/* 헤더 영역 */}
            <BlurFade delay={0.1} duration={0.6} inView>
              <div className="mb-4 flex flex-col items-center gap-3 text-center">
                <span className="border-primary/20 bg-primary/10 text-primary inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium tracking-wide uppercase">
                  창업자의 이야기
                </span>
                <h2 className="text-3xl font-bold tracking-tight text-balance md:text-4xl">
                  왜 이 서비스를 만들게 되었나요?
                </h2>
                <p className="text-muted-foreground mt-3 max-w-2xl text-sm md:text-base">
                  아내가 자궁경부암에서 폐전이가 되어 4기 암 환자가 된 후,
                  <br />
                  "어떻게 해야 아내의 건강관리에 정말 도움이 되는 선택을 할 수 있을까?" 라는 질문에서 Evidence Base는
                  시작되었습니다.
                </p>
                <div className="-mt-1 flex justify-center">
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href="https://blog.naver.com/ymgilman/221562095197?trackingCode=blog_bloghome_searchlist"
                      target="_blank"
                      rel="noreferrer"
                    >
                      블로그에서 시작 이야기 읽기
                    </a>
                  </Button>
                </div>
              </div>
            </BlurFade>

            {/* 본문 + 타임라인 2단 구성 */}
            <BlurFade delay={0.2} duration={0.6} inView>
              <div className="grid gap-8 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
                {/* 왼쪽: 감정/스토리 카드 */}
                <Card className="border-primary/10 bg-background/80 shadow-lg backdrop-blur-sm">
                  <CardContent className="pt-8">
                    <div className="text-muted-foreground space-y-6 text-sm leading-relaxed md:text-base">
                      {/* 인용 박스 – 감정 포인트 강조 */}
                      <div className="border-primary/20 bg-primary/5 relative rounded-xl border p-5">
                        <p className="text-foreground text-center text-sm font-bold md:text-base">
                          '더 건강하게 살수 있도록 돕자'라는 비전을 위해 만들어진 플랫폼입니다.
                        </p>
                      </div>
                      <br />

                      <p>
                        건강 정보는 넘쳐나지만, 암과 관련된 내용은 특히 어렵고 무겁게 느껴집니다. 치료 중이거나 치료를
                        마친 사람에게는 작은 선택도 심리적으로 크게 다가옵니다. 저희도 정보의 홍수 속에 선택 마비가 올
                        정도로 힘들었지만, 어려움을 잘 극복해서 감사하게도 지금 건강한 일상을 살고 있습니다.
                      </p>
                      <p>
                        다양한 방법 중 특히 통합의학적(Integrative Medicine) 정보, 산림치유, 자조모임 환우 커뮤니티가 큰
                        도움이 되었다고 생각합니다. 많은 암 경험자가 최선의 선택을 위한 높은 정보 등급의 큐레이션 된
                        건강 정보, 전문가의 도움을 받는 통합의학적 지식의 실행, 의지할 수 있는 자조모임 커뮤니티를
                        원하지만, 신뢰할 만한 곳은 찾기 힘듭니다.
                      </p>
                      <p>
                        Evidence Base는 “정답”을 주는 플랫폼이 아닙니다. 대신, 검증된 자료, AI 데이터 분석 기술, 직접
                        경험한 치유 방법을 기반으로 &quot;어떤 질문을 던져야 할지&quot;를 함께 정리하는 동반자가 되고자
                        합니다. 표준 치료 이후, 아내가 건강한 삶을 살 수 있도록 돕기 위해 해외의 유명 통합의학 서적들을
                        번역 및 출판, 국내 건강 강의 및 산림치유 활동, 건강에 도움을 주는 보조제의 제조 및 유통 등과
                        같은 일을 하며 “어떻게 암 이후, 건강한 삶을 살 수 있을까?”라는 질문을 해가며 끊임없이 배우고
                        적용해 보았습니다.
                      </p>
                      <p>
                        우리는 사용자가 자신의 몸과 삶에 대해 주체적인 결정을 내릴 수 있도록, 정보·경험·전문가 관점을
                        연결해 주는 역할을 합니다. 단, 최종적인 의료적 판단은 언제나 담당 의료진의 몫임을 분명히 합니다.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* 오른쪽: 연대기/팩트 카드 (따뜻한 색 포인트) */}
                <Card className="border-amber-100 bg-amber-50/90 shadow-md dark:border-amber-900/40 dark:bg-amber-950/20">
                  <CardContent className="pt-6">
                    <div className="space-y-5 text-sm text-amber-950 md:text-base dark:text-amber-50/90">
                      <h3 className="text-foreground text-center text-base font-semibold">
                        한 가족의 기록에서 시작된 여정
                      </h3>
                      <div className="space-y-4">
                        {/* 타임라인 아이템 1 */}
                        <Card className="neon-card cursor-pointer">
                          <CardContent className="pt-4">
                            <div className="flex gap-3">
                              <div className="from-primary mt-1 h-10 w-1 rounded-full bg-gradient-to-b to-emerald-400" />
                              <div>
                                <p className="text-primary text-xs font-semibold tracking-wide uppercase">2019년</p>
                                <p className="text-foreground font-medium">네이버 블로그에 기록을 남기다</p>
                                <p className="mt-1 text-xs md:text-sm">
                                  아내의 재발과 전이를 겪으며, 해외 논문과 통합의학 자료를 번역·정리해 블로그에 공유하기
                                  시작했습니다.
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* 타임라인 아이템 2 */}
                        <Card className="neon-card cursor-pointer">
                          <CardContent className="pt-4">
                            <div className="flex gap-3">
                              <div className="to-primary/60 mt-1 h-10 w-1 rounded-full bg-gradient-to-b from-emerald-400" />
                              <div>
                                <p className="text-xs font-semibold tracking-wide text-emerald-700 uppercase dark:text-emerald-300">
                                  2019–2024년
                                </p>
                                <p className="text-foreground font-medium">숲, 강의, 보조제를 통해 배운 것들</p>
                                <p className="mt-1 text-xs md:text-sm">
                                  산림치유 활동, 환우 자조모임, 건강 강의, 보조제 유통을 통해 실제 암 경험자와
                                  보호자에게 도움이 되었던 것들을 꾸준히 쌓아 왔습니다.
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* 타임라인 아이템 3 */}
                        <Card className="neon-card cursor-pointer">
                          <CardContent className="pt-4">
                            <div className="flex gap-3">
                              <div className="from-primary/70 mt-1 h-10 w-1 rounded-full bg-gradient-to-b to-amber-400" />
                              <div>
                                <p className="text-xs font-semibold tracking-wide text-amber-700 uppercase dark:text-amber-300">
                                  지금
                                </p>
                                <p className="text-foreground font-medium">Evidence Base 플랫폼으로 확장</p>
                                <p className="mt-1 text-xs md:text-sm">
                                  이제는 저희 가족만을 위한 정리가 아니라, 비슷한 길을 걷는 암 경험자·보호자들이
                                  &quot;근거 있는 질문&quot;을 준비하고, 조금 덜 외롭도록 돕는 플랫폼으로 확장하고자
                                  합니다.
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* 마무리 메시지 박스 */}
                      <div className="mt-4 rounded-lg border border-white/60 bg-white/70 p-3 text-xs shadow-sm backdrop-blur-sm md:text-sm dark:border-amber-800/60 dark:bg-amber-950/50">
                        <p className="text-foreground font-medium">
                          이 서비스는 &quot;사업 아이템&quot;이 아니라, 한 가족의 투병과 회복에서 시작된 고민의
                          연장선입니다.
                        </p>
                        <p className="mt-1">그래서 더 조심스럽게, 더 근거 있게, 더 진심으로 만들고 있습니다.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </BlurFade>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-20">
        <BlurFade delay={0.2} duration={0.6} inView>
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">Evidence Base 팀 이야기</h2>
            <p className="text-muted-foreground mx-auto max-w-2xl">
              의료·데이터·소프트웨어·산림치유 전문가가 함께, &quot;암 이후의 삶&quot;에 집중하는 작은 통합의학 팀입니다.
            </p>
          </div>
        </BlurFade>

        <div className="mx-auto max-w-4xl">
          <BlurFade delay={0.3} duration={0.6} inView>
            <Card>
              <CardContent className="pt-6">
                <div className="text-muted-foreground space-y-4 text-sm leading-relaxed md:text-base">
                  <p>
                    우리 팀의 공통점은 &quot;암 경험자의 시간을 가볍게 여기지 않는다&quot;는 점입니다. 이미 한 번 힘들게
                    찾아본 내용과 질문들을, 다음 사람은 조금이나마 더 쉽게 찾을 수 있도록 구조화하고 있습니다.
                  </p>
                  <p>
                    Evidence Base는 완성된 답안지가 아니라, 사용자와 함께 채워 나가는 노트에 가깝습니다. 더 나은 근거,
                    더 이해하기 쉬운 설명, 더 안전한 선택을 위해 꾸준히 업데이트해 나가겠습니다.
                  </p>
                </div>
              </CardContent>
            </Card>
          </BlurFade>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-muted/40 py-20">
        <div className="container mx-auto px-4">
          <BlurFade delay={0.2} duration={0.6} inView>
            <div className="mb-10 text-center">
              <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">자주 묻는 질문</h2>
              <p className="text-muted-foreground mx-auto max-w-2xl text-sm md:text-base">
                의료법·건강기능식품 관련 규정을 준수하기 위해, 서비스의 역할과 한계를 분명하게 안내드립니다.
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

      {/* Compliance Notice */}
      <section className="container mx-auto px-4 py-16">
        <BlurFade delay={0.2} duration={0.6} inView>
          <div className="mb-10 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">중요한 안내사항</h2>
            <p className="text-muted-foreground mx-auto max-w-3xl text-xs md:text-sm">
              Evidence Base는 통합의학적 관점에서 암 경험자를 포함한 사용자들이 건강한 생활 습관을 만들고, 신뢰 가능한
              정보를 바탕으로 스스로 질문을 정리하고 선택할 수 있도록 돕는 것을 목적으로 합니다.
            </p>
          </div>
        </BlurFade>

        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: "진단·치료·예방 목적이 아님",
              description:
                "제공되는 건강기능식품, 강의, 산림치유 프로그램은 질병의 진단·치료·예방을 위한 것이 아니며, 의료행위를 대체하지 않습니다.",
            },
            {
              title: "정보·교육 중심 서비스",
              description:
                "모든 콘텐츠는 통합의학·기능의학 연구 및 임상 자료를 바탕으로 한 ‘정보·교육용’이며, 개별 치료 결정은 담당 의료진과 상의해야 합니다.",
            },
            {
              title: "치료 변경·중단 근거로 사용 금지",
              description:
                "플랫폼의 정보와 후기는 치료 시작·변경·중단·지연의 근거로 사용될 수 없습니다. 이상 반응 발생 시 즉시 전문 의료진의 진료를 받으시기 바랍니다.",
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

      {/* Final CTA */}
      <section className="bg-primary/5 py-20">
        <div className="container mx-auto px-4">
          <BlurFade delay={0.2} duration={0.6} inView>
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
                치료는 병원에서, 생활관리는 함께 정리해 볼까요?
              </h2>
              <p className="text-muted-foreground mb-8 text-sm md:text-lg">
                지금 Evidence Base에 가입하시면 암 이후 생활에서 자주 논의되는 생활습관·영양·정신건강·산림치유
                체크리스트와 함께, 근거 기반 콘텐츠를 차분히 살펴보실 수 있습니다.
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
                  <Link to="/contact">전문가와 먼저 상담하고 싶어요</Link>
                </Button>
              </div>
              <p className="text-muted-foreground mt-4 text-xs">
                * 언제든지 탈퇴·데이터 삭제를 요청하실 수 있으며, 광고성 정보 제공은 최소화하고 실질적인 콘텐츠 위주로
                운영합니다.
              </p>
            </div>
          </BlurFade>
        </div>
      </section>
    </div>
  );
}
