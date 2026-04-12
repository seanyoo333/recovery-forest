import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";
import * as React from "react";

interface NewsletterProps {
  username: string;
  articles?: Array<{
    title: string;
    description: string;
    link: string;
  }>;
  unsubscribeLink: string;
}

const previewProps: NewsletterProps = {
  username: "김철수",
  articles: [
    {
      title: "몸이 지친 날에도 이어갈 수 있는 회복 루틴",
      description:
        "무리하지 않으면서도 오늘 바로 실천할 수 있는 회복 습관을 한 가지씩 정리했습니다.",
      link: "http://localhost:5173/blog/glutamine-metabolism-advanced-hr-positive-bc",
    },
  ],
  unsubscribeLink: "https://evidence-base.ai/unsubscribe",
};

const recordPageUrl = "http://localhost:5173/my/dashboard/health-habits";
const dashboardUrl = "https://evidence-base.ai/my/dashboard";

export function NewsletterEmail({
  username = previewProps.username,
  articles = previewProps.articles,
  unsubscribeLink = previewProps.unsubscribeLink,
}: Partial<NewsletterProps> = {}) {
  const featuredArticle = articles?.[0];

  return (
    <Tailwind>
      <Html>
        <Head />
        <Body className="bg-[#f4f7fb] py-8 font-sans text-black">
          <Preview>이번 주에도 무리하지 않고 이어갈 수 있는 작은 건강 실천을 전해드려요.</Preview>
          <Container className="mx-auto max-w-[600px] px-4 py-4">
            <Section className="mb-6 rounded-[28px] bg-white px-8 py-10 shadow-sm">
              <Text className="m-0 mb-3 text-center text-[13px] font-semibold tracking-[0.3px] text-[#4f46e5]">
                EVIDENCE BASE WEEKLY
              </Text>
              <Heading className="m-0 text-center text-[30px] leading-[1.3] font-semibold tracking-[-0.6px] text-[#111827]">
                이번 주도
                <br />
                나를 돌보는 작은 습관부터 시작해볼까요?
              </Heading>
              <Text className="mb-0 mt-5 text-center text-[15px] leading-7 text-[#4b5563]">
                안녕하세요, {username}님. Evidence Base는 매주 한 번,
                부담은 낮고 실천은 쉬운 건강 루틴을 전해드리고 있어요.
              </Text>
            </Section>

            <Section className="mb-5 rounded-[24px] bg-[#eef4ff] px-7 py-7">
              <Text className="m-0 mb-3 text-[13px] font-semibold tracking-[0.2px] text-[#3156d3]">
                금주 핵심 메시지
              </Text>
              <Heading className="m-0 text-[24px] leading-[1.45] font-semibold tracking-[-0.4px] text-[#111827]">
                완벽하게 해내는 것보다,
                <br />
                오늘 하루를 기록으로 남기는 것이 더 중요합니다.
              </Heading>
              <Text className="mb-0 mt-4 text-[15px] leading-7 text-[#334155]">
                몸의 변화는 갑자기 알아차리기보다, 작게라도 꾸준히 남긴
                기록에서 더 잘 보입니다. 이번 주에는 거창한 목표보다 지금의
                상태를 가볍게 적어보는 것부터 시작해 보세요.
              </Text>
            </Section>

            {featuredArticle ? (
              <Section className="mb-5 rounded-[24px] bg-white px-7 py-7 shadow-sm">
                <Text className="m-0 mb-3 text-[13px] font-semibold tracking-[0.2px] text-[#0f766e]">
                  관련 콘텐츠 1개
                </Text>
                <Heading className="m-0 text-[22px] leading-[1.4] font-semibold tracking-[-0.3px] text-[#111827]">
                  {featuredArticle.title}
                </Heading>
                <Text className="mb-0 mt-4 text-[15px] leading-7 text-[#4b5563]">
                  {featuredArticle.description}
                </Text>
                <Button
                  className="mt-6 block rounded-2xl bg-[#111827] px-6 py-3 text-center text-[15px] font-semibold text-white no-underline"
                  href={featuredArticle.link}
                >
                  관련 콘텐츠 읽어보기
                </Button>
              </Section>
            ) : null}

            <Section className="mb-5 rounded-[24px] bg-[#f0fdf4] px-7 py-7">
              <Text className="m-0 mb-3 text-[13px] font-semibold tracking-[0.2px] text-[#15803d]">
                이번 주 실천하기
              </Text>
              <Heading className="m-0 text-[22px] leading-[1.4] font-semibold tracking-[-0.3px] text-[#111827]">
                오늘의 컨디션을
                <br />
                한 줄만 기록해 보세요.
              </Heading>
              <Text className="mb-0 mt-4 text-[15px] leading-7 text-[#3f3f46]">
                예를 들면 "조금 피곤했지만 식사는 잘 챙겼어요", "오후에
                컨디션이 많이 떨어졌어요"처럼 짧게 남겨도 충분합니다. 이렇게
                쌓인 기록은 나중에 나에게 맞는 패턴을 찾는 데 큰 도움이 됩니다.
              </Text>
              <Button
                className="mt-6 block rounded-2xl bg-[#16a34a] px-6 py-3 text-center text-[15px] font-semibold text-white no-underline"
                href={recordPageUrl}
              >
                기록 페이지로 이동하기
              </Button>
            </Section>

            <Section className="mb-5 rounded-[24px] bg-[#111827] px-7 py-8 text-center">
              <Text className="m-0 mb-3 text-[13px] font-semibold tracking-[0.2px] text-[#c7d2fe]">
                이어서 해보세요
              </Text>
              <Heading className="m-0 text-[24px] leading-[1.4] font-semibold tracking-[-0.4px] text-white">
                내 건강 여정을
                <br />
                이번 주에도 천천히 이어가 보세요.
              </Heading>
              <Text className="mb-0 mt-4 text-[15px] leading-7 text-[#d1d5db]">
                Evidence Base에서는 기록, 건강 정보, 맞춤형 흐름을 한 곳에서
                이어갈 수 있습니다. 무리하지 않아도 괜찮아요. 계속 연결되어
                있는 것이 더 중요합니다.
              </Text>
              <Button
                className="mt-6 inline-block rounded-2xl bg-white px-6 py-3 text-center text-[15px] font-semibold text-[#111827] no-underline"
                href={dashboardUrl}
              >
                내 대시보드 열기
              </Button>
            </Section>

            <Section className="px-2 pt-2 text-center">
              <Text className="mb-3 text-[13px] leading-6 text-[#6b7280]">
                이 메일은 뉴스레터 수신에 동의하신 분들께 발송되고 있습니다.
                원치 않으시면 언제든지 수신을 중단하실 수 있습니다.
              </Text>
              <Link
                href={unsubscribeLink}
                className="text-[13px] font-medium text-[#6b7280] underline"
              >
                수신 거부
              </Link>
            </Section>
          </Container>
        </Body>
      </Html>
    </Tailwind>
  );
}

NewsletterEmail.PreviewProps = previewProps;

export default NewsletterEmail;
