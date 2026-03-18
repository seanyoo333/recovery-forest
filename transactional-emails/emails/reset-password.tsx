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

export default function ResetPassword() {
  return (
    <Tailwind>
      <Html>
        <Head />
        <Body className="bg-white font-sans">
          <Preview>Evidence Base 비밀번호 재설정</Preview>
          <Container className="mx-auto max-w-[560px] py-5 pb-12">
            <Heading className="pt-4 text-center text-2xl leading-tight font-normal tracking-[-0.5px] text-black">
              비밀번호를 재설정해주세요
            </Heading>
            <Section>
              <Text className="mb-4 text-[15px] leading-relaxed text-black">
                비밀번호 재설정을 요청하셨다면 아래 버튼을 눌러 새 비밀번호를
                설정해 주세요.
              </Text>
              <Button
                className="block rounded-xl bg-black px-6 py-3 text-center text-[15px] font-semibold text-white no-underline"
                href={`{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/auth/forgot-password/create`}
              >
                비밀번호 재설정하기
              </Button>
            </Section>
            <Section>
              <Text className="mb-4 text-[15px] leading-relaxed text-black">
                버튼이 동작하지 않으면 아래 주소를 복사해 브라우저에 직접
                입력해 주세요.
              </Text>
              <Text className="mb-4 text-[15px] leading-relaxed text-blue-500">
                {`{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/auth/forgot-password/create`}
              </Text>
              <Text className="mb-4 text-[15px] leading-relaxed text-black">
                본인이 요청하지 않은 비밀번호 재설정이라면 이 메일을 무시해
                주세요.
              </Text>
              <Text className="mb-4 text-[15px] leading-relaxed text-black">
                계정 보안을 위해 비밀번호는 다른 사람과 공유하지 마세요.
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
