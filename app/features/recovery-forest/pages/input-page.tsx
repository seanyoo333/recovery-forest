import { useState } from "react";
import { Form, useActionData, useNavigation } from "react-router";

import type { Route } from "./+types/input-page";

import {
  ACTIVITY_LABELS,
  FITNESS_LABELS,
  HEALTH_PRIORITIES,
  PREFERRED_ACTIVITIES,
  PRIORITY_LABELS,
  TRAVEL_TIMES,
  FITNESS_LEVELS,
} from "../schemas/input.schema";
import type {
  HealthPriority,
  FitnessLevel,
  PreferredActivity,
} from "../schemas/input.schema";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "추천 받기 · 회복의 숲" }];
}

type ActionError = {
  ok: false;
  error: { code: string; message: string };
};

export default function InputPage() {
  const navigation = useNavigation();
  const actionData = useActionData() as ActionError | undefined;

  const [priorities, setPriorities] = useState<HealthPriority[]>([]);
  const [fitness, setFitness] = useState<FitnessLevel | "">("");
  const [travelTime, setTravelTime] = useState<number | "">("");
  const [activity, setActivity] = useState<PreferredActivity | "">("");
  const [sido, setSido] = useState("");
  const [sigungu, setSigungu] = useState("");

  const isSubmitting =
    navigation.state === "submitting" &&
    navigation.formAction === "/api/recommend";

  const canSubmit =
    !!sido &&
    !!sigungu &&
    priorities.length >= 1 &&
    !!fitness &&
    !!travelTime &&
    !!activity &&
    !isSubmitting;

  const togglePriority = (p: HealthPriority) => {
    setPriorities((prev) => {
      if (prev.includes(p)) return prev.filter((x) => x !== p);
      if (prev.length >= 3) return prev;
      return [...prev, p];
    });
  };

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-10 px-6 py-12">
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold">오늘의 회복 숲을 찾을게요</h1>
        <p className="text-gray-600">
          30초 안에 입력하고 맞춤 추천을 받아보세요.
        </p>
      </header>

      {actionData?.ok === false ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {actionData.error.message}
        </div>
      ) : null}

      <Form method="post" action="/api/recommend" className="flex flex-col gap-8">
        <Fieldset label="현재 지역" hint="시·도와 시·군·구를 선택해주세요">
          <div className="grid gap-3 md:grid-cols-2">
            <input
              name="user_sido"
              value={sido}
              onChange={(e) => setSido(e.target.value)}
              placeholder="시·도 (예: 서울)"
              className="h-12 rounded-lg border border-gray-300 px-4 text-base"
            />
            <input
              name="user_sigungu"
              value={sigungu}
              onChange={(e) => setSigungu(e.target.value)}
              placeholder="시·군·구 (예: 강북구)"
              className="h-12 rounded-lg border border-gray-300 px-4 text-base"
            />
          </div>
        </Fieldset>

        <Fieldset
          label="건강 관심 우선순위"
          hint={`최대 3개 선택 (${priorities.length}/3)`}
        >
          <div className="flex flex-wrap gap-2">
            {HEALTH_PRIORITIES.map((p) => {
              const selected = priorities.includes(p);
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => togglePriority(p)}
                  className={`min-h-11 rounded-full border px-4 py-2 text-sm transition ${
                    selected
                      ? "border-emerald-600 bg-emerald-600 text-white"
                      : "border-gray-300 bg-white text-gray-700"
                  }`}
                >
                  {PRIORITY_LABELS[p]}
                </button>
              );
            })}
          </div>
          {priorities.map((p) => (
            <input key={p} type="hidden" name="user_priorities" value={p} />
          ))}
        </Fieldset>

        <Fieldset label="체력 수준">
          <RadioGroup
            name="user_fitness_level"
            value={fitness}
            onChange={(v) => setFitness(v as FitnessLevel)}
            options={FITNESS_LEVELS.map((v) => ({
              value: v,
              label: FITNESS_LABELS[v],
            }))}
          />
        </Fieldset>

        <Fieldset label="이동 가능 시간">
          <RadioGroup
            name="user_travel_time_min"
            value={travelTime === "" ? "" : String(travelTime)}
            onChange={(v) => setTravelTime(Number(v))}
            options={TRAVEL_TIMES.map((v) => ({
              value: String(v),
              label: v === 120 ? "2시간 이상" : `${v}분`,
            }))}
          />
        </Fieldset>

        <Fieldset label="선호 활동">
          <RadioGroup
            name="user_preferred_activity"
            value={activity}
            onChange={(v) => setActivity(v as PreferredActivity)}
            options={PREFERRED_ACTIVITIES.map((v) => ({
              value: v,
              label: ACTIVITY_LABELS[v],
            }))}
          />
        </Fieldset>

        <button
          type="submit"
          disabled={!canSubmit}
          className="h-14 rounded-full bg-emerald-600 text-lg font-semibold text-white shadow-lg transition enabled:hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {isSubmitting ? "오늘의 숲을 분석하고 있어요…" : "추천 받기"}
        </button>
      </Form>
    </main>
  );
}

function Fieldset({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <legend className="text-lg font-semibold">{label}</legend>
        {hint ? <span className="text-sm text-gray-500">{hint}</span> : null}
      </div>
      {children}
    </fieldset>
  );
}

function RadioGroup({
  name,
  value,
  onChange,
  options,
}: {
  name: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <label
            key={opt.value}
            className={`flex min-h-11 cursor-pointer items-center rounded-full border px-5 py-2 text-sm transition ${
              selected
                ? "border-emerald-600 bg-emerald-600 text-white"
                : "border-gray-300 bg-white text-gray-700"
            }`}
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={selected}
              onChange={() => onChange(opt.value)}
              className="sr-only"
            />
            {opt.label}
          </label>
        );
      })}
    </div>
  );
}
