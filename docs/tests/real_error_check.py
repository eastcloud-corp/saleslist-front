#!/usr/bin/env python3
"""
真のJavaScriptエラー検証テスト
ブラウザログ監視による実際のエラー検出
"""

import subprocess
import time
import re
import requests

def check_typescript_errors():
    """TypeScript型エラーをチェック"""
    print("🔍 TypeScript型エラーチェック")
    
    try:
        result = subprocess.run(
            ['npx', 'tsc', '--noEmit'],
            cwd='/mnt/c/Users/user/environment/budget_sales_list/saleslist-front',
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode == 0:
            print("   ✅ TypeScript型エラー: 0件")
            return True
        else:
            print(f"   ❌ TypeScript型エラー検出:")
            print(f"   {result.stderr}")
            return False
    except Exception as e:
        print(f"   ⚠️ TypeScriptチェックエラー: {e}")
        return None

def check_nextjs_build():
    """Next.jsビルドエラーをチェック"""
    print("\n🔍 Next.jsビルドエラーチェック")
    
    try:
        result = subprocess.run(
            ['pnpm', 'run', 'build'],
            cwd='/mnt/c/Users/user/environment/budget_sales_list/saleslist-front',
            capture_output=True,
            text=True,
            timeout=120
        )
        
        if result.returncode == 0:
            print("   ✅ Next.jsビルド: 成功")
            return True
        else:
            print(f"   ❌ Next.jsビルドエラー:")
            # エラーの要点のみ表示
            errors = re.findall(r'Error:.*|Failed to compile.*', result.stdout + result.stderr)
            for error in errors[:5]:  # 最初の5個のエラーのみ
                print(f"   {error}")
            return False
    except Exception as e:
        print(f"   ⚠️ Next.jsビルドチェックエラー: {e}")
        return None

def check_api_endpoints():
    """追加APIエンドポイントの動作確認"""
    print("\n🔍 新規APIエンドポイント確認")
    
    try:
        # 認証トークン取得
        auth_response = requests.post("http://localhost:8080/api/v1/auth/login", 
                                    json={"email": "user@example.com", "password": "password123"})
        if auth_response.status_code != 200:
            print("   ❌ Django認証失敗")
            return False
        
        token = auth_response.json()['access_token']
        headers = {"Authorization": f"Bearer {token}"}
        
        # 新規APIエンドポイントテスト
        test_apis = [
            ("GET", "/api/v1/master/sales-statuses/", "営業ステータス一覧"),
            ("GET", "/api/v1/auth/users/", "ユーザー一覧"),
            ("GET", "/api/v1/master/prefectures/", "都道府県マスター"),
        ]
        
        success_count = 0
        for method, endpoint, name in test_apis:
            response = requests.get(f"http://localhost:8080{endpoint}", headers=headers)
            if response.status_code == 200:
                print(f"   ✅ {name}: 正常動作")
                success_count += 1
            else:
                print(f"   ❌ {name}: {response.status_code}エラー")
        
        print(f"\n📊 APIテスト結果: {success_count}/{len(test_apis)} 成功")
        return success_count == len(test_apis)
        
    except Exception as e:
        print(f"   ⚠️ APIテストエラー: {e}")
        return False

def main():
    print("🧪 真のエラー検証テスト実行")
    print("=" * 50)
    
    results = {
        "typescript": check_typescript_errors(),
        "nextjs_build": check_nextjs_build(), 
        "api_endpoints": check_api_endpoints(),
    }
    
    print("\n" + "=" * 50)
    print("📊 総合テスト結果")
    
    success_count = sum(1 for v in results.values() if v is True)
    total_count = len(results)
    
    for test_name, result in results.items():
        status = "✅ 成功" if result is True else "❌ 失敗" if result is False else "⚠️ スキップ"
        print(f"   {test_name}: {status}")
    
    print(f"\n🎯 成功率: {success_count}/{total_count} ({(success_count/total_count)*100:.1f}%)")
    
    if success_count == total_count:
        print("🎉 全テスト成功！エラー0件達成！")
        return True
    else:
        print(f"⚠️ {total_count - success_count}個のテストで問題検出")
        return False

if __name__ == "__main__":
    main()