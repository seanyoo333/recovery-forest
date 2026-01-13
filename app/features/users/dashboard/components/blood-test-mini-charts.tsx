import { Card, CardContent, CardHeader, CardTitle } from "~/core/components/ui/card";
import type { BloodTestSummary } from "../queries";

interface BloodTestMiniChartsProps {
  latestSummary: BloodTestSummary[];
}

export function BloodTestMiniCharts({ latestSummary }: BloodTestMiniChartsProps) {
  // 종양표지자 찾기 (첫 번째 종양표지자)
  const tumorMarker = latestSummary.find((item) =>
    item.metric.startsWith("tumor_marker_"),
  );

  // 당화혈색소 찾기
  const hba1c = latestSummary.find((item) => item.metric === "hba1c");

  // C 반응성 단백 찾기
  const crp = latestSummary.find((item) => item.metric === "crp");

  const getStatusColor = (
    value: number | null,
    min: number | null,
    max: number | null,
  ): string => {
    if (value === null) return "text-muted-foreground";
    if (min !== null && value < min) return "text-red-500";
    if (max !== null && value > max) return "text-red-500";
    return "text-green-600";
  };

  const formatValue = (value: number | null, unit: string): string => {
    if (value === null) return "데이터 없음";
    return `${value} ${unit}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">혈액검사 핵심 지표</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          {/* 종양표지자 */}
          <div className="flex flex-col gap-2">
            <div className="text-sm font-medium text-muted-foreground">
              {tumorMarker?.label || "종양표지자"}
            </div>
            <div
              className={`text-2xl font-bold ${getStatusColor(
                tumorMarker?.value ?? null,
                tumorMarker?.referenceMin ?? null,
                tumorMarker?.referenceMax ?? null,
              )}`}
            >
              {formatValue(
                tumorMarker?.value ?? null,
                tumorMarker?.unit || "",
              )}
            </div>
            {tumorMarker?.testDate && (
              <div className="text-xs text-muted-foreground">
                {tumorMarker.testDate}
              </div>
            )}
            {!tumorMarker && (
              <div className="text-xs text-muted-foreground">데이터 없음</div>
            )}
          </div>

          {/* 당화혈색소 */}
          <div className="flex flex-col gap-2">
            <div className="text-sm font-medium text-muted-foreground">
              {hba1c?.label || "당화혈색소"}
            </div>
            <div
              className={`text-2xl font-bold ${getStatusColor(
                hba1c?.value ?? null,
                hba1c?.referenceMin ?? null,
                hba1c?.referenceMax ?? null,
              )}`}
            >
              {formatValue(hba1c?.value ?? null, hba1c?.unit || "")}
            </div>
            {hba1c?.testDate && (
              <div className="text-xs text-muted-foreground">
                {hba1c.testDate}
              </div>
            )}
            {!hba1c && (
              <div className="text-xs text-muted-foreground">데이터 없음</div>
            )}
          </div>

          {/* C 반응성 단백 */}
          <div className="flex flex-col gap-2">
            <div className="text-sm font-medium text-muted-foreground">
              {crp?.label || "C 반응성 단백"}
            </div>
            <div
              className={`text-2xl font-bold ${getStatusColor(
                crp?.value ?? null,
                crp?.referenceMin ?? null,
                crp?.referenceMax ?? null,
              )}`}
            >
              {formatValue(crp?.value ?? null, crp?.unit || "")}
            </div>
            {crp?.testDate && (
              <div className="text-xs text-muted-foreground">
                {crp.testDate}
              </div>
            )}
            {!crp && (
              <div className="text-xs text-muted-foreground">데이터 없음</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

