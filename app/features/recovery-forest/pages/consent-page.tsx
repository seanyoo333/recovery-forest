import { useState } from "react";
import { Form, useActionData, useNavigation } from "react-router";

import type { Route } from "./+types/consent-page";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "산림치유 여정 시작 · 회복의 숲" }];
}

type ActionError = { ok: false; error: { code: string; message: string } };

export default function ConsentPage() {
  const navigation = useNavigation();
  const actionData = useActionData() as ActionError | undefined;
  const [agreed, setAgreed] = useState(false);

  const isSubmitting =
    navigation.state === "submitting" &&
    navigation.formAction === "/api/journey-start";

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-12">
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold">산림치유 회복 여정을 시작해요</h1>
        <p className="text-gray-600">
          사전 자가보고 → 맞춤 처방 → 다녀온 뒤 사후 자가보고 →
          변화 리포트까지, 나의 회복 데이터를 함께 쌓아갑니다.
        </p>
      </header>

      {actionData?.ok === false ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {actionData.error.message}
        </div>
      ) : null}

      <section className="rounded-xl border border-gray-200 bg-gray-50 p-5 text-sm leading-relaxed text-gray-700">
        <h2 className="mb-2 text-base font-semibold">수집·이용 안내</h2>
        <ul className="flex list-disc flex-col gap-1 pl-5">
          <li>
            수면·피로·기분·스트레스 등 <strong>주관적 자가보고 점수</strong>를
            수집합니다. 이는 <strong>의학적 진단이 아닙니다.</strong>
          </li>
          <li>수집 목적: 맞춤 산림치유 처방과 방문 전후 변화 비교 리포트 제공</li>
          <li>이메일은 리포트 링크 발송 용도로만 사용하며, 입력은 선택입니다.</li>
          <li>건강 상태에 대한 판단은 반드시 전문의와 상담하세요.</li>
        </ul>
      </section>

      <Form
        method="post"
        action="/api/journey-start"
        className="flex flex-col gap-6"
      >
        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="text-lg font-semibold">
            이메일 <span className="text-sm font-normal text-gray-400">(선택)</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="리포트를 받을 이메일 (비워도 됩니다)"
            className="h-12 rounded-lg border border-gray-300 px-4 text-base"
          />
        </div>

        <label className="flex items-start gap-3 rounded-lg border border-gray-300 p-4">
          <input
            type="checkbox"
            name="consent_agreed"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-1 size-5 accent-emerald-600"
          />
          <span className="text-sm text-gray-700">
            위 안내를 확인했으며, 자가보고 데이터 수집·이용에 동의합니다.
          </span>
        </label>

        <button
          type="submit"
          disabled={!agreed || isSubmitting}
          className="h-14 rounded-full bg-emerald-600 text-lg font-semibold text-white shadow-lg transition enabled:hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {isSubmitting ? "여정을 준비하고 있어요…" : "동의하고 시작하기"}
        </button>
      </Form>
    </main>
  );
}
