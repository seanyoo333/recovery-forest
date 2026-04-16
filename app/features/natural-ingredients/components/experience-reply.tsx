import { DotIcon, MessageCircleIcon, Trash2Icon } from "lucide-react";
import { DateTime } from "luxon";
import { useEffect, useRef, useState } from "react";
import { Form, Link } from "react-router";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "~/core/components/ui/avatar";
import { Button } from "~/core/components/ui/button";
import { Textarea } from "~/core/components/ui/textarea";
import { cn } from "~/core/lib/utils";

export interface ExperienceReplyNode {
  id: number;
  experienceId: number;
  parentId: number | null;
  authorName: string;
  authorUsername: string;
  authorAvatar: string | null;
  content: string;
  createdAt: string;
  replies: ExperienceReplyNode[];
}

interface ExperienceReplyProps {
  reply: ExperienceReplyNode;
  topLevel: boolean;
  isLoggedIn: boolean;
  currentUsername?: string;
  actionData?: { ok?: boolean; intent?: string } | undefined;
}

export function ExperienceReply({
  reply,
  topLevel,
  isLoggedIn,
  currentUsername,
  actionData,
}: ExperienceReplyProps) {
  const [replying, setReplying] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const deleteButtonRef = useRef<HTMLButtonElement>(null);
  const replyFormRef = useRef<HTMLFormElement>(null);
  const isAuthor = Boolean(currentUsername && currentUsername === reply.authorUsername);

  useEffect(() => {
    if (actionData?.ok) {
      setReplying(false);
      setShowDeleteConfirm(false);
    }
  }, [actionData?.ok]);

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
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDeleteConfirm]);

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
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [replying]);

  const handleDeleteClick = (e: React.MouseEvent) => {
    if (!showDeleteConfirm) {
      e.preventDefault();
      setShowDeleteConfirm(true);
    }
  };

  return (
    <div className="flex w-full flex-col gap-2">
      <div className={cn("flex items-start gap-5", topLevel && "md:w-2/3")}>
        <Link to={`/users/${reply.authorUsername}`}>
          <Avatar className="size-12">
            <AvatarFallback>{reply.authorName?.[0] || "?"}</AvatarFallback>
            {reply.authorAvatar ? <AvatarImage src={reply.authorAvatar} /> : null}
          </Avatar>
        </Link>
        <div className="flex w-full flex-col items-start gap-2">
          <div className="flex items-center gap-2">
            <Link to={`/users/${reply.authorUsername}`}>
              <h4 className="font-medium">{reply.authorName}</h4>
            </Link>
            <DotIcon className="size-5" />
            <span className="text-muted-foreground text-xs">
              {DateTime.fromISO(reply.createdAt, { zone: "Asia/Seoul" }).toRelative()}
            </span>
          </div>
          <p className="text-muted-foreground whitespace-pre-wrap">{reply.content}</p>
          <div className="flex items-center gap-2">
            {isLoggedIn ? (
              <Button variant="ghost" className="self-end" onClick={() => setReplying((v) => !v)}>
                <MessageCircleIcon className="size-4" />
                댓글 달기
              </Button>
            ) : null}
            {isLoggedIn && isAuthor ? (
              <Form method="post" className="inline">
                <input type="hidden" name="intent" value="delete-reply" />
                <input type="hidden" name="reply_id" value={reply.id} />
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
            ) : null}
          </div>
        </div>
      </div>

      {replying ? (
        <Form ref={replyFormRef} className="flex w-3/4 items-start gap-5" method="post">
          <input type="hidden" name="intent" value="create-reply" />
          <input type="hidden" name="experience_id" value={reply.experienceId} />
          <input type="hidden" name="parent_reply_id" value={reply.id} />
          <div className="flex w-full flex-col items-end gap-4">
            <Textarea
              autoFocus
              name="reply"
              placeholder="댓글을 입력해 주세요."
              className="w-full resize-none"
              defaultValue={`@${reply.authorUsername} `}
              rows={4}
            />
            <Button className="font-bold">댓글 달기</Button>
          </div>
        </Form>
      ) : null}

      {reply.replies.length > 0 ? (
        <div className={cn("w-full pl-14", topLevel && "pl-16")}>
          {reply.replies.map((childReply) => (
            <ExperienceReply
              key={childReply.id}
              reply={childReply}
              topLevel={false}
              isLoggedIn={isLoggedIn}
              currentUsername={currentUsername}
              actionData={actionData}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
