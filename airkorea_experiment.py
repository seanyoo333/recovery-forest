#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# =====================================================================
#  에어코리아 미세먼지 실험 — 조합형 (좌표 최근접 실측 + 시도 예보등급)
# ---------------------------------------------------------------------
#  목적: prescription_engine.py의 air 축을, 청정넷(과거/현재) 대신
#        에어코리아로 대체할 수 있는지 좌표 기준으로 실험한다.
#
#  파이프라인(조합형):
#    좌표(lat,lon)
#      → ① TM 좌표 변환 (WGS84 → EPSG:5181)
#      → ② getNearbyMsrstnList  : 최근접 측정소(정밀 위치) 찾기
#      → ③ getMsrstnAcctoRltmMesureDnsty : 그 측정소 실측 PM2.5(수치, 변별력)
#      → ④ getMinuDustFrcstDspth : 측정소 시도의 예보등급(방문일 전망 보정)
#
#  ※ 에어코리아 '예보'는 좌표가 아니라 시도/권역 단위 등급 텍스트다.
#    그래서 수치는 ③(실측 최근접), 전망은 ④(시도 예보)로 역할을 나눈다.
#
#  실행: python airkorea_experiment.py
#  의존: pyproj (좌표 변환). 없으면 좌표→TM 단계만 건너뛰고 안내.
#        pip install pyproj
# =====================================================================
import json
import sys
import urllib.parse
import urllib.request
import datetime
from pathlib import Path

# Windows 콘솔(cp949)에서 한글/em-dash 출력 깨짐 방지
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

BASE = "https://apis.data.go.kr/B552584"
SVC_AIR = f"{BASE}/ArpltnInforInqireSvc"   # 대기오염정보(실측/예보) data 15073861
SVC_MSR = f"{BASE}/MsrstnInfoInqireSvc"    # 측정소정보(근접/TM)   data 15073877
UA = {"User-Agent": "recovery-forest-experiment"}

# 실험 대상: prescription_engine.py SAMPLE_FORESTS 중 하나 (장흥 편백 치유의 숲)
SAMPLE = {"name": "장흥 편백 치유의 숲", "lat": 34.68, "lon": 126.91}


# ---------------------------------------------------------------------
# .env.local 로더 (의존성 없이)
# ---------------------------------------------------------------------
def load_env(path: str = ".env.local") -> dict:
    env: dict[str, str] = {}
    p = Path(__file__).resolve().parent / path
    if not p.exists():
        return env
    for line in p.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        env[k.strip()] = v.strip().strip('"').strip("'")
    return env


ENV = load_env()
SERVICE_KEY = ENV.get("DATA_GO_KR_SERVICE_KEY") or ENV.get("AIRKOREA_API_KEY") or ""


# ---------------------------------------------------------------------
# 공통 GET (data.go.kr serviceKey 인코딩 함정 처리)
#  - 포털 발급 'Encoding' 키는 이미 %xx 인코딩됨 → 다시 인코딩하면 SERVICE_KEY_
#    NOT_REGISTERED 에러. 키에 '%'가 있으면 raw로 붙이고, 없으면(Decoding 키)
#    한 번 인코딩한다.
# ---------------------------------------------------------------------
def _get(url: str, params: dict) -> dict:
    qs = urllib.parse.urlencode(params, encoding="utf-8")
    key = SERVICE_KEY if "%" in SERVICE_KEY else urllib.parse.quote(SERVICE_KEY, safe="")
    full = f"{url}?serviceKey={key}&{qs}"
    req = urllib.request.Request(full, headers=UA)
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            raw = r.read().decode("utf-8")
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", "replace")[:500]
        raise RuntimeError(f"HTTP {e.code} {e.reason}\n응답 본문:\n{body}")
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        # 키/파라미터 오류 시 XML(OpenAPI_ServiceResponse)로 옴
        raise RuntimeError(f"JSON 아님(인증/파라미터 오류 가능). 응답 앞부분:\n{raw[:400]}")


# ---------------------------------------------------------------------
# ① WGS84(lat,lon) → TM (EPSG:5181, 에어코리아 근접측정소 좌표계)
# ---------------------------------------------------------------------
def to_tm(lat: float, lon: float) -> tuple[float, float]:
    from pyproj import Transformer
    t = Transformer.from_crs("EPSG:4326", "EPSG:5181", always_xy=True)
    x, y = t.transform(lon, lat)
    return round(x, 3), round(y, 3)


# ---------------------------------------------------------------------
# ② 근접측정소 목록 (TM 좌표 기준, 가까운 순)
# ---------------------------------------------------------------------
def nearby_stations(tm_x: float, tm_y: float) -> list[dict]:
    data = _get(f"{SVC_MSR}/getNearbyMsrstnList", {
        "tmX": tm_x, "tmY": tm_y, "ver": "1.1",
        "returnType": "json", "numOfRows": "5", "pageNo": "1",
    })
    return data.get("response", {}).get("body", {}).get("items", [])


# ---------------------------------------------------------------------
# ③ 측정소별 실시간 측정정보 (PM2.5 수치)
# ---------------------------------------------------------------------
def realtime(station_name: str) -> dict | None:
    data = _get(f"{SVC_AIR}/getMsrstnAcctoRltmMesureDnsty", {
        "stationName": station_name, "dataTerm": "DAILY", "ver": "1.3",
        "returnType": "json", "numOfRows": "1", "pageNo": "1",
    })
    items = data.get("response", {}).get("body", {}).get("items", [])
    return items[0] if items else None


# ---------------------------------------------------------------------
# ④ 대기질 예보통보 (시도 단위 등급) — informCode=PM25
#    informGrade: "서울 : 보통,경기 : 나쁨,전남 : 좋음,..." 를 dict로 파싱
# ---------------------------------------------------------------------
def forecast_grades(search_date: str, inform_code: str = "PM25") -> list[dict]:
    data = _get(f"{SVC_AIR}/getMinuDustFrcstDspth", {
        "searchDate": search_date, "informCode": inform_code, "ver": "1.1",
        "returnType": "json", "numOfRows": "10", "pageNo": "1",
    })
    items = data.get("response", {}).get("body", {}).get("items", [])
    out = []
    for it in items:
        grades = {}
        for part in (it.get("informGrade") or "").split(","):
            if ":" in part:
                sido, g = part.split(":", 1)
                grades[sido.strip()] = g.strip()
        out.append({
            "예보일시": it.get("informData"),       # 예보 대상일
            "통보시각": it.get("dataTime"),
            "등급": grades,
            "개요": it.get("informOverall"),
        })
    return out


# 측정소 주소 시도명 → 예보 시도 키 정규화 (강원/전라/경상 등)
SIDO_NORM = {
    "서울특별시": "서울", "부산광역시": "부산", "대구광역시": "대구",
    "인천광역시": "인천", "광주광역시": "광주", "대전광역시": "대전",
    "울산광역시": "울산", "세종특별자치시": "세종", "경기도": "경기",
    "강원특별자치도": "영동", "강원도": "영동",  # 영동/영서 분리 — 동해안=영동
    "충청북도": "충북", "충청남도": "충남",
    "전북특별자치도": "전북", "전라북도": "전북",
    "전라남도": "전남", "경상북도": "경북", "경상남도": "경남",
    "제주특별자치도": "제주", "제주도": "제주",
}


def normalize_sido(addr: str) -> str | None:
    if not addr:
        return None
    head = addr.split()[0]
    return SIDO_NORM.get(head, head)


def main() -> int:
    print("=" * 64)
    print(f"에어코리아 조합형 실험 — {SAMPLE['name']}  ({SAMPLE['lat']}, {SAMPLE['lon']})")
    print("=" * 64)

    if not SERVICE_KEY:
        print("✗ 서비스키 없음: .env.local 에 DATA_GO_KR_SERVICE_KEY=... 를 추가하세요.")
        print("  (.env.example의 플레이스홀더가 아니라 실제 발급 키여야 합니다)")
        return 1
    print(f"✓ 서비스키 로드됨 ({'Encoding' if '%' in SERVICE_KEY else 'Decoding'} 형식, "
          f"길이 {len(SERVICE_KEY)})\n")

    # ① 좌표 → TM
    try:
        tm_x, tm_y = to_tm(SAMPLE["lat"], SAMPLE["lon"])
    except ModuleNotFoundError:
        print("✗ pyproj 미설치 → 좌표→TM 변환 불가. `pip install pyproj` 후 재실행.")
        return 1
    print(f"① TM 변환:  tmX={tm_x}  tmY={tm_y}")

    # ② 최근접 측정소
    name, sido = None, None
    try:
        stations = nearby_stations(tm_x, tm_y)
        print(f"② 최근접 측정소 {len(stations)}곳:")
        for s in stations:
            print(f"     - {s.get('stationName'):<10} {s.get('addr','')}  "
                  f"(거리 {s.get('tm')}km)")
        if stations:
            nearest = stations[0]
            name = nearest["stationName"]
            sido = normalize_sido(nearest.get("addr", ""))
            print(f"   → 선택: {name}  (시도={sido})")
    except RuntimeError as e:
        print(f"② getNearbyMsrstnList 실패(측정소정보 서비스 미승인 가능):\n   {e}")
    print()

    # ③ 실측 PM2.5 (수치)
    #    ②(측정소정보 미승인)로 측정소를 못 구하면, 같은 권역의 알려진 측정소명으로
    #    폴백해 '대기오염정보' 서비스가 이 키로 동작하는지만 검증한다.
    if not name:
        name = "종로구"  # 에어코리아 표준 예시 측정소명(서울) — ②미승인 시 ③검증용 폴백
        print(f"③ ②미승인 → 표준 측정소 '{name}'(서울)으로 실측 서비스 동작만 검증")
    try:
        rt = realtime(name)
    except RuntimeError as e:
        print(f"③ getMsrstnAcctoRltmMesureDnsty 실패:\n   {e}\n")
        rt = None
    if rt:
        dt = rt.get("dataTime")
        pm25, pm10 = rt.get("pm25Value"), rt.get("pm10Value")
        print(f"③ 실측({dt}):  PM2.5={pm25}㎍/㎥  PM10={pm10}㎍/㎥  "
              f"등급(PM2.5)={rt.get('pm25Grade')}")
        # 신선도 가드
        if dt and dt not in ("-", ""):
            try:
                obs = datetime.datetime.strptime(dt, "%Y-%m-%d %H:%M")
                age_h = (datetime.datetime.now() - obs).total_seconds() / 3600
                print(f"   신선도: 약 {age_h:.1f}시간 전 관측")
            except ValueError:
                pass
    else:
        print("③ 실측 없음")
    print()

    # ④ 시도 예보등급 (오늘/내일)
    today = datetime.date.today().isoformat()
    print(f"④ 예보통보(PM2.5, searchDate={today}):")
    try:
        fc = forecast_grades(today, "PM25")
    except RuntimeError as e:
        print(f"   getMinuDustFrcstDspth 실패:\n   {e}")
        fc = []
    if not fc:
        print("   (해당일 예보 없음 — 발표 전 시간대일 수 있음)")
    if fc:
        # 시도별 등급 파싱 검증: 첫 행의 전체 등급 dict 출력
        sample = fc[0]
        print(f"   [파싱 검증] 대상일 {sample['예보일시']} 시도별 등급:")
        print(f"   {sample['등급']}")
        # 장흥=전남 기준 등급 추출
        my = sample["등급"].get("전남", "?")
        print(f"   → 장흥(전남) PM2.5 예보등급 = {my}")
    print()
    print("요약: ③ 실측 PM2.5 수치(좌표 변별력) + ④ 시도 예보등급(방문일 전망)")
    print("      두 신호를 prescription_engine air 축에 결합 가능.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
