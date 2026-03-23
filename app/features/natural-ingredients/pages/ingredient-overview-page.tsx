import { useOutletContext } from "react-router";

type IngredientContext = {
  ingredient: {
    display_name: string;
    tagline: string | null;
    description: string | null;
    mechanism: string | null;
    safety_notes: string | null;
    interaction_notes: string | null;
    picture: string | null;
  };
};

export default function IngredientOverviewPage() {
  const { ingredient } = useOutletContext<IngredientContext>();

  const description = ingredient.description ?? ingredient.tagline ?? "";
  const mechanism = ingredient.mechanism ?? "";
  const safetyNotes = ingredient.safety_notes ?? "";
  const interactionNotes = ingredient.interaction_notes ?? "";

  return (
    <div className="mx-auto max-w-screen-md space-y-8">
      {ingredient.picture && (
        <div className="flex justify-center">
          <img
            src={ingredient.picture}
            alt={ingredient.display_name}
            className="h-40 w-40 rounded-xl object-cover"
          />
        </div>
      )}

      {description && (
        <div className="space-y-2">
          <h2 className="text-lg font-bold">이 천연물질은 무엇인가요?</h2>
          <p className="text-muted-foreground whitespace-pre-wrap">
            {description}
          </p>
        </div>
      )}

      {mechanism && (
        <div className="space-y-2">
          <h2 className="text-lg font-bold">어떤 기전 연구가 있나요?</h2>
          <p className="text-muted-foreground whitespace-pre-wrap">
            {mechanism}
          </p>
        </div>
      )}

      {safetyNotes && (
        <div className="space-y-2">
          <h2 className="text-lg font-bold">주의사항</h2>
          <p className="text-muted-foreground whitespace-pre-wrap">
            {safetyNotes}
          </p>
        </div>
      )}

      {interactionNotes && (
        <div className="space-y-2">
          <h2 className="text-lg font-bold">다른 성분·약물과의 상호작용</h2>
          <p className="text-muted-foreground whitespace-pre-wrap">
            {interactionNotes}
          </p>
        </div>
      )}

      {!description && !mechanism && !safetyNotes && !interactionNotes && (
        <p className="text-muted-foreground">
          상세 정보가 등록되면 여기에 표시됩니다.
        </p>
      )}
    </div>
  );
}
