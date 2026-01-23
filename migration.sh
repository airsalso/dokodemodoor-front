#!/bin/bash

# =================================================================
# DokodemoDoor Internal Network Migration Packager
# =================================================================
# Description: Automates the process of building and packaging the
#              project for deployment in air-gapped environments.
# =================================================================

set -e # Exit on error

# Configuration
VERSION=$(date +%Y%m%d_%H%M%S)
PACKAGE_NAME="dokodemodoor_offline_$VERSION.tar.gz"
STANDALONE_DIR=".next/standalone"
OUTPUT_FILE="../../$PACKAGE_NAME"

echo "🚀 Starting migration packaging (Version: $VERSION)..."

# 1. Clean up previous builds
echo "🧹 Cleaning up old build files..."
rm -rf .next
rm -f dokodemodoor_offline_*.tar.gz

# 2. Build the project
echo "🛠️ Building Next.js application (standalone mode)..."
npm install
npx prisma generate
npm run build

# 3. Preparation for offline deployment
# The standalone output doesn't include 'public' and 'static' by default.
# We need to manually copy them into the standalone directory.
echo "copying static assets into standalone folder..."
cp -r public "$STANDALONE_DIR/"
cp -r .next/static "$STANDALONE_DIR/.next/"

# 4. Copy Database and Prisma assets
# Prisma is needed if you want to use the Prisma CLI in the internal network,
# though 'server.js' usually handles the connection.
echo "📦 Including database and prisma schema..."
cp -r prisma "$STANDALONE_DIR/"
cp -f .env "$STANDALONE_DIR/.env.example" # Provide template, don't leak secrets if not intended

# 5. Create the package
echo "📦 Creating compressed archive: $PACKAGE_NAME..."
cd "$STANDALONE_DIR"
tar -czf "$OUTPUT_FILE" .

echo "--------------------------------------------------------"
echo "✅ Packaging Complete!"
echo "📦 Artifact: $PACKAGE_NAME"
echo "📂 Location: $(pwd)/$OUTPUT_FILE"
echo "--------------------------------------------------------"
echo "How to deploy in the internal network:"
echo "1. Transfer $PACKAGE_NAME to the internal server."
echo "2. Extract: tar -xzvf $PACKAGE_NAME"
echo "3. Run: PORT=3000 node server.js"
echo "--------------------------------------------------------"
