import {
  ArrowLeft,
  CalendarDays,
  Leaf,
  LineChart,
  MapPin,
  Sparkles,
  Target,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";

import type { Route } from "./+types/prescribe-input-page";

import { KpomsbLevelGroup } from "../components/kpomsb-level-group";
import {
  COMFORT_INPUT_DEMO,
  EXPLORER_INPUT_DEMO,
} from "../fixtures/prescription-demo";
import {
  COMPANIONS,
  COMPANION_LABELS,
  SIMPLE_MOODS,
  TRANSPORT_LABELS,
  TRANSPORT_MODES,
  USER_TYPES,
  USER_TYPE_LABELS,
  USER_TYPE_TAGLINES,
  type Companion,
  type KpomsbAxis,
  type KpomsbScores,
  type PrescribeInput,
  type SimpleMoodKey,
  type TransportMode,
  type UserType,
} from "../schemas/prescribe-input.schema";
import { SIDO_CENTROIDS } from "../services/region-centroid";
import { cn } from "~/core/lib/utils";

export function meta(_args: Route.MetaArgs) {
  return [
    { title: "맞춤 처방 받기 · 회복의 숲" },
    {
      name: "description",
      content:
        "세 가지만 알려주시면 AI가 지금의 상태를 헤아려 나에게 맞는 치유의 숲을 찾아드립니다.",
    },
  ];
}

const SIDO_LIST = Object.keys(SIDO_CENTROIDS);
const QUICK_REGIONS = [
  { sido: "서울", sigungu: "강남구" },
  { sido: "경기", sigungu: "성남시" },
  { sido: "부산", sigungu: "해운대구" },
] as const;

const DEFAULT_KPOMSB: KpomsbScores = {
  긴장: 6,
  우울: 6,
  분노: 3,
  활력: 6,
  피로: 6,
  혼란: 6,
};
const MAX_TRAVEL_OPTIONS = [60, 90, 120, 240] as const;
const ARRIVAL_HOURS = [7, 8, 9, 10, 11, 13, 14, 15] as const;

const STEP_COUNT = 4;

export default function PrescribeInputPage() {
  const navigate = useNavigate();

  // 현재 스텝(0~3) · 전환 방향(패럴럭스 연출용)
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // --- 필수 ---
  const [moodKey, setMoodKey] = useState<SimpleMoodKey | "">("");
  const [note, setNote] = useState("");
  const [sido, setSido] = useState("");
  const [sigungu, setSigungu] = useState("");
  const [date, setDate] = useState("");
  const [consent, setConsent] = useState(false);

  // --- 정밀(선택) ---
  const [userTypeOverride, setUserTypeOverride] = useState<UserType | null>(null);
  const [kpomsb, setKpomsb] = useState<KpomsbScores>(DEFAULT_KPOMSB);
  const [arrivalHour, setArrivalHour] = useState(10);
  const [mode, setMode] = useState<TransportMode>("transit");
  const [maxTravel, setMaxTravel] = useState(90);
  const [prefs, setPrefs] = useState({
    wants_program: true,
    wants_food: true,
    wants_nearby: false,
  });
  const [companions, setCompanions] = useState<Companion>("solo");

  const mood = SIMPLE_MOODS.find((m) => m.key === moodKey) ?? null;
  const userType: UserType | null =
    userTypeOverride ?? (mood ? mood.userType : null);
  const healthGoal = mood?.healthGoal ?? "일반";

  const coords = sido ? SIDO_CENTROIDS[sido] : null;
  const locLabel = sigungu ? `${sido} ${sigungu}` : sido;

  function goNext() {
    setStep((s) => Math.min(s + 1, STEP_COUNT - 1));
  }
  function goBack() {
    setStep((s) => Math.max(s - 1, 0));
  }

  function selectMood(key: SimpleMoodKey) {
    setMoodKey(key);
    setUserTypeOverride(null);
    // 글로 남기는 중이 아니면 자연스럽게 다음으로 흘러가게.
    if (!note.trim()) goNext();
  }

  function submit() {
    if (!userType || !sido || !date || !consent) return;
    const params = new URLSearchParams();
    params.set("user_type", userType);
    params.set("health_goal", healthGoal);
    if (moodKey) params.set("mood", moodKey);
    if (locLabel) params.set("loc_label", locLabel);
    if (coords) {
      params.set("loc_lat", String(coords.lat));
      params.set("loc_lon", String(coords.lon));
    }
    params.set("sido", sido);
    if (sigungu) params.set("sigungu", sigungu);
    params.set("visit_date", date);
    params.set("arrival_hour", String(arrivalHour));
    if (note.trim()) params.set("note", note.trim());

    // "AI가 당신께 맞는 숲을 고르는 중..." — 잠시 머무는 순간을 의도적으로 둔다.
    setSubmitting(true);
    window.setTimeout(() => {
      navigate(`/prescribe/result?${params.toString()}`);
    }, 1600);
  }

  function fillExample(input: PrescribeInput) {
    setMoodKey(
      input.user_type === "explorer"
        ? "explore"
        : input.health_goal === "수면"
          ? "tired"
          : "calm",
    );
    setNote("");
    const [exSido, ...rest] = (input.location.label ?? "").split(" ");
    setSido(exSido || "서울");
    setSigungu(rest.join(" "));
    setDate(input.visit_plan.date);
    setConsent(input.consent.data_use_agreed);
    setUserTypeOverride(input.user_type);
    setKpomsb(input.kpomsb_pre);
    setArrivalHour(input.visit_plan.arrival_hour);
    setMode(input.transport.mode);
    setMaxTravel(input.transport.max_travel_minutes ?? 90);
    setPrefs({
      wants_program: input.preferences.wants_program,
      wants_food: input.preferences.wants_food,
      wants_nearby: input.preferences.wants_nearby,
    });
    setCompanions(input.preferences.companions ?? "solo");
    setStep(STEP_COUNT - 1);
  }

  const canLeaveOrigin = !!sido;
  const canLeaveDate = !!date && consent;

  return (
    <div className="relative isolate min-h-[calc(100vh-3.5rem)]">
      <StyleOnce />
      {/* 숲 배경 — 스텝마다 안개→햇빛 쪽으로 천천히 밀려 올라간다(패럴럭스). */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center transition-[transform,filter] duration-700 ease-out"
        style={{
          backgroundImage: "url(/recovery-forest.png)",
          transform: `translateY(${-step * 1.5}%) scale(1.06)`,
        }}
      />
      {/* 가독성 오버레이 + 따뜻한 베이지 그라데이션 */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-700"
        style={{
          background:
            "linear-gradient(180deg, rgba(40,52,42,0.42) 0%, rgba(40,52,42,0.18) 38%, rgba(60,66,48,0.5) 100%)",
        }}
      />

      <main className="relative z-10 mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-xl flex-col px-5 py-8 sm:py-12">
        {/* 진행 표시 — 점만, 은은하게 */}
        <div className="mb-6 flex items-center justify-center gap-2.5">
          {Array.from({ length: STEP_COUNT }).map((_, i) => (
            <span
              key={i}
              data-step-dot
              className={cn(
                "rounded-full transition-all duration-500",
                i === step
                  ? "h-2 w-6 bg-white"
                  : i < step
                    ? "size-2 bg-white/80"
                    : "size-2 bg-white/35",
              )}
            />
          ))}
        </div>

        {/* 글래스 카드 — 배경 위에 떠 있게 */}
        <div
          key={step}
          className="mf-step-enter flex flex-1 flex-col rounded-[1.75rem] border border-white/50 bg-white/80 p-6 shadow-2xl shadow-emerald-950/20 backdrop-blur-xl sm:p-8"
        >
          {step > 0 ? (
            <button
              type="button"
              onClick={goBack}
              className="mb-4 -ml-1 inline-flex w-fit items-center gap-1 rounded-full px-2 py-1 text-sm text-gray-500 transition hover:text-emerald-700"
            >
              <ArrowLeft className="size-4" aria-hidden />
              이전
            </button>
          ) : (
            <span className="mb-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-700/10 px-3 py-1 text-xs font-medium text-emerald-800">
              <Sparkles className="size-3.5" aria-hidden />
              AI가 지금의 상태를 헤아려 드려요
            </span>
          )}

          {step === 0 ? (
            <StepMood
              moodKey={moodKey}
              note={note}
              onSelect={selectMood}
              onNote={setNote}
              onNext={goNext}
              onFillComfort={() => fillExample(COMFORT_INPUT_DEMO)}
              onFillExplorer={() => fillExample(EXPLORER_INPUT_DEMO)}
            />
          ) : null}

          {step === 1 ? (
            <StepOrigin
              sido={sido}
              sigungu={sigungu}
              onSido={setSido}
              onSigungu={setSigungu}
              canNext={canLeaveOrigin}
              onNext={goNext}
            />
          ) : null}

          {step === 2 ? (
            <StepDate
              date={date}
              consent={consent}
              onDate={setDate}
              onConsent={setConsent}
              canNext={canLeaveDate}
              onNext={goNext}
              onSkip={submit}
            />
          ) : null}

          {step === 3 ? (
            <StepSurvey
              userType={userType}
              kpomsb={kpomsb}
              arrivalHour={arrivalHour}
              mode={mode}
              maxTravel={maxTravel}
              prefs={prefs}
              companions={companions}
              onUserType={setUserTypeOverride}
              onKpomsb={(axis, v) =>
                setKpomsb((prev) => ({ ...prev, [axis]: v }))
              }
              onArrivalHour={setArrivalHour}
              onMode={setMode}
              onMaxTravel={setMaxTravel}
              onPrefs={setPrefs}
              onCompanions={setCompanions}
              onSubmit={submit}
            />
          ) : null}
        </div>
      </main>

      {submitting ? <LoadingVeil /> : null}
    </div>
  );
}

/* ───────────────────────── 스텝 1 · 마음 ───────────────────────── */

function StepMood({
  moodKey,
  note,
  onSelect,
  onNote,
  onNext,
  onFillComfort,
  onFillExplorer,
}: {
  moodKey: SimpleMoodKey | "";
  note: string;
  onSelect: (key: SimpleMoodKey) => void;
  onNote: (v: string) => void;
  onNext: () => void;
  onFillComfort: () => void;
  onFillExplorer: () => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2.5">
        <h1 className="text-[1.7rem] leading-snug font-bold text-gray-900">
          오늘, 어떤 휴식이 필요하세요?
        </h1>
        <p className="text-[0.975rem] leading-relaxed text-gray-600">
          지금 마음에 가장 가까운 걸 가볍게 골라주세요. 나머지는 AI가 헤아려
          드릴게요.
        </p>
      </header>

      <div className="flex flex-col gap-3">
        {SIMPLE_MOODS.map((m) => {
          const selected = moodKey === m.key;
          return (
            <button
              key={m.key}
              type="button"
              onClick={() => onSelect(m.key)}
              aria-pressed={selected}
              className={cn(
                "flex flex-col items-start gap-1 rounded-2xl border-2 p-4 text-left transition duration-200 hover:scale-[1.01] hover:brightness-[1.02]",
                selected
                  ? "border-emerald-600 bg-emerald-50/80 shadow-sm"
                  : "border-emerald-900/10 bg-white/70 hover:border-emerald-400",
              )}
            >
              <span className="text-[1.05rem] font-semibold text-gray-900">
                {m.label}
              </span>
              <span className="text-sm leading-relaxed text-gray-500">
                {m.desc}
              </span>
            </button>
          );
        })}
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-gray-600">
          마음을 글로 남기고 싶으시면 적어주셔도 좋아요{" "}
          <span className="text-gray-400">(선택)</span>
        </span>
        <textarea
          value={note}
          onChange={(e) => onNote(e.target.value)}
          rows={2}
          maxLength={200}
          placeholder="예: 요즘 잠이 얕고 자꾸 지쳐요. 조용히 쉬고 싶어요."
          className="resize-none rounded-xl border border-gray-300/80 bg-white/80 p-3 text-base leading-relaxed outline-none focus:border-emerald-400"
        />
      </label>

      {note.trim() ? (
        <NextButton onClick={onNext} disabled={!moodKey} />
      ) : (
        <p className="text-center text-xs text-gray-400">
          하나를 고르면 다음으로 천천히 넘어가요.
        </p>
      )}

      <div className="flex flex-wrap items-center justify-center gap-2 border-t border-gray-200/70 pt-4 text-xs">
        <span className="text-gray-400">빠른 시연:</span>
        <button
          type="button"
          onClick={onFillComfort}
          className="rounded-full border border-emerald-300 px-3 py-1 font-medium text-emerald-700 transition hover:bg-emerald-50"
        >
          지친 분 예시
        </button>
        <button
          type="button"
          onClick={onFillExplorer}
          className="rounded-full border border-indigo-300 px-3 py-1 font-medium text-indigo-700 transition hover:bg-indigo-50"
        >
          여유로운 분 예시
        </button>
      </div>
    </div>
  );
}

/* ───────────────────────── 스텝 2 · 출발지 ───────────────────────── */

function StepOrigin({
  sido,
  sigungu,
  onSido,
  onSigungu,
  canNext,
  onNext,
}: {
  sido: string;
  sigungu: string;
  onSido: (v: string) => void;
  onSigungu: (v: string) => void;
  canNext: boolean;
  onNext: () => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2.5">
        <h1 className="text-[1.7rem] leading-snug font-bold text-gray-900">
          어디서 출발하세요?
        </h1>
        <p className="text-[0.975rem] leading-relaxed text-gray-600">
          출발지를 알면 오가는 길까지 헤아려 가까운 숲부터 살펴드려요.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-gray-700">시·도</span>
          <select
            value={sido}
            onChange={(e) => onSido(e.target.value)}
            className="h-12 rounded-xl border border-gray-300/80 bg-white/80 px-3 text-base outline-none focus:border-emerald-400"
          >
            <option value="">시·도 선택</option>
            {SIDO_LIST.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-gray-700">
            시·군·구 <span className="font-normal text-gray-400">(선택)</span>
          </span>
          <input
            type="text"
            value={sigungu}
            onChange={(e) => onSigungu(e.target.value)}
            placeholder="예: 강남구"
            className="h-12 rounded-xl border border-gray-300/80 bg-white/80 px-4 text-base outline-none focus:border-emerald-400"
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 text-xs text-gray-400">
          <MapPin className="size-3.5" aria-hidden />
          자주 찾는 지역
        </span>
        {QUICK_REGIONS.map((q) => (
          <button
            key={`${q.sido}-${q.sigungu}`}
            type="button"
            onClick={() => {
              onSido(q.sido);
              onSigungu(q.sigungu);
            }}
            className="rounded-full border border-gray-300 bg-white/70 px-3 py-1 text-sm text-gray-600 transition hover:border-emerald-300"
          >
            {q.sido} {q.sigungu}
          </button>
        ))}
      </div>

      <NextButton onClick={onNext} disabled={!canNext} />
    </div>
  );
}

/* ───────────────────────── 스텝 3 · 날짜 + 동의 ───────────────────────── */

function StepDate({
  date,
  consent,
  onDate,
  onConsent,
  canNext,
  onNext,
  onSkip,
}: {
  date: string;
  consent: boolean;
  onDate: (v: string) => void;
  onConsent: (v: boolean) => void;
  canNext: boolean;
  onNext: () => void;
  onSkip: () => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2.5">
        <h1 className="text-[1.7rem] leading-snug font-bold text-gray-900">
          언제 다녀오고 싶으세요?
        </h1>
        <p className="text-[0.975rem] leading-relaxed text-gray-600">
          그날의 공기와 미세먼지까지 살펴 가장 좋은 숲을 골라드려요.
        </p>
      </header>

      <label className="flex w-full flex-col gap-1.5 text-sm sm:max-w-xs">
        <span className="flex items-center gap-1.5 font-medium text-gray-700">
          <CalendarDays className="size-4" aria-hidden />
          방문 희망일
        </span>
        <input
          type="date"
          value={date}
          onChange={(e) => onDate(e.target.value)}
          className="h-12 rounded-xl border border-gray-300/80 bg-white/80 px-4 text-base outline-none focus:border-emerald-400"
        />
      </label>

      <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-gray-100/70 p-4 text-sm text-gray-600">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => onConsent(e.target.checked)}
          className="mt-0.5 size-5 accent-emerald-600"
        />
        <span>
          입력한 상태는 의료 진단이 아닌 주관적 자가보고이며, 맞춤 추천 생성에만
          활용하는 데 동의합니다.
        </span>
      </label>

      <div className="flex flex-col gap-3">
        <NextButton
          onClick={onNext}
          disabled={!canNext}
          label="기분도 살펴볼게요"
        />
        <button
          type="button"
          onClick={onSkip}
          disabled={!canNext}
          className="text-center text-sm text-gray-500 underline-offset-4 transition hover:text-emerald-700 hover:underline disabled:cursor-not-allowed disabled:text-gray-300"
        >
          설문은 건너뛰고 바로 처방 받기
        </button>
      </div>
    </div>
  );
}

/* ───────────────────────── 스텝 4 · 기분 설문(선택) ───────────────────────── */

function StepSurvey({
  userType,
  kpomsb,
  arrivalHour,
  mode,
  maxTravel,
  prefs,
  companions,
  onUserType,
  onKpomsb,
  onArrivalHour,
  onMode,
  onMaxTravel,
  onPrefs,
  onCompanions,
  onSubmit,
}: {
  userType: UserType | null;
  kpomsb: KpomsbScores;
  arrivalHour: number;
  mode: TransportMode;
  maxTravel: number;
  prefs: { wants_program: boolean; wants_food: boolean; wants_nearby: boolean };
  companions: Companion;
  onUserType: (t: UserType) => void;
  onKpomsb: (axis: KpomsbAxis, v: number) => void;
  onArrivalHour: (v: number) => void;
  onMode: (v: TransportMode) => void;
  onMaxTravel: (v: number) => void;
  onPrefs: (
    p: (prev: {
      wants_program: boolean;
      wants_food: boolean;
      wants_nearby: boolean;
    }) => {
      wants_program: boolean;
      wants_food: boolean;
      wants_nearby: boolean;
    },
  ) => void;
  onCompanions: (v: Companion) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2.5">
        <h1 className="text-[1.7rem] leading-snug font-bold text-gray-900">
          지금 기분을 살펴볼까요?
        </h1>
        <p className="text-[0.975rem] leading-relaxed text-gray-600">
          1~2분이면 충분해요. 적어주실수록 더 꼭 맞는 숲을 찾아드려요.
        </p>
      </header>

      <div className="flex flex-col gap-2 rounded-2xl bg-indigo-50/70 p-4 text-sm text-gray-700">
        <p className="flex items-start gap-2">
          <Target className="mt-0.5 size-4 shrink-0 text-indigo-600" aria-hidden />
          <span>
            <b>더 꼭 맞는 숲</b>을 찾아드려요 — 지금 상태에 맞춰 추천이
            정교해집니다.
          </span>
        </p>
        <p className="flex items-start gap-2">
          <LineChart className="mt-0.5 size-4 shrink-0 text-indigo-600" aria-hidden />
          <span>
            방문 후 같은 설문을 한 번 더 하면, <b>마음의 변화를 그래프</b>로
            확인할 수 있어요.
          </span>
        </p>
      </div>

      <Sub label="지금 기분 상태 (K-POMS-B)" hint="최근 일주일 기준">
        <KpomsbLevelGroup value={kpomsb} onChange={onKpomsb} />
      </Sub>

      <details className="rounded-2xl border border-gray-200/80 bg-white/60">
        <summary className="cursor-pointer list-none p-4 text-sm font-semibold text-gray-700">
          이동·동행 등 조금 더 맞춰볼까요{" "}
          <span className="font-normal text-gray-400">(선택)</span>
        </summary>
        <div className="flex flex-col gap-5 border-t border-gray-100 p-4">
          <Sub label="방문 성향">
            <div className="grid gap-2 sm:grid-cols-2">
              {USER_TYPES.map((t) => {
                const active = userType === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => onUserType(t)}
                    aria-pressed={active}
                    className={cn(
                      "flex flex-col items-start rounded-xl border-2 p-3 text-left transition",
                      active
                        ? "border-emerald-500 bg-emerald-50/60"
                        : "border-gray-200 bg-white hover:border-emerald-300",
                    )}
                  >
                    <span className="font-semibold text-gray-900">
                      {USER_TYPE_LABELS[t]}
                    </span>
                    <span className="text-xs text-gray-500">
                      {USER_TYPE_TAGLINES[t]}
                    </span>
                  </button>
                );
              })}
            </div>
          </Sub>

          <Sub label="이동">
            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-2 text-sm">
                <span className="w-20 text-gray-600">도착 시각</span>
                <select
                  value={arrivalHour}
                  onChange={(e) => onArrivalHour(Number(e.target.value))}
                  className="h-11 flex-1 rounded-lg border border-gray-300 bg-white px-3"
                >
                  {ARRIVAL_HOURS.map((h) => (
                    <option key={h} value={h}>
                      {h}시
                    </option>
                  ))}
                </select>
              </label>
              <ChipRow
                options={TRANSPORT_MODES.map((m) => ({
                  value: m,
                  label: TRANSPORT_LABELS[m],
                }))}
                value={mode}
                onSelect={(v) => onMode(v as TransportMode)}
              />
              <div className="flex flex-wrap gap-2">
                {MAX_TRAVEL_OPTIONS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => onMaxTravel(m)}
                    className={cn(
                      "min-h-9 rounded-full border px-3 text-sm transition",
                      maxTravel === m
                        ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                        : "border-gray-300 bg-white text-gray-600",
                    )}
                  >
                    {m >= 240 ? "4시간+" : `${m}분`}
                  </button>
                ))}
              </div>
            </div>
          </Sub>

          <Sub label="추천에 포함할 것 · 동행">
            <div className="flex flex-col gap-2">
              <ToggleRow
                label="산림치유 프로그램"
                checked={prefs.wants_program}
                onChange={(v) => onPrefs((p) => ({ ...p, wants_program: v }))}
              />
              <ToggleRow
                label="주변 맛집"
                checked={prefs.wants_food}
                onChange={(v) => onPrefs((p) => ({ ...p, wants_food: v }))}
              />
              <ToggleRow
                label="주변 관광·문화시설"
                checked={prefs.wants_nearby}
                onChange={(v) => onPrefs((p) => ({ ...p, wants_nearby: v }))}
              />
            </div>
            <div className="mt-3">
              <ChipRow
                options={COMPANIONS.map((c) => ({
                  value: c,
                  label: COMPANION_LABELS[c],
                }))}
                value={companions}
                onSelect={(v) => onCompanions(v as Companion)}
              />
            </div>
          </Sub>
        </div>
      </details>

      <button
        type="button"
        onClick={onSubmit}
        className="h-14 rounded-full bg-emerald-600 text-lg font-semibold text-white shadow-lg shadow-emerald-900/20 transition hover:bg-emerald-700 hover:brightness-105"
      >
        맞춤 숲 처방 받기
      </button>
    </div>
  );
}

/* ───────────────────────── 로딩 베일 ───────────────────────── */

function LoadingVeil() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-emerald-950/80 backdrop-blur-md">
      <span className="mf-leaf-pulse flex size-16 items-center justify-center rounded-full bg-white/10">
        <Leaf className="size-8 text-emerald-200" aria-hidden />
      </span>
      <p className="text-lg font-medium text-white">
        AI가 당신께 맞는 숲을 고르는 중...
      </p>
      <p className="text-sm text-emerald-100/70">잠시만 숨을 고르며 기다려 주세요</p>
    </div>
  );
}

/* ───────────────────────── 공용 ───────────────────────── */

function NextButton({
  onClick,
  disabled,
  label = "천천히 다음으로",
}: {
  onClick: () => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="h-14 rounded-full bg-emerald-600 text-lg font-semibold text-white shadow-lg shadow-emerald-900/20 transition enabled:hover:bg-emerald-700 enabled:hover:brightness-105 disabled:cursor-not-allowed disabled:bg-gray-300/80"
    >
      {label}
    </button>
  );
}

function Sub({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-semibold text-gray-800">{label}</span>
        {hint ? <span className="text-xs text-gray-400">{hint}</span> : null}
      </div>
      {children}
    </div>
  );
}

function ChipRow({
  options,
  value,
  onSelect,
}: {
  options: { value: string; label: string }[];
  value: string;
  onSelect: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onSelect(opt.value)}
            aria-pressed={selected}
            className={cn(
              "min-h-10 rounded-full border px-4 text-sm transition",
              selected
                ? "border-emerald-600 bg-emerald-600 text-white"
                : "border-gray-300 bg-white text-gray-700 hover:border-emerald-300",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
      className={cn(
        "flex items-center justify-between rounded-xl border px-4 py-3 text-sm transition",
        checked ? "border-emerald-300 bg-emerald-50/60" : "border-gray-200 bg-white",
      )}
    >
      <span className="font-medium text-gray-800">{label}</span>
      <span
        className={cn(
          "relative h-6 w-11 rounded-full transition",
          checked ? "bg-emerald-600" : "bg-gray-300",
        )}
        aria-hidden
      >
        <span
          className={cn(
            "absolute top-0.5 size-5 rounded-full bg-white shadow transition-all",
            checked ? "left-[1.375rem]" : "left-0.5",
          )}
        />
      </span>
    </button>
  );
}

/** 스텝 전환 페이드/슬라이드 + 로딩 잎 맥박 — 스코프 한정 키프레임. */
function StyleOnce() {
  return (
    <style>{`
      @keyframes mf-fade-up {
        from { opacity: 0; transform: translateY(14px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .mf-step-enter { animation: mf-fade-up 0.4s ease both; }
      @keyframes mf-leaf-pulse {
        0%, 100% { transform: scale(1); opacity: 0.85; }
        50% { transform: scale(1.12); opacity: 1; }
      }
      .mf-leaf-pulse { animation: mf-leaf-pulse 1.6s ease-in-out infinite; }
      @media (prefers-reduced-motion: reduce) {
        .mf-step-enter, .mf-leaf-pulse { animation: none; }
      }
    `}</style>
  );
}
