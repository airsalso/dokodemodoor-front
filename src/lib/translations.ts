export type Language = "en" | "ko";

export const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navbar
    dashboard: "Dashboard",
    scans: "Pentest Scans",
    settings: "Settings",
    about: "About",
    login: "Login",
    logout: "Logout",
    start_pentest: "Start Pentest",
    sca_scans: "SCA Scans",
    logs: "Logs",
    reports: "Reports",
    projects: "Project",
    project_management: "Project Management",
    project_profiles: "Project Profile",
    project_analyzer: "Project Analyzer",
    profile_name: "Profile Name",
    yaml_content: "YAML Content",
    save_config: "Save Profile",
    cancel: "Cancel",
    create_config: "Create Profile",
    mcp_config: "Create MCP Profile",
    config_desc: "Define a custom YAML profile for your scan.",
    analyzer_desc: "Analyze project source code to identify patterns and enhancements.",
    run_analyzer: "Run Analyzer",
    mcp_desc: "Define a custom MCP server profile for your scan.",
    register_project: "Register Project",
    repo_url: "Repository URL",
    project_name: "Project Name",
    register_desc: "Clone a git repository to create a new project.",
    edit_project: "Edit Project",
    new_project: "New Project",

    // Settings Sections
    account_settings: "Account Settings",
    manage_profile: "Manage your profile and system configurations.",
    scan_configs: "Scan Configurations",
    scan_configs_desc: "Optimize the scanning engine behavior.",
    ai_engine_settings: "AI & Engine Settings",
    ai_engine_settings_desc: "Configure the AI core and engine environment (.env).",
    notifications: "Notifications & Integrations",
    notifications_desc: "Get alerted on scan completion and vulnerabilities.",
    data_management: "Data Management",
    data_management_desc: "Manage your scan history and account data.",
    appearance: "Appearance & Language",
    appearance_desc: "Personalize your UI experience.",

    // Scan Config Fields
    exclusions: "Default Exclusions",
    exclusions_placeholder: "admin,logout,login...",
    request_delay: "Request Delay (ms)",
    timeout: "Timeout Settings (ms)",

    // AI Settings Fields
    llm_provider: "LLM Provider",
    llm_model: "LLM Model Selection",
    analysis_strictness: "Analysis Strictness",
    api_key: "API Key Management",
    engine_env_warning: "Changing these will update the engine's .env file directly.",

    // Notification Fields
    webhook_url: "Webhook Integration (Slack/Discord)",
    email_reports: "Email Reports",
    email_reports_desc: "Automatically send PDF reports via email.",

    // Data Management Fields
    export_history: "Export History",
    auto_cleanup: "Auto-Cleanup Days",
    auto_cleanup_desc: "0 means disabled (keep forever).",
    account_deletion: "Account Deletion",
    delete_desc: "Permanently remove your account and all scan data.",

    // Appearance Fields
    terminal_theme: "Terminal Theme",
    accent_color: "Accent Color",
    select_language: "Select Language",
    language_desc: "Choose your preferred language for the interface.",
    terminal_font: "Terminal Font",
    theme_font: "Theme Font",
    theme_font_desc: "Choose the main interface font.",
    manual_registration: "Local",
    git_clone: "Git",
    local_path: "Local Path",
    local_path_desc: "The path on the server where the source code is located.",

    // General
    save_changes: "Save Changes",
    change_password: "Change Password",
    current_password: "Current Password",
    new_password: "New Password",
    confirm_password: "Confirm New Password",
    save_password: "Save New Password",
    security_tips: "Security Tips",
    verified_user: "Verified User",

    // Scans
    scans_title: "Pentest Scans",
    scans_desc: "Manage and monitor your security assessment history.",
    search_placeholder: "Search by Project Name, Target URL or Scan ID...",
    start_new_scan: "Start New Scan",
    all_status: "All Status",
    running: "Running",
    completed: "Completed",
    failed: "Failed",
    translating: "Translating",
    date: "Date",
    vulns: "Vulns",
    vulnerabilities: "Vulnerabilities",
    scan_history: "Scan History",
    duration: "Duration",
    no_results: "No results found.",

    // Home
    hero_title: "Vulnerability Scanning",
    hero_desc: "The most advanced AI-powered security assessment tool for modern applications.",
    features: "Features",
    // Roles
    role_admin: "System Admin",
    role_security: "Security Officer",
    role_user: "General User",

    // Management
    management: "Management",
    user_management: "User Management",
    permission_management: "Permission Management",
    role_permissions: "Role Permissions",
    permission_desc: "Configure access levels and feature availability for system roles.",
    network_security: "Network Security",
    ip_access_control: "IP Access Control",
    ip_desc: "Restrict system access to specific IP addresses. (Nginx-based)"
  },
  ko: {
    // Navbar
    dashboard: "대시보드",
    scans: "모의해킹 이력",
    settings: "설정",
    about: "소개",
    login: "로그인",
    logout: "로그아웃",
    start_pentest: "스캔 시작",
    sca_scans: "SCA 스캔",
    logs: "로그",
    reports: "리포트",
    projects: "프로젝트",
    project_management: "프로젝트 관리",
    project_profiles: "Project Profile",
    project_analyzer: "Project Analyzer",
    profile_name: "프로필 이름",
    yaml_content: "YAML 내용",
    save_config: "프로필 저장",
    cancel: "취소",
    create_config: "프로필 생성",
    config_desc: "스캔을 위한 사용자 정의 YAML 프로필을 정의하십시오.",
    analyzer_desc: "프로젝트 소스 코드를 분석하여 패턴 및 개선 사항을 식별합니다.",
    run_analyzer: "분석 시작",
    register_project: "프로젝트 등록",
    repo_url: "저장소 URL",
    project_name: "프로젝트 이름",
    register_desc: "Git 저장소를 클론하여 새 프로젝트를 생성합니다.",
    edit_project: "프로젝트 수정",
    new_project: "새 프로젝트",

    // Settings Sections
    account_settings: "계정 및 시스템 설정",
    manage_profile: "프로필 및 시스템 구성을 관리합니다.",
    scan_configs: "스캔 최적화 설정",
    scan_configs_desc: "스캐닝 엔진의 동작을 최적화합니다.",
    ai_engine_settings: "AI 및 엔진 설정",
    ai_engine_settings_desc: "AI 코어 및 엔진 환경(.env)을 설정합니다.",
    notifications: "알림 및 연동",
    notifications_desc: "스캔 완료 및 취약점 발견 알림을 받습니다.",
    data_management: "데이터 관리",
    data_management_desc: "스캔 이력 및 계정 데이터를 관리합니다.",
    appearance: "화면 및 언어 설정",
    appearance_desc: "UI 경험을 개인화합니다.",

    // Scan Config Fields
    exclusions: "기본 제외 경로",
    exclusions_placeholder: "admin,logout,login...",
    request_delay: "요청 지연 시간 (ms)",
    timeout: "타임아웃 설정 (ms)",

    // AI Settings Fields
    llm_provider: "LLM 제공자",
    llm_model: "LLM 모델 선택",
    analysis_strictness: "분석 엄격도",
    api_key: "API 키 관리",
    engine_env_warning: "이 설정을 변경하면 엔진의 .env 파일이 직접 수정됩니다.",

    // Notification Fields
    webhook_url: "웹훅 연동 (Slack/Discord)",
    email_reports: "이메일 보고서",
    email_reports_desc: "PDF 보고서를 이메일로 자동 전송합니다.",

    // Data Management Fields
    export_history: "이력 내보내기",
    auto_cleanup: "자동 삭제 주기 (일)",
    auto_cleanup_desc: "0은 비활성화 (영구 보관)를 의미합니다.",
    account_deletion: "계정 탈퇴",
    delete_desc: "계정과 모든 스캔 데이터를 영구적으로 삭제합니다.",

    // Appearance Fields
    terminal_theme: "터미널 테마",
    accent_color: "포인트 색상",
    select_language: "언어 선택",
    language_desc: "인터페이스에 사용할 언어를 선택하세요.",
    theme_font: "테마 폰트",
    theme_font_desc: "메인 인터페이스의 글꼴을 선택합니다.",
    manual_registration: "수동 프로젝트 등록",
    git_clone: "Git 클론",
    local_path: "로컬 경로",
    local_path_desc: "서버 내 소스 코드가 위치한 절대 경로입니다.",

    // General
    save_changes: "설정 저장",
    change_password: "비밀번호 변경",
    current_password: "현재 비밀번호",
    new_password: "새 비밀번호",
    confirm_password: "새 비밀번호 확인",
    save_password: "새 비밀번호 저장",
    security_tips: "보안 팁",
    verified_user: "인증된 사용자",

    // Scans
    scans_title: "모의해킹 이력",
    scans_desc: "보안 진단 이력을 관리하고 모니터링하세요.",
    search_placeholder: "타겟 URL 또는 스캔 ID로 검색...",
    start_new_scan: "새 스캔 시작",
    all_status: "전체 상태",
    running: "진행 중",
    completed: "완료",
    failed: "실패",
    translating: "번역 중",
    date: "일시",
    vulns: "취약점",
    vulnerabilities: "취약점 관리",
    scan_history: "스캔 이력",
    duration: "소요시간",
    no_results: "검색 결과가 없습니다.",

    // Home
    hero_title: "취약점 스캐닝",
    hero_desc: "최신 애플리케이션을 위한 가장 진보된 AI 기반 보안 진단 도구입니다.",
    features: "주요 기능",
    realtime_logs: "실시간 로그",
    ai_analysis: "AI 분석",
    secure_auth: "보안 인증",

    // Roles
    role_admin: "시스템어드민",
    role_security: "보안담당자",
    role_user: "일반사용자",

    // Management
    management: "시스템관리",
    user_management: "사용자 관리",
    permission_management: "권한 관리",
    role_permissions: "역할별 권한 설정",
    permission_desc: "시스템 역할별 접근 수준 및 기능 가용성을 설정합니다.",
    terminal_font: "터미널 폰트",
    network_security: "네트워크 보안",
    ip_access_control: "IP 접근 제어",
    ip_desc: "시스템 접근이 허용된 IP 주소를 관리합니다. (Nginx 기반)"
  }
};
