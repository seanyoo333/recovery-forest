import { redirect } from "react-router";

export function loader({ params }: { params: { clinicId: string } }) {
  return redirect(`/clinic/${params.clinicId}/overview`);
}
