import { useMemo, useState } from "react";

import { Badge } from "~/core/components/ui/badge";
import { Button } from "~/core/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/core/components/ui/card";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "~/core/components/ui/drawer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/core/components/ui/select";
import { Separator } from "~/core/components/ui/separator";
import { Switch } from "~/core/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/core/components/ui/tooltip";
import { cn } from "~/core/lib/utils";

type Fuel = "glucose" | "glutamine" | "fatty";
type EvidenceType = "natural" | "offlabel";

type EvidenceItem = {
  ingredientName: string;
  kind: EvidenceType;
  studyType:
    | "systematic_review"
    | "rct"
    | "human_observational"
    | "animal"
    | "cell"
    | "mechanistic";
  strength: number;
  pmid?: string;
  note?: string;
};

type CellCoverage = {
  bestStrength?: number;
  kind?: "natural" | "offlabel" | "both";
  evidence: EvidenceItem[];
};

type TargetRow = {
  id: string;
  label: string;
  group: "Glucose" | "Glutamine" | "Fatty acids";
  fuel: Fuel;
};

type MatrixState = {
  coverageByTargetId: Record<string, CellCoverage>;
};

type JoinedEvidenceRow = {
  ingredient_id: string;
  ingredient_name: string;
  target_slug: string;
  strength: number;
  study_type:
    | "systematic_review"
    | "rct"
    | "human_observational"
    | "case_report"
    | "animal"
    | "cell"
    | "mechanistic";
};

const FUEL_LABEL: Record<Fuel, string> = {
  glucose: "Glucose",
  glutamine: "Glutamine",
  fatty: "Fatty Acids",
};

const GROUP_ORDER: TargetRow["group"][] = [
  "Glucose",
  "Glutamine",
  "Fatty acids",
];

const KIND_MARK = {
  natural: "✓",
  offlabel: "●",
  both: "◆",
  none: "·",
} as const;

const TARGET_ROWS: TargetRow[] = [
  // Glucose
  { id: "glut1", label: "GLUT1", group: "Glucose", fuel: "glucose" },
  { id: "insulin", label: "Insulin", group: "Glucose", fuel: "glucose" },
  { id: "pppathway", label: "PPP pathway", group: "Glucose", fuel: "glucose" },
  { id: "oxphos", label: "OXPHOS", group: "Glucose", fuel: "glucose" },
  {
    id: "aerobic_glycolysis",
    label: "Aerobic Glycolysis",
    group: "Glucose",
    fuel: "glucose",
  },
  // Glutamine
  { id: "igf-1", label: "IGF-1", group: "Glutamine", fuel: "glutamine" },
  {
    id: "gln_oxphos",
    label: "Gln OXPHOS",
    group: "Glutamine",
    fuel: "glutamine",
  },
  { id: "mtor", label: "mTOR", group: "Glutamine", fuel: "glutamine" },
  {
    id: "macropinocytosis",
    label: "Macropinocytosis",
    group: "Glutamine",
    fuel: "glutamine",
  },
  {
    id: "nucleoside_salvage",
    label: "Nucleoside Salvage",
    group: "Glutamine",
    fuel: "glutamine",
  },
  {
    id: "glutaminolysis",
    label: "Glutaminolysis",
    group: "Glutamine",
    fuel: "glutamine",
  },
  // Fatty acids
  {
    id: "acetate-srebp-1",
    label: "Acetate-SREBP-1",
    group: "Fatty acids",
    fuel: "fatty",
  },
  { id: "acly", label: "ACLY", group: "Fatty acids", fuel: "fatty" },
  { id: "fas", label: "F.A.S", group: "Fatty acids", fuel: "fatty" },
  { id: "fao", label: "F.A.O.", group: "Fatty acids", fuel: "fatty" },
  { id: "srebp-1", label: "SREBP-1", group: "Fatty acids", fuel: "fatty" },
  {
    id: "mevalonate-srebp-2",
    label: "Mevalonate-SREBP-2",
    group: "Fatty acids",
    fuel: "fatty",
  },
];

const TARGET_SLUG_MAP: Record<string, string> = {
  glut1: "glut1",
  insulin: "insulin",
  pppathway: "pppathway",
  oxphos: "oxphos",
  aerobic_glycolysis: "aerobic_glycolysis",
  "igf-1": "igf-1",
  gln_oxphos: "gln_oxphos",
  mtor: "mtor",
  macropinocytosis: "macropinocytosis",
  nucleoside_salvage: "nucleoside_salvage",
  glutaminolysis: "glutaminolysis",
  "acetate-srebp-1": "acetate-srebp-1",
  acly: "acly",
  fas: "fas",
  fao: "fao",
  "srebp-1": "srebp-1",
  "mevalonate-srebp-2": "mevalonate-srebp-2",
};

function computeCoverageSummary(rows: TargetRow[], state: MatrixState) {
  const byFuel: Record<
    Fuel,
    { total: number; covered: number; missing: string[] }
  > = {
    glucose: { total: 0, covered: 0, missing: [] },
    glutamine: { total: 0, covered: 0, missing: [] },
    fatty: { total: 0, covered: 0, missing: [] },
  };

  for (const r of rows) {
    byFuel[r.fuel].total += 1;
    const cell = state.coverageByTargetId[r.id];
    const isCovered = !!cell && cell.evidence.length > 0;
    if (isCovered) byFuel[r.fuel].covered += 1;
    else byFuel[r.fuel].missing.push(r.label);
  }

  return byFuel;
}

function clampPct(n: number) {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

function mapEvidenceToMatrix(
  evidenceRows: JoinedEvidenceRow[],
  strengthThreshold: number,
): MatrixState {
  const state: MatrixState = { coverageByTargetId: {} };

  for (const row of evidenceRows) {
    if (row.strength < strengthThreshold) continue;

    const targetId = Object.keys(TARGET_SLUG_MAP).find(
      (id) => TARGET_SLUG_MAP[id] === row.target_slug,
    );
    if (!targetId) continue;

    if (!state.coverageByTargetId[targetId]) {
      state.coverageByTargetId[targetId] = { evidence: [] };
    }

    const evidenceItem: EvidenceItem = {
      ingredientName: row.ingredient_name,
      kind: "natural", // 기본값, 실제로는 DB에서 가져와야 함
      studyType:
        row.study_type === "case_report"
          ? "human_observational"
          : row.study_type,
      strength: row.strength,
    };

    state.coverageByTargetId[targetId].evidence.push(evidenceItem);
  }

  // 각 타겟의 kind와 bestStrength 계산
  for (const [targetId, cell] of Object.entries(state.coverageByTargetId)) {
    if (cell.evidence.length === 0) continue;

    const kinds = new Set(cell.evidence.map((e) => e.kind));
    cell.kind =
      kinds.size === 2 ? "both" : kinds.has("natural") ? "natural" : "offlabel";
    cell.bestStrength = Math.max(...cell.evidence.map((e) => e.strength));
  }

  return state;
}

interface MetabolicFuelBlockingMapProps {
  evidenceData: JoinedEvidenceRow[];
  timeRange?: "7d" | "30d" | "all";
  onTimeRangeChange?: (v: "7d" | "30d" | "all") => void;
  withCard?: boolean;
}

export function MetabolicFuelBlockingMap({
  evidenceData,
  timeRange: externalTimeRange,
  onTimeRangeChange: externalOnTimeRangeChange,
  withCard = true,
}: MetabolicFuelBlockingMapProps) {
  const [strengthThreshold, setStrengthThreshold] = useState(0.45);
  const [onlyMissing, setOnlyMissing] = useState(false);
  const [internalTimeRange, setInternalTimeRange] = useState<
    "7d" | "30d" | "all"
  >("30d");

  const timeRange = externalTimeRange ?? internalTimeRange;
  const setTimeRange = externalOnTimeRangeChange ?? setInternalTimeRange;

  const state = useMemo(
    () => mapEvidenceToMatrix(evidenceData, strengthThreshold),
    [evidenceData, strengthThreshold],
  );

  const filteredRows = useMemo(() => {
    if (!onlyMissing) return TARGET_ROWS;
    return TARGET_ROWS.filter(
      (r) => !state.coverageByTargetId[r.id]?.evidence?.length,
    );
  }, [onlyMissing, state]);

  const summary = useMemo(
    () => computeCoverageSummary(TARGET_ROWS, state),
    [state],
  );

  const content = (
    <>
      <Toolbar
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
        strengthThreshold={strengthThreshold}
        onStrengthThresholdChange={setStrengthThreshold}
        onlyMissing={onlyMissing}
        onOnlyMissingChange={setOnlyMissing}
      />

      <CoverageBars summary={summary} />

      <Legend strengthThreshold={strengthThreshold} />

      <MatrixTable rows={filteredRows} state={state} />
    </>
  );

  if (!withCard) {
    return (
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto">
        {content}
      </div>
    );
  }

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <CardHeader>
        <CardTitle>대사 안정화</CardTitle>
        <CardDescription>연료 차단 맵 (Fuel Blocking Map)</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4 overflow-y-auto">
        {content}
      </CardContent>
    </Card>
  );
}

function Toolbar(props: {
  timeRange: "7d" | "30d" | "all";
  onTimeRangeChange: (v: "7d" | "30d" | "all") => void;
  strengthThreshold: number;
  onStrengthThresholdChange: (v: number) => void;
  onlyMissing: boolean;
  onOnlyMissingChange: (v: boolean) => void;
}) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={props.timeRange}
          onValueChange={(v) => props.onTimeRangeChange(v as any)}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="기간 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">최근 7일</SelectItem>
            <SelectItem value="30d">최근 30일</SelectItem>
            <SelectItem value="all">전체</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={String(props.strengthThreshold)}
          onValueChange={(v) => props.onStrengthThresholdChange(Number(v))}
        >
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="강도 임계값" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0.3">≥ 0.30 (기전적+)</SelectItem>
            <SelectItem value="0.45">≥ 0.45 (세포+)</SelectItem>
            <SelectItem value="0.7">≥ 0.70 (동물+)</SelectItem>
            <SelectItem value="0.85">≥ 0.85 (인간+)</SelectItem>
            <SelectItem value="0.95">≥ 0.95 (RCT+)</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2 rounded-xl border px-3 py-2">
          <Switch
            checked={props.onlyMissing}
            onCheckedChange={props.onOnlyMissingChange}
          />
          <span className="text-sm">누락된 항목만</span>
        </div>
      </div>
    </div>
  );
}

function CoverageBars(props: {
  summary: Record<Fuel, { total: number; covered: number; missing: string[] }>;
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">커버리지 (점수가 아님)</h3>
      <div className="grid gap-3 md:grid-cols-3">
        {(["glucose", "glutamine", "fatty"] as Fuel[]).map((fuel) => {
          const s = props.summary[fuel];
          const pct = s.total === 0 ? 0 : clampPct((s.covered / s.total) * 100);
          return (
            <Card key={fuel} className="rounded-xl">
              <CardContent className="space-y-2 p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">{FUEL_LABEL[fuel]}</div>
                  <div className="text-muted-foreground text-xs">
                    {Math.round(pct)}% ({s.covered}/{s.total})
                  </div>
                </div>
                <div className="bg-muted h-2 w-full rounded-full">
                  <div
                    className="bg-foreground h-2 rounded-full"
                    style={{ width: `${pct}%` }}
                    aria-label={`${FUEL_LABEL[fuel]} 커버리지 ${pct}%`}
                  />
                </div>
                <div className="text-muted-foreground line-clamp-2 text-xs">
                  누락: {s.missing.length ? s.missing.join(", ") : "없음 🎉"}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function Legend(props: { strengthThreshold: number }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <Badge variant="outline" className="rounded-xl">
        {KIND_MARK.natural} 천연물
      </Badge>
      <Badge variant="outline" className="rounded-xl">
        {KIND_MARK.offlabel} 오프라벨
      </Badge>
      <Badge variant="outline" className="rounded-xl">
        {KIND_MARK.both} 둘 다
      </Badge>
      <Badge variant="outline" className="rounded-xl">
        {KIND_MARK.none} 없음
      </Badge>
      <span className="text-muted-foreground">
        강도 임계값: {props.strengthThreshold.toFixed(2)}
      </span>
    </div>
  );
}

function MatrixTable(props: { rows: TargetRow[]; state: MatrixState }) {
  const grouped = useMemo(() => {
    const map = new Map<TargetRow["group"], TargetRow[]>();
    for (const g of GROUP_ORDER) map.set(g, []);
    for (const r of props.rows) map.get(r.group)?.push(r);
    return map;
  }, [props.rows]);

  return (
    <div className="rounded-xl border">
      <div className="bg-muted/40 grid grid-cols-[1.6fr_1fr_1fr_1fr] gap-0 border-b">
        <div className="p-3 text-sm font-medium">표적</div>
        <div className="p-3 text-sm font-medium">Glucose</div>
        <div className="p-3 text-sm font-medium">Glutamine</div>
        <div className="p-3 text-sm font-medium">Fatty Acids</div>
      </div>

      <div className="divide-y">
        {GROUP_ORDER.map((group) => {
          const rows = grouped.get(group) ?? [];
          if (!rows.length) return null;

          return (
            <div key={group}>
              <div className="text-muted-foreground px-3 py-2 text-xs font-semibold">
                {group}
              </div>
              <Separator />
              {rows.map((r) => (
                <MatrixRow
                  key={r.id}
                  row={r}
                  cell={props.state.coverageByTargetId[r.id]}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MatrixRow(props: { row: TargetRow; cell?: CellCoverage }) {
  const { row, cell } = props;
  return (
    <div className="grid grid-cols-[1.6fr_1fr_1fr_1fr]">
      <div className="p-3 text-sm">{row.label}</div>

      <MatrixCell fuel="glucose" row={row} cell={cell} />
      <MatrixCell fuel="glutamine" row={row} cell={cell} />
      <MatrixCell fuel="fatty" row={row} cell={cell} />
    </div>
  );
}

function MatrixCell(props: {
  fuel: Fuel;
  row: TargetRow;
  cell?: CellCoverage;
}) {
  const isOwn = props.row.fuel === props.fuel;
  const evidence = isOwn ? (props.cell?.evidence ?? []) : [];
  const kind = isOwn ? props.cell?.kind : undefined;

  const mark =
    evidence.length === 0
      ? KIND_MARK.none
      : kind === "both"
        ? KIND_MARK.both
        : kind === "offlabel"
          ? KIND_MARK.offlabel
          : KIND_MARK.natural;

  const cellTone =
    evidence.length === 0
      ? "text-muted-foreground"
      : kind === "both"
        ? "font-semibold"
        : "font-medium";

  if (evidence.length === 0) {
    return (
      <div className="p-3">
        <div
          className={cn(
            "bg-background flex h-9 items-center justify-center rounded-xl border",
            cellTone,
            !isOwn && "opacity-40",
          )}
          title={!isOwn ? "이 표적은 다른 연료 축에 속합니다" : "증거 없음"}
        >
          {mark}
        </div>
      </div>
    );
  }

  return (
    <div className="p-3">
      <EvidenceDrawerTrigger
        title={`${props.row.label} × ${FUEL_LABEL[props.fuel]}`}
        kind={kind ?? "natural"}
        evidence={evidence}
      >
        <div
          className={cn(
            "bg-background hover:bg-muted/50 flex h-9 cursor-pointer items-center justify-center rounded-xl border",
            cellTone,
          )}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <span>{mark}</span>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-xs">
                {evidence.length}개 증거 항목. 클릭하여 확인하세요.
              </div>
            </TooltipContent>
          </Tooltip>
        </div>
      </EvidenceDrawerTrigger>
    </div>
  );
}

function EvidenceDrawerTrigger(props: {
  title: string;
  kind: "natural" | "offlabel" | "both";
  evidence: EvidenceItem[];
  children: React.ReactNode;
}) {
  const badge =
    props.kind === "both"
      ? { label: "둘 다", mark: KIND_MARK.both }
      : props.kind === "offlabel"
        ? { label: "오프라벨", mark: KIND_MARK.offlabel }
        : { label: "천연물", mark: KIND_MARK.natural };

  const sorted = useMemo(
    () => [...props.evidence].sort((a, b) => b.strength - a.strength),
    [props.evidence],
  );

  return (
    <Drawer>
      <DrawerTrigger asChild>{props.children}</DrawerTrigger>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            {props.title}
            <Badge variant="outline" className="rounded-xl">
              {badge.mark} {badge.label}
            </Badge>
          </DrawerTitle>
          <DrawerDescription>
            증거 목록 (강도순 정렬). 최상위 신호만 표시하며 누적 용량은
            무시됩니다.
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-2">
          <div className="space-y-2">
            {sorted.map((e, idx) => (
              <Card key={`${e.ingredientName}-${idx}`} className="rounded-xl">
                <CardContent className="space-y-2 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-medium">{e.ingredientName}</div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="rounded-xl">
                        {e.kind === "natural" ? "천연물" : "오프라벨"}
                      </Badge>
                      <Badge variant="outline" className="rounded-xl">
                        {e.studyType}
                      </Badge>
                      <Badge className="rounded-xl">
                        강도 {e.strength.toFixed(2)}
                      </Badge>
                    </div>
                  </div>

                  <div className="text-muted-foreground text-sm">
                    PMID: {e.pmid ?? "—"}
                  </div>

                  {e.note ? <div className="text-sm">{e.note}</div> : null}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline">닫기</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
