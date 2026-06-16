import { Link, Outlet } from "react-router";

export default function NavigationLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="border-b border-gray-100 bg-white/90 backdrop-blur">
        <nav className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <Link to="/" className="font-bold text-emerald-700">
            회복의 숲
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link
              to="/prescribe"
              className="font-medium text-emerald-700 hover:text-emerald-800"
            >
              맞춤 처방 받기
            </Link>
            <Link to="/about" className="text-gray-700 hover:text-emerald-700">
              서비스 소개
            </Link>
          </div>
        </nav>
      </header>

      <div className="flex-1">
        <Outlet />
      </div>

      <footer className="mt-12 border-t border-gray-100 bg-gray-50">
        <div className="mx-auto max-w-5xl px-6 py-8 text-center text-sm text-gray-500">
          <p>© Evidence Base · 회복의 숲은 의료 진단을 제공하지 않습니다.</p>
          <p className="mt-1">
            데이터 출처: 산림청 · 기상청 · 에어코리아
          </p>
        </div>
      </footer>
    </div>
  );
}
