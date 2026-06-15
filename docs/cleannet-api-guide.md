# 청정넷(산림 미세먼지 측정넷, AICAN) API 연동 가이드

> 치유의 숲 ↔ 청정넷 실시간 기상/미세먼지를 연결하기 위한 개발자 가이드.
> 핵심: **두 개의 API를 조합**한다 — ① 지점 메타정보(좌표) ② 10분 단위 실측값.

---

## 0. 한눈에 보기

| 용도 | API | 무엇을 주나 | 갱신 |
|---|---|---|---|
| **지점 위치/메타** | `AicanObsrrInfo/obsrrInfoWFS` | 코드·지점명·**WGS84 위경도**·주소·설치일·장비 | 정적(거의 안 바뀜) |
| **실시간 측정값** | `AicanDustData/dustData` | PM10/PM2.5/PM1.0·기온·습도·풍속·풍향 | **10분 단위** |

매칭 파이프라인:

```
① obsrrInfoWFS  → 청정넷 지점 좌표 테이블 (1회 구축, 캐시)
② forest_places 38개 좌표 ↔ haversine ↔ 최근접 청정넷 그룹 매핑 (1회 구축)
③ dustData      → 매칭된 그룹의 obsrr_tpcd로 10분 실측 조회 (실시간)
```

인증키: 공공데이터포털 `DATA_GO_KR_SERVICE_KEY` 하나로 두 API 공용. (`.env.local`)

---

## 1. 관측소 코드 규칙 (★ 가장 중요)

`dustData`가 주는 `obsrr_tpcd`(예: `0402`)는 다음 구조다:

```
0402  =  040  +  2
          │       └ 지점번호(센서) : 같은 그룹 내 측정점(도심/숲내부/주거, 또는 5m/20m/30m 수직타워)
          └ 그룹코드(3자리)        : 지역(파주)
```

- **그룹코드(앞 3자리)** = 지역. 총 **46개 그룹**.
- **지점번호(끝 1자리)** = 그 지역의 개별 센서. 그룹당 1~3개.
- 실측 API(`dustData`)엔 **약 127개 센서**가 활성.
- 메타 API(`obsrrInfoWFS`)엔 **약 84개 센서**만 등록(46개 그룹은 전부 포함, 단 일부 센서는 좌표 누락 — §2 주의).

> 매칭은 **센서(4자리) 단위가 아니라 그룹(지역, 앞 3자리) 단위**로 하면 안전하다.

---

## 2. 지점 메타정보 — `obsrrInfoWFS`

GeoServer WFS(GML/XML) 응답. 좌표/주소를 여기서 얻는다.

### 요청

```
GET https://apis.data.go.kr/1400377/AicanObsrrInfo/obsrrInfoWFS
  ?serviceKey=<DATA_GO_KR_SERVICE_KEY>
  &layers=frstre_avenue
  &maxFeatures=100            # ★ 상한 ~100. 130 이상이면 InvalidParameterValue 에러
  &obsrrGroupCd=040           # (선택) 특정 그룹만. 생략하면 전체
```

### 응답(발췌)

```xml
<gml:featureMember>
  <FINDDUST:tbl_opn_obsrr_info fid="tbl_opn_obsrr_info.0402">
    <FINDDUST:obsrr_group_cd>040</FINDDUST:obsrr_group_cd>
    <FINDDUST:obsrr_nm>파주_주거2</FINDDUST:obsrr_nm>
    <FINDDUST:obsrr_lttd>37.8387540000</FINDDUST:obsrr_lttd>     <!-- WGS84 위도 -->
    <FINDDUST:obsrr_lngtd>126.7809300000</FINDDUST:obsrr_lngtd>  <!-- WGS84 경도 -->
    <FINDDUST:obsrr_addr>경기도 파주시 문산읍 내포리 1641(월롱근린공원)</FINDDUST:obsrr_addr>
    <FINDDUST:obsrr_instl_dt>20231115</FINDDUST:obsrr_instl_dt>
    <FINDDUST:eqpmn_nm>EDM365</FINDDUST:eqpmn_nm>
  </FINDDUST:tbl_opn_obsrr_info>
</gml:featureMember>
```

### ⚠️ 주의사항 (실측으로 확인됨)

1. **`maxFeatures`는 ~100이 상한.** 130 이상 주면 `ServiceException: InvalidParameterValue MAXFEATURES`. 전체를 받으려면 100으로 호출(현재 84개라 한 번에 다 옴).
2. **좌표 없는 지점이 있다.** `0141 인천_해안`, `0291 완도`, `0301 충주`, `0313 춘천`, `0323 종로`, `0333 구미`, `0343 삼척`, `0363 청주` 등은 `obsrr_lttd/lngtd` 태그가 **아예 없음** → 숫자 파싱 시 `(0, 0)` 좌표가 됨. **반드시 가드**(`if (!lat || !lon) skip`).
3. **빈 필드는 self-closing**(`<FINDDUST:obsrr_dscrt/>`)으로 옴 → `<tag>(.*?)</tag>` 정규식엔 안 잡히고 `null`. (에러는 아님)
4. **`obsrr_haslv`(해발고도) 태그는 없다.** 파싱 대상에서 제외.
5. 좌표는 `<geom>`에 EPSG:3857로도 들어오지만, **`obsrr_lttd/lngtd`(WGS84)를 사용**(변환 불필요).
6. http는 WAF 차단 → **반드시 https**.

### 파서 (TypeScript)

```ts
export interface CleannetStation {
  code: string;        // 0402  (obsrr_tpcd = dustData와 조인 키)
  groupCode: string;   // 040
  name: string;        // 파주_주거2
  lat: number;
  lon: number;
  address: string;
  installedAt: string; // 20231115
}

const tag = (block: string, t: string): string | null => {
  const m = block.match(new RegExp(`<FINDDUST:${t}>(.*?)</FINDDUST:${t}>`, "s"));
  return m ? m[1] : null;
};

export function parseStations(xml: string): CleannetStation[] {
  const out: CleannetStation[] = [];
  for (const m of xml.matchAll(/<gml:featureMember>(.*?)<\/gml:featureMember>/gs)) {
    const block = m[1];
    const code = block.match(/fid="tbl_opn_obsrr_info\.(.*?)"/)?.[1];
    const lat = Number(tag(block, "obsrr_lttd"));
    const lon = Number(tag(block, "obsrr_lngtd"));
    // ★ 좌표 없는 지점(0,0) 제외
    if (!code || !lat || !lon) continue;
    out.push({
      code,
      groupCode: tag(block, "obsrr_group_cd") ?? "",
      name: tag(block, "obsrr_nm") ?? "",
      lat,
      lon,
      address: tag(block, "obsrr_addr") ?? "",
      installedAt: tag(block, "obsrr_instl_dt") ?? "",
    });
  }
  return out;
}
```

---

## 3. 실시간 측정값 — `dustData`

### 요청

```
GET https://apis.data.go.kr/1400377/AicanDustData/dustData
  ?serviceKey=<DATA_GO_KR_SERVICE_KEY>
  &numOfRows=500
  &pageNo=1
  &contentType=JSON
  &startDt=20260614110000     # ★ KST, yyyyMMddHHmmss
  &endDt=20260614114000
```

### 응답(발췌)

```json
{ "resultCode": "00", "totalCount": "...", "items": [
  { "obsrt_dtm": "202606140300",   // 관측시각 (KST, 10분 단위)
    "obsrr_tpcd": "0402",          // ★ 지점 메타와 조인 키
    "obsrt_tmprt": 17.57,          // 기온 ℃
    "obsrt_hmdt": 88.567,          // 습도 %
    "obsrt_ws": 0.112,             // 풍속 m/s
    "obsrt_wndrc_val": 142.991,    // 풍향 °
    "obsrt_pm10_val": 26.752,
    "obsrt_pm25_val": 24.987,      // PM2.5
    "obsrt_pm01_val": 23.986 }
]}
```

### ⚠️ 주의사항 (실측으로 확인됨)

1. **반드시 https + User-Agent 헤더.** http는 `400 Request Blocked`.
2. **`obsrt_dtm`은 KST.** (Git Bash 등에서 `TZ=Asia/Seoul`가 안 먹으면 UTC+9로 직접 계산.) `startDt/endDt`도 KST로 넣어야 한다.
3. **기본 정렬이 오래된 순(2019~).** 최신을 보려면 `startDt/endDt`로 최근 범위를 반드시 지정.
4. **"10분 단위"는 데이터 해상도는 맞지만, 실시간 신선도는 보장되지 않는다.** 공급이 수 시간 지연/정지하는 구간이 관측됨(최신 관측치가 9시간 stale인 사례 확인). → **`obsrt_dtm`과 현재시각 차이를 검사**하고, 임계 초과 시 기상청(`KMA_API_KEY`)/에어코리아(`AIRKOREA_API_KEY`)로 **폴백**.
5. 한 관측시각에 ~120개 센서가 동시 보고되므로, 특정 지점만 필요하면 응답을 `obsrr_tpcd`로 필터.

---

## 4. 숲 ↔ 청정넷 매칭 (haversine 최근접)

프로젝트에 이미 있는 `haversineKm()`(`app/features/recovery-forest/services/forest-ranking.ts:87`)을 재사용.

```ts
import { haversineKm, type LatLon } from "@/features/recovery-forest/services/forest-ranking";
import type { CleannetStation } from "./cleannet";

/** 숲 좌표 → 가장 가까운 청정넷 지점. 그룹코드로 묶어 dustData 조회에 사용. */
export function nearestStation(
  forest: LatLon,
  stations: CleannetStation[],
): { station: CleannetStation; km: number } | null {
  let best: { station: CleannetStation; km: number } | null = null;
  for (const s of stations) {
    const km = haversineKm(forest, { lat: s.lat, lon: s.lon });
    if (!best || km < best.km) best = { station: s, km };
  }
  return best;
}
```

### 전체 흐름 예시

```ts
// 1) 지점 테이블 구축 (1회 / 캐시)
const xml = await fetch(
  `https://apis.data.go.kr/1400377/AicanObsrrInfo/obsrrInfoWFS` +
  `?serviceKey=${KEY}&layers=frstre_avenue&maxFeatures=100`,
  { headers: { "User-Agent": "recovery-forest" } },
).then(r => r.text());
const stations = parseStations(xml);

// 2) 숲마다 최근접 지점 매핑
const match = nearestStation({ lat: forest.latitude, lon: forest.longitude }, stations);
//  match.station.groupCode → 실측 조회용 그룹코드
//  match.km                → 거리(너무 멀면 신뢰도 낮음 → 폴백 고려)

// 3) 그 지역 10분 실측값 조회 후 obsrr_tpcd 앞 3자리로 필터
const items = await fetchDustData(/* 최근 KST 범위 */);
const live = items.filter(it => it.obsrr_tpcd.startsWith(match.station.groupCode));
```

> **매칭 단위 권장:** 센서(4자리)가 아니라 **그룹(3자리, 지역)** 단위. 좌표 누락 센서를 피하고, dustData에서 그룹 내 아무 센서나 대표값으로 쓸 수 있다.

---

## 5. 데이터 신선도 가드 (필수)

```ts
function isFresh(obsrtDtm: string, maxAgeMin = 60): boolean {
  // obsrtDtm: "202606140300" (KST)
  const y = +obsrtDtm.slice(0, 4), mo = +obsrtDtm.slice(4, 6) - 1, d = +obsrtDtm.slice(6, 8);
  const h = +obsrtDtm.slice(8, 10), mi = +obsrtDtm.slice(10, 12);
  const obs = Date.UTC(y, mo, d, h - 9, mi);      // KST→UTC
  return (Date.now() - obs) / 60000 <= maxAgeMin;
}
// isFresh가 false면 KMA/AirKorea 폴백 → "9시간 전 데이터로 추천" 방지
```

---

## 6. 참고 출처

- 실측 API: <https://www.data.go.kr/data/15078005/openapi.do> (산림청 국립산림과학원_청정넷_측정데이터)
- 지점 메타 WFS: `AicanObsrrInfo/obsrrInfoWFS` (GeoServer: `aican-geo.nifos.go.kr`)
- 공식 포털(지점 드롭다운·지도): <https://aican.nifos.go.kr/>
- 코드↔지점명 원본: `aican.nifos.go.kr/map.do` (드롭다운 `<option value="그룹코드">지점명</option>`)
- ※ `15110279`(산림청_전국 치유의숲 좌표)는 **별개 데이터** — 공유 키 없음, 매칭은 좌표 거리로만.
