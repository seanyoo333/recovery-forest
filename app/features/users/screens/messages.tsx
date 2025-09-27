import type { Route } from "./+types/messages";

import { MessageCircleIcon } from "lucide-react";

export const meta: Route.MetaFunction = () => {
  return [{ title: "Messages | Evidence-Base" }];
};

export default function MessagesPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4">
      <MessageCircleIcon className="text-muted-foreground size-12" />
      <h1 className="text-muted-foreground text-xl font-semibold">
        메시지를 클릭하여 대화를 시작하세요.
      </h1>
    </div>
  );
}
