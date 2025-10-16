# 챗봇 설정 가이드

## 환경 변수 설정

챗봇 기능을 사용하려면 다음 환경 변수를 설정해야 합니다.

### 로컬 개발 환경

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```
OPENAI_API_KEY=sk-your-openai-api-key-here
```

### Vercel 배포 환경

1. Vercel 대시보드에서 프로젝트 선택
2. Settings > Environment Variables 메뉴로 이동
3. 다음 환경 변수 추가:
   - Name: `OPENAI_API_KEY`
   - Value: `sk-your-openai-api-key-here`
   - Environment: Production, Preview, Development (모두 선택)

## OpenAI API 키 발급

1. https://platform.openai.com/api-keys 접속
2. "Create new secret key" 클릭
3. API 키 복사 (sk-로 시작)
4. 안전한 곳에 보관

## 주의사항

- `.env.local` 파일은 Git에 커밋하지 마세요 (이미 `.gitignore`에 포함됨)
- API 키는 절대 공개 저장소에 올리지 마세요
- OpenAI API는 유료 서비스입니다 (무료 체험 크레딧 소진 후 과금됨)

## 챗봇 기능

- 제품, 작업지시, 생산계획, 설비, 자재, 사용자 정보 조회
- 마크다운 테이블 형식으로 결과 표시
- 차트 시각화 기능 (막대, 선, 파이 차트)
- 채팅 히스토리 저장

## 문제 해결

빌드 시 "Missing credentials" 에러가 발생하면:
- Vercel 환경 변수에 `OPENAI_API_KEY`가 설정되어 있는지 확인
- 환경 변수 추가 후 재배포 필요

