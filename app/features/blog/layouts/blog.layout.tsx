import { ChevronsRightIcon } from "lucide-react";
import { Link, Outlet } from "react-router";

function BlogNav() {
  const appName = (import.meta.env.VITE_APP_NAME ?? "Evidence Base").replaceAll(
    "-",
    " ",
  );

  return (
    <nav className="mx-auto flex h-16 items-center justify-between border-b px-5 shadow-xs backdrop-blur-lg transition-opacity md:px-10">
      <div className="mx-auto flex h-full w-full max-w-screen-2xl items-center justify-between py-3">
        <h1 className="flex items-center gap-2 text-lg">
          <Link
            to="/"
            className="text-muted-foreground text-lg font-extrabold"
            viewTransition
          >
            {appName}
          </Link>
          <ChevronsRightIcon className="text-muted-foreground size-4" />
          <Link to="/blog-posts" className="font-semibold" viewTransition>
            좋은습관 블로그
          </Link>
        </h1>
      </div>
    </nav>
  );
}

export default function BlogLayout() {
  return (
    <>
      <BlogNav />
      <div className="mx-auto w-full max-w-screen-2xl px-5 py-16 md:px-10">
        <Outlet />
      </div>
    </>
  );
}
