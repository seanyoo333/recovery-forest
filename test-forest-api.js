// 산림청 유아숲체험원 API 테스트
async function testForestAPI() {
  try {
    console.log("🌲 산림청 유아숲체험원 API 호출 중...");

    const response = await fetch(
      "http://api.forest.go.kr/openapi/service/cultureInfoService/frstEduInfoOpenAPI",
    );
    const data = await response.text();

    console.log("✅ API 호출 성공!");
    console.log("📄 응답 데이터 길이:", data.length, "문자");
    console.log("\n📋 전체 응답 내용:");
    console.log("=".repeat(50));
    console.log(data);
    console.log("=".repeat(50));

    // 프로그램 개수 확인
    const programCount = (data.match(/☆/g) || []).length;
    console.log(`\n🎯 발견된 프로그램 개수: ${programCount}개`);

    // 각 프로그램 이름 추출
    const programs = data.split("☆").filter((block) => block.trim());
    console.log("\n📝 프로그램 목록:");
    programs.forEach((program, index) => {
      const lines = program.split("\n").filter((line) => line.trim());
      if (lines.length > 0) {
        const name = lines[0].replace("☆", "").trim();
        if (name) {
          console.log(`${index + 1}. ${name}`);
        }
      }
    });
  } catch (error) {
    console.error("❌ API 호출 실패:", error.message);
  }
}

// API 테스트 실행
testForestAPI();
