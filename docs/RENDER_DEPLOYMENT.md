# Render 무료 배포 안내

작성일: 2026-10-12 (Asia/Seoul)

사용자 확정: 프론트 https://dg-truckworks.site 유지, 백엔드는 Render 무료 Web Service, DB는 Render 무료 PostgreSQL로 체험한다. 백엔드 연결 주소는 프론트와 같은 사이트에 속한 https://api.dg-truckworks.site 로 준비한다. 코드·문서 작성 완료이며 GitHub 업로드·서비스 생성·DNS·환경변수·실제 배포·사용자 동작 확인은 대기다.

## 1. 변경 파일 업로드

현재 로컬 변경을 사용자가 GitHub의 Gorani77/dg-truckworks main에 반영한다. 이번에는 커밋·push를 수행하지 않았다. 필요한 파일은 frontend/src/api/url.ts, session.ts, factoryStream.ts, frontend/.env.example, backend/src/truckworks/api/app.py, backend/.python-version, backend/render-start.sh 및 관련 기록이다. 실제 .env와 키는 업로드하지 않는다.

## 2. Render PostgreSQL 생성

Render Dashboard → New → Postgres에서 이름 truckworks-db, Free 플랜을 선택한다. 이후 Web Service도 같은 리전을 선택한다. 생성 후 Connections의 Internal Database URL을 서버 환경변수에 사용한다. URL·비밀번호를 채팅이나 저장소에 공유하지 않는다.

무료 DB는 생성 후 30일에 만료된다. 만료 전 데이터를 내보내거나 유지 방법을 선택해야 한다. 만료 후 14일의 유료 전환 유예 기간이 지나면 데이터가 삭제된다. 무료 DB 백업 제공은 없다. 생성일과 만료일을 사용자가 기록한다. 날짜를 알기 전에는 만료일을 추정해 확정하지 않는다.

## 3. Render Web Service 생성

New → Web Service → GitHub 저장소 연결 후 아래 값을 입력한다.

| 항목 | 값 |
|---|---|
| Name | truckworks-api (이미 사용 중이면 다른 이름) |
| Branch | main |
| Root Directory | backend |
| Language / Runtime | Python 3 |
| Region | DB와 동일 |
| Instance Type | Free |
| Build Command | `uv sync --locked` |
| Start Command | `sh render-start.sh` |
| Health Check Path | /api/health |

backend/.python-version은 3.12 계열을 지정한다. Render는 서비스 루트의 uv.lock을 통해 uv를 제공한다. 시작 스크립트는 `uv run --no-sync alembic upgrade head` 성공 후 Uvicorn을 0.0.0.0:$PORT에서 worker 1개로 실행한다. 무료 서비스의 pre-deploy 명령 대신 시작 단계에서 migration을 적용하며 실패 시 앱은 시작하지 않는다. 유휴 중지 후 시작할 때도 migration 최신 여부를 반영한다. 현재 단일 서버 체험 구성 기준이며 다중 인스턴스로 확장하는 설정이 아니다.

Render 환경변수:

| 이름 | 값 |
|---|---|
| TRUCKWORKS_CORS_ORIGINS | `["https://dg-truckworks.site"]` |
| TRUCKWORKS_SESSION_COOKIE_SECURE | `true` |
| TRUCKWORKS_DATABASE_URL | Internal Database URL의 맨 앞 `postgresql://`를 `postgresql+psycopg://`로 변경한 값 |
| TRUCKWORKS_OPENAI_API_KEY | 기존 서버용 키 (AI 분석 사용 시) |
| TRUCKWORKS_OPENAI_MODEL | 기존 backend/.env.example의 모델 설정 |

DB URL의 사용자·비밀번호·호스트·경로는 유지하고 접두어만 바꾼다. 키가 없으면 AI 분석을 사용할 수 없다. 서버 호스팅 무료와 AI API 사용료는 별개다. 실제 키·DB URL은 Render의 비공개 환경변수에만 입력한다.

서비스 생성 후 Render가 빌드와 실행을 수행한다. 사용자가 로그에서 dependency 설치·migration·Uvicorn 시작 결과를 읽는다. 실패하면 비밀정보를 제거한 오류 부분으로 원인을 논의하고, 잠금 파일 갱신이나 구성 변경을 임의로 우회하지 않는다.

## 4. API 서브도메인 연결

서비스 Settings → Custom Domains → api.dg-truckworks.site 추가. 현재 도메인의 DNS 관리 화면에서 Render가 안내하는 CNAME을 추가한다. 일반적인 형태는 이름 `api`, 대상 `실제서비스명.onrender.com`이며 Render 화면의 실제 지시를 우선한다. 프론트 루트 도메인의 기존 Vercel 레코드는 유지한다. api 이름의 기존 충돌 레코드가 있다면 해당 이름만 정리한다.

Render에서 도메인 검증과 TLS 인증서 발급 완료를 사용자가 확인한다. HTTPS API 주소는 https://api.dg-truckworks.site, WebSocket은 wss://api.dg-truckworks.site/api/factory/stream 이다. 기존 쿠키는 HttpOnly·SameSite=Lax·Path=/api를 유지한다. HTTPS 루트 프론트와 HTTPS API 서브도메인은 같은 사이트이므로 이 구성에서 Lax 쿠키를 활용한다. 서로 다른 origin이므로 HTTP credentials: include와 CORS allow_credentials=True를 함께 적용했다.

Vercel 프리뷰 주소나 onrender.com 직접 연결은 서로 다른 사이트가 되어 현재 Lax 쿠키 구성의 대상이 아니다. 프론트는 우선 확정된 https://dg-truckworks.site 에서 사용한다. www 주소도 운영하려면 실제 사용 여부에 따라 canonical redirect 또는 CORS 범위를 별도로 정한다.

## 5. Vercel 환경변수·프론트 재배포

프론트 프로젝트 Settings → Environment Variables에서 Production에 다음 값을 추가하고 재배포한다.

```text
VITE_API_ORIGIN=https://api.dg-truckworks.site
```

Vite 환경변수는 빌드 시 반영된다. 이 변수는 공개 API 주소이며 비밀키를 넣지 않는다. 로컬 개발에서는 변수를 설정하지 않으면 기존 Vite /api 프록시를 사용한다. frontend/.env.example은 설명용이며 자동으로 환경에 적용되지 않는다.

HTTP와 WebSocket은 같은 apiUrl 함수를 사용한다. 배포 origin이 있으면 최초 세션 준비 요청은 최대 120초까지 기다린다. 기본 연결 중 UI와 기존 실패 후 재연결 로직을 사용하며 생산/유료 AI 명령을 자동 재실행하지 않는다. 120초 대기는 시작 성공 보장이 아니다.

## 6. 사용자가 직접 확인할 항목

테스트·빌드·린트·서버 실행·HTTP 호출·브라우저 검증은 Codex가 수행하지 않았다.

1. https://api.dg-truckworks.site/api/health 의 정상 JSON 응답과 HTTPS 연결.
2. https://dg-truckworks.site 에서 /api/session 응답·HttpOnly Secure 방문자 쿠키 설정·WebSocket 101 연결·공장 상태 수신.
3. 15분 이상 실제 수신 트래픽이 없는 상태 이후 첫 방문에서 서버 준비 대기 후 연결되는지. 열린 WebSocket의 메시지도 트래픽이므로 열린 탭만 두고 유휴 중지됐다고 가정하지 않는다.
4. 생산 시작·고장·복구 및 다른 브라우저 프로필에서 공장 분리. 재시작 후 진행 중 상태는 초기화되며 같은 쿠키의 DB 이력은 별도로 유지되어야 한다.
5. AI 질문은 사용자가 직접 제출하고 결과·실패 표시를 확인한다. 실제 API 요금이 발생한다.
6. 생산/분석 이력의 저장·조회. 무료 DB 만료일과 데이터 보관 방법을 기록한다.
7. 필요 시 frontend에서 npm run build와 npm run lint를 직접 수행한다. 배포 주소를 설정하지 않은 로컬 환경도 기존 프록시로 연결되어야 한다.

## 제한과 다음 작업

무료 웹 서비스는 15분 수신 트래픽이 없으면 중지되고 재가동에 약 1분이 걸릴 수 있다. 임의 재시작과 메모리 부족 가능성도 있으므로 현재 규모에서 동작·메모리는 사용자 확인 대기다. 무료 시간은 워크스페이스당 월 750시간이며 outbound와 build 사용량 제한도 있다. 결제수단 유무·지출 설정에 따라 한도 초과 시 추가 청구 또는 서비스/빌드 중단이 발생할 수 있다. 실제 계정의 요금 화면에서 확인한다.

다음은 사용자 서비스 생성·업로드·DNS·환경변수 입력·배포 결과를 받아 연결 문제를 다루는 단계다. 다른 DB·유료 플랜 전환은 별도 선택 후 진행한다.

공식 자료: [FastAPI 배포](https://render.com/docs/deploy-fastapi), [uv 제공](https://render.com/docs/uv-version), [Python 버전](https://render.com/docs/python-version), [사용자 도메인](https://render.com/docs/custom-domains), [무료 제한](https://render.com/docs/free), [배포 단계](https://render.com/docs/deploys).
