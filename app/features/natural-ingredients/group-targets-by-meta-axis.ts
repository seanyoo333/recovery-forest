import {
  AXIS_DESCRIPTION,
  AXIS_LABEL,
  isMetaAxis,
  META_AXES,
  type MetaAxis,
} from "~/core/meta-axis";

export type NaturalTargetWithMappings = {
  id: string;
  slug: string;
  display_name: string;
  description: string | null;
  target_to_meta_axis: Array<{
    meta_axis: string;
    axis_weight: number;
  }> | null;
};

export type TargetCardData = {
  id: string;
  slug: string;
  display_name: string;
  description: string | null;
};

export type MetaAxisSection = {
  axis: MetaAxis;
  label: string;
  description: string;
  targets: TargetCardData[];
};

/**
 * `target_to_meta_axis` 매핑을 기준으로 표적을 5축 섹션으로 나눕니다.
 * 한 표적이 여러 축에 속하면 각 축 섹션에 모두 표시됩니다.
 */
export function groupTargetsByMetaAxis(
  targets: NaturalTargetWithMappings[],
): { sections: MetaAxisSection[]; unassigned: TargetCardData[] } {
  const byAxis = new Map<MetaAxis, TargetCardData[]>();
  for (const axis of META_AXES) {
    byAxis.set(axis, []);
  }

  const unassigned: TargetCardData[] = [];

  for (const t of targets) {
    const mappings = t.target_to_meta_axis ?? [];
    const axes = new Set<MetaAxis>();
    for (const m of mappings) {
      if (isMetaAxis(m.meta_axis)) {
        axes.add(m.meta_axis);
      }
    }

    const card: TargetCardData = {
      id: t.id,
      slug: t.slug,
      display_name: t.display_name,
      description: t.description,
    };

    if (axes.size === 0) {
      unassigned.push(card);
      continue;
    }

    for (const axis of axes) {
      byAxis.get(axis)!.push(card);
    }
  }

  const sortKo = (a: TargetCardData, b: TargetCardData) =>
    a.display_name.localeCompare(b.display_name, "ko");

  for (const axis of META_AXES) {
    byAxis.get(axis)!.sort(sortKo);
  }
  unassigned.sort(sortKo);

  const sections: MetaAxisSection[] = META_AXES.map((axis) => ({
    axis,
    label: AXIS_LABEL[axis],
    description: AXIS_DESCRIPTION[axis],
    targets: byAxis.get(axis)!,
  }));

  return { sections, unassigned };
}
