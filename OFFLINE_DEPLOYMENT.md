# 사내망(폐쇄망) 배포 가이드 (Offline Deployment Guide)

이 문서는 인터넷 연결이 제한된 사내망 환경에서 프로젝트를 성공적으로 가동하기 위한 압축 방법 및 Nginx 설정 가이드를 제공합니다.

---

## 🛠 1. 로컬 환경에서 압축 준비 (Preparation)

폐쇄망 서버에서는 외부 라이브러리(`npm install`)를 내려받을 수 없으므로, **빌드를 마친 상태의 전체 환경을 압축**해야 합니다.

### 1단계: 프로덕션 빌드 실행
```bash
# 최신 정적 파일 및 서버 파일 생성
npm run build
```

### 2단계: 배포용 데이터베이스 준비
- `prisma/dev.db` 파일이 포함되어 있는지 확인하십시오. 신규 서버에서 시작할 경우 빈 DB 상태로 가져가도 무방합니다.

### 3단계: 필수 파일 압축
다음 파일 및 폴더를 포함하여 `.zip` 또는 `.tar.gz`로 압축합니다.
- `.next/` (빌드 결과물)
- `node_modules/` (모든 의존성 라이브러리)
- `public/` (이미지 및 정적 자산)
- `prisma/` (DB 파일 및 스키마)
- `.env` (환경 설정 파일)
- `package.json`

> **Tip:** `.next/standalone` 모드를 활용하면 더 가볍게 배포할 수 있지만, 가장 확실한 방법은 위 항목 전체를 가져가는 것입니다.

---

## 🚚 2. 사내망 서버로 이전 (Transfer)

1. 압축 파일을 사내 서버의 원하는 경로(예: `/home/ubuntu/dokodemodoor-front`)에 풀고 이동합니다.
2. 서버에 **Node.js (v18+)**가 설치되어 있는지 확인합니다.
   ```bash
   node -v
   ```

---

## ⚙️ 3. Nginx 설정 (Nginx Configuration)

사내망 서버의 Nginx에 프로젝트와 연동하기 위한 설정 파일(Server Block)을 생성해야 합니다. 특히 이번 업데이트의 핵심인 **세션 인증**이 유지되도록 필수 헤더를 포함해야 합니다.

### 1단계: 설정 파일 생성
```bash
sudo nano /etc/nginx/sites-available/dokodemodoor
```

### 2단계: 설정 내용 작성
아래 내용을 복사하여 붙여넣으십시오. ([서버_IP] 부분을 실제 사내 IP로 수정)
```nginx
server {
    listen 80;
    server_name [서버_IP_혹은_도메인];

    # 파일 업로드 크기 제한 (필요 시 수정)
    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;

        # [CRITICAL] 세션 방식 인증을 위한 필수 헤더 설정
        proxy_set_header Cookie $http_cookie;
        proxy_pass_header Set-Cookie;

        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 3단계: 활성화 및 재시작
```bash
# 심볼릭 링크 생성
sudo ln -s /etc/nginx/sites-available/dokodemodoor /etc/nginx/sites-enabled/

# Nginx 설정 테스트
sudo nginx -t

# Nginx 재시작
sudo systemctl restart nginx
```

---

## 🏃 4. 애플리케이션 가동 (Execution)

서버에서 백그라운드로 애플리케이션을 가동합니다.

### 방법 A: 단순 실행 (Standalone)
```bash
node .next/standalone/server.js
```

### 방법 B: PM2 사용 권장 (프로세스 관리)
서버가 재부팅되어도 자동으로 켜지도록 PM2를 사용하는 것이 좋습니다.
```bash
# pm2 설치 (기존에 가져온 node_modules에 포함되어 있어야 함)
./node_modules/.bin/pm2 start .next/standalone/server.js --name "dokodemodoor-front"
```

---

## ✅ 5. 최종 확인

1. 브라우저에서 `http://[서버_IP]`로 접속합니다.
2. 로그인을 시도하여 정상적으로 메인 페이지로 진입하는지 확인합니다.
3. `/scans/vulns` 페이지에서 취약점 목록이 정상적으로 조회되는지 확인합니다. (Nginx의 Cookie 헤더가 정상 작동하는지 확인하는 가장 빠른 방법입니다.)

---

### ⚠️ 주의사항
- **포트 충돌:** 사내 서버의 80포트를 이미 다른 앱이 쓰고 있다면 Nginx의 `listen` 포트를 변경해야 합니다.
- **방화벽:** 서버의 인바운드 규칙에서 80포트(혹은 설정한 포트)가 열려 있어야 합니다.
