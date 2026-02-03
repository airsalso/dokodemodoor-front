-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "jwt" TEXT NOT NULL,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "expiresAt" DATETIME NOT NULL,
    "lastActivity" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_RefreshToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "lastActivity" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_RefreshToken" ("createdAt", "expiresAt", "id", "lastActivity", "token", "userId") SELECT "createdAt", "expiresAt", "id", "lastActivity", "token", "userId" FROM "RefreshToken";
DROP TABLE "RefreshToken";
ALTER TABLE "new_RefreshToken" RENAME TO "RefreshToken";
CREATE UNIQUE INDEX "RefreshToken_token_key" ON "RefreshToken"("token");
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");
CREATE INDEX "RefreshToken_token_idx" ON "RefreshToken"("token");
CREATE TABLE "new_Scan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "targetUrl" TEXT NOT NULL,
    "sourcePath" TEXT,
    "config" TEXT,
    "sessionId" TEXT,
    "status" TEXT NOT NULL,
    "startTime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" DATETIME,
    "vulnerabilities" INTEGER NOT NULL DEFAULT 0,
    "duration" TEXT,
    "logs" TEXT,
    "userId" TEXT,
    CONSTRAINT "Scan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Scan" ("config", "duration", "endTime", "id", "logs", "sessionId", "sourcePath", "startTime", "status", "targetUrl", "userId", "vulnerabilities") SELECT "config", "duration", "endTime", "id", "logs", "sessionId", "sourcePath", "startTime", "status", "targetUrl", "userId", "vulnerabilities" FROM "Scan";
DROP TABLE "Scan";
ALTER TABLE "new_Scan" RENAME TO "Scan";
CREATE TABLE "new_UserSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "exclusions" TEXT NOT NULL DEFAULT 'admin,logout,login',
    "requestDelay" INTEGER NOT NULL DEFAULT 500,
    "timeout" INTEGER NOT NULL DEFAULT 30000,
    "llmModel" TEXT NOT NULL DEFAULT 'gpt-4o',
    "analysisStrictness" TEXT NOT NULL DEFAULT 'balanced',
    "apiKey" TEXT,
    "webhookUrl" TEXT,
    "emailReports" BOOLEAN NOT NULL DEFAULT false,
    "autoCleanupDays" INTEGER NOT NULL DEFAULT 0,
    "terminalTheme" TEXT NOT NULL DEFAULT 'bright',
    "accentColor" TEXT NOT NULL DEFAULT '#60a5fa',
    "terminalFont" TEXT NOT NULL DEFAULT 'jetbrains',
    "themeFont" TEXT NOT NULL DEFAULT 'noto',
    "language" TEXT NOT NULL DEFAULT 'en',
    CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_UserSettings" ("accentColor", "analysisStrictness", "apiKey", "autoCleanupDays", "emailReports", "exclusions", "id", "language", "llmModel", "requestDelay", "terminalFont", "terminalTheme", "themeFont", "timeout", "userId", "webhookUrl") SELECT "accentColor", "analysisStrictness", "apiKey", "autoCleanupDays", "emailReports", "exclusions", "id", "language", "llmModel", "requestDelay", "terminalFont", "terminalTheme", "themeFont", "timeout", "userId", "webhookUrl" FROM "UserSettings";
DROP TABLE "UserSettings";
ALTER TABLE "new_UserSettings" RENAME TO "UserSettings";
CREATE UNIQUE INDEX "UserSettings_userId_key" ON "UserSettings"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_id_idx" ON "Session"("id");
