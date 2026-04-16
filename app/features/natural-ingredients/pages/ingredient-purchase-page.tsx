import { useOutletContext } from "react-router";

import { Badge } from "~/core/components/ui/badge";
import { Button } from "~/core/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/core/components/ui/card";

type IngredientContext = {
  ingredient: {
    display_name: string;
    safety_notes: string | null;
    interaction_notes: string | null;
  };
};

const SMART_STORE_URL = "https://smartstore.naver.com/brightnlucky";

export default function IngredientPurchasePage() {
  const { ingredient } = useOutletContext<IngredientContext>();

  return (
    <div className="mx-auto max-w-screen-lg space-y-6">
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>구매가이드</CardTitle>
            <Badge variant="secondary">선택형 안내</Badge>
          </div>
          <CardDescription>
            이 탭은 "{ingredient.display_name}"이 포함된 제품을 스스로 비교하고
            선택하기 위한 안내입니다.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              1. 이 성분이 들어간 제품을 고를 때 볼 기준
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>• 제품 라벨에 성분명이 명확히 표기되어 있는지 확인합니다.</p>
            <p>
              • 제조사, 원산지, 품질관리(시험성적서/인증) 정보를 확인합니다.
            </p>
            <p>
              • 복용 목적(회복기, 컨디션 관리 등)에 맞는 제품인지 점검합니다.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              2. 함량/제형/부원료/주의사항
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>• 1회 섭취량과 1일 섭취량 기준의 실제 함량을 비교합니다.</p>
            <p>
              • 캡슐/정제/분말/액상 중 복용 편의성과 소화 부담에 맞는 제형을
              고릅니다.
            </p>
            <p>• 당류, 감미료, 알레르기 유발 가능 부원료를 확인합니다.</p>
            {ingredient.safety_notes ? (
              <p className="whitespace-pre-wrap">
                • 주의사항: {ingredient.safety_notes}
              </p>
            ) : (
              <p>• 현재 치료 단계와 병용 약물과의 충돌 가능성을 확인합니다.</p>
            )}
            {ingredient.interaction_notes ? (
              <p className="whitespace-pre-wrap">
                • 상호작용: {ingredient.interaction_notes}
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              3. 가격대 또는 제품 형태 비교
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>• 동일 성분이라도 함량 기준 단가(1일 섭취 기준)를 비교합니다.</p>
            <p>
              • 단일 성분 제품과 복합 성분 제품의 장단점을 목적에 맞게
              비교합니다.
            </p>
            <p>
              • 배송주기, 보관 조건, 복용 기간까지 포함한 총비용을 계산합니다.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">4. 외부 구매 링크</CardTitle>
            <CardDescription>
              구매 전 치료 단계와 병용 약물 여부를 먼저 확인하세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <a
                href={SMART_STORE_URL}
                target="_blank"
                rel="noreferrer noopener"
              >
                이 성분이 포함된 제품 보기
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
