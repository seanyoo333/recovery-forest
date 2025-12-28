"""
================================================================================
LangGraph 기반 프로덕션급 건강 챗봇 시스템
================================================================================

전체 워크플로우:
1. Router LLM (1회 호출)
   - 사용자 질문이 건강 관련인지 판단
   - 건강 질문인 경우: 카테고리, 검색 쿼리, 핵심 용어, 예산 할당
   - 비건강 질문인 경우: 짧은 답변 생성 후 종료

2. P1 근거 수집 (LLM 호출 없음)
   - RAG 검색: FAISS 벡터 스토어에서 관련 문서 검색 (예산 내 반복)
   - 웹 검색: RAG 실패 시 Firecrawl/Serper로 웹 검색 (예산 내 반복)
   - 목표: 최소 2개의 P1 근거 수집

3. P2 근거 수집 (LLM 호출 없음)
   - P2 검색 쿼리 준비: P1의 핵심 용어 기반 학술 검색 쿼리 생성
   - PubMed 검색: 의학 논문 데이터베이스 검색 (예산 내 반복)
   - Google Scholar 검색: PubMed 실패 시 학술 논문 검색 (예산 내 반복)
   - 목표: 최소 2개의 P2 근거 수집

4. P3 환자 데이터 (LLM 호출 없음)
   - Supabase에서 환자 정보 및 검사 결과 조회
   - 환자 데이터를 기전 용어와 매핑하여 해석 노트 생성

5. 정규화 및 충분성 검사 (LLM 호출 없음)
   - P1과 P2 근거를 합쳐서 중복 제거 및 정리
   - 충분성 검사: P1>=2, P2>=2, 참고문헌>=4 확인

6. Writer LLM (1회 호출)
   - 수집된 모든 근거를 바탕으로 4개 문단 형식의 답변 생성
   - 1문단: 주요 기전 설명 (P1 근거 기반)
   - 2문단: 과학적 근거 (P2 근거 기반)
   - 3문단: 환자 맞춤 조언 (환자 데이터 기반)
   - 4문단: 종합 실천 조언

7. 사후 검사 및 재시도 (선택적)
   - 생성된 답변의 품질 확인
   - 부족하면 재시도 (최대 1회, 예산 확대)

주요 특징:
✅ 비용 안정성: 예산 기반으로 각 검색 소스별 호출 횟수 제한
✅ 일관성: State 기반으로 모든 노드가 동일한 상태 구조 사용
✅ 디버깅 가능: 각 단계의 결과를 debug 필드에 저장
✅ 무한 루프 방지: 실패 시 자동으로 다음 단계로 진행
✅ @tool 미사용: 모든 기능을 State를 읽고 쓰는 노드로 구현하여 일관성 확보
✅ 실제 구현 통합: main.ipynb의 실제 검색 및 데이터 조회 로직 통합
"""

from __future__ import annotations

import asyncio
import json
import os
import re
import logging
from datetime import datetime
from typing import Any, Dict, List, Literal, Optional, TypedDict, cast
from pathlib import Path
from uuid import UUID
from contextlib import asynccontextmanager

# =============================================================================
# 라이브러리 임포트
# =============================================================================

# -------- LangGraph 임포트 --------
# LangGraph: 상태 기반 워크플로우 그래프 구축을 위한 프레임워크
from langgraph.graph import StateGraph, START, END
from langgraph.graph import MessagesState


# -------- LLM (LangChain) --------
# LangChain: LLM 통합 및 프롬프트 관리
from pydantic import BaseModel, Field, ValidationError  # 데이터 검증
from langchain_openai import ChatOpenAI  # OpenAI LLM
from langchain_openai import OpenAIEmbeddings  # OpenAI 임베딩

# -------- RAG (선택적) --------
# FAISS: 벡터 검색을 위한 인메모리 인덱스
from langchain_community.vectorstores import FAISS
from langchain_community.document_loaders import PyPDFLoader  # PDF 로더

from langchain_text_splitters import RecursiveCharacterTextSplitter  # 문서 분할기

# -------- 웹 검색 (선택적) --------
# Firecrawl: 웹 크롤링 및 검색 서비스
from firecrawl import FirecrawlApp

# -------- PubMed (선택적) --------
# Bio.Entrez: NCBI PubMed API 접근
from Bio import Entrez

# -------- Google Scholar (선택적) --------
# SerpAPI: Google Scholar 검색 API
try:
    from serpapi import search as serpapi_search
    serpapi_available = True
except ImportError:
    serpapi_search = None
    serpapi_available = False

# -------- Supabase (선택적) --------
# Supabase: 환자 데이터 저장소
from supabase import create_client, Client

# -------- 체크포인터 (선택적) --------
# PostgresSaver: 대화 히스토리를 PostgreSQL에 저장
# AsyncPostgresSaver: async 스트리밍 지원 (astream 사용 시 필요)
try:
    from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
    async_postgres_available = True
except ImportError:
    AsyncPostgresSaver = None
    async_postgres_available = False

from langgraph.checkpoint.postgres import PostgresSaver
import psycopg  # PostgreSQL 연결
from psycopg_pool import ConnectionPool  # 연결 풀 관리 (동기)
try:
    from psycopg_pool import AsyncConnectionPool  # 비동기 연결 풀
    async_pool_available = True
except ImportError:
    AsyncConnectionPool = None
    async_pool_available = False

# -------- FastAPI --------
# FastAPI: REST API 프레임워크
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware

# -------- 환경 변수 --------
# .env 파일에서 환경 변수 로드
from dotenv import load_dotenv
load_dotenv()

# -------- 로깅 --------
# 로깅 설정: INFO 레벨 이상의 로그 출력
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# -------- LangSmith 추적 설정 --------
# LangSmith 추적 활성화 (공식 문서: https://docs.langchain.com/langsmith/trace-with-langchain)
# 환경 변수가 설정되면 LangChain과 LangGraph가 자동으로 추적합니다
langsmith_tracing = os.getenv("LANGSMITH_TRACING", "").lower() in ("true", "1", "yes")
langchain_tracing_v2 = os.getenv("LANGCHAIN_TRACING_V2", "").lower() in ("true", "1", "yes")
langsmith_api_key = os.getenv("LANGSMITH_API_KEY")
langsmith_workspace_id = os.getenv("LANGSMITH_WORKSPACE_ID")
langsmith_project = os.getenv("LANGSMITH_PROJECT", "lang-chatbot")

# LangSmith 추적 활성화 여부 확인
if langsmith_tracing or langchain_tracing_v2:
    if langsmith_api_key:
        # LangSmith 추적 활성화
        os.environ["LANGCHAIN_TRACING_V2"] = "true"
        os.environ["LANGCHAIN_ENDPOINT"] = os.getenv("LANGSMITH_ENDPOINT", "https://api.smith.langchain.com")
        
        # 워크스페이스 ID가 있으면 설정 (여러 워크스페이스가 있는 경우 필수)
        if langsmith_workspace_id:
            os.environ["LANGSMITH_WORKSPACE_ID"] = langsmith_workspace_id
        
        # 프로젝트 이름 설정 (선택적)
        if langsmith_project:
            os.environ["LANGSMITH_PROJECT"] = langsmith_project
        
        logger.info("✅ LangSmith tracing 활성화됨")
        logger.info(f"   - 프로젝트: {langsmith_project}")
        if langsmith_workspace_id:
            logger.info(f"   - 워크스페이스 ID: {langsmith_workspace_id[:8]}...")
    else:
        logger.warning("⚠️ LANGSMITH_TRACING이 활성화되었지만 LANGSMITH_API_KEY가 없습니다. 추적을 비활성화합니다.")
        os.environ["LANGCHAIN_TRACING_V2"] = "false"
else:
    # LangSmith 추적 비활성화
    os.environ["LANGCHAIN_TRACING_V2"] = "false"
    logger.info("ℹ️ LangSmith tracing 비활성화됨")

# =============================================================================
# 0) 데이터 스키마 정의
# =============================================================================

# 근거 자료의 출처 타입 (RAG, 웹 검색, PubMed, Google Scholar, 데이터베이스)
SourceType = Literal["rag", "web", "pubmed", "scholar", "db"]

# 허용된 건강 카테고리 목록 (암 생존자 건강 관리에 필요한 카테고리)
ALLOWED_CATEGORIES = [
    "supplement",      # 보충제
    "nutrition",       # 영양
    "exercise",        # 운동
    "habit",           # 생활 습관
    "treatment",       # 치료
    "symptom",         # 증상 관리
    "sleep",           # 수면
    "stress",          # 스트레스 관리
    "lab_interpretation",  # 검사 결과 해석
    "drug_interaction",    # 약물 상호작용
    "recovery",        # 회복
    "mental_health",   # 정신 건강
]


class EvidenceItem(TypedDict, total=False):
    """근거 자료 항목: 각 검색 결과나 참고 문헌을 나타내는 구조"""
    source_type: SourceType  # 출처 타입
    title: str  # 제목
    url: str  # URL 링크
    pmid: str  # PubMed ID (PubMed 논문의 경우)
    year: int  # 발행 연도
    snippet: str  # 요약/본문 일부
    keywords: List[str]  # 키워드 목록


class Budget(TypedDict):
    """각 검색 소스별 최대 호출 횟수 예산 (비용 제어용)"""
    rag: int  # RAG 검색 최대 횟수
    web: int  # 웹 검색 최대 횟수
    pubmed: int  # PubMed 검색 최대 횟수
    scholar: int  # Google Scholar 검색 최대 횟수


class Counts(Budget):
    """Budget과 동일한 키를 가지며, 실제로 호출한 횟수를 추적"""
    pass


class OutputPayload(TypedDict):
    """최종 출력 형식: 4개 문단 + 참고 문헌"""
    first_paragraph: str  # 1문단: 주요 기전 설명
    second_paragraph: str  # 2문단: 과학적 근거
    third_paragraph: str  # 3문단: 환자 맞춤 조언
    fourth_paragraph: str  # 4문단: 종합 실천 조언
    references: List[EvidenceItem]  # 참고 문헌 목록


class GraphState(MessagesState):
    """그래프 전체에서 사용되는 상태 정보"""
    # 사용자 식별 정보
    user_id: str  # 사용자 ID
    conversation_id: str  # 대화 세션 ID (UUID 형식 문자열)

    # Router 노드의 출력 결과
    is_health_question: bool  # 건강 관련 질문인지 여부
    category: str  # 건강 카테고리 (예: "nutrition", "exercise" 등)
    query_rag: str  # RAG 검색용 한글 키워드
    query_web: str  # 웹 검색용 영어 키워드
    expanded_queries: List[str]  # 학술지 검색용 영어 키워드 쿼리 목록
    mechanism_seed_terms: List[str]  # 기전 관련 핵심 용어 (영어, 3-8개)
    non_health_short_answer: str  # 비건강 질문에 대한 짧은 답변

    # 제어 변수
    budget: Budget  # 각 검색 소스별 예산
    counts: Counts  # 각 검색 소스별 실제 호출 횟수
    attempt: int  # 현재 재시도 횟수
    max_attempts: int  # 최대 재시도 횟수

    # 문단별 근거 자료 버킷
    evidence_p1: List[EvidenceItem]  # P1 근거: RAG + 웹 검색 결과 (기전 설명용)
    evidence_p2: List[EvidenceItem]  # P2 근거: PubMed + Scholar 결과 (학술 근거용)
    patient_data: Dict[str, Any]  # 환자 데이터 (Supabase에서 조회)
    evidence_p3_notes: str  # 환자 관련 해석 노트

    # 정규화된 참고 문헌
    references: List[EvidenceItem]  # 중복 제거된 최종 참고 문헌 목록

    # 최종 출력
    output: Optional[OutputPayload]  # 최종 생성된 답변
    writer_raw: str  # Writer LLM의 원본 출력 (태그 포함)
    debug: Dict[str, Any]  # 디버깅 정보


# =============================================================================
# 1) Router 구조화된 출력 (Pydantic 모델)
# =============================================================================

class RouterResult(BaseModel):
    """Router LLM의 출력을 검증하기 위한 Pydantic 모델"""
    is_health_question: bool = Field(..., description="사용자 질문이 건강 관련인지 여부")
    non_health_short_answer: Optional[str] = Field(
        default=None, description="건강 관련이 아닌 경우 1-2문장 짧은 답변"
    )
    category: Optional[str] = Field(default=None, description="건강 카테고리 라벨 (해당되는 경우)")
    query_rag: Optional[str] = Field(default=None, description="RAG 검색용 한글 키워드 (2-5개 단어, 문장형 아님)")
    query_web: Optional[str] = Field(default=None, description="웹 검색용 영어 키워드 (2-5개 단어, 문장형 아님)")
    expanded_queries: List[str] = Field(default_factory=list, description="학술지 검색용 영어 키워드 쿼리 목록 (최대 3개)")
    mechanism_seed_terms: List[str] = Field(default_factory=list, description="3-8개의 핵심 기전 용어 (영어 키워드)")
    budget: Budget = Field(
        default_factory=lambda: {"rag": 6, "web": 2, "pubmed": 2, "scholar": 1},
        description="각 검색 소스별 예산"
    )
    


# =============================================================================
# 2) 유틸리티 헬퍼 함수들
# =============================================================================

def _safe_json_loads(text: str) -> Any:
    """
    LLM 출력에서 JSON을 안전하게 추출하는 함수
    LLM이 때때로 JSON 외의 텍스트를 포함할 수 있으므로, 최선의 노력으로 JSON을 찾아 파싱함
    - 마크다운 코드 블록(```json ... ```)에서 JSON 추출
    - 여러 JSON 객체가 있을 경우 가장 큰 것 선택
    - 중첩된 JSON 객체 처리
    """
    if not text:
        raise ValueError("빈 텍스트입니다")
    
    text = text.strip()
    
    # 1. 먼저 직접 JSON 파싱 시도
    try:
        return json.loads(text)
    except Exception:
        pass
    
    # 2. 마크다운 코드 블록에서 JSON 추출 (```json ... ``` 또는 ``` ... ```)
    code_block_pattern = r"```(?:json)?\s*(\{.*?\})\s*```"
    matches = re.findall(code_block_pattern, text, re.DOTALL)
    for match in matches:
        try:
            return json.loads(match.strip())
        except Exception:
            continue
    
    # 3. 중첩된 JSON 객체를 찾기 위해 더 정교한 패턴 사용
    # 가장 깊은 중첩을 가진 JSON 객체를 찾기 위해 여러 시도
    json_patterns = [
        r"\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}",  # 간단한 중첩
        r"\{.*\}",  # 전체 텍스트에서 가장 긴 JSON 객체
    ]
    
    for pattern in json_patterns:
        matches = list(re.finditer(pattern, text, re.DOTALL))
        if matches:
            # 가장 긴 매치를 선택 (일반적으로 가장 완전한 JSON)
            longest_match = max(matches, key=lambda m: len(m.group(0)))
            try:
                return json.loads(longest_match.group(0))
            except Exception:
                continue
    
    # 4. 마지막 시도: 첫 번째 {부터 마지막 }까지 추출
    first_brace = text.find("{")
    last_brace = text.rfind("}")
    if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
        try:
            return json.loads(text[first_brace:last_brace + 1])
        except Exception:
            pass
    
    # 5. 모든 시도 실패 시 원본 텍스트를 로깅하고 예외 발생
    logger.error(f"JSON 파싱 실패. LLM 출력:\n{text[:500]}...")  # 처음 500자만 로깅
    raise ValueError("LLM 출력에서 JSON을 파싱할 수 없습니다")


def _cap_budget(budget: Budget) -> Budget:
    """
    예산을 하드 캡으로 제한하여 비용 안정성 확보
    각 검색 소스별로 최대값을 설정하여 예상치 못한 높은 비용 방지
    """
    return {
        "rag": min(max(budget.get("rag", 0), 0), 6),  # RAG 최대 6회
        "web": min(max(budget.get("web", 0), 0), 3),  # 웹 검색 최대 3회
        "pubmed": min(max(budget.get("pubmed", 0), 0), 2),  # PubMed 최대 2회
        "scholar": min(max(budget.get("scholar", 0), 0), 2),  # Scholar 최대 2회
    }


def _init_counts() -> Counts:
    """각 검색 소스별 호출 횟수를 0으로 초기화"""
    return {"rag": 0, "web": 0, "pubmed": 0, "scholar": 0}


def _dedupe_evidence(items: List[EvidenceItem]) -> List[EvidenceItem]:
    """
    근거 자료 목록에서 중복 제거
    (출처 타입, URL/PMID, 제목)을 기준으로 중복을 판단함
    """
    seen = set()  # 이미 본 항목을 추적하는 집합
    out: List[EvidenceItem] = []
    for it in items:
        # 중복 판단을 위한 고유 키 생성
        key = (
            it.get("source_type"),  # 출처 타입
            it.get("url") or "",  # URL (없으면 빈 문자열)
            it.get("pmid") or "",  # PMID (없으면 빈 문자열)
            (it.get("title") or "")[:200],  # 제목 (최대 200자)
        )
        if key in seen:
            continue  # 이미 본 항목이면 건너뜀
        seen.add(key)
        out.append(it)
    return out


def _keyword_overlap(seed_terms: List[str], text: str) -> int:
    """
    간단한 관련성 휴리스틱: 시드 용어가 텍스트에 몇 개나 나타나는지 카운트
    기전 관련 핵심 용어가 논문 제목/초록에 얼마나 포함되어 있는지 확인
    """
    t = (text or "").lower()  # 소문자로 변환하여 대소문자 무시
    return sum(1 for s in seed_terms if s.lower() in t)  # 포함된 시드 용어 개수 반환


# =============================================================================
# JSON 유틸리티 (제어 문자 제거)
# =============================================================================

def clean_for_json(obj: Any) -> Any:
    """
    JSON 직렬화 전에 제어 문자를 제거하는 헬퍼 함수
    딕셔너리, 리스트, 문자열을 재귀적으로 처리
    """
    if isinstance(obj, dict):
        return {k: clean_for_json(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [clean_for_json(item) for item in obj]
    elif isinstance(obj, str):
        # 제어 문자 제거 (0x00-0x1F, 단 \n, \r, \t는 유지)
        cleaned = ""
        for char in obj:
            code = ord(char)
            # 허용된 제어 문자: \n(10), \r(13), \t(9)
            if code < 32 and code not in (9, 10, 13):
                continue
            # 삭제 문자(127)도 제거
            elif code == 127:
                continue
            else:
                cleaned += char
        return cleaned
    else:
        return obj


def safe_json_dumps(obj: Any, **kwargs) -> str:
    """
    제어 문자를 제거한 후 JSON 직렬화
    """
    cleaned_obj = clean_for_json(obj)
    return json.dumps(cleaned_obj, **kwargs)


# =============================================================================
# 태그 기반 스트리밍 파서
# =============================================================================

class TaggedWriterStreamParser:
    """
    Writer 출력에서 [[P1]]...[[/P1]] 등 섹션 태그를 감지하여 이벤트 생성 및 JSON 파싱
    태그는 완전히 제거되어 사용자에게 노출되지 않음
    """
    START_TAGS = {"[[P1]]": "p1", "[[P2]]": "p2", "[[P3]]": "p3", "[[P4]]": "p4", "[[JSON]]": "json"}
    END_TAGS = {"[[/P1]]": "p1", "[[/P2]]": "p2", "[[/P3]]": "p3", "[[/P4]]": "p4", "[[/JSON]]": "json"}
    
    # 태그 패턴 (정규표현식으로 불완전한 태그도 감지)
    TAG_PATTERN = re.compile(r'\[\[/?[PJ][1-4]?\]?\]?')

    def __init__(self):
        self.buf = ""
        self.section: Optional[str] = None
        self.json_buf = ""
        self.section_text: Dict[str, str] = {"p1": "", "p2": "", "p3": "", "p4": ""}

    def _clean_text(self, text: str) -> str:
        """텍스트에서 모든 태그 패턴 제거 (불완전한 태그 포함)"""
        if not text:
            return text
        # 완전한 태그 제거
        cleaned = text
        for tag in list(self.START_TAGS.keys()) + list(self.END_TAGS.keys()):
            cleaned = cleaned.replace(tag, "")
        # 불완전한 태그 패턴 제거 (chunk 경계에서 잘린 경우)
        cleaned = self.TAG_PATTERN.sub("", cleaned)
        return cleaned

    def feed(self, chunk: str) -> List[tuple]:
        """chunk를 넣으면 SSE로 보낼 이벤트 리스트 반환: (event_name, payload_dict)"""
        events: List[tuple] = []
        self.buf += chunk

        while True:
            next_pos, next_tag = None, None
            for tag in list(self.START_TAGS.keys()) + list(self.END_TAGS.keys()):
                pos = self.buf.find(tag)
                if pos != -1 and (next_pos is None or pos < next_pos):
                    next_pos, next_tag = pos, tag

            if next_pos is None:
                if self.section and len(self.buf) > 0:
                    text = self._clean_text(self.buf)  # 태그 제거
                    self.buf = ""
                    if self.section == "json":
                        self.json_buf += text
                    else:
                        self.section_text[self.section] += text
                        if text:  # 빈 텍스트는 전송하지 않음
                            events.append(("delta", {"section": self.section, "text": text}))
                break

            before = self.buf[:next_pos]
            if before:
                cleaned_before = self._clean_text(before)  # 태그 제거
                if self.section == "json":
                    self.json_buf += cleaned_before
                elif self.section:
                    self.section_text[self.section] += cleaned_before
                    if cleaned_before:  # 빈 텍스트는 전송하지 않음
                        events.append(("delta", {"section": self.section, "text": cleaned_before}))

            self.buf = self.buf[next_pos + len(next_tag):]

            if next_tag in self.START_TAGS:
                sec = self.START_TAGS[next_tag]
                self.section = sec
                if sec in ("p1", "p2", "p3", "p4"):
                    events.append(("section_start", {"section": sec}))
            else:
                sec = self.END_TAGS[next_tag]
                if sec == "json":
                    self.section = None
                else:
                    events.append(("section_done", {"section": sec}))
                    self.section = None

        return events

    def try_parse_final_json(self) -> Optional[Dict[str, Any]]:
        """writer 스트림이 끝난 뒤 JSON 블록 파싱"""
        raw = self.json_buf.strip()
        if not raw:
            return None
        try:
            return json.loads(raw)
        except Exception:
            return None


# =============================================================================
# 3) 캐싱 시스템
# =============================================================================

# 간단한 인메모리 캐시 (프로덕션에서는 Redis 등으로 교체 가능)
_response_cache_firecrawl: Dict[str, str] = {}  # Firecrawl 검색 결과 캐시
_response_cache_pubmed: Dict[str, Dict[str, Any]] = {}  # PubMed 검색 결과 캐시


def _save_cache_firecrawl():
    """Firecrawl 캐시를 디스크에 저장 (재시작 후에도 유지되도록)"""
    cache_file = Path("cache_firecrawl.json")
    try:
        cache_file.write_text(json.dumps(_response_cache_firecrawl, ensure_ascii=False))
    except Exception as e:
        logger.warning(f"Firecrawl 캐시 저장 실패: {e}")


def _load_cache_firecrawl():
    """디스크에서 Firecrawl 캐시 로드"""
    cache_file = Path("cache_firecrawl.json")
    if cache_file.exists():
        try:
            global _response_cache_firecrawl
            _response_cache_firecrawl = json.loads(cache_file.read_text())
        except Exception as e:
            logger.warning(f"Firecrawl 캐시 로드 실패: {e}")


def _save_cache_pubmed():
    """PubMed 캐시를 디스크에 저장"""
    cache_file = Path("cache_pubmed.json")
    try:
        cache_file.write_text(json.dumps(_response_cache_pubmed, ensure_ascii=False))
    except Exception as e:
        logger.warning(f"PubMed 캐시 저장 실패: {e}")


def _load_cache_pubmed():
    """디스크에서 PubMed 캐시 로드"""
    cache_file = Path("cache_pubmed.json")
    if cache_file.exists():
        try:
            global _response_cache_pubmed
            _response_cache_pubmed = json.loads(cache_file.read_text())
        except Exception as e:
            logger.warning(f"PubMed 캐시 로드 실패: {e}")


# 시작 시 캐시 로드
_load_cache_firecrawl()
_load_cache_pubmed()


# =============================================================================
# 4) 외부 서비스 구현 (main.ipynb에서 가져온 실제 구현)
# =============================================================================

def _auto_update_vector_store(pdf_dir: str, category: str) -> None:
    """
    벡터 스토어가 오래되었으면 업데이트하거나 존재하지 않으면 생성
    - PDF 파일이 존재하는지 확인
    - 벡터 스토어가 없거나 PDF가 더 최신이면 벡터 스토어 생성/업데이트
    - PDF를 로드하여 청크로 분할하고 FAISS 벡터 스토어로 저장
    """
    vector_path = f"database/faiss/{category}"
    logger.info(f"벡터 경로: {vector_path}")
    logger.info(f"벡터 존재 여부: {os.path.exists(vector_path)}")
    
    # 업데이트 및 생성이 필요한지 확인
    should_update = (
        not os.path.exists(vector_path) or  # 벡터 정보가 없는 경우
        (os.path.exists(pdf_dir) and os.path.exists(vector_path) and 
         os.path.getmtime(pdf_dir) > os.path.getmtime(vector_path))  # PDF 파일이 더 최신인 경우
    )
    logger.info(f"업데이트 필요 여부: {should_update}")
    
    if not should_update:
        logger.info(f"벡터 스토어가 최신 상태입니다 (카테고리: {category})")
        return
    
    # 필요한 라이브러리가 없으면 경고 후 종료
    if FAISS is None or PyPDFLoader is None or RecursiveCharacterTextSplitter is None:
        logger.warning("FAISS, PyPDFLoader, 또는 RecursiveCharacterTextSplitter를 사용할 수 없습니다. 벡터 스토어 업데이트를 건너뜁니다.")
        return
    
    # PDF 파일이 없으면 경고 후 종료
    if not os.path.exists(pdf_dir):
        logger.warning(f"PDF 파일을 찾을 수 없습니다: {pdf_dir}")
        return
    
    try:
        # 벡터 저장소 생성
        logger.info("벡터 스토어 생성 시작...")
        loader = PyPDFLoader(pdf_dir)
        documents = loader.load()
        logger.info(f"{len(documents)}개의 문서를 로드했습니다")
        
        # 문서를 청크로 분할 (청크 크기: 1000자, 겹침: 200자)
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        splits = text_splitter.split_documents(documents)
        logger.info(f"{len(splits)}개의 청크를 생성했습니다")
        
        # OpenAI 임베딩을 사용하여 벡터 스토어 생성
        embeddings = OpenAIEmbeddings()
        vectorstore = FAISS.from_documents(splits, embeddings)
        logger.info("벡터 스토어를 생성했습니다")
        
        # 벡터 스토어를 디스크에 저장
        os.makedirs(vector_path, exist_ok=True)
        vectorstore.save_local(vector_path)
        logger.info(f"벡터 스토어를 저장했습니다: {vector_path}")
    except Exception as e:
        logger.error(f"벡터 스토어 생성 중 오류 발생: {str(e)}", exc_info=True)
        raise


def rag_search(query: str, expanded_queries: List[str], top_k: int, category: str = "general") -> List[Dict[str, Any]]:
    """
    FAISS를 사용한 RAG 검색
    - PDF 문서를 벡터화하여 저장한 FAISS 인덱스에서 관련 문서 검색
    - 카테고리별로 별도의 인덱스 관리
    - 한글 키워드 쿼리 사용 (expanded_queries는 현재 사용하지 않음)
    """
    if FAISS is None:
        logger.warning("FAISS not available, skipping RAG search")
        return []
    pdf_dir = f"database/pdfs/{category}.pdf"
    
    try:
        # 벡터 스토어 자동 업데이트 (PDF가 최신이면 인덱스 갱신)
        _auto_update_vector_store(pdf_dir, category)
        
        # FAISS 인덱스 경로 확인
        faiss_path = f"database/faiss/{category}"
        if not os.path.exists(faiss_path):
            logger.warning(f"FAISS 인덱스를 찾을 수 없습니다: {faiss_path}")
            return []

        # FAISS 벡터 스토어 로드
        vector_store = FAISS.load_local(
            folder_path=faiss_path,
            index_name="index",
            embeddings=OpenAIEmbeddings(),  # OpenAI 임베딩 사용
            allow_dangerous_deserialization=True,  # 로컬 파일이므로 허용
        )
        # 검색기 생성 (상위 k개 결과 반환)
        retriever = vector_store.as_retriever(search_kwargs={"k": top_k})
        
        # 메인 쿼리 먼저 시도, 그 다음 확장 쿼리 시도
        all_docs = []
        queries_to_try = [query] + expanded_queries[:2]  # 확장 쿼리는 최대 2개만
        
        for q in queries_to_try:
            try:
                docs = retriever.invoke(q)  # 벡터 검색 실행
                if isinstance(docs, list):
                    # 여러 문서가 반환된 경우
                    for doc in docs:
                        all_docs.append({
                            "title": getattr(doc, "metadata", {}).get("title", "RAG Document"),
                            "content": doc.page_content if hasattr(doc, "page_content") else str(doc),
                            "url": getattr(doc, "metadata", {}).get("url", ""),
                        })
                else:
                    # 단일 문서가 반환된 경우
                    all_docs.append({
                        "title": "RAG Document",
                        "content": str(docs),
                        "url": "",
                    })
                # 필요한 개수만큼 수집했으면 중단
                if len(all_docs) >= top_k:
                    break
            except Exception as e:
                logger.error(f"쿼리 '{q}'에 대한 RAG 검색 오류: {e}")
                continue  # 다음 쿼리 시도

        return all_docs[:top_k]  # 요청한 개수만큼 반환
    except Exception as e:
        logger.error(f"RAG error: {e}")
        return []


def web_search(query: str, max_results: int) -> List[Dict[str, Any]]:
    """
    웹 검색: Firecrawl을 우선 사용하고, 실패 시 Serper API로 폴백
    - Firecrawl: 웹 크롤링 및 검색 서비스
    - Serper: Google 검색 API 대체 서비스
    """
    # 캐시 확인: 이전에 검색한 쿼리면 캐시에서 반환
    if query in _response_cache_firecrawl:
        cached = _response_cache_firecrawl[query]
        # 캐시된 문자열을 구조화된 형식으로 파싱
        results = []
        for item in cached.split("\n\n"):  # 각 검색 결과는 "\n\n"로 구분
            lines = item.split("\n")
            if len(lines) >= 2:
                results.append({
                    "title": lines[0],  # 첫 줄: 제목
                    "snippet": "\n".join(lines[1:-1]) if len(lines) > 2 else "",  # 중간 줄: 요약
                    "url": lines[-1].replace("출처: ", "") if lines[-1].startswith("출처: ") else "",  # 마지막 줄: URL
                })
        return results[:max_results]  # 요청한 개수만큼 반환

    firecrawl_api_key = os.getenv("FIRECRAWL_API_KEY")
    
    if FirecrawlApp and firecrawl_api_key:
        try:
            app = FirecrawlApp(api_key=firecrawl_api_key)
            search_results = app.search(query=query, limit=max_results)
            
            if not search_results or "data" not in search_results:
                logger.warning("Firecrawl returned no results, falling back to Serper")
                return _google_serper_search(query, max_results)
            
            results = []
            for item in search_results.get("data", [])[:max_results]:
                results.append({
                    "title": item.get("title", ""),
                    "snippet": item.get("description", ""),
                    "url": item.get("url", ""),
                })
            
            # Cache result
            cache_str = "\n\n".join([
                f"{r['title']}\n{r['snippet']}\n출처: {r['url']}"
                for r in results
            ])
            _response_cache_firecrawl[query] = cache_str
            _save_cache_firecrawl()
            
            return results
        except Exception as e:
            logger.error(f"Firecrawl search error: {e}")
            return _google_serper_search(query, max_results)
    else:
        return _google_serper_search(query, max_results)


def _google_serper_search(query: str, max_results: int) -> List[Dict[str, Any]]:
    """
    Serper API를 사용한 Google 검색 (Firecrawl 실패 시 폴백)
    - Google 검색 결과를 API로 제공하는 서비스
    """
    serper_api_key = os.getenv("SERPER_API_KEY")
    if not serper_api_key:
        logger.warning("No web search API key available")
        return []
    
    try:
        import requests
        response = requests.post(
            "https://google.serper.dev/search",
            headers={"X-API-KEY": serper_api_key},
            json={"q": query, "num": max_results}
        )
        response.raise_for_status()
        data = response.json()
        
        results = []
        for item in data.get("organic", [])[:max_results]:
            results.append({
                "title": item.get("title", ""),
                "snippet": item.get("snippet", ""),
                "url": item.get("link", ""),
            })
        return results
    except Exception as e:
        logger.error(f"Serper search error: {e}")
        return []


def pubmed_search(query: str, max_results: int) -> List[Dict[str, Any]]:
    """
    PubMed 검색: NCBI Entrez API를 사용한 의학 논문 검색
    - 논문 타입(메타분석, RCT 등)과 발행 연도를 고려하여 점수화
    - 점수가 높은 논문을 우선 반환
    """
    if Entrez is None:
        logger.warning("Bio.Entrez not available, skipping PubMed search")
        return []

    # Check cache
    if query in _response_cache_pubmed:
        cached = _response_cache_pubmed[query]
        return cached.get("results", [])[:max_results]

    ncbi_api_key = os.getenv("NCBI_API_KEY")
    entrez_email = os.getenv("ENTREZ_EMAIL")
    
    if not entrez_email:
        logger.warning("ENTREZ_EMAIL not set, skipping PubMed search")
        return []

    Entrez.email = entrez_email
    if ncbi_api_key:
        Entrez.api_key = ncbi_api_key

    # 근거 수준 계층 구조 (높을수록 더 신뢰할 수 있는 근거)
    _evidence_hierarchy = {
        'systematic review': 15,  # 체계적 문헌고찰 (최고 수준)
        'meta-analysis': 14,  # 메타분석
        'randomized controlled trial': 13,  # 무작위 대조 시험
        'clinical trial': 12,  # 임상 시험
        'practice guideline': 11,  # 진료 가이드라인
        'cohort study': 10,  # 코호트 연구
        'case-control study': 9,  # 환자-대조군 연구
        'comparative study': 8,  # 비교 연구
        'clinical study': 7,  # 임상 연구
        'case series': 6,  # 증례 연속
        'case report': 5,  # 증례 보고
    }

    def evaluate_paper_score(article) -> float:
        """
        논문의 근거 수준과 발행 연도를 고려하여 점수 계산
        - 근거 타입에 따라 기본 점수 부여
        - 최신 논문일수록 추가 점수 부여 (최근 3년 내 발행 논문 우선)
        """
        score = 0.0
        pub_types = [str(t).lower() for t in article['MedlineCitation']['Article'].get('PublicationTypeList', [])]
        for evidence_type, value in _evidence_hierarchy.items():
            if any(evidence_type in pt for pt in pub_types):
                score += value
                break
        
        try:
            year = int(article['MedlineCitation']['Article']['Journal']['JournalIssue']['PubDate'].get('Year', 0))
            current_year = datetime.now().year
            if year == current_year:
                score += 10
            elif year == current_year - 1:
                score += 8
            elif year >= current_year - 3:
                score += 5
        except Exception:
            pass
        
        return score

    try:
        search_handle = Entrez.esearch(
            db="pubmed",
            term=query,
            retmax=10,
            sort="relevance"
        )
        search_results = Entrez.read(search_handle)
        search_handle.close()
        
        if not search_results.get("IdList"):
            return []
        
        fetch_handle = Entrez.efetch(db="pubmed", id=search_results["IdList"], rettype="xml")
        articles = Entrez.read(fetch_handle).get('PubmedArticle', [])
        fetch_handle.close()
        
        # 각 논문에 대해 점수 계산 및 데이터 추출
        scored_papers = []
        for article in articles:
            score = evaluate_paper_score(article)  # 근거 수준 점수 계산
            medline = article['MedlineCitation']  # Medline 메타데이터
            
            # 논문 데이터 추출
            paper_data = {
                'title': medline['Article'].get('ArticleTitle', 'No title'),  # 제목
                'abstract': medline['Article'].get('Abstract', {}).get('AbstractText', [''])[0],  # 초록
                'pmid': str(medline['PMID']),  # PubMed ID
                'url': f"https://pubmed.ncbi.nlm.nih.gov/{medline['PMID']}/",  # URL 생성
                'year': medline['Article']['Journal']['JournalIssue']['PubDate'].get('Year', 'Unknown'),  # 발행 연도
                'evidence_score': score,  # 계산된 근거 점수
            }
            scored_papers.append(paper_data)
        
        # 점수 순으로 정렬하여 상위 논문만 선택
        top_papers = sorted(scored_papers, key=lambda x: x['evidence_score'], reverse=True)[:max_results]
        
        # Cache result
        result_dict = {
            "status": "success",
            "query": query,
            "results": top_papers,
            "total_results": len(top_papers)
        }
        _response_cache_pubmed[query] = result_dict
        _save_cache_pubmed()
        
        return top_papers
    except Exception as e:
        logger.error(f"PubMed search error: {e}")
        return []


def scholar_search(query: str, max_results: int) -> List[Dict[str, Any]]:
    """
    Google Scholar 검색: SerpAPI를 사용한 학술 논문 검색
    - Google Scholar의 검색 결과를 API로 제공받음
    """
    if not serpapi_available or serpapi_search is None:
        logger.warning("serpapi not available, skipping Scholar search")
        return []

    serpapi_key = os.getenv("SERPAPI_KEY")
    if not serpapi_key:
        logger.warning("SERPAPI_KEY not set, skipping Scholar search")
        return []

    try:
        # serpapi의 search 함수는 딕셔너리를 직접 반환
        results = serpapi_search({
            "q": query,
            "api_key": serpapi_key,
            "engine": "google_scholar"  # Google Scholar 엔진 지정
        })
        
        scholar_results = []
        if results and "organic_results" in results:
            for result in results["organic_results"][:max_results]:
                scholar_results.append({
                    "title": result.get("title", ""),
                    "snippet": result.get("snippet", ""),
                    "url": result.get("link", ""),
                })
        
        return scholar_results
    except Exception as e:
        logger.error(f"Scholar search error: {e}")
        return []


async def get_or_create_bot_message_room(supabase: Client, conversation_id: str, user_id: str) -> Optional[int]:
    """대화방 조회 또는 생성"""
    try:
        response = supabase.table("bot_message_rooms").select("bot_message_room_id").eq("conversation_id", conversation_id).execute()
        if response.data and len(response.data) > 0:
            return response.data[0].get("bot_message_room_id")
        
        insert_response = supabase.table("bot_message_rooms").insert({
            "conversation_id": conversation_id,
            "created_by": user_id,
            "room_name": "AI Chat Room",
        }).execute()
        
        if insert_response.data and len(insert_response.data) > 0:
            room_id = insert_response.data[0].get("bot_message_room_id")
            try:
                supabase.table("bot_message_room_members").insert({
                    "bot_message_room_id": room_id,
                    "profile_id": user_id,
                }).execute()
            except Exception:
                pass
            return room_id
        return None
    except Exception as e:
        logger.error(f"대화방 조회/생성 실패: {e}", exc_info=True)
        return None


async def save_to_supabase(conversation_id: str, user_id: str, user_message: str, output: Dict[str, Any]) -> None:
    """Supabase에 사용자 메시지와 AI 응답 저장"""
    if create_client is None:
        return
    
    supabase_url = os.getenv("SUPABASE_URL")
    service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    anon_key = os.getenv("SUPABASE_KEY")
    supabase_key = service_role_key or anon_key
    
    if not supabase_url or not supabase_key:
        return
    
    try:
        supabase: Client = create_client(supabase_url, supabase_key)
        room_id = await get_or_create_bot_message_room(supabase, conversation_id, user_id)
        if not room_id:
            return
        
        supabase.table("bot_messages").insert({
            "bot_message_room_id": room_id,
            "sender_id": user_id,
            "content": user_message,
        }).execute()
        
        supabase.table("bot_messages").insert({
            "bot_message_room_id": room_id,
            "sender_id": "ai-assistant",
            "content": safe_json_dumps(output, ensure_ascii=False),
        }).execute()
        
        logger.info(f"✅ 메시지 저장 완료: conversation_id={conversation_id}")
    except Exception as e:
        logger.error(f"❌ Supabase 저장 실패: {e}", exc_info=True)


def fetch_patient_data(user_id: str) -> Dict[str, Any]:
    """
    Supabase에서 환자 데이터 조회
    - health_profiles_view를 우선 시도하고, 없으면 개별 테이블에서 조회
    - 뷰는 LEFT JOIN으로 여러 행을 반환할 수 있으므로, 환자 정보와 혈액검사 결과를 분리하여 처리
    - 환자 기본 정보와 최근 혈액 검사 결과를 반환
    - user_id만으로 환자 정보를 조회 (conversation_id 불필요)
    """
    if create_client is None:
        logger.warning("Supabase client not available")
        return {}

    supabase_url = os.getenv("SUPABASE_URL")
    # 서버사이드에서는 service_role key 사용 (RLS 우회)
    # 보안 주의: service_role key는 절대 클라이언트에 노출되면 안 됨
    service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    anon_key = os.getenv("SUPABASE_KEY")
    supabase_key = service_role_key or anon_key
    
    # 디버깅: 사용 중인 키 타입 확인
    if service_role_key:
        logger.info("✅ SUPABASE_SERVICE_ROLE_KEY 사용 중 (RLS 우회)")
        key_type = "service_role"
    elif anon_key:
        logger.warning("⚠️ SUPABASE_KEY 사용 중 (RLS 적용됨 - 권한 문제 발생 가능)")
        key_type = "anon"
    else:
        logger.error("❌ Supabase 키가 설정되지 않았습니다")
        return {}
    
    if not supabase_url:
        logger.error("❌ SUPABASE_URL이 설정되지 않았습니다")
        return {}
    
    # service_role key 확인 (일반적으로 더 긴 문자열)
    if key_type == "service_role":
        key_preview = f"{supabase_key[:20]}...{supabase_key[-10:]}" if len(supabase_key) > 30 else "***"
        logger.info(f"Service role key 확인: {key_preview} (길이: {len(supabase_key)})")

    try:
        supabase: Client = create_client(supabase_url, supabase_key)
        
        # health_profiles_view를 먼저 시도 (통합 뷰가 있으면 사용)
        try:
            response = supabase.table("health_profiles_view").select("*").eq("patient_id", user_id).execute()
            
            if response.data and len(response.data) > 0:
                # 첫 번째 행에서 환자 기본 정보 추출 (모든 행에서 동일)
                first_row = response.data[0]
                patient_info = {
                    "patient_id": first_row.get("patient_id"),
                    "age": first_row.get("age"),
                    "gender": first_row.get("gender"),
                    "bmi": first_row.get("bmi"),  # 뷰에서 계산된 BMI
                    "height_cm": first_row.get("height_cm"),
                    "weight_kg": first_row.get("weight_kg"),
                    "disease": first_row.get("disease"),  # 뷰 필드명: disease (disease_type 아님)
                    "disease_status": first_row.get("disease_status"),
                    "treatment_status": first_row.get("treatment_status"),
                    "medication_status": first_row.get("medication_status"),
                    "medication_name": first_row.get("medication_name"),
                    "patient_name": first_row.get("patient_name"),
                }
                
                # 모든 행에서 혈액검사 결과 수집 (result_id가 있는 경우만)
                lab_results = []
                seen_result_ids = set()  # 중복 제거용
                
                for row in response.data:
                    result_id = row.get("result_id")
                    # result_id가 있고 아직 추가하지 않은 경우만 추가
                    if result_id and result_id not in seen_result_ids:
                        seen_result_ids.add(result_id)
                        lab_results.append({
                            "result_id": result_id,
                            "test_id": row.get("test_id"),
                            "test_name": row.get("standard_name"),  # 검사 항목명 (standard_name)
                            "value": row.get("result_value"),  # 검사 결과 값
                            "unit": row.get("result_unit") or row.get("type_unit"),  # 단위 (result_unit 우선)
                            "reference_min": row.get("reference_min"),  # 정상 범위 최소값
                            "reference_max": row.get("reference_max"),  # 정상 범위 최대값
                            "test_date": row.get("test_date"),  # 검사 날짜
                            "is_out_of_range": row.get("is_out_of_range"),  # 범위 밖 여부 (뷰에서 계산됨)
                            "confidence": row.get("confidence"),  # 신뢰도
                            "clinical_significance": row.get("clinical_significance"),  # 임상적 의미
                            "notes": row.get("notes"),  # 메모
                        })
                
                # 검사 날짜 기준으로 최신순 정렬 (최근 10개만)
                lab_results.sort(key=lambda x: x.get("test_date") or "", reverse=True)
                lab_results = lab_results[:10]
                
                return {
                    "patient_info": patient_info,
                    "lab_results": lab_results
                }
        except Exception as view_error:
            logger.warning(f"health_profiles_view 사용 실패, 개별 테이블로 폴백: {view_error}")
        
        # 폴백: 개별 테이블에서 조회 (뷰가 없는 경우)
        # patient_health_profiles 테이블에서 기본 정보 조회
        try:
            profile_response = supabase.table("patient_health_profiles").select("*").eq("patient_id", user_id).execute()
        except Exception as e:
            logger.error(f"프로필 조회 실패: {e}")
            profile_response = None
        
        patient_info = {}
        if profile_response and profile_response.data:
            profile = profile_response.data[0]
            # BMI 계산 (height_cm와 weight_kg가 있으면)
            bmi = None
            if profile.get("height_cm") and profile.get("weight_kg"):
                try:
                    height_m = profile.get("height_cm") / 100.0
                    bmi = round(profile.get("weight_kg") / (height_m ** 2), 1)
                except Exception:
                    pass
            
            patient_info = {
                "patient_id": profile.get("patient_id"),
                "age": profile.get("age"),
                "gender": profile.get("gender"),
                "bmi": bmi,
                "height_cm": profile.get("height_cm"),
                "weight_kg": profile.get("weight_kg"),
                "disease": profile.get("disease"),
                "disease_status": profile.get("disease_status"),
                "treatment_status": profile.get("treatment_status"),
                "medication_status": profile.get("medication_status"),
                "medication_name": profile.get("medication_name"),
            }
        
        # 혈액 검사 결과 조회 (blood_test_results와 blood_test_types 조인)
        # 최근 10개만 조회
        try:
            lab_response = supabase.table("blood_test_results").select(
                "result_id, test_id, result_value, result_unit, test_date, confidence, notes, "
                "blood_test_types(standard_name, unit, reference_min, reference_max, clinical_significance)"
            ).eq("patient_id", user_id).order("test_date", desc=True).limit(10).execute()
        except Exception as e:
            logger.error(f"검사 결과 조회 실패: {e}")
            lab_response = None
        
        lab_results = []
        if lab_response and lab_response.data:
            for test in lab_response.data:
                test_type = test.get("blood_test_types") or {}
                # reference 범위 체크
                is_out_of_range = False
                result_value = test.get("result_value")
                ref_min = test_type.get("reference_min")
                ref_max = test_type.get("reference_max")
                
                if result_value is not None:
                    try:
                        value = float(result_value)
                        if ref_min is not None and value < float(ref_min):
                            is_out_of_range = True
                        elif ref_max is not None and value > float(ref_max):
                            is_out_of_range = True
                    except (ValueError, TypeError):
                        pass
                
                lab_results.append({
                    "result_id": test.get("result_id"),
                    "test_id": test.get("test_id"),
                    "test_name": test_type.get("standard_name", ""),
                    "value": result_value,
                    "unit": test.get("result_unit") or test_type.get("unit", ""),
                    "reference_min": ref_min,
                    "reference_max": ref_max,
                    "test_date": test.get("test_date"),
                    "is_out_of_range": is_out_of_range,
                    "confidence": test.get("confidence"),
                    "clinical_significance": test_type.get("clinical_significance"),
                    "notes": test.get("notes"),
                })
        
        return {
            "patient_info": patient_info,
            "lab_results": lab_results
        }
    except Exception as e:
        logger.error(f"Supabase query error: {e}", exc_info=True)
        return {}


# =============================================================================
# 5) LLM 설정 (Router와 Writer만 사용)
# =============================================================================

# Router LLM: 건강 질문 분류 및 검색 계획 수립용 (1회 호출)
router_llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

# Writer LLM: 최종 답변 생성용 (1회 호출)
writer_llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)


# =============================================================================
# 6) 노드 구현
# =============================================================================

def node_bootstrap(state: GraphState) -> Dict[str, Any]:
    """
    부트스트랩 노드: 상태 필드를 초기화하여 프로덕션에서 KeyError 방지
    - 필수 필드들이 없을 경우 기본값으로 초기화
    - 새로운 사용자 메시지가 추가되었으면 검색 관련 상태를 강제로 초기화
    - 체크포인터로 복원된 이전 검색 결과가 새 질문에 영향을 주지 않도록 방지
    """
    messages = state.get("messages", [])
    
    # 새로운 질문 감지: 마지막 메시지가 사용자 메시지이고, 이전에 완료된 대화가 있었는지 확인
    is_new_question = False
    if messages:
        last_msg = messages[-1]
        
        # 메시지 타입 및 내용 확인 (dict 또는 LangChain 메시지 객체 모두 처리)
        if isinstance(last_msg, dict):
            msg_type = last_msg.get("type", "") or last_msg.get("role", "")
            has_content = bool(last_msg.get("content", ""))
        else:
            msg_type = getattr(last_msg, "type", "") or getattr(last_msg.__class__, "__name__", "")
            has_content = bool(getattr(last_msg, "content", ""))
        
        # 사용자 메시지인지 확인 (human, user, HumanMessage 등)
        is_user_message = (
            msg_type in ["human", "user"] or 
            "HumanMessage" in str(type(last_msg))
        )
        
        # 새 질문 조건: 사용자 메시지가 있고, 이전에 완료된 대화가 있었음
        is_new_question = is_user_message and has_content and (state.get("output") is not None)
    
    # 새 질문이면 검색 관련 상태 강제 초기화
    if is_new_question:
        logger.info("새로운 질문 감지 - 검색 상태 초기화")
        return {
            "attempt": 0,
            "max_attempts": state.get("max_attempts", 1),
            "counts": _init_counts(),
            "evidence_p1": [],  # P1 근거 강제 초기화
            "evidence_p2": [],  # P2 근거 강제 초기화
            "patient_data": state.get("patient_data", {}),  # 환자 데이터는 유지
            "evidence_p3_notes": "",
            "references": [],  # 참고 문헌 강제 초기화
            "output": None,
            "writer_raw": "",
            "debug": {},
        }
    
    # 기존 상태 유지 (같은 질문에 대한 재시도 등)
    return {
        "attempt": state.get("attempt", 0),
        "max_attempts": state.get("max_attempts", 1),
        "counts": state.get("counts", _init_counts()),
        "evidence_p1": state.get("evidence_p1", []),
        "evidence_p2": state.get("evidence_p2", []),
        "patient_data": state.get("patient_data", {}),
        "evidence_p3_notes": state.get("evidence_p3_notes", ""),
        "references": state.get("references", []),
        "output": state.get("output", None),
        "writer_raw": state.get("writer_raw", ""),
        "debug": state.get("debug", {}),
    }


def node_router(state: GraphState) -> Dict[str, Any]:
    """
    Router 노드: 건강 질문 분류 및 검색 계획 수립 (LLM 1회 호출)
    - 사용자 질문이 건강 관련인지 판단
    - 건강 질문인 경우: 카테고리, 검색 쿼리, 핵심 용어, 예산 할당
    - 비건강 질문인 경우: 짧은 답변 생성
    """
    messages = state.get("messages", [])
    if messages:
        last_msg = messages[-1]
        # Handle both dict and LangChain message objects
        user_msg = last_msg.get("content", "") if isinstance(last_msg, dict) else getattr(last_msg, "content", "")
    else:
        user_msg = ""

    # Router LLM 프롬프트: 건강 질문 분류 및 검색 계획 수립
    categories_list = ", ".join([f'"{cat}"' for cat in ALLOWED_CATEGORIES])
    prompt = f"""
당신은 암 환자의 보호자이자, 암 에너지 대사 연구가 및 의학 전문가입니다. 사용자의 건강 관련 질문만 정확히 분류하고 답변해야 합니다.

**중요: 건강 질문이 아닌 경우 반드시 is_health_question=false로 설정하세요.**

## 건강 질문이 아닌 경우 (is_health_question=false):
- 일상적인 대화, 인사, 감사 표현
- 단순한 사실 서술 (예: "오늘 저녁은 파스타를 먹었어", "어제 영화를 봤어")
- 건강과 무관한 일반 대화
- 건강 질문이 아닌 경우: non_health_short_answer에 사용자의 메시지에 맞는 자연스럽고 친절한 1-2문장의 짧은 답변을 제공하세요.
  * 인사에는 인사로 답변
  * 감사 표현에는 감사 인사로 답변
  * 일상 대화에는 간단히 확인하고 건강 관련 질문을 유도

**건강 질문이 아닌 예시:**
- "안녕하세요" → is_health_question=false, non_health_short_answer="안녕하세요! 건강 관련 질문이 있으시면 언제든지 물어보세요."
- "오늘 저녁은 파스타를 먹었어" → is_health_question=false, non_health_short_answer="네, 알겠습니다. 건강 관련 질문이 있으시면 언제든지 물어보세요."
- "고마워" → is_health_question=false, non_health_short_answer="천만에요. 건강 관련 질문이 있으시면 언제든지 물어보세요."

## 건강 질문인 경우 (is_health_question=true):
건강, 질병, 증상, 치료, 약물, 보충제, 영양제, 보조제, 영양, 운동, 수면, 스트레스 등과 관련된 질문만 해당합니다.

카테고리 (반드시 다음 중 하나):
[{categories_list}]
- supplement: 보충제 관련 질문
- nutrition: 영양 및 식단 관련 질문
- exercise: 운동 및 신체 활동 관련 질문
- habit: 생활 습관 관련 질문
- treatment: 치료 방법 및 치료 과정 관련 질문
- symptom: 증상 관리 및 완화 관련 질문
- sleep: 수면 관련 질문
- stress: 스트레스 관리 관련 질문
- lab_interpretation: 검사 결과 해석 관련 질문
- drug_interaction: 약물 상호작용 관련 질문
- recovery: 회복 및 재활 관련 질문
- mental_health: 정신 건강 및 심리적 웰빙 관련 질문

**건강 질문 예시:**
- "암환자가 퀘르세틴 먹어도 돼?" → is_health_question=true, category="supplement"
- "혈당 관리 방법이 뭐야?" → is_health_question=true, category="nutrition"
- "운동은 얼마나 해야 해?" → is_health_question=true, category="exercise"

건강 질문인 경우에만 다음 필드를 채우세요:
- query_rag: RAG 검색용 한글 키워드 (2-5개 단어, 문장형 아님, 예: "퀘르세틴 암 환자")
- query_web: 웹 검색용 영어 키워드 (2-5개 단어, 문장형 아님, 예: "quercetin cancer patients")
- expanded_queries: 학술지 검색용 영어 키워드 쿼리 목록 (최대 3개)
- mechanism_seed_terms: 기전 초점을 정의하는 3-8개의 영어 핵심 용어
- budget: 질문의 난이도에 따라 최대 호출 횟수 제안 (예시. rag<=6, web<=3, pubmed<=2, scholar<=2)

다음 JSON 형식만 반환하세요:
{{
  "is_health_question": true/false,
  "non_health_short_answer": "..." or null,
  "category": "..." or null,
  "query_rag": "..." or null,
  "query_web": "..." or null,
  "expanded_queries": ["...", "..."],
  "mechanism_seed_terms": ["...", "..."],
  "budget": {{"rag": int, "web": int, "pubmed": int, "scholar": int}}
}}

사용자 메시지:
{user_msg}
""".strip()

    resp = router_llm.invoke([{"role": "system", "content": prompt}])
    data = _safe_json_loads(resp.content)

    try:
        rr = RouterResult.model_validate(data)
        
        # 건강 질문인데 카테고리가 없거나 잘못된 경우 처리
        if rr.is_health_question:
            if not rr.category or rr.category.lower() not in ALLOWED_CATEGORIES:
                logger.warning(f"건강 질문인데 카테고리가 없거나 잘못됨: {rr.category}. 비건강 질문으로 재분류합니다.")
                state.setdefault("debug", {})
                state["debug"]["invalid_category"] = rr.category
                # 카테고리가 없거나 잘못되면 비건강 질문으로 처리
                # LLM이 생성한 non_health_short_answer가 있으면 사용, 없으면 기본 답변
                rr.is_health_question = False
                if not rr.non_health_short_answer:
                    rr.non_health_short_answer = "건강 관련 질문을 더 구체적으로 말씀해 주시겠어요?"
                rr.category = None
                rr.query_rag = None
                rr.query_web = None
                rr.expanded_queries = []
                rr.mechanism_seed_terms = []
                rr.budget = {"rag": 0, "web": 0, "pubmed": 0, "scholar": 0}
    except ValidationError as e:
        # ValidationError 발생 시 보수적으로 처리: 비건강 질문으로 분류
        logger.warning(f"Router 파싱 오류: {e}. 비건강 질문으로 분류합니다.")
        state.setdefault("debug", {})
        state["debug"]["router_parse_error"] = str(e)
        # 파싱된 데이터에서 non_health_short_answer를 추출 시도
        parsed_answer = None
        if isinstance(data, dict):
            parsed_answer = data.get("non_health_short_answer")
        rr = RouterResult(
            is_health_question=False,
            non_health_short_answer=parsed_answer or "죄송합니다. 질문을 이해하지 못했습니다. 건강 관련 질문을 다시 말씀해 주시겠어요?",
            category=None,
            query_rag=None,
            query_web=None,
            expanded_queries=[],
            mechanism_seed_terms=[],
            budget={"rag": 0, "web": 0, "pubmed": 0, "scholar": 0},
        )

    budget = _cap_budget(rr.budget)

    return {
        "is_health_question": rr.is_health_question,
        "non_health_short_answer": rr.non_health_short_answer or "",
        "category": (rr.category or "general").lower(),  # 소문자로 정규화
        "query_rag": (rr.query_rag or "").strip(),
        "query_web": (rr.query_web or "").strip(),
        "expanded_queries": rr.expanded_queries or [],
        "mechanism_seed_terms": rr.mechanism_seed_terms or [],
        "budget": budget,
        "counts": _init_counts(),
    }


def node_answer_non_health(state: GraphState) -> Dict[str, Any]:
    """
    비건강 질문 답변 노드: 추가 LLM 호출 없이 Router가 생성한 짧은 답변 반환
    - Router에서 이미 답변을 생성했으므로 그대로 사용
    """
    short = (state.get("non_health_short_answer") or "").strip()
    if not short:
        # 기본 답변을 더 명확하게 설정
        short = "네, 알겠습니다. 건강 관련 질문이 있으시면 언제든지 물어보세요."
    out: OutputPayload = {
        "first_paragraph": short,
        "second_paragraph": "",
        "third_paragraph": "",
        "fourth_paragraph": "",
        "references": [],
    }
    return {"output": out}


# ---------------- P1 근거 수집: RAG 루프 후 웹 검색 루프 ----------------

def node_rag_retrieve(state: GraphState) -> Dict[str, Any]:
    """
    RAG 검색 노드: FAISS 벡터 스토어에서 관련 문서 검색
    - 예산 내에서 반복 호출 가능
    - 검색 결과를 evidence_p1에 추가
    - 한글 키워드 쿼리 사용
    """
    if state["counts"]["rag"] >= state["budget"]["rag"]:
        return {}

    top_k = 1
    category = state.get("category", "general")
    query_rag = state.get("query_rag", "").strip()
    if not query_rag:
        return {}
    
    # RAG 검색은 한글 키워드만 사용 (expanded_queries는 사용하지 않음)
    docs = rag_search(query_rag, [], top_k=top_k, category=category)
    state["counts"]["rag"] += 1

    evidence = []
    for d in docs:
        evidence.append(
            cast(EvidenceItem, {
                "source_type": "rag",
                "title": d.get("title", "RAG Document"),
                "snippet": d.get("content", "")[:1200],
                "url": d.get("url", ""),
            })
        )

    merged = _dedupe_evidence(state.get("evidence_p1", []) + evidence)
    return {"evidence_p1": merged, "counts": state["counts"]}


def node_web_retrieve(state: GraphState) -> Dict[str, Any]:
    """
    웹 검색 노드: Firecrawl/Serper를 사용한 웹 검색
    - RAG 검색으로 충분한 근거를 얻지 못한 경우 사용
    - 검색 결과를 evidence_p1에 추가
    - 영어 키워드 쿼리 사용
    """
    if state["counts"]["web"] >= state["budget"]["web"]:
        return {}

    query_web = state.get("query_web", "").strip()
    if not query_web:
        return {}
    
    results = web_search(query_web, max_results=1)
    state["counts"]["web"] += 1

    evidence = []
    for r in results:
        evidence.append(
            cast(EvidenceItem, {
                "source_type": "web",
                "title": r.get("title", "Web Result"),
                "snippet": r.get("snippet", "")[:800],
                "url": r.get("url", ""),
            })
        )

    merged = _dedupe_evidence(state.get("evidence_p1", []) + evidence)
    return {"evidence_p1": merged, "counts": state["counts"]}


def cond_need_more_rag(state: GraphState) -> bool:
    """
    RAG 검색을 더 해야 하는지 판단하는 조건 함수
    - P1 근거가 2개 이상이면 False (충분함)
    - 예산이 소진되었으면 False (더 이상 검색 불가)
    - 3번 이상 시도했는데 결과가 없으면 False (무한 루프 방지)
    """
    if len(state.get("evidence_p1", [])) >= 2:
        return False
    # If budget is exhausted, stop trying RAG
    if state["counts"]["rag"] >= state["budget"]["rag"]:
        return False
    # If we've tried multiple times with no results, move on to web search
    # This prevents infinite loops when RAG is not available
    if state["counts"]["rag"] >= 3 and len(state.get("evidence_p1", [])) == 0:
        return False
    return True


def cond_need_web(state: GraphState) -> bool:
    """
    웹 검색이 필요한지 판단하는 조건 함수
    - P1 근거가 2개 이상이면 False (충분함)
    - RAG 예산이 소진되었거나 3번 이상 실패했고, 웹 검색 예산이 남아있으면 True
    """
    if len(state.get("evidence_p1", [])) >= 2:
        return False
    # Move to web if RAG budget exhausted OR if we've tried RAG multiple times with no results
    rag_done = (state["counts"]["rag"] >= state["budget"]["rag"]) or \
               (state["counts"]["rag"] >= 3 and len(state.get("evidence_p1", [])) == 0)
    web_available = state["counts"]["web"] < state["budget"]["web"]
    return rag_done and web_available


# ---------------- P2 근거 수집: P1 핵심 용어 기반 PubMed/Scholar 검색 ----------------

def node_prepare_p2_query(state: GraphState) -> Dict[str, Any]:
    """
    P2 검색 쿼리 준비 노드: 기전 핵심 용어와 expanded_queries를 기반으로 학술 검색 쿼리 생성
    - mechanism_seed_terms와 expanded_queries를 우선 사용
    - 없으면 P1 근거에서 영어 키워드 추출
    - 암/종양학 관련 학술 논문 검색을 위한 쿼리 생성
    """
    seeds = state.get("mechanism_seed_terms", [])
    expanded = state.get("expanded_queries", [])
    
    # mechanism_seed_terms가 없으면 P1 근거에서 영어 키워드 추출
    if not seeds:
        text = " ".join([(e.get("title", "") + " " + e.get("snippet", "")) for e in state.get("evidence_p1", [])])
        words = re.findall(r"[A-Za-z][A-Za-z0-9\-\_]{2,}", text)
        seeds = list(dict.fromkeys([w.lower() for w in words]))[:6]
    
    # expanded_queries가 있으면 우선 사용, 없으면 mechanism_seed_terms로 쿼리 생성
    if expanded:
        # expanded_queries를 그대로 사용 (이미 영어 키워드 쿼리)
        academic_query = expanded[0] if len(expanded) > 0 else ""
    elif seeds:
        # mechanism_seed_terms로 쿼리 생성
        term_blob = " OR ".join(seeds[:5])
        academic_query = f"({term_blob}) AND (cancer OR oncology) AND (review OR trial OR systematic)"
    else:
        # 폴백: query_web 사용
        query_web = state.get("query_web", "").strip()
        academic_query = f"({query_web}) AND (cancer OR oncology) AND (review OR trial OR systematic)" if query_web else ""
    
    return {"debug": {**state.get("debug", {}), "academic_query": academic_query}}


def node_pubmed_retrieve(state: GraphState) -> Dict[str, Any]:
    """
    PubMed 검색 노드: 의학 논문 데이터베이스에서 관련 논문 검색
    - 기전 핵심 용어와 관련성이 높은 논문만 필터링
    - 검색 결과를 evidence_p2에 추가
    - 영어 키워드 쿼리 사용
    """
    if state["counts"]["pubmed"] >= state["budget"]["pubmed"]:
        return {}

    academic_query = state.get("debug", {}).get("academic_query", "").strip()
    if not academic_query:
        return {}
    
    papers = pubmed_search(academic_query, max_results=1)
    state["counts"]["pubmed"] += 1

    evidence = []
    seeds = state.get("mechanism_seed_terms", [])
    for p in papers:
        title = p.get("title", "PubMed Paper")
        abstract = p.get("abstract", "")
        if seeds and (_keyword_overlap(seeds, title + " " + abstract) == 0):
            continue
        evidence.append(
            cast(EvidenceItem, {
                "source_type": "pubmed",
                "title": title,
                "pmid": str(p.get("pmid", "")),
                "year": int(p.get("year", 0) or 0) if isinstance(p.get("year"), (int, str)) and str(p.get("year")).isdigit() else 0,
                "snippet": abstract[:1200],
                "url": p.get("url", ""),
            })
        )

    merged = _dedupe_evidence(state.get("evidence_p2", []) + evidence)
    return {"evidence_p2": merged, "counts": state["counts"]}


def node_scholar_retrieve(state: GraphState) -> Dict[str, Any]:
    """
    Google Scholar 검색 노드: 학술 논문 검색
    - PubMed로 충분한 근거를 얻지 못한 경우 사용
    - 검색 결과를 evidence_p2에 추가
    - 영어 키워드 쿼리 사용
    """
    if state["counts"]["scholar"] >= state["budget"]["scholar"]:
        return {}

    academic_query = state.get("debug", {}).get("academic_query", "").strip()
    if not academic_query:
        return {}
    
    papers = scholar_search(academic_query, max_results=1)
    state["counts"]["scholar"] += 1

    evidence = []
    seeds = state.get("mechanism_seed_terms", [])
    for p in papers:
        title = p.get("title", "Scholar Result")
        snippet = p.get("snippet", "")
        if seeds and (_keyword_overlap(seeds, title + " " + snippet) == 0):
            continue
        evidence.append(
            cast(EvidenceItem, {
                "source_type": "scholar",
                "title": title,
                "url": p.get("url", ""),
                "snippet": snippet[:800],
            })
        )

    merged = _dedupe_evidence(state.get("evidence_p2", []) + evidence)
    return {"evidence_p2": merged, "counts": state["counts"]}


def cond_need_more_pubmed(state: GraphState) -> bool:
    """
    PubMed 검색을 더 해야 하는지 판단
    - P2 근거가 2개 이상이면 False
    - 예산이 남아있으면 True
    """
    if len(state.get("evidence_p2", [])) >= 2:
        return False
    return state["counts"]["pubmed"] < state["budget"]["pubmed"]


def cond_need_scholar(state: GraphState) -> bool:
    """
    Google Scholar 검색이 필요한지 판단
    - P2 근거가 2개 이상이면 False
    - PubMed 예산이 소진되었고 Scholar 예산이 남아있으면 True
    """
    if len(state.get("evidence_p2", [])) >= 2:
        return False
    pubmed_done = state["counts"]["pubmed"] >= state["budget"]["pubmed"]
    scholar_available = state["counts"]["scholar"] < state["budget"]["scholar"]
    return pubmed_done and scholar_available


# ---------------- P3 환자 데이터 (DB) + 매핑 노트 ----------------

def node_patient_fetch(state: GraphState) -> Dict[str, Any]:
    """
    환자 데이터 조회 노드: Supabase에서 환자 정보 및 검사 결과 조회
    - user_id를 사용하여 환자 데이터 조회
    """
    user_id = state.get("user_id", "")
    if not user_id:
        logger.warning("user_id가 비어있습니다")
        return {"patient_data": {}}
    
    data = fetch_patient_data(user_id) or {}
    return {"patient_data": data}


def node_patient_mapping_notes(state: GraphState) -> Dict[str, Any]:
    """
    환자 데이터 매핑 노드: 환자 검사 결과를 기전 핵심 용어와 연결하여 노트 생성
    - 모든 혈액검사 항목을 지원하며, 기전 키워드와 연관지어 해석
    - 임상적 의미(clinical_significance, descriptions)를 활용하여 환자 맞춤 노트 생성
    - 정상 범위 이탈 여부(is_out_of_range)를 고려하여 우선순위 부여
    """
    labs = (state.get("patient_data") or {}).get("lab_results", [])
    if not labs:
        return {"evidence_p3_notes": "환자 혈액검사/개인정보가 제공되지 않아 일반적인 범위에서만 안내합니다."}

    seeds = [s.lower() for s in state.get("mechanism_seed_terms", [])]  # 소문자로 변환하여 매칭
    notes = []
    
    # 혈액검사 항목을 기전 키워드와 연관성에 따라 분류
    # 기전 키워드와 관련된 검사 항목을 우선적으로 포함
    relevant_labs = []
    other_labs = []
    
    # 기전 키워드와 혈액검사 항목의 매핑 (키워드 → 검사 항목명 패턴)
    mechanism_mapping = {
        # 혈당/당뇨 관련
        "glucose": ["glucose", "hgba1c", "blood sugar", "diabetes", "insulin"],
        "당뇨": ["glucose", "hgba1c"],
        "혈당": ["glucose", "hgba1c"],
        
        # 염증/면역 관련
        "inflammation": ["crp", "lmr", "nlr", "wbc", "neutrophil", "lymphocyte", "monocyte", "eosinophil", "basophil"],
        "염증": ["crp", "lmr", "nlr", "wbc"],
        "면역": ["wbc", "neutrophil", "lymphocyte", "monocyte", "eosinophil", "basophil"],
        "immune": ["wbc", "neutrophil", "lymphocyte", "monocyte", "eosinophil", "basophil"],
        
        # 간 기능 관련
        "liver": ["ast", "alt", "gtp", "total_bilirubin", "ldh"],
        "간": ["ast", "alt", "gtp", "total_bilirubin", "ldh"],
        
        # 신장 기능 관련
        "kidney": ["bun", "creatinine", "egfr", "uric_acid"],
        "신장": ["bun", "creatinine", "egfr", "uric_acid"],
        "renal": ["bun", "creatinine", "egfr", "uric_acid"],
        
        # 지질/콜레스테롤 관련
        "cholesterol": ["cholesterol", "triglyceride", "hdl", "ldl"],
        "콜레스테롤": ["cholesterol", "triglyceride", "hdl", "ldl"],
        "lipid": ["cholesterol", "triglyceride", "hdl", "ldl"],
        "지질": ["cholesterol", "triglyceride", "hdl", "ldl"],
        
        # 갑상선 관련
        "thyroid": ["free_t3", "free_t4", "tsh"],
        "갑상선": ["free_t3", "free_t4", "tsh"],
        
        # 종양 표지자 관련
        "tumor": ["tumor_marker_cea", "tumor_marker_ca199", "tumor_marker_ca125", "tumor_marker_ca153", 
                  "tumor_marker_psa", "tumor_marker_afp", "tumor_marker_ca724", "tumor_marker_nse", "tumor_marker_scc"],
        "종양": ["tumor_marker_cea", "tumor_marker_ca199", "tumor_marker_ca125", "tumor_marker_ca153", 
                 "tumor_marker_psa", "tumor_marker_afp", "tumor_marker_ca724", "tumor_marker_nse", "tumor_marker_scc"],
        "암": ["tumor_marker_cea", "tumor_marker_ca199", "tumor_marker_ca125", "tumor_marker_ca153", 
               "tumor_marker_psa", "tumor_marker_afp", "tumor_marker_ca724", "tumor_marker_nse", "tumor_marker_scc"],
        
        # 혈액 관련
        "blood": ["platelet", "rbc", "hgb", "hct", "mcv", "mchc", "rdw", "pdw"],
        "혈액": ["platelet", "rbc", "hgb", "hct", "mcv", "mchc", "rdw", "pdw"],
        "빈혈": ["rbc", "hgb", "hct", "mcv", "mchc"],
        
        # 비타민/영양 관련
        "vitamin": ["vitamin_d3", "homocysteine"],
        "비타민": ["vitamin_d3", "homocysteine"],
        "영양": ["vitamin_d3", "homocysteine"],
    }
    
    # 각 검사 항목이 기전 키워드와 관련이 있는지 확인
    for lab in labs:
        test_name = lab.get("test_name", "").lower().strip()
        is_relevant = False
        
        # 기전 키워드와 직접 매칭
        for seed in seeds:
            if seed in test_name or test_name in seed:
                is_relevant = True
                break
            
            # 매핑 테이블을 통한 간접 매칭
            if seed in mechanism_mapping:
                for pattern in mechanism_mapping[seed]:
                    if pattern in test_name:
                        is_relevant = True
                        break
                if is_relevant:
                    break
        
        if is_relevant:
            relevant_labs.append(lab)
        else:
            other_labs.append(lab)
    
    # 관련 검사 항목을 우선 처리 (정상 범위 이탈 항목 우선)
    relevant_labs.sort(key=lambda x: (
        not x.get("is_out_of_range", False),  # 범위 이탈 항목 우선
        x.get("test_date") or ""  # 날짜 최신순
    ), reverse=True)
    
    # 관련 검사 항목 처리 (최대 8개)
    for lab in relevant_labs[:8]:
        test_name = lab.get("test_name", "")
        value = lab.get("value")
        unit = lab.get("unit", "")
        is_out_of_range = lab.get("is_out_of_range", False)
        clinical_significance = lab.get("clinical_significance", "")
        test_date = lab.get("test_date", "")
        
        # 값 포맷팅
        value_str = str(value) if value is not None else "N/A"
        
        # 노트 생성
        note_parts = [f"- {test_name}: {value_str} {unit}"]
        
        # 정상 범위 정보 추가
        ref_min = lab.get("reference_min")
        ref_max = lab.get("reference_max")
        if ref_min is not None or ref_max is not None:
            ref_str = f" (정상범위: "
            if ref_min is not None and ref_max is not None:
                ref_str += f"{ref_min}~{ref_max} {unit})"
            elif ref_min is not None:
                ref_str += f">={ref_min} {unit})"
            elif ref_max is not None:
                ref_str += f"<={ref_max} {unit})"
            note_parts.append(ref_str)
        
        # 범위 이탈 시 강조
        if is_out_of_range:
            note_parts.append(" [정상 범위 이탈]")
        
        # 임상적 의미 추가
        if clinical_significance:
            note_parts.append(f" | 임상적 의미: {clinical_significance[:100]}")
        
        # 검사 날짜 추가 (있는 경우)
        if test_date:
            note_parts.append(f" | 검사일: {test_date}")
        
        notes.append("".join(note_parts))
    
    # 관련 검사 항목이 없으면 다른 검사 항목 중 중요 항목 포함
    if not notes and other_labs:
        # 범위 이탈 항목 우선
        other_labs.sort(key=lambda x: (
            not x.get("is_out_of_range", False),
            x.get("test_date") or ""
        ), reverse=True)
        
        for lab in other_labs[:5]:
            test_name = lab.get("test_name", "")
            value = lab.get("value")
            unit = lab.get("unit", "")
            is_out_of_range = lab.get("is_out_of_range", False)
            
            value_str = str(value) if value is not None else "N/A"
            note = f"- {test_name}: {value_str} {unit}"
            
            if is_out_of_range:
                note += " [정상 범위 이탈]"
            
            notes.append(note)
    
    # 기전 키워드 정보 추가
    if seeds:
        notes.append(f"\n[기전 키워드: {', '.join(seeds[:5])}]")
    
    if not notes:
        notes.append("- 제공된 검사 항목으로는 기전과 직접 연결되는 해석이 제한적입니다.")

    return {"evidence_p3_notes": "\n".join(notes)}


# ---------------- 정규화 + 충분성 검사 ----------------

def node_normalize_refs(state: GraphState) -> Dict[str, Any]:
    """
    참고 문헌 정규화 노드: P1과 P2 근거를 합쳐서 중복 제거 및 정리
    - 최대 10개로 제한하여 가독성 확보
    """
    refs = _dedupe_evidence((state.get("evidence_p1", []) + state.get("evidence_p2", [])))
    refs = refs[:10]
    return {"references": refs}


def _sufficient_for_writer(state: GraphState) -> bool:
    """
    Writer 노드 실행을 위한 충분성 검사
    - P1 근거 >= 2개
    - P2 근거 >= 2개
    - 참고 문헌 >= 4개
    - 환자 데이터는 선택사항
    """
    p1_ok = len(state.get("evidence_p1", [])) >= 2
    p2_ok = len(state.get("evidence_p2", [])) >= 2
    refs_ok = len(state.get("references", [])) >= 4
    return p1_ok and p2_ok and refs_ok


def node_sufficiency_gate(state: GraphState) -> Dict[str, Any]:
    """
    충분성 게이트 노드: 수집된 근거가 충분한지 확인
    - 충분하지 않으면 재시도 또는 경고와 함께 진행
    """
    ok = _sufficient_for_writer(state)
    return {"debug": {**state.get("debug", {}), "sufficient_pre_writer": ok}}


# ---------------- 최종 Writer (LLM 1회 호출) ----------------

def node_writer(state: GraphState) -> Dict[str, Any]:
    """
    Writer 노드: 태그 기반 출력으로 스트리밍 시 섹션별 실시간 표시 가능
    """
    p1 = state.get("evidence_p1", [])[:4]
    p2 = state.get("evidence_p2", [])[:4]
    p3 = state.get("evidence_p3_notes", "")
    refs = state.get("references", [])

    system = """
당신은 사랑하는 사람을 암으로 부터 지켜야하는 암 환자의 보호자 이자, 암 에너지 대사 연구가, 의학 저널 편집자, 의학 전문가입니다.
반드시 아래 출력 규칙을 100% 지키세요.

[출력 규칙]
1) 아래 태그를 정확히 포함하고, 순서도 반드시 지키세요.
2) 각 섹션 내용은 태그 사이에만 작성하세요.
3) 마지막에 [[JSON]]...[[/JSON]] 블록을 반드시 포함하세요.
4) 참고문헌은 제공된 references만 사용하고, 새로운 출처를 만들지 마세요.

[태그 포맷]
[[P1]]
(1) 기전: P1 근거 기반 요약
[[/P1]]

[[P2]]
(2) 근거: P2 근거 기반 학술적 세부사항
[[/P2]]

[[P3]]
(3) 환자 관련 해석: patient_notes 사용(없으면 간단히 언급)
[[/P3]]

[[P4]]
(4) 실천적 조언: 1-3 통합, 안전 주의사항 포함, 진단/처방 금지, 필요시 임상의 상담 권고
[[/P4]]

[[JSON]]
{
 "first_paragraph": "...",
 "second_paragraph": "...",
 "third_paragraph": "...",
 "fourth_paragraph": "...",
 "references": [{"source_type":"...", "title":"...", "url":"...", "pmid":"...", "year": 0}]
}
[[/JSON]]
""".strip()

    messages = state.get("messages", [])
    if messages:
        last_msg = messages[-1]
        user_question = last_msg.get("content", "") if isinstance(last_msg, dict) else getattr(last_msg, "content", "")
    else:
        user_question = ""
    
    user = {
        "role": "user",
        "content": json.dumps(
            {
                "user_question": user_question,
                "P1_evidence": p1,
                "P2_evidence": p2,
                "patient_notes": p3,
                "references": refs,
            },
            ensure_ascii=False,
        ),
    }

    resp = writer_llm.invoke([{"role": "system", "content": system}, user])
    writer_raw = resp.content
    
    parser = TaggedWriterStreamParser()
    parser.feed(writer_raw)
    final_json = parser.try_parse_final_json()
    
    if final_json is None:
        final_json = {
            "first_paragraph": parser.section_text.get("p1", "").strip(),
            "second_paragraph": parser.section_text.get("p2", "").strip(),
            "third_paragraph": parser.section_text.get("p3", "").strip(),
            "fourth_paragraph": parser.section_text.get("p4", "").strip(),
            "references": refs,
        }

    out = cast(OutputPayload, {
        "first_paragraph": str(final_json.get("first_paragraph", "")).strip(),
        "second_paragraph": str(final_json.get("second_paragraph", "")).strip(),
        "third_paragraph": str(final_json.get("third_paragraph", "")).strip(),
        "fourth_paragraph": str(final_json.get("fourth_paragraph", "")).strip(),
        "references": cast(List[EvidenceItem], final_json.get("references", [])) or refs,
    })
    
    return {"output": out, "writer_raw": writer_raw}


def node_postcheck(state: GraphState) -> Dict[str, Any]:
    """
    사후 검사 노드: Writer가 생성한 답변의 품질 확인
    - 1문단과 2문단이 비어있지 않은지 확인
    - 참고 문헌이 4개 이상인지 확인
    """
    out = state.get("output") or {}
    refs = out.get("references") or []
    ok = bool(out.get("first_paragraph")) and bool(out.get("second_paragraph")) and len(refs) >= 4
    return {"debug": {**state.get("debug", {}), "sufficient_post_writer": ok}}


def cond_should_retry(state: GraphState) -> bool:
    """
    재시도가 필요한지 판단하는 조건 함수
    - 최대 재시도 횟수에 도달했으면 False
    - Writer 실행 전 또는 후에 근거가 부족하면 True
    """
    if state.get("attempt", 0) >= state.get("max_attempts", 1):
        return False
    pre_ok = state.get("debug", {}).get("sufficient_pre_writer", False)
    post_ok = state.get("debug", {}).get("sufficient_post_writer", True)
    return (not pre_ok) or (not post_ok)


def node_retry_prepare(state: GraphState) -> Dict[str, Any]:
    """
    재시도 준비 노드: 한 번의 제한된 재시도 라운드 준비
    - 재시도 횟수 증가
    - 예산을 약간 확대 (웹 +1, Scholar +1, 최대값 내에서)
    - 호출 횟수 초기화 (기존 근거는 유지)
    """
    attempt = int(state.get("attempt", 0)) + 1

    budget = dict(state.get("budget", {"rag": 6, "web": 2, "pubmed": 2, "scholar": 1}))
    budget["web"] = min(budget.get("web", 0) + 1, 3)
    budget["scholar"] = min(budget.get("scholar", 0) + 1, 2)
    budget = _cap_budget(cast(Budget, budget))

    counts = _init_counts()

    return {"attempt": attempt, "budget": budget, "counts": counts}


# =============================================================================
# 7) 그래프 구성 (노드 + 조건부 엣지 + 루프)
# =============================================================================

def build_graph(checkpointer=None) -> Any:
    """
    LangGraph 그래프 구성 함수
    - 모든 노드를 추가하고 엣지로 연결
    - 조건부 라우팅으로 루프 및 분기 처리
    - 체크포인터가 제공되면 대화 히스토리 저장 활성화
    """
    g = StateGraph(GraphState)

    # Nodes
    g.add_node("bootstrap", node_bootstrap)
    g.add_node("router", node_router)
    g.add_node("non_health_end", node_answer_non_health)

    # P1
    g.add_node("rag", node_rag_retrieve)
    g.add_node("web", node_web_retrieve)

    # P2
    g.add_node("prep_p2", node_prepare_p2_query)
    g.add_node("pubmed", node_pubmed_retrieve)
    g.add_node("scholar", node_scholar_retrieve)

    # P3 + normalize + checks + writer
    g.add_node("patient_fetch", node_patient_fetch)
    g.add_node("patient_map", node_patient_mapping_notes)
    g.add_node("normalize", node_normalize_refs)
    g.add_node("sufficiency", node_sufficiency_gate)
    g.add_node("writer", node_writer)
    g.add_node("postcheck", node_postcheck)

    # Retry
    g.add_node("retry_prepare", node_retry_prepare)

    # 진입점: START → bootstrap → router
    g.add_edge(START, "bootstrap")  # 시작 시 부트스트랩으로 초기화
    g.add_edge("bootstrap", "router")  # 초기화 후 Router로 이동

    # Router 분기: 건강 질문인지 판단하여 분기
    def _route_from_router(s: GraphState) -> str:
        """
        Router 이후 라우팅: 건강 질문 여부에 따라 분기
        - 비건강 질문: non_health_end로 이동하여 짧은 답변 반환
        - 건강 질문: RAG 검색 시작
        """
        return "non_health_end" if not s.get("is_health_question", True) else "rag"

    g.add_conditional_edges("router", _route_from_router, {
        "non_health_end": "non_health_end",  # 비건강 질문 종료
        "rag": "rag",  # 건강 질문 → RAG 검색 시작
    })
    g.add_edge("non_health_end", END)  # 비건강 질문은 바로 종료

    # P1 루프: RAG 검색을 충분한 근거를 얻을 때까지 또는 예산 소진까지 반복
    def _route_after_rag(s: GraphState) -> str:
        """
        RAG 검색 이후 라우팅:
        1. RAG가 여러 번 실패했으면 웹 검색으로 전환
        2. RAG 검색이 더 필요하면 RAG 반복
        3. 충분하면 P2 준비로 이동
        """
        if cond_need_web(s):  # RAG 실패 시 웹 검색으로 전환
            return "web"
        if cond_need_more_rag(s):  # RAG 검색 더 필요
            return "rag"
        return "prep_p2"  # 충분하면 P2 준비로

    g.add_conditional_edges("rag", _route_after_rag, {
        "rag": "rag",  # RAG 검색 반복
        "web": "web",  # 웹 검색으로 전환
        "prep_p2": "prep_p2",  # P2 준비로 이동
    })

    def _route_after_web(s: GraphState) -> str:
        """
        웹 검색 이후 라우팅:
        - P1 근거가 2개 미만이고 웹 검색 예산이 남아있으면 웹 검색 반복
        - 충분하면 P2 준비로 이동
        - 최대 반복 횟수 제한 (무한 루프 방지)
        """
        evidence_p1 = s.get("evidence_p1", [])
        counts = s.get("counts", {})
        budget = s.get("budget", {})
        
        # 종료 조건: 근거가 충분하거나 예산 소진 또는 최대 반복 횟수 도달
        if len(evidence_p1) >= 2:
            return "prep_p2"
        if counts.get("web", 0) >= budget.get("web", 0):
            return "prep_p2"
        # 최대 5번 반복 제한 (무한 루프 방지)
        if counts.get("web", 0) >= 5:
            return "prep_p2"
        return "web"  # 웹 검색 반복

    g.add_conditional_edges("web", _route_after_web, {
        "web": "web",  # 웹 검색 반복
        "prep_p2": "prep_p2",  # P2 준비로 이동
    })

    # P2: 학술 검색 쿼리 준비 → PubMed 루프 → Scholar 루프
    g.add_edge("prep_p2", "pubmed")  # P2 쿼리 준비 후 PubMed 검색 시작

    def _route_after_pubmed(s: GraphState) -> str:
        """
        PubMed 검색 이후 라우팅:
        1. PubMed 검색이 더 필요하면 PubMed 반복
        2. PubMed 예산 소진되고 Scholar 예산이 있으면 Scholar로
        3. 충분하면 환자 데이터 조회로 이동
        """
        if cond_need_more_pubmed(s):
            return "pubmed"  # PubMed 반복
        if cond_need_scholar(s):
            return "scholar"  # Scholar로 전환
        return "patient_fetch"  # 충분하면 환자 데이터 조회

    g.add_conditional_edges("pubmed", _route_after_pubmed, {
        "pubmed": "pubmed",  # PubMed 반복
        "scholar": "scholar",  # Scholar로 전환
        "patient_fetch": "patient_fetch",  # 환자 데이터 조회
    })

    def _route_after_scholar(s: GraphState) -> str:
        """
        Scholar 검색 이후 라우팅:
        - P2 근거가 2개 미만이고 Scholar 예산이 남아있으면 Scholar 반복
        - 충분하면 환자 데이터 조회로 이동
        - 최대 반복 횟수 제한 (무한 루프 방지)
        """
        evidence_p2 = s.get("evidence_p2", [])
        counts = s.get("counts", {})
        budget = s.get("budget", {})
        
        # 종료 조건: 근거가 충분하거나 예산 소진 또는 최대 반복 횟수 도달
        if len(evidence_p2) >= 2:
            return "patient_fetch"
        if counts.get("scholar", 0) >= budget.get("scholar", 0):
            return "patient_fetch"
        # 최대 5번 반복 제한 (무한 루프 방지)
        if counts.get("scholar", 0) >= 5:
            return "patient_fetch"
        return "scholar"  # Scholar 반복

    g.add_conditional_edges("scholar", _route_after_scholar, {
        "scholar": "scholar",  # Scholar 반복
        "patient_fetch": "patient_fetch",  # 환자 데이터 조회
    })

    # P3 + 정규화 + 사전 검사: 순차 실행
    g.add_edge("patient_fetch", "patient_map")  # 환자 데이터 조회 → 매핑
    g.add_edge("patient_map", "normalize")  # 매핑 → 정규화
    g.add_edge("normalize", "sufficiency")  # 정규화 → 충분성 검사

    def _route_after_sufficiency(s: GraphState) -> str:
        """
        충분성 검사 이후 라우팅:
        - 근거가 부족하고 재시도 횟수가 남아있으면 재시도 준비
        - 충분하거나 재시도 불가능하면 Writer로 이동
        """
        ok = s.get("debug", {}).get("sufficient_pre_writer", False)
        if not ok and s.get("attempt", 0) < s.get("max_attempts", 1):
            return "retry_prepare"  # 재시도 준비
        return "writer"  # Writer로 이동

    g.add_conditional_edges("sufficiency", _route_after_sufficiency, {
        "retry_prepare": "retry_prepare",  # 재시도 준비
        "writer": "writer",  # Writer로 이동
    })

    g.add_edge("retry_prepare", "rag")  # 재시도 준비 후 RAG 검색부터 다시 시작

    # Writer + 사후 검사
    g.add_edge("writer", "postcheck")  # Writer 실행 후 사후 검사

    def _route_after_postcheck(s: GraphState) -> str:
        """
        사후 검사 이후 라우팅:
        - 재시도가 필요하면 재시도 준비로
        - 충분하면 종료
        """
        return "retry_prepare" if cond_should_retry(s) else END

    g.add_conditional_edges("postcheck", _route_after_postcheck, {
        "retry_prepare": "retry_prepare",  # 재시도 준비
        END: END,  # 종료
    })

    if checkpointer:
        return g.compile(checkpointer=checkpointer)
    return g.compile()


# =============================================================================
# 8) 체크포인터 초기화
# =============================================================================

# 전역 변수: 연결 풀과 체크포인터 관리
_connection_pool: Optional[ConnectionPool] = None
_checkpointer_instance: Optional[Any] = None


async def init_checkpointer():
    """
    Postgres 체크포인터 초기화 (비동기)
    - DATABASE_URL이 설정되어 있으면 Postgres에 대화 히스토리 저장
    - 연결 풀을 사용하여 효율적인 연결 관리
    - 실패해도 그래프는 정상 작동 (체크포인터 없이)
    - 연결 풀은 전역 변수로 관리하여 종료 시 정리 가능
    """
    global _connection_pool, _checkpointer_instance
    
    # 이미 초기화되어 있으면 재사용
    if _checkpointer_instance is not None:
        return _checkpointer_instance
    
    if PostgresSaver is None:
        logger.warning("PostgresSaver not available")
        return None

    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        logger.warning("DATABASE_URL not set, checkpointer disabled")
        return None

    try:
        # AsyncPostgresSaver 사용 (async 스트리밍 지원)
        # from_conn_string은 컨텍스트 매니저이므로 직접 사용 불가
        # AsyncConnectionPool을 사용해야 함
        if async_postgres_available and AsyncPostgresSaver and async_pool_available and AsyncConnectionPool:
            # AsyncConnectionPool 생성 (비동기)
            _connection_pool = AsyncConnectionPool(
                conninfo=database_url,
                min_size=1,
                max_size=5,
                open=False  # 수동으로 열어야 함
            )
            # AsyncConnectionPool.open()은 비동기 메서드이므로 await 필요
            await _connection_pool.open()
            _checkpointer_instance = AsyncPostgresSaver(_connection_pool)
            logger.info("✅ AsyncPostgresSaver initialized with AsyncConnectionPool (async streaming supported)")
            return _checkpointer_instance
        else:
            # AsyncPostgresSaver가 없으면 PostgresSaver 사용 (동기 전용)
            # 주의: astream 사용 시 NotImplementedError 발생 가능
            _connection_pool = ConnectionPool(
                conninfo=database_url,
                min_size=1,
                max_size=5,
                open=False
            )
            _connection_pool.open()
            _checkpointer_instance = PostgresSaver(_connection_pool)
            logger.warning("⚠️ PostgresSaver initialized (async streaming NOT supported, use invoke instead of astream)")
            return _checkpointer_instance
    except Exception as e:
        logger.error(f"❌ Checkpointer initialization failed: {e}")
        return None


async def close_checkpointer():
    """
    체크포인터 및 연결 풀 정리
    - 앱 종료 시 명시적으로 호출하여 스레드 정상 종료 보장
    - AsyncConnectionPool의 경우 await 필요
    """
    global _connection_pool, _checkpointer_instance
    
    if _connection_pool is not None:
        try:
            logger.info("Closing connection pool...")
            # AsyncConnectionPool.close()는 비동기 메서드이므로 await 필요
            if isinstance(_connection_pool, AsyncConnectionPool):
                await _connection_pool.close()
            else:
                _connection_pool.close()
            logger.info("✅ Connection pool closed")
        except Exception as e:
            logger.error(f"❌ Error closing connection pool: {e}")
        finally:
            _connection_pool = None
            _checkpointer_instance = None


# =============================================================================
# 9) FastAPI 앱 설정
# =============================================================================

from langchain_core.messages import HumanMessage, AIMessageChunk, AIMessage

# FastAPI 요청/응답 모델
class ChatRequest(BaseModel):
    """챗봇 요청 모델 (conversation_id는 경로 파라미터로 받음)"""
    message: str = Field(..., description="사용자 메시지")
    user_id: str = Field(..., description="사용자 ID")
    max_attempts: int = Field(default=1, description="최대 재시도 횟수")


class ChatResponse(BaseModel):
    """챗봇 응답 모델"""
    output: Optional[OutputPayload] = Field(None, description="생성된 답변")
    debug: Dict[str, Any] = Field(default_factory=dict, description="디버깅 정보")


# 그래프 초기화 (앱 시작 시 한 번만 실행)
_graph = None


def get_graph():
    """그래프 인스턴스 가져오기 (싱글톤 패턴)"""
    global _graph
    if _graph is None:
        # checkpointer는 lifespan에서 이미 초기화됨 (전역 변수 _checkpointer_instance 사용)
        _graph = build_graph(checkpointer=_checkpointer_instance)
        logger.info("✅ 그래프 초기화 완료")
    return _graph, _checkpointer_instance


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI 앱 생명주기 관리
    - 시작 시: 체크포인터 및 그래프 초기화
    - 종료 시: 연결 풀 명시적으로 닫기
    """
    # 시작 시
    logger.info("🚀 Starting application...")
    checkpointer = await init_checkpointer()
    if checkpointer:
        logger.info("✅ Checkpointer ready")
    
    yield
    
    # 종료 시
    logger.info("🛑 Shutting down application...")
    await close_checkpointer()
    logger.info("✅ Application shutdown complete")


# FastAPI 앱 초기화 (lifespan 이벤트로 연결 풀 관리)
app = FastAPI(
    title="건강 챗봇 API",
    description="LangGraph 기반 건강 챗봇 시스템",
    version="1.0.0",
    lifespan=lifespan
)

# CORS 설정 (프론트엔드 연결용)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 프로덕션에서는 특정 도메인으로 제한
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check 엔드포인트
@app.get("/health")
def health_check():
    """서비스 상태 확인"""
    return {"status": "healthy", "service": "health-chatbot"}


# 메인 챗봇 엔드포인트 (통일성을 위해 conversation_id를 경로 파라미터로 받음)
@app.post("/conversations/{conversation_id}/chat", response_model=ChatResponse)
async def chat(conversation_id: UUID, request: ChatRequest):
    """
    챗봇 메인 엔드포인트
    - 사용자 메시지를 받아 건강 관련 답변 생성
    - conversation_id를 thread_id로 사용하여 대화 히스토리 관리
    """
    try:
        # 그래프 가져오기
        graph, checkpointer = get_graph()
        conversation_id_str = str(conversation_id)
        
        # GraphState 형식으로 변환
        input_state: GraphState = {
            "messages": [HumanMessage(content=request.message)],
            "user_id": request.user_id,
            "conversation_id": conversation_id_str,
            "max_attempts": request.max_attempts,
        }  # type: ignore
        
        # 체크포인터 설정
        config = {}
        if checkpointer:
            config = {"configurable": {"thread_id": conversation_id_str}}
        
        # 그래프 실행 (recursion_limit 설정: 루프가 많을 수 있으므로 50으로 설정)
        invoke_config = {**config, "recursion_limit": 50}
        result = graph.invoke(input_state, config=invoke_config)
        
        # 응답 형식화
        return ChatResponse(
            output=result.get("output"),
            debug=result.get("debug", {})
        )
    
    except Exception as e:
        logger.error(f"챗봇 실행 오류: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"챗봇 처리 중 오류가 발생했습니다: {str(e)}"
        )


def _format_output_as_text(output: Optional[OutputPayload]) -> str:
    """OutputPayload를 읽기 쉬운 텍스트 형식으로 변환"""
    if not output:
        return "답변을 생성할 수 없습니다."
    
    paragraphs = []
    if output.get("first_paragraph"):
        paragraphs.append(output["first_paragraph"])
    if output.get("second_paragraph"):
        paragraphs.append(output["second_paragraph"])
    if output.get("third_paragraph"):
        paragraphs.append(output["third_paragraph"])
    if output.get("fourth_paragraph"):
        paragraphs.append(output["fourth_paragraph"])
    
    # 참고 문헌 추가
    refs = output.get("references", [])
    if refs:
        paragraphs.append("\n\n참고 문헌:")
        for i, ref in enumerate(refs[:10], 1):
            title = ref.get("title", "제목 없음")
            url = ref.get("url", "")
            if url:
                paragraphs.append(f"{i}. {title} ({url})")
            else:
                paragraphs.append(f"{i}. {title}")
    
    return "\n\n".join(paragraphs)


@app.post("/conversations/{conversation_id}/message-stream")
async def message_stream(conversation_id: UUID, request: ChatRequest):
    """
    대화에 메시지를 추가하고 스트리밍으로 에이전트 응답을 받습니다.
    LangGraph checkpointer를 통해 이전 대화를 자동으로 복원합니다.
    SSE(Server-Sent Events) 형식으로 스트리밍합니다.
    """
    try:
        graph, checkpointer = get_graph()
        conversation_id_str = str(conversation_id)
        config = {}
        if checkpointer:
            config = {"configurable": {"thread_id": conversation_id_str}}
        
        # 이전 상태 확인 (디버깅용, checkpointer가 있을 때만)
        if checkpointer:
            try:
                current_state = graph.get_state(config)
                if current_state and current_state.values:
                    prev_messages = current_state.values.get("messages", [])
                    logger.info(f"Previous state found: {len(prev_messages)} messages in history")
            except Exception as e:
                logger.debug(f"No previous state or error: {e}")
        
        async def sse():
            try:
                import asyncio
                
                input_state: GraphState = {
                    "messages": [HumanMessage(content=request.message)],
                    "user_id": request.user_id,
                    "conversation_id": conversation_id_str,
                    "max_attempts": request.max_attempts,
                }  # type: ignore
                
                invoke_config = {**config, "recursion_limit": 50}
                
                # stream_mode="messages": LLM 토큰을 실시간으로 스트리밍
                # AsyncPostgresSaver가 있을 때만 사용 (없으면 기본 모드)
                if checkpointer and async_postgres_available:
                    try:
                        # LLM 토큰 실시간 스트리밍
                        full_response = ""
                        async for event in graph.astream(
                            input_state,
                            config=invoke_config,
                            stream_mode="messages"  # LLM 토큰 실시간 스트리밍
                        ):
                            # stream_mode="messages"는 messages 필드에 토큰을 스트리밍
                            # 이벤트 형식: {"messages": [AIMessageChunk(...)]}
                            if "messages" in event:
                                for msg in event["messages"]:
                                    # AIMessageChunk 또는 AIMessage인 경우만 처리 (LLM 응답)
                                    if isinstance(msg, (AIMessageChunk, AIMessage)):
                                        content = msg.content
                                        # 토큰을 OpenAI Agents SDK 형식으로 스트리밍
                                        if isinstance(content, str) and content.strip():
                                            # 델타 추출 (이전 내용과 비교하여 새로 추가된 부분만)
                                            if len(content) > len(full_response):
                                                delta = content[len(full_response):]
                                                if delta:
                                                    full_response = content
                                                    # OpenAI Agents SDK 형식: raw_response_event
                                                    yield f"event: raw_response_event\ndata: {safe_json_dumps({'type': 'response.output_text.delta', 'delta': delta}, ensure_ascii=False)}\n\n"
                                            elif content != full_response:
                                                # 전체 내용이 변경된 경우
                                                full_response = content
                                                yield f"event: raw_response_event\ndata: {safe_json_dumps({'type': 'response.output_text.delta', 'delta': content}, ensure_ascii=False)}\n\n"
                                        elif isinstance(content, list):
                                            # 리스트인 경우 텍스트만 추출
                                            for item in content:
                                                if isinstance(item, dict) and "text" in item:
                                                    text = item["text"]
                                                    if text.strip():
                                                        if len(text) > len(full_response):
                                                            delta = text[len(full_response):]
                                                            if delta:
                                                                full_response = text
                                                                yield f"event: raw_response_event\ndata: {safe_json_dumps({'type': 'response.output_text.delta', 'delta': delta}, ensure_ascii=False)}\n\n"
                                                elif isinstance(item, str) and item.strip():
                                                    if len(item) > len(full_response):
                                                        delta = item[len(full_response):]
                                                        if delta:
                                                            full_response = item
                                                            yield f"event: raw_response_event\ndata: {safe_json_dumps({'type': 'response.output_text.delta', 'delta': delta}, ensure_ascii=False)}\n\n"
                        
                        # 완료 이벤트 전송
                        if full_response:
                            yield f"event: raw_response_event\ndata: {safe_json_dumps({'type': 'response.output_text.done', 'content': full_response}, ensure_ascii=False)}\n\n"
                        yield "event: done\ndata: {}\n\n"
                        return
                    except (NotImplementedError, AttributeError) as e:
                        # AsyncPostgresSaver가 제대로 작동하지 않는 경우 기본 모드로 폴백
                        logger.warning(f"stream_mode='messages' failed: {e}, falling back to default mode")
                        # 아래 기본 모드로 계속 진행
                
                # 기본 모드: checkpointer가 없거나 stream_mode="messages" 실패 시
                # 노드 완료 후 스트리밍 (실시간이 아님)
                async for event in graph.astream(input_state, config=invoke_config):
                    for node_name, node_state in event.items():
                        # 디버깅: 노드 실행 로그
                        logger.debug(f"Node executed: {node_name}")
                        
                        # non_health_end 노드 처리 (비건강 질문)
                        if node_name == "non_health_end" and node_state.get("output"):
                            output = node_state.get("output")
                            short_answer = output.get("first_paragraph", "네, 알겠습니다.")
                            # OpenAI Agents SDK 형식으로 전송
                            yield f"event: raw_response_event\ndata: {safe_json_dumps({'type': 'response.output_text.done', 'content': short_answer}, ensure_ascii=False)}\n\n"
                            yield "event: done\ndata: {}\n\n"
                            return
                        
                        # writer 노드 완료 시 메시지 스트리밍
                        if node_name == "writer":
                            # writer 노드의 출력 확인
                            output = node_state.get("output")
                            if output:
                                full_text = _format_output_as_text(output)
                                logger.info(f"Writer output length: {len(full_text)}")
                                
                                # 텍스트를 청크 단위로 스트리밍 (OpenAI Agents SDK 형식)
                                chunk_size = 20
                                for i in range(0, len(full_text), chunk_size):
                                    chunk = full_text[i:i + chunk_size]
                                    yield f"event: raw_response_event\ndata: {safe_json_dumps({'type': 'response.output_text.delta', 'delta': chunk}, ensure_ascii=False)}\n\n"
                                    await asyncio.sleep(0.02)
                                
                                # 완료 이벤트
                                yield f"event: raw_response_event\ndata: {safe_json_dumps({'type': 'response.output_text.done', 'content': full_text}, ensure_ascii=False)}\n\n"
                                yield "event: done\ndata: {}\n\n"
                                return
                            else:
                                logger.warning("Writer node executed but no output found")
                
                # 그래프가 완료되었지만 writer 노드를 찾지 못한 경우
                logger.warning("Graph completed but writer node not found or no output")
                yield "event: done\ndata: {}\n\n"
                
            except Exception as e:
                logger.error(f"스트리밍 오류: {e}", exc_info=True)
                yield f"event: error\ndata: {{\"message\":\"{str(e)}\"}}\n\n"
        
        return StreamingResponse(sse(), media_type="text/event-stream")
    
    except Exception as e:
        logger.error(f"스트리밍 엔드포인트 오류: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"스트리밍 처리 중 오류가 발생했습니다: {str(e)}"
        )


@app.post("/conversations/{conversation_id}/message-stream-all")
async def message_stream_all(conversation_id: UUID, request: ChatRequest):
    """
    태그 기반 섹션별 스트리밍 + 최종 JSON 확정 + 데이터베이스 저장
    - 이벤트 스트림: 시작, 노드 진행 상태(status) 이벤트 전송
    - Writer 섹션별 실시간 스트리밍 (section_start/delta/section_done)
    - 최종 확정(complete) 이벤트
    - 저장 완료(saved) 이벤트
    """
    try:
        graph, checkpointer = get_graph()
        conversation_id_str = str(conversation_id)
        config = {}
        if checkpointer:
            config = {"configurable": {"thread_id": conversation_id_str}}
        
        NODE_STATUS = {
            "router": "질문 분석 중...",
            "rag": "RAG 검색 중...",
            "web": "웹 검색 중...",
            "pubmed": "PubMed 논문 찾는 중...",
            "scholar": "Google Scholar 추가 근거 찾는 중...",
            "patient_fetch": "환자 정보 조회 중...",
            "patient_map": "환자 데이터 분석 중...",
            "writer": "최종 문서 작성 중...",
        }
        
        async def event_generator():
            try:
                import asyncio
                
                input_state: GraphState = {
                    "messages": [HumanMessage(content=request.message)],
                    "user_id": request.user_id,
                    "conversation_id": conversation_id_str,
                    "max_attempts": request.max_attempts,
                }  # type: ignore
                
                invoke_config = {**config, "recursion_limit": 50}
                
                # 시작 이벤트
                yield safe_json_dumps({
                    "type": "start",
                    "data": {"conversation_id": conversation_id_str}
                }, ensure_ascii=False) + "\n"
                
                current_node = None
                parser = TaggedWriterStreamParser()
                final_state = None
                is_non_health = False
                
                # astream_events를 사용하여 LLM 토큰 스트리밍 감지
                try:
                    async for event in graph.astream_events(
                        input_state,
                        config=invoke_config,
                        version="v2"
                    ):
                        event_type = event.get("event")
                        metadata = event.get("metadata", {}) or {}
                        node_name = metadata.get("langgraph_node")
                        
                        # (A) 노드 진행 상태 이벤트
                        if event_type in ("on_node_start", "on_chain_start"):
                            if node_name and node_name != current_node:
                                current_node = node_name
                                status_text = NODE_STATUS.get(node_name)
                                if status_text:
                                    yield safe_json_dumps({
                                        "type": "status",
                                        "data": {"node": node_name, "text": status_text}
                                    }, ensure_ascii=False) + "\n"
                        
                        # 비건강 질문 처리
                        if node_name == "non_health_end" and event_type == "on_node_end":
                            is_non_health = True
                            async for snap in graph.astream(input_state, config=invoke_config, stream_mode="values"):
                                final_state = snap
                                break
                            
                            # router의 non_health_short_answer를 우선 사용
                            short_answer = (final_state.get("non_health_short_answer") or "").strip() if final_state else ""
                            if not short_answer and final_state and final_state.get("output"):
                                short_answer = final_state.get("output", {}).get("first_paragraph", "").strip()
                            if not short_answer:
                                short_answer = "네, 알겠습니다. 건강 관련 질문이 있으시면 언제든지 물어보세요."
                            
                            output = {
                                "first_paragraph": short_answer,
                                "second_paragraph": "",
                                "third_paragraph": "",
                                "fourth_paragraph": "",
                                "references": [],
                            }
                            
                            yield safe_json_dumps({
                                "type": "complete",
                                "data": {"output": {"first_paragraph": short_answer}}
                            }, ensure_ascii=False) + "\n"
                            try:
                                await save_to_supabase(conversation_id_str, request.user_id, request.message, output)
                                yield safe_json_dumps({"type": "saved", "data": {}}, ensure_ascii=False) + "\n"
                            except Exception as e:
                                logger.error(f"저장 실패: {e}")
                            return
                        
                        # (B) Writer LLM 토큰 스트리밍 → 태그 파서로 섹션 이벤트 변환
                        if event_type in ("on_chat_model_stream", "on_llm_stream"):
                            if current_node == "writer":
                                data = event.get("data", {}) or {}
                                chunk_obj = data.get("chunk")
                                if chunk_obj is not None:
                                    delta = None
                                    if hasattr(chunk_obj, "content"):
                                        delta = chunk_obj.content
                                    elif isinstance(chunk_obj, dict):
                                        delta = chunk_obj.get("content")
                                    
                                    if delta and isinstance(delta, str):
                                        for event_name, payload in parser.feed(delta):
                                            yield safe_json_dumps({
                                                "type": event_name,
                                                "data": payload
                                            }, ensure_ascii=False) + "\n"
                
                except Exception as e:
                    logger.warning(f"astream_events 실패: {e}, 기본 모드로 폴백")
                    async for snap in graph.astream(input_state, config=invoke_config, stream_mode="values"):
                        final_state = snap
                        if snap.get("is_health_question") is False:
                            is_non_health = True
                            # router의 non_health_short_answer를 우선 사용
                            short_answer = (snap.get("non_health_short_answer") or "").strip()
                            if not short_answer and snap.get("output"):
                                short_answer = snap.get("output", {}).get("first_paragraph", "").strip()
                            if not short_answer:
                                short_answer = "네, 알겠습니다. 건강 관련 질문이 있으시면 언제든지 물어보세요."
                            
                            output = {
                                "first_paragraph": short_answer,
                                "second_paragraph": "",
                                "third_paragraph": "",
                                "fourth_paragraph": "",
                                "references": [],
                            }
                            
                            yield safe_json_dumps({
                                "type": "complete",
                                "data": {"output": {"first_paragraph": short_answer}}
                            }, ensure_ascii=False) + "\n"
                            try:
                                await save_to_supabase(conversation_id_str, request.user_id, request.message, output)
                                yield safe_json_dumps({"type": "saved", "data": {}}, ensure_ascii=False) + "\n"
                            except Exception as e:
                                logger.error(f"저장 실패: {e}")
                            return
                        if "writer_raw" in snap:
                            writer_raw = snap.get("writer_raw", "")
                            if writer_raw:
                                for event_name, payload in parser.feed(writer_raw):
                                    yield safe_json_dumps({
                                        "type": event_name,
                                        "data": payload
                                    }, ensure_ascii=False) + "\n"
                
                if is_non_health:
                    return
                
                # 최종 상태 확보
                if final_state is None:
                    async for snap in graph.astream(input_state, config=invoke_config, stream_mode="values"):
                        final_state = snap
                        # 비건강 질문 확인 (astream_events에서 놓친 경우 대비)
                        if snap.get("is_health_question") is False:
                            is_non_health = True
                            # router의 non_health_short_answer를 우선 사용
                            short_answer = (snap.get("non_health_short_answer") or "").strip()
                            if not short_answer and snap.get("output"):
                                short_answer = snap.get("output", {}).get("first_paragraph", "").strip()
                            if not short_answer:
                                short_answer = "네, 알겠습니다. 건강 관련 질문이 있으시면 언제든지 물어보세요."
                            
                            output = {
                                "first_paragraph": short_answer,
                                "second_paragraph": "",
                                "third_paragraph": "",
                                "fourth_paragraph": "",
                                "references": [],
                            }
                            
                            yield safe_json_dumps({
                                "type": "complete",
                                "data": {"output": {"first_paragraph": short_answer}}
                            }, ensure_ascii=False) + "\n"
                            try:
                                await save_to_supabase(conversation_id_str, request.user_id, request.message, output)
                                yield safe_json_dumps({"type": "saved", "data": {}}, ensure_ascii=False) + "\n"
                            except Exception as e:
                                logger.error(f"저장 실패: {e}")
                            return
                        break
                
                # 최종 상태에서 비건강 질문 재확인 (astream_events에서 놓친 경우)
                if final_state and final_state.get("is_health_question") is False:
                    is_non_health = True
                    # router의 non_health_short_answer를 우선 사용
                    short_answer = (final_state.get("non_health_short_answer") or "").strip()
                    if not short_answer and final_state.get("output"):
                        short_answer = final_state.get("output", {}).get("first_paragraph", "").strip()
                    if not short_answer:
                        short_answer = "네, 알겠습니다. 건강 관련 질문이 있으시면 언제든지 물어보세요."
                    
                    output = {
                        "first_paragraph": short_answer,
                        "second_paragraph": "",
                        "third_paragraph": "",
                        "fourth_paragraph": "",
                        "references": [],
                    }
                    
                    yield safe_json_dumps({
                        "type": "complete",
                        "data": {"output": {"first_paragraph": short_answer}}
                    }, ensure_ascii=False) + "\n"
                    try:
                        await save_to_supabase(conversation_id_str, request.user_id, request.message, output)
                        yield safe_json_dumps({"type": "saved", "data": {}}, ensure_ascii=False) + "\n"
                    except Exception as e:
                        logger.error(f"저장 실패: {e}")
                    return
                
                if is_non_health:
                    return
                
                # writer_raw가 있으면 파서에 추가 feed (보험)
                if final_state and final_state.get("writer_raw"):
                    writer_raw = final_state.get("writer_raw", "")
                    if writer_raw:
                        for event_name, payload in parser.feed(writer_raw):
                            yield safe_json_dumps({
                                "type": event_name,
                                "data": payload
                            }, ensure_ascii=False) + "\n"
                
                # 최종 JSON 파싱
                output = parser.try_parse_final_json()
                if output is None:
                    output = {
                        "first_paragraph": parser.section_text.get("p1", "").strip(),
                        "second_paragraph": parser.section_text.get("p2", "").strip(),
                        "third_paragraph": parser.section_text.get("p3", "").strip(),
                        "fourth_paragraph": parser.section_text.get("p4", "").strip(),
                        "references": (final_state or {}).get("references", []),
                    }
                
                # (C) complete 이벤트 (프론트에서 확정 렌더)
                yield safe_json_dumps({
                    "type": "complete",
                    "data": {"output": output}
                }, ensure_ascii=False) + "\n"
                
                # (D) Supabase 저장
                try:
                    await save_to_supabase(conversation_id_str, request.user_id, request.message, output)
                    yield safe_json_dumps({"type": "saved", "data": {}}, ensure_ascii=False) + "\n"
                except Exception as e:
                    logger.error(f"저장 실패: {e}", exc_info=True)
                    yield safe_json_dumps({
                        "type": "error",
                        "data": {"message": f"저장 실패: {str(e)}"}
                    }, ensure_ascii=False) + "\n"
                
            except Exception as e:
                logger.exception("Error in event_generator: %s", e)
                yield safe_json_dumps({
                    "type": "error",
                    "data": {"type": "error", "message": str(e)}
                }, ensure_ascii=False) + "\n"
        
        return StreamingResponse(event_generator(), media_type="text/plain")
    
    except Exception as e:
        logger.error(f"스트리밍 엔드포인트 오류: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"스트리밍 처리 중 오류가 발생했습니다: {str(e)}"
        )


# =============================================================================
# 10) 그래프 인스턴스 (LangGraph Studio용)
# =============================================================================

# LangGraph Studio가 이 변수를 찾습니다
# 주의: LangGraph Studio는 자동으로 persistence를 처리하므로 checkpointer를 None으로 설정
# 프로덕션 환경에서는 FastAPI 앱의 get_graph()를 사용하세요
graph = build_graph(checkpointer=None)


# =============================================================================
# 11) 로컬 실행 예제
# =============================================================================

if __name__ == "__main__":
    """
    로컬 실행 예제 (개발/테스트용)
    - uvicorn으로 FastAPI 서버 실행: uvicorn main:app --reload
    - 또는 직접 그래프 테스트
    """
    # 체크포인터 초기화 (동기 버전 - 테스트용)
    # 주의: AsyncPostgresSaver를 사용하려면 async 함수 필요
    # 프로덕션에서는 lifespan에서 초기화됨
    import asyncio
    checkpointer = asyncio.run(init_checkpointer())
    graph = build_graph(checkpointer=checkpointer)

    # 샘플 테스트
    input_state: GraphState = {
        "messages": [HumanMessage(content="퀘르세틴은 암의 어떤 에너지 대사를 억제할 수 있나?")],
        "user_id": "720315a9-91cb-472b-b57d-9bf7a8264978",
        "conversation_id": "550e8400-e29b-41d4-a716-446655440000",  # UUID 형식
        "max_attempts": 1,
    }  # type: ignore

    config = {}
    if checkpointer:
        config = {"configurable": {"thread_id": input_state["conversation_id"]}}

    # 그래프 실행 (recursion_limit 설정)
    invoke_config = {**config, "recursion_limit": 50}
    result = graph.invoke(input_state, config=invoke_config)
    print(json.dumps(result.get("output"), ensure_ascii=False, indent=2))
    
    # FastAPI 서버 실행 (선택적)
    # import uvicorn
    # uvicorn.run(app, host="0.0.0.0", port=8000)
