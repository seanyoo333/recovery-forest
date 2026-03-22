import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "~/core/lib/supa-client.server";

export const updateUser = async (
  client: SupabaseClient<Database>,
  {
    id,
    name,
    role,
    headline,
    bio,
  }: {
    id: string;
    name: string;
    role:
      | "healthy"
      | "patient"
      | "caregiver"
      | "doctor"
      | "health_exp"
      | "other";
    headline: string;
    bio: string;
  },
) => {
  const { error } = await client
    .from("profiles")
    .update({ name, role, headline, bio })
    .eq("profile_id", id);
  if (error) {
    throw error;
  }
};

export const updateUserAvatar = async (
  client: SupabaseClient<Database>,
  {
    id,
    avatarUrl,
  }: {
    id: string;
    avatarUrl: string;
  },
) => {
  const { error } = await client
    .from("profiles")
    .update({ avatar: avatarUrl })
    .eq("profile_id", id);
  if (error) {
    throw error;
  }
};

export const seeNotification = async (
  client: SupabaseClient<Database>,
  { userId, notificationId }: { userId: string; notificationId: string },
) => {
  const { error } = await client
    .from("notifications")
    .update({ seen: true })
    .eq("notification_id", parseInt(notificationId))
    .eq("target_id", userId);
  if (error) {
    throw error;
  }
};

/* export const isReadMessage = async (
  client: SupabaseClient<Database>,
  { userId, messageId }: { userId: string; messageId: string },
) => {
  const { error } = await client
    .from("messages")
    .update({ is_read: true })
    .eq("message_id", messageId)
    .eq("target_id", userId);
  if (error) {
    throw error;
  }
}; */

export const isReadMessageRoom = async (
  client: SupabaseClient<Database>,
  { userId, messageRoomId }: { userId: string; messageRoomId: string },
) => {
  const { error } = await client
    .from("message_room_members")
    .update({ is_read: true })
    .eq("message_room_id", parseInt(messageRoomId))
    .eq("profile_id", userId);
  if (error) {
    throw error;
  }
};

export const hideMessageRoom = async (
  client: SupabaseClient<Database>,
  { userId, messageRoomId }: { userId: string; messageRoomId: string },
) => {
  const { error } = await client
    .from("message_room_members")
    .update({ is_hidden: true })
    .eq("message_room_id", parseInt(messageRoomId))
    .eq("profile_id", userId);
  if (error) {
    throw error;
  }
};

/* export const deleteNotification = async (
  client: SupabaseClient<Database>,
  { userId, notificationId }: { userId: string; notificationId: string },
) => {
  const { error } = await client
    .from("notifications")
    .delete()
    .eq("notification_id", notificationId)
    .eq("target_id", userId);
  if (error) {
    throw error;
  }
}; */

export const sendMessage = async (
  client: SupabaseClient<Database>,
  {
    fromUserId,
    toUserId,
    content,
  }: { fromUserId: string; toUserId: string; content: string },
) => {
  const { data, error } = await client
    .rpc("get_room", {
      from_user_id: fromUserId,
      to_user_id: toUserId,
    })
    .maybeSingle();
  if (error) {
    throw error;
  }
  if (data?.message_room_id) {
    // 기존 숨겨진 룸을 다시 활성화 - 보낸 사람은 읽음
    const { data: updateData, error: updateError } = await client
      .from("message_room_members")
      .update({
        is_hidden: false,
        is_read: true, // 새 메시지를 보냈으므로 보낸 사람은 읽음 상태
      })
      .eq("message_room_id", data.message_room_id)
      .eq("profile_id", fromUserId)
      .select();

    // 받는 사람은 읽지 않음 상태로 유지
    await client
      .from("message_room_members")
      .update({
        is_hidden: false,
        is_read: false, // 받는 사람은 읽지 않음 상태
      })
      .eq("message_room_id", data.message_room_id)
      .neq("profile_id", fromUserId);

    await client.from("messages").insert({
      message_room_id: data.message_room_id,
      sender_id: fromUserId,
      content,
    });
    return data.message_room_id;
  } else {
    const { data: roomData, error: roomError } = await client
      .from("message_rooms")
      .insert({})
      .select("message_room_id")
      .single();
    if (roomError) {
      throw roomError;
    }
    await client.from("message_room_members").insert([
      {
        message_room_id: roomData.message_room_id,
        profile_id: fromUserId,
        is_read: true, // 보낸 사람은 이미 읽음 상태
        is_hidden: false,
      },
      {
        message_room_id: roomData.message_room_id,
        profile_id: toUserId,
        is_read: false, // 받는 사람은 읽지 않음 상태
        is_hidden: false,
      },
    ]);
    await client.from("messages").insert({
      message_room_id: roomData.message_room_id,
      sender_id: fromUserId,
      content,
    });
    return roomData.message_room_id;
  }
};

/* export const sendMessage = async (
  client: SupabaseClient<Database>,
  {
    fromUserId,
    toUserId,
    content,
  }: { fromUserId: string; toUserId: string; content: string },
) => {
  const { data, error } = await client
    .rpc("get_room", {
      from_user_id: fromUserId,
      to_user_id: toUserId,
    })
    .maybeSingle();
  if (error) {
    throw error;
  }
  if (data?.message_room_id) {
    await client.from("messages").insert({
      message_room_id: data.message_room_id,
      sender_id: fromUserId,
      content,
    });
    return data.message_room_id;
  } else {
    const { data: roomData, error: roomError } = await client
      .from("message_rooms")
      .insert({})
      .select("message_room_id")
      .single();
    if (roomError) {
      throw roomError;
    }
    await client.from("message_room_members").insert([
      {
        message_room_id: roomData.message_room_id,
        profile_id: fromUserId,
      },
      {
        message_room_id: roomData.message_room_id,
        profile_id: toUserId,
      },
    ]);
    await client.from("messages").insert({
      message_room_id: roomData.message_room_id,
      sender_id: fromUserId,
      content,
    });
    return roomData.message_room_id;
  }
}; */

export const toggleFollow = async (
  client: SupabaseClient<Database>,
  { userId, targetId }: { userId: string; targetId: string },
) => {
  const { count, error } = await client
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("follower_id", userId)
    .eq("following_id", targetId);
  if (error) {
    throw error;
  }
  if (count === 0) {
    await client
      .from("follows")
      .insert({ follower_id: userId, following_id: targetId });
  } else {
    await client
      .from("follows")
      .delete()
      .eq("follower_id", userId)
      .eq("following_id", targetId);
  }
};

/* export const updateProfile = async (
  client: SupabaseClient<Database>,
  {
    id,
    name,
    role,
    headline,
    bio,
    marketingConsent,
    avatar,
  }: {
    id: string;
    name: string;
    role:
      | "healthy"
      | "patient"
      | "caregiver"
      | "doctor"
      | "health_exp"
      | "other";
    headline: string | null;
    bio: string | null;
    marketingConsent: boolean;
    avatar?: File;
  },
) => {
  let avatarUrl: string | null = null;

  // Handle avatar upload if provided
  if (avatar && avatar instanceof File && avatar.size > 0) {
    if (avatar.size > 1024 * 1024) {
      throw new Error("Avatar file size must be less than 1MB");
    }
    if (!avatar.type.startsWith("image/")) {
      throw new Error("Avatar must be an image file");
    }

    // Upload avatar to Supabase Storage
    const { error: uploadError } = await client.storage
      .from("avatars")
      .upload(id, avatar, {
        upsert: true,
      });

    if (uploadError) {
      throw uploadError;
    }

    // Get public URL for the uploaded avatar
    const {
      data: { publicUrl },
    } = await client.storage.from("avatars").getPublicUrl(id);
    avatarUrl = publicUrl;
  }

  // Update profile in database
  const { error: profileError } = await client
    .from("profiles")
    .update({
      name,
      role,
      headline,
      bio,
      marketing_consent: marketingConsent,
      ...(avatarUrl && { avatar: avatarUrl }),
    })
    .eq("profile_id", id);

  if (profileError) {
    throw profileError;
  }

  // Update auth user metadata
  const { error: authError } = await client.auth.updateUser({
    data: {
      name,
      display_name: name,
      marketing_consent: marketingConsent,
      role,
      headline,
      bio,
      ...(avatarUrl && { avatar_url: avatarUrl }),
    },
  });

  if (authError) {
    throw authError;
  }

  return { avatarUrl };
};
 */
