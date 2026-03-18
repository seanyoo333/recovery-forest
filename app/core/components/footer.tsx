/**
 * Footer Component
 *
 * A responsive footer for sales and legal compliance that displays:
 * - Company information (EvidenceBase Inc., representative, business number, email)
 * - Links to legal pages (Terms, Privacy, AI Notice, Contact)
 * - Copyright notice
 *
 * Company details can be updated in the FOOTER_CONFIG object below.
 */
import { MailIcon } from "lucide-react";
import { Link } from "react-router";

/** 푸터에 표시할 회사 정보 (필요 시 수정) */
const FOOTER_CONFIG = {
  companyName: "EvidenceBase Inc.",
  companyNameKo: "에비던스베이스 주식회사",
  representative: "유명길",
  businessNumber: "316-87-03897",
  email: "shineyou@evidence-base.ai",
  address: "서울시 도봉구 마들로 11길 65, 5층 503-이13호",
} as const;

export default function Footer() {
  const { companyName, representative, businessNumber, email, address } =
    FOOTER_CONFIG;

  return (
    <footer className="bg-muted/30 mt-auto border-t">
      <div className="mx-auto w-full max-w-screen-2xl px-5 py-6 md:py-8">
        {/* Company info */}
        <div className="text-muted-foreground mb-6 grid gap-4 text-sm md:grid-cols-2 md:items-start md:gap-8">
          <div className="space-y-1">
            <p className="text-foreground font-semibold">{companyName}</p>
            <p>대표자: {representative}</p>
            <p>사업자등록번호: {businessNumber}</p>
            <a
              href={`mailto:${email}`}
              className="hover:text-foreground flex items-center gap-2 transition-colors"
            >
              <MailIcon className="h-4 w-4 shrink-0" />
              {email}
            </a>
            <p>주소: {address}</p>
          </div>

          {/* Legal links */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 md:justify-end md:gap-x-8">
            <Link
              to="/legal/terms-of-service"
              viewTransition
              className="hover:text-foreground underline transition-colors"
            >
              이용약관
            </Link>
            <Link
              to="/legal/refund-policy"
              viewTransition
              className="hover:text-foreground underline transition-colors"
            >
              환불정책
            </Link>
            <Link
              to="/legal/privacy-policy"
              viewTransition
              className="hover:text-foreground underline transition-colors"
            >
              개인정보처리방침
            </Link>
            <Link
              to="/legal/ai-notice"
              viewTransition
              className="hover:text-foreground underline transition-colors"
            >
              AI 분석 안내
            </Link>
            <Link
              to="/contact"
              viewTransition
              className="hover:text-foreground underline transition-colors"
            >
              문의하기
            </Link>
          </div>
        </div>

        {/* Copyright */}
        <p className="text-muted-foreground border-border/50 border-t pt-4 text-center text-xs md:text-left">
          &copy; {new Date().getFullYear()} {import.meta.env.VITE_APP_NAME}. All
          rights reserved.
        </p>
      </div>
    </footer>
  );
}
