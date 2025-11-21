import type { Route } from "./+types/account";

import { Suspense } from "react";
import { Await } from "react-router";

import makeServerClient from "~/core/lib/supa-client.server";

import ChangeEmailForm from "../components/forms/change-email-form";
import ChangePasswordForm from "../components/forms/change-password-form";
import ConnectSocialAccountsForm from "../components/forms/connect-social-accounts-form";
import DeleteAccountForm from "../components/forms/delete-account-form";

export const meta: Route.MetaFunction = () => {
  return [{ title: `Account | ${import.meta.env.VITE_APP_NAME}` }];
};

export async function loader({ request }: Route.LoaderArgs) {
  const [client] = makeServerClient(request);
  const {
    data: { user },
  } = await client.auth.getUser();
  const identities = await client.auth.getUserIdentities();
  return {
    user,
    identities,
  };
}

export default function Account({ loaderData }: Route.ComponentProps) {
  return (
    <div className="flex w-full flex-col items-center gap-10 pt-0 pb-8">
      <ChangeEmailForm email={loaderData.user?.email ?? ""} />
      <ChangePasswordForm
        hasPassword={
          loaderData.identities?.data?.identities?.some(
            (identity: { provider: string }) => identity.provider === "email",
          ) ?? false
        }
      />
      <Suspense
        fallback={
          <div className="bg-card animate-fast-pulse h-60 w-full max-w-screen-md rounded-xl border shadow-sm" />
        }
      >
        <Await
          resolve={loaderData.identities}
          errorElement={
            <div className="text-red-500">
              소셜 계정 정보를 불러올 수 없습니다
            </div>
          }
        >
          {({ data, error }) => {
            if (!data) {
              return (
                <div className="text-red-500">
                  <span>소셜 계정 정보를 불러올 수 없습니다</span>
                  <span className="text-xs">코드: {error.code}</span>
                  <span className="text-xs">메시지: {error.message}</span>
                </div>
              );
            }
            return (
              <ConnectSocialAccountsForm
                providers={data.identities
                  .filter(
                    (identity: { provider: string }) =>
                      identity.provider !== "email",
                  )
                  .map((identity: { provider: string }) => identity.provider)}
              />
            );
          }}
        </Await>
      </Suspense>
      <DeleteAccountForm />
    </div>
  );
}
