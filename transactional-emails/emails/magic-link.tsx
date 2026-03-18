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

export default function MagicLink() {
  return (
    <Tailwind>
      <Html>
        <Head />
        <Body className="bg-white font-sans">
          <Preview>Evidence Base 로그인 안내</Preview>
          <Container className="mx-auto max-w-[560px] py-5 pb-12">
            <Heading className="pt-4 text-center text-2xl leading-tight font-normal tracking-[-0.5px] text-black">
              로그인 링크를 보내드렸어요
            </Heading>
            <Section>
              <Text className="mb-4 text-[15px] leading-relaxed text-black">
                아래 버튼을 누르면 Evidence Base에 바로 로그인할 수 있습니다.
              </Text>
              <Button
                className="block rounded-xl bg-black px-6 py-3 text-center text-[15px] font-semibold text-white no-underline"
                href={`{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/`}
              >
                로그인하기
              </Button>
            </Section>
            <Section>
              <Text className="mt-10 mb-4 text-[15px] leading-relaxed text-black">
                일회용 인증 코드가 필요한 경우에는 아래 코드를 복사해
                입력해 주세요.
              </Text>
              <div className="flex justify-center">
                <code className="mx-auto inline-block rounded bg-[#dfe1e4] px-1 py-2 text-center font-mono text-[21px] font-bold tracking-[-0.3px] text-black uppercase">
                  {`{{ .Token }}`}
                </code>
              </div>
              <Text className="mt-4 mb-4 text-[15px] leading-relaxed text-black">
                본인이 요청하지 않은 로그인이라면 이 메일을 무시해 주세요.
              </Text>
              <Text className="mb-4 text-[15px] leading-relaxed text-black">
                계정 보안을 위해 메일과 인증 코드는 다른 사람과 공유하지 마세요.
              </Text>
              <Text className="mb-4 text-[15px] leading-relaxed text-black">
                감사합니다.
              </Text>
              <Text className="mb-4 text-[15px] leading-relaxed text-black">
                Evidence Base 팀 드림
              </Text>
            </Section>
          </Container>
        </Body>
      </Html>
    </Tailwind>
  );
}
