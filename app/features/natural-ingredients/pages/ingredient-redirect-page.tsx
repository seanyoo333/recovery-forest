import type { Route } from "./+types/ingredient-redirect-page";

import { redirect } from "react-router";

export const loader = ({ params }: Route.LoaderArgs) => {
  return redirect(`/natural-ingredients/${params.slug}/overview`);
};
