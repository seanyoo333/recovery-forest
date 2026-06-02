import { Link, useSearchParams } from "react-router";

export function meta() {
  return [{ title: "오류 · 회복의 숲" }];
}

export default function ErrorPage() {
  const [searchParams] = useSearchParams();
  const errorCode = searchParams.get("error_code");
  const errorDescription = searchParams.get("error_description");

  return (
    <main className="mx-auto flex max-w-xl flex-col items-center gap-4 px-6 py-20 text-center">
      <h1 className="text-2xl font-semibold text-red-700">문제가 발생했어요</h1>
      {errorCode ? (
        <p className="text-sm text-gray-500">오류 코드: {errorCode}</p>
      ) : null}
      {errorDescription ? (
        <p className="text-gray-700">{errorDescription}</p>
      ) : (
        <p className="text-gray-700">잠시 후 다시 시도해주세요.</p>
      )}
      <Link
        to="/"
        className="mt-2 inline-flex h-12 items-center rounded-full bg-emerald-600 px-6 text-white"
      >
        처음으로 돌아가기
      </Link>
    </main>
  );
}
