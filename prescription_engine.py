#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# =====================================================================
#  회복의 숲 처방 엔진 (Prescription Engine) — v1 (3축)
# ---------------------------------------------------------------------
#  설계 근거(인터뷰 2명, 2026-06):
#   - 두 사용자가 정반대 선호 → 단일 랭킹 불가, 유형별 가중치 분기 필요
#       · comfort(편안함형, 디폴트·일반 타겟): 거리가 결정의 전부, 잠/편안함 중심
#       · explorer(근거형):                   거리 무관, 차별성·과학적 근거 중심
#   - 킬러 아웃컴 = 수면. 디폴트 페르소나는 comfort.
#
#  점수 축 3개(각 0~100):  ① 거리(접근성)  ② 피톤치드 잠재력 지수  ③ 미세먼지 안전
#   ※ ④ 프로그램 매칭은 제외(2026-06 결정). 산림교육/산림복지전문업/산림복지 13건
#     세 소스 모두 위치 비구조화·치유 매칭 불가·정적 데이터로 부적합. → V2 로드맵.
#  유형이 ①~③ 가중치를 바꾼다. (핵심 분기 = if 하나)
#
#  ※ 데이터: 운영시 Supabase healing_forests(38개) + 청정넷 실시간을 읽음.
#    SAMPLE_FORESTS는 엔진 동작 시연용 표본(좌표·기상은 예시).
# =====================================================================
import math
from phytoncide_index import phytoncide_potential_index

# ---------------------------------------------------------------------
# 유형별 가중치 (합=1.0). ④ 프로그램(.15/.30) 제거분을 ①③에 재분배.
# ---------------------------------------------------------------------
WEIGHTS = {
    "comfort":  {"distance": 0.50, "phyto": 0.20, "air": 0.30},  # 편안함형: 거리 지배
    "explorer": {"distance": 0.10, "phyto": 0.60, "air": 0.30},  # 근거형: 피톤치드 지배
}

# ---------------------------------------------------------------------
# 시연용 표본 숲 (운영시 Supabase 38개로 대체)
#  pm25/temp/humidity/wind = 청정넷 최근접 관측소 실시간(여기선 예시)
# ---------------------------------------------------------------------
SAMPLE_FORESTS = [
    {"name": "장흥 편백 치유의 숲", "region": "전남", "lat": 34.68, "lon": 126.91,
     "species": "편백", "pm25": 12, "temp": 27, "humidity": 72, "wind": 1.2},
    {"name": "축령산 편백 치유의 숲", "region": "전남", "lat": 35.42, "lon": 126.86,
     "species": "편백", "pm25": 10, "temp": 26, "humidity": 70, "wind": 1.0},
    {"name": "잣향기 푸른숲", "region": "경기", "lat": 37.83, "lon": 127.39,
     "species": "잣나무", "pm25": 18, "temp": 25, "humidity": 65, "wind": 1.5},
    {"name": "산음 치유의 숲", "region": "경기", "lat": 37.65, "lon": 127.70,
     "species": "침활혼효림", "pm25": 16, "temp": 25, "humidity": 66, "wind": 1.4},
    {"name": "대관령 치유의 숲", "region": "강원", "lat": 37.68, "lon": 128.72,
     "species": "소나무", "pm25": 9, "temp": 23, "humidity": 68, "wind": 2.2},
    {"name": "부산 치유의 숲", "region": "부산", "lat": 35.27, "lon": 129.14,
     "species": "기타활엽수", "pm25": 22, "temp": 28, "humidity": 74, "wind": 1.8},
]

# ---------------------------------------------------------------------
# 개별 점수 함수 (각 0~100)
# ---------------------------------------------------------------------
def _haversine_km(lat1, lon1, lat2, lon2):
    R = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1); dl = math.radians(lon2 - lon1)
    a = math.sin(dp/2)**2 + math.cos(p1)*math.cos(p2)*math.sin(dl/2)**2
    return 2 * R * math.asin(math.sqrt(a))

def distance_score(user, f):
    km = _haversine_km(user["lat"], user["lon"], f["lat"], f["lon"])
    # 가까울수록 가점. 운영시 카카오 길찾기 이동시간으로 교체 권장(데모는 직선거리)
    return round(100 * math.exp(-km / 150), 1), round(km, 0)

def air_quality_score(pm25):
    # 초미세먼지 낮을수록 안전(가점). 35 초과는 추천 회피 신호.
    return round(max(0.0, 100 - pm25 * 1.8), 1)

def phyto_score(f, month, hour):
    return phytoncide_potential_index(
        species=f["species"], temp_c=f["temp"], humidity_pct=f["humidity"],
        wind_ms=f["wind"], month=month, hour=hour)

# ---------------------------------------------------------------------
# 처방 = 점수화 → 랭킹 → 처방전(왜+시점+목표+측정)
# ---------------------------------------------------------------------
def _optimal_time(species, month):
    # 피톤치드 시점 근거(보고서 p.79~80): 여름 정오 회피, 오전 권장.
    if month in (6, 7, 8, 9):
        return "오전 9~11시 (여름 정오는 농도 최저라 회피)"
    if species == "편백" and month in (2, 3, 4):
        return "오전, 3월 전후가 편백 피톤치드 연중 최고"
    return "오전 9~11시"

def _why(f, comps, user_type):
    km = comps["distance_km"]
    aq = "쾌적" if f["pm25"] <= 15 else ("양호" if f["pm25"] <= 35 else "주의")
    if user_type == "comfort":
        return (f"집에서 약 {km:.0f}km로 가깝고, 현재 초미세먼지 {f['pm25']}㎍/㎥로 "
                f"{aq}한 환경입니다 ({f['species']}림).")
    return (f"피톤치드 잠재력 지수 {comps['phyto']}점(상위)으로 {f['species']}림의 강점이 "
            f"뚜렷하고, 초미세먼지 {f['pm25']}㎍/㎥로 {aq}합니다. "
            f"농도 근거: 국립산림과학원 연구(편백>소나무>낙엽송>잣, p<.01).")

def prescribe(user, forests=SAMPLE_FORESTS):
    w = WEIGHTS[user["user_type"]]
    rows = []
    for f in forests:
        d_score, km = distance_score(user, f)
        a_score = air_quality_score(f["pm25"])
        p_score = phyto_score(f, user["month"], user["hour"])
        total = w["distance"]*d_score + w["air"]*a_score + w["phyto"]*p_score
        rows.append({"forest": f, "total": round(total, 1),
                     "components": {"distance": d_score, "distance_km": km,
                                    "air": a_score, "phyto": p_score}})
    rows.sort(key=lambda r: -r["total"])
    top = rows[0]; f = top["forest"]
    return {
        "user_type": user["user_type"], "goal": user["goal"],
        "pick": f["name"], "score": top["total"],
        "visit_time": _optimal_time(f["species"], user["month"]),
        "why": _why(f, top["components"], user["user_type"]),
        "target_outcome": {"수면": "수면질 향상(주관 수면점수 +20%)",
                           "스트레스": "긴장 완화·안정감 증가"}.get(user["goal"], "회복감 증가"),
        "post_measure": {"방문 전": ["수면점수(1-10)", "피로도(1-10)"],
                         "방문 직후": ["회복감(1-10)", "한 줄 기분"],
                         "3일 후": ["수면점수(1-10)"]},
        "ranking": [(r["forest"]["name"], r["total"], r["components"]["phyto"],
                     r["components"]["distance_km"]) for r in rows],
    }

def _print(rx):
    print(f"\n{'='*60}\n[유형: {rx['user_type']}]  목표: {rx['goal']}\n{'='*60}")
    print(f"▶ 추천: {rx['pick']}  (종합 {rx['score']}점)")
    print(f"▶ 권장 시점: {rx['visit_time']}")
    print(f"▶ 왜 이 숲: {rx['why']}")
    print(f"▶ 기대 효과: {rx['target_outcome']}")
    print(f"  · 전체 랭킹 (종합 / 피톤치드 / 거리km / 이름):")
    for name, tot, ph, km in rx["ranking"]:
        print(f"      {tot:>5}  ph={ph:>5}  {km:>4.0f}km  {name}")

if __name__ == "__main__":
    seoul = (37.55, 126.97)
    _print(prescribe({"goal": "수면", "lat": seoul[0], "lon": seoul[1],
                      "user_type": "comfort", "month": 7, "hour": 10}))
    _print(prescribe({"goal": "스트레스", "lat": seoul[0], "lon": seoul[1],
                      "user_type": "explorer", "month": 7, "hour": 10}))
