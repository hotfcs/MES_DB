# DeepSeek API 설정 가이드

챗봇 AI 모델을 OpenAI에서 **DeepSeek**으로 교체했습니다!

## 🎉 장점

- ✅ **완전 무료** - API 키 발급만으로 무료 사용
- ✅ **기술 특화** - MES 관련 기술 용어 이해도 우수
- ✅ **빠른 응답** - 합리적인 응답 속도
- ✅ **Function Calling 지원** - 기존 코드 구조 그대로 유지

---

## 📋 설정 단계

### 1. DeepSeek API 키 발급

1. **DeepSeek 웹사이트 방문**
   - https://platform.deepseek.com/

2. **회원 가입 / 로그인**
   - 이메일 또는 Google 계정으로 가입

3. **API 키 발급**
   - Dashboard > API Keys 메뉴로 이동
   - "Create API Key" 클릭
   - API 키 복사 (다시 볼 수 없으니 안전하게 보관!)

### 2. 환경변수 설정

프로젝트 루트의 `.env.local` 파일을 열고 다음 내용을 추가/수정:

```bash
# DeepSeek API 키 (필수!)
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# 기존 OpenAI 키는 주석 처리 (선택사항)
# OPENAI_API_KEY=sk-...
```

**중요**: 
- `.env.local` 파일은 절대 Git에 커밋하지 마세요!
- `.gitignore`에 이미 포함되어 있습니다.

### 3. 개발 서버 재시작

환경변수 변경 후 서버를 재시작해야 합니다:

```bash
# Ctrl + C로 서버 종료 후
npm run dev
```

---

## 🧪 테스트

챗봇을 열고 다음 질문을 해보세요:

1. **기본 대화 테스트**
   ```
   안녕하세요
   ```

2. **데이터 조회 테스트**
   ```
   제품 목록 보여줘
   ```

3. **차트 테스트**
   ```
   생산계획 수량을 막대차트로 보여줘
   ```

---

## ⚠️ 주의사항

### 무료 제한
- DeepSeek은 무료지만 API 호출 제한이 있을 수 있습니다.
- 과도한 요청은 자제해 주세요.

### 한국어 품질
- DeepSeek은 기술 문서에 강하지만, 한국어는 OpenAI/Gemini보다 약간 부족할 수 있습니다.
- 필요시 Gemini로 변경 가능합니다.

---

## 🔄 다른 모델로 변경하려면?

### Gemini로 변경
더 자연스러운 한국어가 필요하면 Gemini를 추천합니다:
```
"Gemini로 교체해줘"
```

### OpenAI로 복구
유료 OpenAI로 돌아가려면:
```
"OpenAI로 복구해줘"
```

---

## 💰 비용 비교

| 모델 | 비용 | 한국어 품질 | 기술 이해도 | 추천도 |
|------|------|------------|------------|--------|
| **DeepSeek** | 무료 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Gemini Flash** | 무료 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **OpenAI GPT-4o-mini** | 유료 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |

---

## 📚 추가 정보

- **DeepSeek 문서**: https://platform.deepseek.com/docs
- **API 상태**: https://status.deepseek.com/
- **커뮤니티**: https://discord.gg/deepseek

---

## 🆘 문제 해결

### API 키 오류
```
Error: Invalid API key
```
→ `.env.local`의 `DEEPSEEK_API_KEY` 확인

### 연결 오류
```
Error: Failed to fetch
```
→ 인터넷 연결 확인
→ DeepSeek 서비스 상태 확인 (https://status.deepseek.com/)

### 느린 응답
→ DeepSeek 무료 티어는 응답이 느릴 수 있습니다.
→ Gemini로 변경 고려

---

**설정 완료!** 🎊

이제 무료 DeepSeek AI를 사용하여 MES 챗봇을 이용할 수 있습니다!

