#!/bin/bash

# フロントエンドエラーチェックテスト実行スクリプト

echo "🧪 フロントエンドエラーチェックテスト開始"
echo "================================================"
echo "開始時刻: $(date)"
echo ""

# 前提条件チェック
echo "🔍 前提条件確認中..."

# Next.jsサーバー確認
if curl -s http://localhost:3002 > /dev/null 2>&1; then
    echo "✅ Next.jsサーバー稼働中 (localhost:3002)"
else
    echo "❌ Next.jsサーバーが応答しません"
    echo "   起動コマンド: PORT=3002 pnpm run dev"
    exit 1
fi

# Django APIサーバー確認
if curl -s http://localhost:8080/api/v1/auth/login > /dev/null 2>&1; then
    echo "✅ Django APIサーバー稼働中 (localhost:8080)"
else
    echo "❌ Django APIサーバーが応答しません"
    echo "   コンテナ確認: docker ps | grep social-navigator"
    exit 1
fi

echo ""

# Playwright依存関係確認
if [ ! -d "node_modules/@playwright/test" ]; then
    echo "📦 Playwrightインストール中..."
    pnpm install --save-dev @playwright/test
    npx playwright install
fi

# エラーチェックテスト実行
echo "🔍 エラー検出テスト実行中..."
echo "--------------------------------"

echo "1. 総合エラー検出テスト"
npx playwright test tests/unit/error-detection.test.js --reporter=line

echo ""
echo "2. リファレンスエラーチェック"
npx playwright test tests/unit/reference-errors.test.js --reporter=line

echo ""
echo "3. 構文エラーチェック"  
npx playwright test tests/unit/syntax-errors.test.js --reporter=line

echo ""
echo "4. JavaScript実行エラーチェック"
npx playwright test tests/unit/js-errors.test.js --reporter=line

# 結果サマリー
echo ""
echo "================================================"
echo "🏁 フロントエンドエラーチェック完了 - $(date)"
echo "================================================"

echo ""
echo "📄 詳細レポート: test-results/"
echo "💡 エラー修正後、再度テストを実行してください"

echo ""
echo "🔧 個別テスト実行方法:"
echo "   npx playwright test tests/unit/error-detection.test.js"
echo "   npx playwright test tests/unit/reference-errors.test.js"
echo "   npx playwright test tests/unit/syntax-errors.test.js"
echo "   npx playwright test tests/unit/js-errors.test.js"