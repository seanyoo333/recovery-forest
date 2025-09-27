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

export function NewsletterEmail({
  username,
  articles = [],
  unsubscribeLink,
}: NewsletterProps) {
  const hasArticles = articles && articles.length > 0;

  return (
    <Tailwind>
      <Html>
        <Head />
        <Body className="bg-white font-sans">
          <Preview>Your Weekly Newsletter: Latest Updates and Insights</Preview>
          <Container className="mx-auto max-w-[600px] py-5 pb-12">
            <Heading className="pt-4 text-center text-2xl leading-tight font-normal tracking-[-0.5px] text-black">
              Weekly Newsletter
            </Heading>

            <Section>
              <Text className="mb-4 text-[15px] leading-relaxed text-black">
                Hello {username},
              </Text>
              <Text className="mb-4 text-[15px] leading-relaxed text-black">
                {hasArticles
                  ? "Here are this week's top stories and insights we've curated just for you:"
                  : "We're currently preparing new content for you. Stay tuned for our next update!"}
              </Text>
            </Section>

            {hasArticles &&
              articles.map((article, index) => (
                <Section
                  key={index}
                  className="mb-6 border-b border-gray-200 pb-6"
                >
                  <Heading className="mb-2 text-xl font-semibold text-black">
                    {article.title}
                  </Heading>
                  <Text className="mb-4 text-[15px] leading-relaxed text-gray-600">
                    {article.description}
                  </Text>
                  <Button
                    className="block rounded-xl bg-black px-6 py-3 text-center text-[15px] font-semibold text-white no-underline"
                    href={article.link}
                  >
                    Read More
                  </Button>
                </Section>
              ))}

            <Section>
              <Text className="mb-4 text-[15px] leading-relaxed text-black">
                {hasArticles
                  ? "Stay tuned for more updates next week!"
                  : "We'll be back soon with more exciting content!"}
              </Text>
              <Text className="mb-4 text-[15px] leading-relaxed text-black">
                Best regards,
              </Text>
              <Text className="mb-4 text-[15px] leading-relaxed text-black">
                The Supaplate Team
              </Text>
            </Section>

            <Section className="mt-8 border-t border-gray-200 pt-4">
              <Text className="text-[13px] text-gray-500">
                You're receiving this email because you subscribed to our
                newsletter.
                <br />
                <Link
                  href={unsubscribeLink}
                  className="text-gray-500 underline"
                >
                  Unsubscribe
                </Link>
              </Text>
            </Section>
          </Container>
        </Body>
      </Html>
    </Tailwind>
  );
}

export default NewsletterEmail;
