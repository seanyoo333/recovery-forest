import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("~/lib/env.server", () => ({
  getServerEnv: () => ({ DATA_GO_KR_SERVICE_KEY: "test-key" }),
}));

import { cleannetPm25ByForest } from "../services/cleannet.service";

function nowKstDtm(): string {
  return new Date(Date.now() + 9 * 3600 * 1000)
    .toISOString()
    .slice(0, 16)
    .replace(/[-:T]/g, "");
}

const META_XML = `<wfs>
  <gml:featureMember>
    <FINDDUST:tbl_opn_obsrr_info fid="tbl_opn_obsrr_info.0081">
      <FINDDUST:obsrr_group_cd>008</FINDDUST:obsrr_group_cd>
      <FINDDUST:obsrr_lttd>37.5000</FINDDUST:obsrr_lttd>
      <FINDDUST:obsrr_lngtd>127.0000</FINDDUST:obsrr_lngtd>
    </FINDDUST:tbl_opn_obsrr_info>
  </gml:featureMember>
</wfs>`;

afterEach(() => vi.unstubAllGlobals());

describe("청정넷 매칭", () => {
  it("매칭(≤15km)+신선 시 청정넷 PM2.5, 먼 숲은 생략", async () => {
    const dust = JSON.stringify({
      items: [{ obsrr_tpcd: "0081", obsrt_pm25_val: 7.3, obsrt_dtm: nowKstDtm() }],
    });
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) => {
        const body = String(url).includes("obsrrInfoWFS") ? META_XML : dust;
        return Promise.resolve({ ok: true, text: async () => body });
      }),
    );

    const map = await cleannetPm25ByForest([
      { id: "near", latitude: 37.5005, longitude: 127.0005 }, // 지점 바로 옆
      { id: "far", latitude: 35.0, longitude: 128.5 }, // 수백 km
    ]);

    expect(map.get("near")).toBe(7); // round(7.3)
    expect(map.has("far")).toBe(false);
  });
});
