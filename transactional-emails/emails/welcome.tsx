import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

interface WelcomeProps {
  profile: {
    name: string;
    email: string;
    username?: string;
    avatar?: string;
  };
}

export default function Welcome({ profile }: WelcomeProps) {
  return (
    <Tailwind>
      <Html>
        <Head />
        <Body className="bg-white font-sans">
          <Preview>
            Evidence Base에 오신 것을 환영합니다 - 암 경험자를 위한 건강관리
            플랫폼
          </Preview>
          <Container className="mx-auto max-w-[600px] py-8 pb-12">
            <Heading className="pt-4 text-center text-2xl leading-tight font-normal tracking-[-0.5px] text-black">
              🎉 Evidence Base 가입을 환영합니다!
            </Heading>

            <Section className="mt-8">
              <Text className="mb-6 text-[16px] leading-relaxed text-gray-800">
                안녕하세요, <strong>{profile.name}</strong>님!
              </Text>

              <Text className="mb-6 text-[16px] leading-relaxed text-gray-800">
                암 경험자로서의 여정에서 <strong>Evidence Base</strong>를
                선택해주셔서 진심으로 감사합니다. 당신의 건강한 회복과 삶의 질
                향상을 위해 함께하겠습니다.
              </Text>

              <Section className="mb-6 rounded-lg bg-blue-50 p-6">
                <Heading className="mb-4 text-lg font-semibold text-blue-900">
                  🎯 당신의 첫 번째 단계
                </Heading>
                <Text className="mb-4 text-[15px] leading-relaxed text-blue-800">
                  <strong>1. 건강 프로필 완성하기</strong>
                  <br />
                  개인화된 건강관리 계획을 위해 기본 정보를 입력해주세요.
                </Text>
                <Text className="mb-4 text-[15px] leading-relaxed text-blue-800">
                  <strong>2. 전문의 상담 예약</strong>
                  <br />
                  기능의학 전문의와의 1:1 상담을 통해 맞춤형 치료 계획을
                  세워보세요.
                </Text>
                <Text className="text-[15px] leading-relaxed text-blue-800">
                  <strong>3. 건강 커뮤니티 참여</strong>
                  <br />
                  같은 경험을 가진 분들과의 소통으로 힘을 얻어보세요.
                </Text>
              </Section>

              <Section className="mb-6 rounded-lg bg-green-50 p-6">
                <Heading className="mb-4 text-lg font-semibold text-green-900">
                  💎 당신이 받게 될 혜택
                </Heading>
                <Text className="mb-3 text-[15px] leading-relaxed text-green-800">
                  ✅ <strong>개인화된 건강관리 계획</strong> - 당신만의 맞춤형
                  치료 로드맵
                </Text>
                <Text className="mb-3 text-[15px] leading-relaxed text-green-800">
                  ✅ <strong>전문의 상담 서비스</strong> - 기능의학 전문의와의
                  정기 상담
                </Text>
                <Text className="mb-3 text-[15px] leading-relaxed text-green-800">
                  ✅ <strong>증거 기반 건강 정보</strong> - 최신 연구 결과를
                  바탕으로 한 신뢰할 수 있는 정보
                </Text>
                <Text className="mb-3 text-[15px] leading-relaxed text-green-800">
                  ✅ <strong>건강 모니터링 도구</strong> - 실시간 건강 상태 추적
                  및 분석
                </Text>
                <Text className="text-[15px] leading-relaxed text-green-800">
                  ✅ <strong>지지 커뮤니티</strong> - 같은 경험을 가진 분들과의
                  소통 공간
                </Text>
              </Section>

              <Section className="mb-6 text-center">
                <Button
                  href="https://evidence-base.ai/dashboard"
                  className="rounded-lg bg-blue-600 px-8 py-3 text-[16px] font-semibold text-white hover:bg-blue-700"
                >
                  🚀 지금 시작하기
                </Button>
              </Section>

              <Text className="mb-4 text-[15px] leading-relaxed text-gray-700">
                <strong>궁금한 점이 있으시면 언제든지 연락주세요.</strong>
                <br />
                고객지원팀이 24시간 내에 답변드리겠습니다.
              </Text>

              <Text className="mb-4 text-[15px] leading-relaxed text-gray-700">
                당신의 건강한 회복을 위해 Evidence Base가 함께하겠습니다.
                <br />
                다시 한번 가입해주셔서 감사합니다.
              </Text>

              <Text className="text-[15px] leading-relaxed text-gray-600">
                따뜻한 마음으로,
                <br />
                <strong>Evidence Base Team</strong>
              </Text>
            </Section>
          </Container>
        </Body>
      </Html>
    </Tailwind>
  );
}

Welcome.PreviewProps = {
  profile: {
    name: "김철수",
    email: "test@example.com",
    username: "testuser",
    avatar: "https://example.com/avatar.png",
  },
};
