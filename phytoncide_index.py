#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# =====================================================================
#  피톤치드 잠재력 지수  (Phytoncide Potential Index, PPI)
# ---------------------------------------------------------------------
#  근거: 국립산림과학원,「산림치유자원 연구보고서 — 기상환경과 임분특성에
#        따른 피톤치드 농도 경향분석」(전국 30개 지역 117개 지점, 2017~2024)
#
#  ★ 핵심 원칙
#   - 이 지수는 '절대 농도(pptv) 예측'이 아니라, 보고서가 통계적으로 검증한
#     '순위(ordinal)와 방향'에 기반한 투명한 상대 지수(0~100)다.
#   - 측정소 4개소 실측 + 보고서 = 검증 앵커. 본 지수가 산출하는 수종 순위는
#     보고서 순위(편백>소나무>낙엽송>잣)와 일치해야 한다(내장 정합성 체크).
#   - 모든 가중치에 보고서 출처를 주석으로 명시 → 발표 방어용.
#   - 수종 '순위'는 보고서 근거, 점수 '간격'은 조정 가능한 설계값(튜닝 대상).
# =====================================================================

# ---------------------------------------------------------------------
# 1) 수종 기본점수
#    근거: 보고서 결론(p.13, p.88) "수종별 피톤치드 농도는
#          편백림 > 소나무림 > 낙엽송림 > 잣나무림 순"
#    참나무류·기타활엽수·자작나무는 침엽 우세종보다 낮음(하위군).
#    → 순위는 보고서, 간격은 ordinal 설계값(편백을 뚜렷이 높게: 보고서상
#      "동일 기온 조건에서도 편백림이 최고 농도").
# ---------------------------------------------------------------------
SPECIES_BASE = {
    "편백": 85,          # 최고 (p.88: 동일 기온서도 최고)
    "소나무": 65,
    "리기다소나무": 62,   # 소나무속
    "낙엽송": 48,
    "잣나무": 40,
    "침활혼효림": 35,
    "자작나무": 26,
    "기타활엽수": 22,
    "상수리나무": 18, "졸참나무": 18, "굴참나무": 18,   # 참나무류
    "신갈나무": 18, "갈참나무": 18, "참나무": 18,
    "층층나무": 16,
}
DEFAULT_BASE = 28   # 미상 수종(임상도 미확인 숲의 잠정값)

# 침엽 우세종 집합 (시점 보정 분기에 사용)
CONIFER_MAJOR = {"편백", "소나무", "리기다소나무", "낙엽송", "잣나무"}


# ---------------------------------------------------------------------
# 2) 기상 보정
#    근거: 보고서 결론(p.13, p.88, p<.01)
#          "기온과 습도는 높을수록, 풍속은 낮을수록 높은 농도"
#    기준점: 산림 대상지 평균(표19~21) — 기온 ~15℃, 습도 ~60%, 풍속 낮음.
#    각 인자를 완만한 배수로(±). 종 기본점수가 주(主) 동인이 되도록 폭 제한.
# ---------------------------------------------------------------------
def weather_modifier(temp_c, humidity_pct, wind_ms):
    t = 1.0 + 0.020 * (temp_c - 15)        # 15℃=1.0, 25℃≈1.20, 5℃≈0.80
    h = 1.0 + 0.004 * (humidity_pct - 60)  # 60%=1.0, 80%≈1.08, 40%≈0.92
    w = 1.0 - 0.050 * wind_ms              # 0m/s=1.0, 4m/s≈0.80
    # 과도한 보정 방지 클램프
    t = min(max(t, 0.70), 1.40)
    h = min(max(h, 0.85), 1.15)
    w = min(max(w, 0.70), 1.05)
    return t * h * w


# ---------------------------------------------------------------------
# 3) 시점 보정 (계절 × 시간)
#    근거: 보고서 p.79~80
#      - 대부분 수종 여름(6,7,8월) 최고
#      - 편백림은 3월 최고 / 낙엽송림은 5월 최고 (예외)
#      - 6~9월 정오(12시 전후) 농도 최저(산화반응), 야간 높음
# ---------------------------------------------------------------------
def timing_modifier(species, month, hour):
    # --- 계절 ---
    if species == "편백":
        season = 1.20 if month == 3 else 1.10 if month in (2, 4) else \
                 1.00 if month in (5, 6, 7, 8) else 0.90
    elif species == "낙엽송":
        season = 1.20 if month == 5 else 1.10 if month in (4, 6) else \
                 1.00 if month in (7, 8) else 0.90
    else:
        season = 1.15 if month in (6, 7, 8) else \
                 1.00 if month in (4, 5, 9) else 0.85
    # --- 시간 ---
    if month in (6, 7, 8, 9) and 11 <= hour <= 14:
        tod = 0.85                  # 여름 정오 최저
    elif 9 <= hour <= 17:
        tod = 1.00                  # 주간
    else:
        tod = 1.10                  # 야간/이른아침 높음
    return season * tod


# ---------------------------------------------------------------------
# 종합 지수
# ---------------------------------------------------------------------
def phytoncide_potential_index(species, temp_c, humidity_pct, wind_ms, month, hour,
                               normalize=True):
    """수종 + 실시간 기상 + 시점 → 피톤치드 잠재력 상대 지수.
       normalize=True면 0~100으로 캡. 랭킹은 raw 기준이 정확."""
    base = SPECIES_BASE.get(species, DEFAULT_BASE)
    raw = base * weather_modifier(temp_c, humidity_pct, wind_ms) \
              * timing_modifier(species, month, hour)
    if normalize:
        return round(min(raw, 100.0), 1)
    return round(raw, 1)


def consistency_check():
    """내장 정합성 체크: 동일 조건에서 수종 순위가 보고서와 일치하는지."""
    cond = dict(temp_c=20, humidity_pct=65, wind_ms=1.0, month=7, hour=10)
    order = ["편백", "소나무", "낙엽송", "잣나무", "기타활엽수"]
    scores = [(s, phytoncide_potential_index(species=s, **cond)) for s in order]
    ok = all(scores[i][1] >= scores[i + 1][1] for i in range(len(scores) - 1))
    print("정합성 체크 (보고서 순위 편백>소나무>낙엽송>잣>활엽수와 일치?):", "✅" if ok else "❌")
    for s, v in scores:
        print(f"    {s:<8} {v}")
    return ok


if __name__ == "__main__":
    consistency_check()

    print("\n=== 실제 치유의숲 예시 (오늘 가정: 7월, 오전 9시 vs 정오) ===")
    # 수종: 이름에서 확보 가능한 것 + 미상은 기타활엽수로 잠정
    forests = [
        ("장흥편백 치유의 숲", "편백"),
        ("창원편백 치유의 숲", "편백"),
        ("잣향기 푸른숲",      "잣나무"),
        ("대관령치유의숲(소나무 우세)", "소나무"),
        ("만연산치유의숲(활엽 잠정)",   "기타활엽수"),
    ]
    weather = dict(temp_c=26, humidity_pct=70, wind_ms=1.5)  # 청정넷 실시간 가정
    for label in [("오전 9시", 9), ("정오 12시", 12)]:
        tag, hr = label
        print(f"\n[{tag}]  (기온26℃ 습도70% 풍속1.5)")
        ranked = sorted(
            [(name, phytoncide_potential_index(species=sp, month=7, hour=hr, **weather))
             for name, sp in forests],
            key=lambda x: -x[1])
        for i, (name, ppi) in enumerate(ranked, 1):
            print(f"   {i}. {name:<26} PPI={ppi}")

    print("\n=== 계절 예외 확인: 편백은 3월에 더 높음 ===")
    for m in (3, 7, 12):
        v = phytoncide_potential_index(species="편백", temp_c=12, humidity_pct=60,
                                       wind_ms=1.0, month=m, hour=10)
        print(f"   편백 {m:>2}월(기온12℃ 동일): PPI={v}")
