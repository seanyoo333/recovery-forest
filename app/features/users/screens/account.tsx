import type { Route } from "./+types/account";

import { Suspense, useState } from "react";
import { Await } from "react-router";
import { z } from "zod";

import makeServerClient from "~/core/lib/supa-client.server";

import ChangeEmailForm from "../components/forms/change-email-form";
import ChangePasswordForm from "../components/forms/change-password-form";
import ConnectSocialAccountsForm from "../components/forms/connect-social-accounts-form";
import DeleteAccountForm from "../components/forms/delete-account-form";
import EditProfileForm from "../components/forms/edit-profile-form";
import { updateUser, updateUserAvatar } from "../mutations";
import { getLoggedInUserId, getUserById } from "../queries";

export const meta: Route.MetaFunction = () => {
  return [{ title: `Account | ${import.meta.env.VITE_APP_NAME}` }];
};

export async function loader({ request }: Route.LoaderArgs) {
  const [client] = makeServerClient(request);
  const {
    data: { user },
  } = await client.auth.getUser();
  const identities = await client.auth.getUserIdentities();
  const profile = await getUserById(client, { id: user!.id });
  return {
    user,
    identities,
    profile,
  };
}

const formSchema = z.object({
  name: z.string().min(3),
  role: z.string(),
  headline: z.string().optional().default(""),
  bio: z.string().optional().default(""),
});

export const action = async ({ request }: Route.ActionArgs) => {
  const [client] = makeServerClient(request);
  const userId = await getLoggedInUserId(client);
  const formData = await request.formData();
  const avatar = formData.get("avatar");
  if (avatar && avatar instanceof File) {
    if (avatar.size <= 2097152 && avatar.type.startsWith("image/")) {
      const { data, error } = await client.storage
        .from("avatars")
        .upload(`${userId}/${Date.now()}`, avatar, {
          contentType: avatar.type,
          upsert: false,
        });
      if (error) {
        return { formErrors: { avatar: ["Failed to upload avatar"] } };
      }
      const {
        data: { publicUrl },
      } = await client.storage.from("avatars").getPublicUrl(data.path);
      await updateUserAvatar(client, {
        id: userId,
        avatarUrl: publicUrl,
      });
    } else {
      return { formErrors: { avatar: ["Invalid file size or type"] } };
    }
  } else {
    const { success, error, data } = formSchema.safeParse(
      Object.fromEntries(formData),
    );
    if (!success) {
      return { formErrors: error.flatten().fieldErrors };
    }
    const { name, role, headline, bio } = data;
    await updateUser(client, {
      id: userId,
      name,
      role: role as
        | "healthy"
        | "patient"
        | "caregiver"
        | "doctor"
        | "health_exp"
        | "other",
      headline,
      bio,
    });
    return {
      ok: true,
    };
  }
};

export default function Account({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const [avatar, setAvatar] = useState<string | null>(
    loaderData.profile?.avatar,
  );
  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const file = event.target.files[0];
      setAvatar(URL.createObjectURL(file));
    }
  };
  return (
    <div className="flex w-full flex-col items-center gap-10 pt-0 pb-8">
      <Suspense
        fallback={
          <div className="bg-card animate-fast-pulse h-60 w-full max-w-screen-md rounded-xl border shadow-sm" />
        }
      >
        <Await
          resolve={loaderData.profile}
          errorElement={
            <div className="text-red-500">Could not load profile</div>
          }
        >
          {(profile) => {
            if (!profile) {
              return null;
            }
            return (
              <EditProfileForm
                name={profile.name!}
                marketingConsent={profile.marketing_consent!}
                avatarUrl={profile.avatar!}
                role={profile.role!}
                headline={profile.headline}
                bio={profile.bio}
              />
            );
          }}
        </Await>
      </Suspense>
      <ChangeEmailForm email={loaderData.user?.email ?? ""} />
      <ChangePasswordForm
        hasPassword={
          loaderData.identities?.data?.identities?.some(
            (identity: any) => identity.provider === "email",
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
            <div className="text-red-500">Could not load social accounts</div>
          }
        >
          {({ data, error }) => {
            if (!data) {
              return (
                <div className="text-red-500">
                  <span>Could not load social accounts</span>
                  <span className="text-xs">Code: {error.code}</span>
                  <span className="text-xs">Message: {error.message}</span>
                </div>
              );
            }
            return (
              <ConnectSocialAccountsForm
                providers={data.identities
                  .filter((identity) => identity.provider !== "email")
                  .map((identity) => identity.provider)}
              />
            );
          }}
        </Await>
      </Suspense>
      <DeleteAccountForm />
    </div>
  );
}
