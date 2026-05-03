import { z } from "zod";

export const postReferenceSchema = z.object({
  label: z.string().trim().min(1, "출처 이름을 입력해 주세요."),
  url: z
    .string()
    .trim()
    .url("올바른 URL 형식이 아닙니다.")
    .refine((value) => /^https?:\/\//i.test(value), {
      message: "URL은 http:// 또는 https:// 로 시작해야 합니다.",
    }),
  note: z.string().trim().optional(),
});

export type PostReference = z.infer<typeof postReferenceSchema>;

export function parseReferencesFromFormData(formData: FormData): PostReference[] {
  const labels = formData
    .getAll("reference_label")
    .map((value) => String(value).trim());
  const urls = formData
    .getAll("reference_url")
    .map((value) => String(value).trim());
  const notes = formData
    .getAll("reference_note")
    .map((value) => String(value).trim());

  const rowCount = Math.max(labels.length, urls.length, notes.length);
  const parsed: PostReference[] = [];

  for (let index = 0; index < rowCount; index += 1) {
    const label = labels[index] ?? "";
    const url = urls[index] ?? "";
    const note = notes[index] ?? "";

    // 비어있는 행은 저장에서 제외
    if (!label && !url && !note) {
      continue;
    }

    const result = postReferenceSchema.safeParse({
      label,
      url,
      note: note || undefined,
    });
    if (!result.success) {
      const firstMessage =
        result.error.issues[0]?.message ?? "출처 형식이 올바르지 않습니다.";
      throw new Error(`출처 ${index + 1}번째 줄 오류: ${firstMessage}`);
    }
    parsed.push(result.data);
  }

  return parsed;
}
