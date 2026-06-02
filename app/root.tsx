import "./app.css";

import type { Route } from "./+types/root";

import { Settings } from "luxon";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
} from "react-router";
import { Toaster } from "sonner";

export const links: Route.LinksFunction = () => [
  { rel: "icon", href: "/favicon.ico" },
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Geist:wght@100..900&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  Settings.defaultLocale = "ko";
  Settings.defaultZone = "Asia/Seoul";
  return (
    <html lang="ko" className="h-full">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="h-full bg-white text-gray-900 antialiased">
        {children}
        <Toaster richColors position="bottom-right" />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let title = "문제가 발생했어요";
  let message = "잠시 후 다시 시도해주세요.";

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      title = "페이지를 찾을 수 없어요";
      message = "주소를 다시 확인해주세요.";
    } else {
      title = `오류 ${error.status}`;
      message = error.statusText || message;
    }
  } else if (import.meta.env.DEV && error instanceof Error) {
    message = error.message;
  }

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-4 px-6 py-20 text-center">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="text-gray-600">{message}</p>
      <a
        href="/"
        className="mx-auto inline-flex h-12 items-center rounded-full bg-emerald-600 px-6 text-white"
      >
        처음으로 돌아가기
      </a>
    </main>
  );
}
