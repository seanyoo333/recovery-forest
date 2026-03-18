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

const previewProps: WelcomeProps = {
  profile: {
    name: "김철수",
    email: "test@example.com",
    username: "testuser",
    avatar: "https://example.com/avatar.png",
  },
};

export default function Welcome({
  profile = previewProps.profile,
}: Partial<WelcomeProps> = {}) {
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
                회복의 여정에서 <strong>Evidence Base</strong>를 선택해주셔서
                진심으로 감사합니다. 건강한 회복과 삶의 질 향상을 위해
                함께하겠습니다.
              </Text>

              <Section className="mb-6 rounded-lg bg-green-50 p-6">
                <Heading className="mb-4 text-lg font-semibold text-green-900">
                  💎 Evidence Base 활용하기
                </Heading>
                <Text className="mb-3 text-[15px] leading-relaxed text-green-800">
                  ✅ <strong>개인화된 건강관리 보고서</strong> - 개인 기록
                  데이터, 근거 논문, AI에이전트 기반의 맞춤형 건강관리 로드맵
                </Text>
                <Text className="mb-3 text-[15px] leading-relaxed text-green-800">
                  ✅ <strong>증거 기반 건강 정보</strong> - 최신 연구 결과를
                  바탕으로 실제 행동을 유도하는 건강 정보
                </Text>
                <Text className="mb-3 text-[15px] leading-relaxed text-green-800">
                  ✅ <strong>건강 모니터링 도구</strong> - 개인 건강 데이터 기반
                  실시간 건강 상태 추적 및 분석
                </Text>
              </Section>

              <Section className="mb-6 rounded-lg bg-blue-50 p-6">
                <Heading className="mb-4 text-lg font-semibold text-blue-900">
                  🎯 시작이 반, 첫 걸음을 내딛어보세요.
                </Heading>
                <Text className="mb-4 text-[15px] leading-relaxed text-blue-800">
                  <strong>건강 프로필 등록하기</strong>
                  <br />
                  건강 기본정보, 병원 검사 정보 등을 기록해 두면, 본인의 건강
                  상태를 더 정확하게 파악할 수 있고, 더 정확한 맞춤 건강 정보를
                  받을 수 있습니다.
                </Text>
              </Section>

              <Section className="mb-6 text-center">
                <Button
                  href="https://evidence-base.ai/my/dashboard"
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
                따뜻한 마음을 담아,
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

Welcome.PreviewProps = previewProps;
