-- CreateTable
CREATE TABLE "ScanReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scanId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ScanReport_scanId_fkey" FOREIGN KEY ("scanId") REFERENCES "Scan" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "repoUrl" TEXT,
    "localPath" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Project" ("createdAt", "description", "id", "localPath", "name", "repoUrl", "updatedAt") SELECT "createdAt", "description", "id", "localPath", "name", "repoUrl", "updatedAt" FROM "Project";
DROP TABLE "Project";
ALTER TABLE "new_Project" RENAME TO "Project";
CREATE UNIQUE INDEX "Project_name_key" ON "Project"("name");
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
    "terminalTheme" TEXT NOT NULL DEFAULT 'monokai',
    "accentColor" TEXT NOT NULL DEFAULT '#8b5cf6',
    "terminalFont" TEXT NOT NULL DEFAULT 'var(--font-mono), ''JetBrains Mono'', ''Fira Code'', ''Menlo'', ''Monaco'', ''Consolas'', ''Liberation Mono'', ''Courier New'', monospace',
    "themeFont" TEXT NOT NULL DEFAULT 'var(--font-outfit), var(--font-inter), sans-serif',
    "language" TEXT NOT NULL DEFAULT 'en',
    CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_UserSettings" ("accentColor", "analysisStrictness", "apiKey", "autoCleanupDays", "emailReports", "exclusions", "id", "language", "llmModel", "requestDelay", "terminalTheme", "timeout", "userId", "webhookUrl") SELECT "accentColor", "analysisStrictness", "apiKey", "autoCleanupDays", "emailReports", "exclusions", "id", "language", "llmModel", "requestDelay", "terminalTheme", "timeout", "userId", "webhookUrl" FROM "UserSettings";
DROP TABLE "UserSettings";
ALTER TABLE "new_UserSettings" RENAME TO "UserSettings";
CREATE UNIQUE INDEX "UserSettings_userId_key" ON "UserSettings"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
