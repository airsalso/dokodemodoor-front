# DokodemoDoor 사내망 마이그레이션 작업 계획서

본 문서는 외부 네트워크가 차단된 사내망(Air-gapped) 환경으로 DokodemoDoor 프론트엔드 프로젝트를 안전하게 이관하고 구동하기 위한 절차를 기술합니다.

---

## 1. 개요
- **목적:** 외부망 의존성(Google Fonts, 외부 API 등)이 제거된 서비스를 사내망 서버에 구축
- **대상:** Next.jsStandalone 기반 프론트엔드 어플리케이션 및 SQLite 데이터베이스
- **방식:** Standalone 빌드 아티팩트 패키징 및 오프라인 임포트

---

## 2. 사전 준비 (외부망/개발 환경)

### 2.1 코드 및 의존성 최적화 (완료)
- [x] Google Fonts 로드 제거 및 시스템 폰트 스택 전환
- [x] `next.config.ts`에 `output: 'standalone'` 설정 추가 (오프라인 실행 최적화)

### 2.2 어플리케이션 빌드
```bash
# 1. 의존성 설치
npm install

# 2. 프리즈마 클라이언트 생성
npx prisma generate

# 3. 프로젝트 빌드
npm run build
```

### 2.3 패키징 작업
빌드 완료 후 생성된 `.next/standalone` 폴더를 중심으로 필요한 자산을 모읍니다.
1. **대상 파일 목록:**
   - `.next/standalone` 폴더 전체 (서버 로직)
   - `.next/static` 폴더 (프론트엔드 정적 코드 - `standalone/.next/static`으로 이동 필요)
   - `public` 폴더 (이미지, SVG 등)
   - `prisma` 폴더 (`dev.db` 포함 - 필요 시 초기화된 DB 준비)
   - `.env` 파일 (환경 변수 설정값)
2. **압축 수행:**
```bash
# standalone 폴더 내부로 static 및 public 이동
cp -r public .next/standalone/
cp -r .next/static .next/standalone/.next/

# 마이그레이션 패키지 압축
tar -czvf dokodemodoor_migration_v1.tar.gz -C .next/standalone .
```

---

## 3. 이관 및 설치 (사내망/운영 환경)

### 3.1 인프라 준비
- **Node.js:** v20+ 설치 (오프라인 설치 파일 준비 필요)
- **네트워크:** 사내망 내부 IP 할당 및 3000번 포트 개방

### 3.2 아티팩트 배포
1. 준비된 `dokodemodoor_migration_v1.tar.gz` 파일을 운영 서버로 전송
2. 압축 해제:
```bash
mkdir -p /app/dokodemodoor
tar -xzvf dokodemodoor_migration_v1.tar.gz -C /app/dokodemodoor
```

### 3.3 환경 변수 설정
`.env` 파일을 사내망 환경에 맞게 수정합니다.
- `DATABASE_URL`: `"file:./prisma/dev.db"`
- `JWT_SECRET`: 사내 보안 규정에 맞는 비밀키
- `NEXT_PUBLIC_API_URL`: (필요 시) 내부 API 엔드포인트

---

## 4. 실행 및 검증

### 4.1 데이터베이스 검증
Prisma 엔진이 정상적으로 SQLite 파일에 접근 가능한지 확인합니다.
```bash
# standalone 환경에서는 별도의 prisma 명령어 없이 서버 실행 시 연결됨
# 필요 시 sqlite3 명령어로 dev.db 구조 확인
```

### 4.2 서버 구동
```bash
# 서버 실행 (기본 포트 3000)
PORT=3000 node server.js
```

### 4.3 체크리스트
- [ ] 브라우저 접속 시 폰트 로딩 오류(404 Google Fonts)가 발생하지 않는가?
- [ ] 로그인/로그아웃 기능이 사내망 DB(SQLite)와 정상 연동되는가?
- [ ] 스캔 이력 조회 및 설정 변경 시 에러가 없는가?
- [ ] (중요) 모든 이미지가 정적으로 로딩되는가? (외부 URL 참조 여부)

---

## 5. 유지보수 및 업데이트
- **업데이트:** 외부망에서 빌드를 새로 수행한 후 `server.js`를 포함한 standalone 패키지만 재배포
- **로그 관리:** `stdout`, `stderr`를 파일로 리다이렉션하여 사내 보안 관제 시스템에 연동 권장
