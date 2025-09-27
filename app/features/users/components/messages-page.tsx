import type { Route } from "./+types/messages-page";

import { MessageCircleIcon } from "lucide-react";

export const meta: Route.MetaFunction = () => {
  return [{ title: "Messages | wemake" }];
};

export default function MessagesPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4">
      <MessageCircleIcon className="text-muted-foreground size-12" />
      <h1 className="text-muted-foreground text-xl font-semibold">
        Click on a message in the sidebar to view it.
      </h1>
    </div>
  );
}
