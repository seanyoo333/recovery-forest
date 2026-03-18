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

export default function ConfirmEmailChange() {
  return (
    <Tailwind>
      <Html>
        <Head />
        <Body className="bg-white font-sans">
          <Preview>Evidence Base 이메일 변경 확인</Preview>
          <Container className="mx-auto max-w-[560px] py-5 pb-12">
            <Heading className="pt-4 text-center text-2xl leading-tight font-normal tracking-[-0.5px] text-black">
              이메일 변경을 확인해주세요
            </Heading>
            <Section>
              <Text className="mb-4 break-after-avoid-page text-[15px] leading-relaxed">
                Evidence Base 계정의 이메일 주소를 기존 {`{{ .Email }}`}에서{" "}
                {`{{ .NewEmail }}`}로 변경하려면 아래 버튼을 눌러 확인해 주세요.
              </Text>
              <Button
                className="block rounded-xl bg-black px-6 py-3 text-center text-[15px] font-semibold text-white no-underline"
                href={`{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email_change&next=/auth/email-verified`}
              >
                이메일 변경 확인하기
              </Button>
            </Section>
            <Section>
              <Text className="mb-4 text-[15px] leading-relaxed text-black">
                버튼이 동작하지 않으면 아래 주소를 복사해 브라우저에 직접 입력해
                주세요.
              </Text>
              <Text className="mb-4 text-[15px] leading-relaxed text-blue-500">
                {`{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email_change&next=/auth/email-verified`}
              </Text>
              <Text className="mb-4 text-[15px] leading-relaxed text-black">
                본인이 요청하지 않은 변경이라면 이 메일을 무시하셔도 되며,
                변경은 완료되지 않습니다.
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
