-- CreateTable
CREATE TABLE "UserSettings" (
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
    "language" TEXT NOT NULL DEFAULT 'en',
    CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "UserSettings_userId_key" ON "UserSettings"("userId");
