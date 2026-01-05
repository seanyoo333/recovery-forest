import { StarIcon } from "lucide-react";
import { DateTime } from "luxon";
import { Link } from "react-router";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "~/core/components/ui/avatar";

interface ReviewCardProps {
  username: string;
  handle: string;
  avatarUrl: string | null;
  rating: number;
  patientFriendliness: number;
  content: string;
  postedAt: string;
}

export default function ReviewCard({
  username,
  handle,
  avatarUrl,
  rating,
  patientFriendliness,
  content,
  postedAt,
}: ReviewCardProps) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Link to={`/users/${handle}`}>
          <Avatar>
            <AvatarFallback>{username.charAt(0)}</AvatarFallback>
            {avatarUrl ? <AvatarImage src={avatarUrl} /> : null}
          </Avatar>
        </Link>
        <div>
          <Link to={`/users/${handle}`}>
            <h4 className="text-lg font-bold">{username}</h4>
          </Link>
          <p className="text-muted-foreground text-sm">{handle}</p>
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground text-xs">전체 평점</span>
            <div className="flex text-yellow-400">
              {Array.from({ length: rating }).map((_, i) => (
                <StarIcon key={i} className="size-4" fill="currentColor" />
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground text-xs">환자 친화도</span>
            <div className="flex text-blue-400">
              {Array.from({ length: patientFriendliness }).map((_, i) => (
                <StarIcon key={i} className="size-4" fill="currentColor" />
              ))}
            </div>
          </div>
        </div>
      </div>
      <p className="text-muted-foreground">{content}</p>
      <span className="text-muted-foreground text-xs">
        {DateTime.fromISO(postedAt, {
          zone: "utc",
        }).toRelative()}
      </span>
    </div>
  );
}
