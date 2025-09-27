import type { Route } from "./+types/leaderboard-layout";

import { Outlet, data, useOutletContext } from "react-router";
import { z } from "zod";

const searchParamsSchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
});

export const loader = async ({ request }: Route.LoaderArgs) => {
  const url = new URL(request.url);
  const { success, data: parsedData } = searchParamsSchema.safeParse(
    Object.fromEntries(url.searchParams),
  );
  if (!success) {
    throw data(
      {
        error_code: "Invalid_page",
        message: "Invalid page",
      },
      { status: 400 },
    );
  }

  return { page: parsedData.page };
};
/* 문제의 원인:
leaderboard-layout.tsx의 loader 함수가 성공 시에 아무것도 반환하지 않고 있었습니다. 
React Router의 loader 함수는 항상 데이터를 반환해야 하는데, 반환하지 않으면 undefined가 되어 에러가 발생합니다.
해결 방법:
loader 함수에서 parsedData.page를 반환하도록 수정했습니다.
이제 loader가 성공적으로 데이터를 반환하므로 에러가 발생하지 않습니다.
왜 홈에서 제품으로 이동할 때는 문제가 없었나요?
클라이언트 사이드 네비게이션에서는 loader가 호출되지 않거나, 다른 방식으로 처리되기 때문에 문제가 없었습니다.
하지만 새로고침 시에는 서버에서 loader가 호출되면서 에러가 발생했습니다.
이제 leaderboard 페이지에서 새로고침을 해도 에러가 발생하지 않을 것입니다. */

export default function LeaderboardLayout() {
  const { isLoggedIn } = useOutletContext<{
    isLoggedIn: boolean;
  }>();
  return <Outlet context={{ isLoggedIn }} />;
}
