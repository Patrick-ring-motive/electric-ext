#!/bin/bash
set -e

echo "🔍 Checking code..."
npm run check

echo ""
echo "� Bumping version..."
npm version patch --no-git-tag-version

VERSION=$(node -p "require('./package.json').version")
echo "   Version: $VERSION"

echo ""
echo "🗑️  Removing old vsix..."
rm -f electric-color-*.vsix

echo ""
echo "📦 Building vsix..."
npm run package

echo ""
echo "✅ Done! Package ready."
ls -lh electric-color-*.vsix

