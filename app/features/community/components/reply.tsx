import type { action } from "../pages/post-page";

import { DotIcon, MessageCircleIcon, Trash2Icon } from "lucide-react";
import { DateTime } from "luxon";
import { useEffect, useRef, useState } from "react";
import { Form, Link, useActionData, useOutletContext } from "react-router";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "~/core/components/ui/avatar";
import { Button } from "~/core/components/ui/button";
import { Textarea } from "~/core/components/ui/textarea";

interface ReplyProps {
  name: string;
  username: string;
  avatarUrl: string | null;
  content: string;
  timestamp: string;
  topLevel: boolean;
  topLevelId: number;
  replyId: number;
  replies?: {
    post_reply_id: number;
    reply: string;
    created_at: string;
    user: {
      name: string;
      avatar: string | null;
      username: string;
    };
  }[];
}

export function Reply({
  name,
  username,
  avatarUrl,
  content,
  timestamp,
  topLevel,
  topLevelId,
  replyId,
  replies,
}: ReplyProps) {
  const actionData = useActionData<typeof action>();
  const [replying, setReplying] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const deleteButtonRef = useRef<HTMLButtonElement>(null);
  const replyFormRef = useRef<HTMLFormElement>(null);
  const toggleReplying = () => setReplying((prev) => !prev);
  const {
    isLoggedIn,
    name: loggedInName,
    username: loggedInUsername,
    avatar,
  } = useOutletContext<{
    isLoggedIn: boolean;
    name: string;
    username: string;
    avatar: string;
  }>();

  const isAuthor = loggedInUsername === username;

  useEffect(() => {
    if (actionData?.ok) {
      setReplying(false);
      setShowDeleteConfirm(false);
    }
  }, [actionData]);

  // 삭제 확인 상태에서 다른 곳 클릭 시 원래 상태로 복원
  useEffect(() => {
    if (!showDeleteConfirm) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        deleteButtonRef.current &&
        !deleteButtonRef.current.contains(event.target as Node)
      ) {
        setShowDeleteConfirm(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDeleteConfirm]);

  // 댓글 작성 상태에서 다른 곳 클릭 시 댓글창 닫기
  useEffect(() => {
    if (!replying) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        replyFormRef.current &&
        !replyFormRef.current.contains(event.target as Node)
      ) {
        setReplying(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [replying]);

  const handleDeleteClick = (e: React.MouseEvent) => {
    if (!showDeleteConfirm) {
      e.preventDefault();
      setShowDeleteConfirm(true);
    }
    // showDeleteConfirm이 true일 때는 form submit을 허용
  };

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex items-start gap-5 md:w-2/3">
        <Link to={`/users/${username}`}>
          <Avatar className="size-14">
            <AvatarFallback>{name?.[0] || "?"}</AvatarFallback>
            {avatarUrl ? <AvatarImage src={avatarUrl} /> : null}
          </Avatar>
        </Link>
        <div className="flex w-full flex-col items-start gap-2">
          <div className="flex items-center gap-2">
            <Link to={`/users/${username}`}>
              <h4 className="font-medium">{name}</h4>
            </Link>
            <DotIcon className="size-5" />
            <span className="text-muted-foreground text-xs">
              {DateTime.fromISO(timestamp, { zone: "Asia/Seoul" }).toRelative()}
            </span>
          </div>
          <p className="text-muted-foreground">{content}</p>
          <div className="flex items-center gap-2">
            {isLoggedIn ? (
              <Button
                variant="ghost"
                className="self-end"
                onClick={toggleReplying}
              >
                <MessageCircleIcon className="size-4" />
                댓글 달기
              </Button>
            ) : null}
            {isLoggedIn && isAuthor && (
              <Form method="post" className="inline">
                <input type="hidden" name="intent" value="delete" />
                <input type="hidden" name="replyId" value={replyId} />
                <Button
                  ref={deleteButtonRef}
                  type="submit"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={handleDeleteClick}
                >
                  <Trash2Icon className="size-4" />
                  {showDeleteConfirm ? "정말 삭제하시겠습니까?" : "삭제"}
                </Button>
              </Form>
            )}
          </div>
        </div>
      </div>
      {replying && (
        <Form
          ref={replyFormRef}
          className="flex w-3/4 items-start gap-5"
          method="post"
        >
          <input type="hidden" name="topLevelId" value={topLevelId} />
          <Avatar className="size-14">
            <AvatarFallback>{loggedInName?.[0] || "?"}</AvatarFallback>
            <AvatarImage src={avatar} />
          </Avatar>
          <div className="flex w-full flex-col items-end gap-5">
            <Textarea
              autoFocus
              name="reply"
              placeholder="Write a reply"
              className="w-full resize-none"
              defaultValue={`@${username} `}
              rows={5}
              onFocus={(e) => {
                // 커서를 username 뒤로 이동
                const mentionLength = `@${username} `.length;
                e.target.setSelectionRange(mentionLength, mentionLength);
              }}
            />
            <Button className="font-bold">댓글 달기</Button>
          </div>
        </Form>
      )}
      {topLevel && replies && (
        <div className="w-full pl-20">
          {replies.map((reply) => (
            <Reply
              key={reply.post_reply_id}
              name={reply.user.name}
              username={reply.user.username}
              avatarUrl={reply.user.avatar}
              content={reply.reply}
              timestamp={reply.created_at}
              topLevel={false}
              topLevelId={topLevelId}
              replyId={reply.post_reply_id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
