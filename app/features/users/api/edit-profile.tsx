/**
 * Edit Profile API Endpoint
 *
 * This file handles profile updates including avatar uploads and database updates.
 * The main logic is now in the form component, this API provides the endpoint.
 */
import { data } from "react-router";

import makeServerClient from "~/core/lib/supa-client.server";

import { getUserById } from "../queries";

export async function action({ request }: { request: Request }) {
  try {
    // Create a server-side Supabase client with the user's session
    const [client] = makeServerClient(request);

    // Get the authenticated user's information
    const {
      data: { user },
    } = await client.auth.getUser();

    // Validate request method and authentication
    if (request.method !== "POST") {
      return data(null, { status: 405 });
    }

    if (!user) {
      return data(null, { status: 401 });
    }

    // Extract form data
    const formData = await request.formData();
    const name = formData.get("name") as string;
    const avatar = formData.get("avatar") as File | null;
    const marketingConsent = formData.get("marketingConsent") === "on";
    const role = formData.get("role") as string | null;
    const headline = formData.get("headline") as string | null;
    const bio = formData.get("bio") as string | null;

    // Validate required fields
    if (!name || name.length < 1) {
      return data(
        { fieldErrors: { name: ["Name is required"] } },
        { status: 400 },
      );
    }

    // Get current profile
    const profile = await getUserById(client, { id: user.id });
    let avatarUrl = profile?.avatar || null;

    // Handle avatar upload
    if (
      avatar &&
      avatar instanceof File &&
      avatar.size > 0 &&
      avatar.size < 1024 * 1024 &&
      avatar.type.startsWith("image/")
    ) {
      const { error: uploadError } = await client.storage
        .from("avatars")
        .upload(user.id, avatar, { upsert: true });

      if (uploadError) {
        return data({ error: uploadError.message }, { status: 400 });
      }

      const {
        data: { publicUrl },
      } = await client.storage.from("avatars").getPublicUrl(user.id);
      avatarUrl = publicUrl;
    }

    // Update profile in database
    const { error: updateProfileError } = await client
      .from("profiles")
      .update({
        name,
        marketing_consent: marketingConsent,
        avatar: avatarUrl,
        role,
        headline,
        bio,
      })
      .eq("profile_id", user.id);

    if (updateProfileError) {
      return data({ error: updateProfileError.message }, { status: 400 });
    }

    // Update auth user metadata
    const { error: updateError } = await client.auth.updateUser({
      data: {
        name,
        display_name: name,
        marketing_consent: marketingConsent,
        avatar_url: avatarUrl,
        role,
        headline,
        bio,
      },
    });

    if (updateError) {
      return data({ error: updateError.message }, { status: 400 });
    }

    return { success: true };
  } catch (error) {
    return data({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
