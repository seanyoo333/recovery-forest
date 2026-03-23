import { Link, useOutletContext } from "react-router";

import { Badge } from "~/core/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/core/components/ui/card";

type EvidenceRow = {
  evidence_id: string | null;
  target_slug: string | null;
  target_name: string | null;
  target_description: string | null;
  meta_axis: string | null;
  effect: "inhibit" | "activate" | "unclear" | null;
  outcome_direction: "positive" | "negative" | "neutral" | null;
  strength: number | null;
  study_type: string | null;
  evidence_notes: string | null;
  evidence_count: number | null;
  primary_evidence_count: number | null;
};

type EvidenceContext = {
  evidenceRows: EvidenceRow[];
  evidenceStats: {
    targetCount: number;
    evidenceCount: number;
    sourceCount: number;
    primarySourceCount: number;
  };
};

type NormalizedEvidence = {
  key: string;
  targetSlug: string | null;
  targetName: string;
  targetDescription: string | null;
  effect: EvidenceRow["effect"];
  outcomeDirection: EvidenceRow["outcome_direction"];
  strength: number | null;
  studyType: string | null;
  evidenceNotes: string | null;
  evidenceCount: number;
  primaryEvidenceCount: number;
  metaAxes: string[];
};

function getEffectLabel(effect: EvidenceRow["effect"]) {
  if (effect === "inhibit") return "억제";
  if (effect === "activate") return "활성";
  if (effect === "unclear") return "불명확";
  return "미지정";
}

function getOutcomeDirectionLabel(direction: EvidenceRow["outcome_direction"]) {
  if (direction === "positive") return "긍정";
  if (direction === "negative") return "부정";
  if (direction === "neutral") return "중립";
  return "미지정";
}

function normalizeEvidenceRows(rows: EvidenceRow[]): NormalizedEvidence[] {
  const grouped = new Map<string, NormalizedEvidence>();

  for (const row of rows) {
    const key =
      row.evidence_id ??
      `${row.target_slug ?? "unknown-target"}-${row.study_type ?? "unknown-study"}-${row.strength ?? "0"}`;

    const existing = grouped.get(key);
    if (!existing) {
      grouped.set(key, {
        key,
        targetSlug: row.target_slug,
        targetName: row.target_name ?? "미지정 표적",
        targetDescription: row.target_description,
        effect: row.effect,
        outcomeDirection: row.outcome_direction,
        strength: row.strength,
        studyType: row.study_type,
        evidenceNotes: row.evidence_notes,
        evidenceCount: row.evidence_count ?? 0,
        primaryEvidenceCount: row.primary_evidence_count ?? 0,
        metaAxes: row.meta_axis ? [row.meta_axis] : [],
      });
      continue;
    }

    if (row.meta_axis && !existing.metaAxes.includes(row.meta_axis)) {
      existing.metaAxes.push(row.meta_axis);
    }
    existing.evidenceCount = Math.max(existing.evidenceCount, row.evidence_count ?? 0);
    existing.primaryEvidenceCount = Math.max(
      existing.primaryEvidenceCount,
      row.primary_evidence_count ?? 0,
    );
  }

  return [...grouped.values()].sort((a, b) => (b.strength ?? 0) - (a.strength ?? 0));
}

export default function IngredientEvidencePage() {
  const { evidenceRows, evidenceStats } = useOutletContext<EvidenceContext>();
  const normalizedRows = normalizeEvidenceRows(evidenceRows);

  if (normalizedRows.length === 0) {
    return (
      <div className="mx-auto max-w-screen-md space-y-3">
        <h2 className="text-xl font-bold">근거 요약</h2>
        <p className="text-muted-foreground">
          아직 등록된 근거 데이터가 없습니다. 성분-표적 근거가 추가되면 이 탭에 표시됩니다.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-screen-lg space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">연결 표적</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {evidenceStats.targetCount}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">근거 항목</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {evidenceStats.evidenceCount}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">연결 출처 수</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {evidenceStats.sourceCount}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">주요 출처 수</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {evidenceStats.primarySourceCount}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {normalizedRows.map((row) => (
          <Card key={row.key}>
            <CardHeader className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-xl">{row.targetName}</CardTitle>
                {row.targetSlug && (
                  <Badge variant="secondary" asChild>
                    <Link to={`/natural-ingredients/targets/${row.targetSlug}`}>
                      표적 페이지
                    </Link>
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">효과: {getEffectLabel(row.effect)}</Badge>
                <Badge variant="outline">
                  결과 방향: {getOutcomeDirectionLabel(row.outcomeDirection)}
                </Badge>
                <Badge variant="outline">연구 유형: {row.studyType ?? "미지정"}</Badge>
                <Badge variant="outline">
                  강도: {row.strength?.toFixed(2) ?? "미지정"}
                </Badge>
                <Badge variant="outline">출처: {row.evidenceCount}</Badge>
                <Badge variant="outline">주요 출처: {row.primaryEvidenceCount}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {row.targetDescription && (
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {row.targetDescription}
                </p>
              )}
              {row.evidenceNotes && (
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {row.evidenceNotes}
                </p>
              )}
              {row.metaAxes.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {row.metaAxes.map((axis) => (
                    <Badge key={`${row.key}-${axis}`} variant="secondary">
                      {axis}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
