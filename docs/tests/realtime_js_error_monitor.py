#!/usr/bin/env python3
"""
リアルタイムJavaScriptエラー監視
Next.jsログとDjangoログからJavaScriptエラーを検出
"""

import re
import time
import requests
from datetime import datetime

def monitor_nextjs_logs():
    """Next.jsコンソールログからJavaScriptエラーを検出"""
    # 実際の方法：ブラウザ開発者ツールでコンソール監視
    print("📋 手動確認手順:")
    print("1. ブラウザで http://localhost:3002 にアクセス")
    print("2. F12 → Console タブ")
    print("3. 各ページに移動してJavaScriptエラー確認")
    print("")
    
    # 既知のエラーパターンをテスト
    pages_to_check = [
        '/companies/5',  # TypeError報告があったページ
        '/clients/1',
        '/projects/1',
        '/dashboard'
    ]
    
    print("🔍 要確認ページ:")
    for page in pages_to_check:
        print(f"   - http://localhost:3002{page}")
    
    return True

def simulate_user_actions():
    """ユーザー操作をシミュレートしてエラーを誘発"""
    test_scenarios = [
        {
            'page': '/companies/5',
            'action': '企業詳細表示',
            'error_type': 'TypeError: Cannot read properties of undefined (reading charAt)'
        },
        {
            'page': '/companies',
            'action': '企業一覧でフィルター操作',
            'error_type': 'ng_status.includes() related errors'
        }
    ]
    
    print("\n🧪 JavaScriptエラー再現テスト:")
    for scenario in test_scenarios:
        print(f"📍 {scenario['page']} - {scenario['action']}")
        print(f"   期待エラー: {scenario['error_type']}")
        
        # 実際のテスト：curlでページアクセス
        try:
            response = requests.get(f"{FRONTEND_URL}{scenario['page']}")
            if response.status_code == 200:
                print(f"   ✅ ページ表示: 200")
                # HTMLに明らかなエラーがないかチェック
                if 'Error' in response.text and 'TypeError' in response.text:
                    print(f"   🚨 HTMLにエラー表示を検出")
                else:
                    print(f"   ✅ HTMLレベルでエラーなし")
            else:
                print(f"   ❌ ページエラー: {response.status_code}")
        except Exception as e:
            print(f"   ❌ 接続エラー: {e}")
    
    print("\n💡 実際のJavaScriptエラー検出には：")
    print("   ブラウザで実際にページにアクセスしてください！")

def main():
    print("🔍 リアルタイムJavaScriptエラー監視")
    print("=" * 50)
    
    # Next.jsサーバー確認
    try:
        response = requests.get(FRONTEND_URL)
        if response.status_code == 200:
            print("✅ Next.jsサーバー稼働中")
        else:
            print(f"❌ Next.jsサーバーエラー: {response.status_code}")
            return
    except Exception as e:
        print(f"❌ Next.jsサーバー接続失敗: {e}")
        return
    
    # モニタリング実行
    monitor_nextjs_logs()
    simulate_user_actions()
    
    print("\n" + "=" * 50)
    print("⚠️  重要：この検出方法には限界があります")
    print("実際のJavaScriptエラーは、ブラウザの開発者ツールで確認が必要です")

if __name__ == "__main__":
    main()