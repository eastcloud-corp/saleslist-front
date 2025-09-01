#!/usr/bin/env python3
"""
フロントエンド→Django API統合テスト
全URLパターンでのAPI呼び出し検証
"""

import requests
import json
import time
from datetime import datetime

BASE_URL = "http://localhost:8080"
FRONTEND_URL = "http://localhost:3002"

def get_auth_token():
    """認証トークン取得"""
    response = requests.post(f"{BASE_URL}/api/v1/auth/login", json={
        "email": "user@example.com",
        "password": "password123"
    })
    if response.status_code == 200:
        return response.json()['access_token']
    return None

def test_api_endpoint(endpoint, headers, method='GET', data=None):
    """APIエンドポイントテスト"""
    try:
        full_url = f"{BASE_URL}{endpoint}"
        
        if method == 'GET':
            response = requests.get(full_url, headers=headers)
        elif method == 'POST':
            response = requests.post(full_url, headers=headers, json=data)
        
        return {
            'success': response.status_code < 300,
            'status': response.status_code,
            'size': len(response.text),
            'response_time': response.elapsed.total_seconds()
        }
    except Exception as e:
        return {
            'success': False,
            'status': 0,
            'error': str(e)
        }

def test_frontend_page(page_url):
    """フロントエンドページアクセステスト"""
    try:
        response = requests.get(f"{FRONTEND_URL}{page_url}")
        return {
            'success': response.status_code == 200,
            'status': response.status_code,
            'has_js_error': 'Error' in response.text and 'JavaScript' in response.text
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

def main():
    print("🧪 フロントエンド→Django API統合完全検証")
    print("=" * 60)
    
    # 認証トークン取得
    token = get_auth_token()
    if not token:
        print("❌ Django認証失敗")
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    print("✅ Django認証成功")
    
    # フロントエンドサーバー確認
    frontend_status = test_frontend_page("/")
    if not frontend_status['success']:
        print("❌ Next.jsサーバー応答なし")
        return
    
    print("✅ Next.jsサーバー稼働中")
    print("")
    
    # 完全URL→API マッピングテスト（全14ページ）
    url_api_mapping = [
        # 認証・ダッシュボード系
        {'page': '/login', 'apis': []},  # ログインページは表示のみ
        {'page': '/', 'apis': ['/api/v1/auth/me', '/api/v1/dashboard/stats', '/api/v1/dashboard/recent-projects', '/api/v1/dashboard/recent-companies']},
        {'page': '/dashboard', 'apis': ['/api/v1/auth/me', '/api/v1/dashboard/stats', '/api/v1/dashboard/recent-projects', '/api/v1/dashboard/recent-companies']},
        
        # クライアント系
        {'page': '/clients', 'apis': ['/api/v1/auth/me', '/api/v1/clients/', '/api/v1/master/industries/', '/api/v1/master/statuses/']},
        {'page': '/clients/new', 'apis': ['/api/v1/auth/me', '/api/v1/master/industries/', '/api/v1/master/statuses/']},
        {'page': '/clients/1', 'apis': ['/api/v1/auth/me', '/api/v1/clients/1/', '/api/v1/clients/1/stats/', '/api/v1/clients/1/ng-companies/', '/api/v1/clients/1/projects/']},
        {'page': '/clients/1/select-companies', 'apis': ['/api/v1/auth/me', '/api/v1/clients/1/', '/api/v1/companies/', '/api/v1/master/industries/']},
        
        # 企業系
        {'page': '/companies', 'apis': ['/api/v1/auth/me', '/api/v1/companies/', '/api/v1/master/industries/', '/api/v1/master/statuses/']},
        {'page': '/companies/new', 'apis': ['/api/v1/auth/me', '/api/v1/master/industries/', '/api/v1/master/prefectures/']},
        {'page': '/companies/5', 'apis': ['/api/v1/auth/me', '/api/v1/companies/5/', '/api/v1/companies/5/executives/']},
        
        # プロジェクト系
        {'page': '/projects', 'apis': ['/api/v1/auth/me', '/api/v1/projects/', '/api/v1/master/statuses/']},
        {'page': '/projects/1', 'apis': ['/api/v1/auth/me', '/api/v1/projects/1/', '/api/v1/projects/1/companies/', '/api/v1/master/statuses/']},
        {'page': '/projects/1/add-companies', 'apis': ['/api/v1/auth/me', '/api/v1/projects/1/', '/api/v1/projects/1/available-companies/', '/api/v1/master/industries/']},
        
        # 設定系
        {'page': '/settings', 'apis': ['/api/v1/auth/me', '/api/v1/auth/users/']},
    ]
    
    total_pages = len(url_api_mapping)
    total_apis = sum(len(mapping['apis']) for mapping in url_api_mapping)
    success_pages = 0
    success_apis = 0
    
    print(f"📊 テスト対象: {total_pages}ページ, {total_apis}API")
    print("")
    
    # 各ページ→API検証
    for mapping in url_api_mapping:
        page_url = mapping['page']
        expected_apis = mapping['apis']
        
        print(f"🔍 {page_url}")
        
        # フロントエンドページ確認
        page_result = test_frontend_page(page_url)
        if page_result['success']:
            success_pages += 1
            print(f"   ✅ ページ表示: {page_result['status']}")
        else:
            print(f"   ❌ ページ表示: {page_result.get('status', 'ERROR')}")
        
        # 期待されるAPI呼び出し確認
        for api in expected_apis:
            api_result = test_api_endpoint(api, headers)
            if api_result['success']:
                success_apis += 1
                print(f"   ✅ API: {api} - {api_result['status']} ({api_result['response_time']:.2f}s)")
            else:
                print(f"   ❌ API: {api} - {api_result.get('status', 'ERROR')}")
        
        print("")
    
    # 結果サマリー
    print("=" * 60)
    print(f"📊 フロントエンド→Django API統合テスト結果")
    print(f"   ページ成功: {success_pages}/{total_pages} ({(success_pages/total_pages)*100:.1f}%)")
    print(f"   API成功: {success_apis}/{total_apis} ({(success_apis/total_apis)*100:.1f}%)")
    
    if success_pages == total_pages and success_apis == total_apis:
        print("🎉 全URL→API統合テスト100%成功！")
    else:
        print(f"⚠️ {total_pages - success_pages}ページ, {total_apis - success_apis}API に問題があります")
    
    # 詳細結果をJSONで保存
    results = {
        'timestamp': datetime.now().isoformat(),
        'total_pages': total_pages,
        'total_apis': total_apis,
        'success_pages': success_pages,
        'success_apis': success_apis,
        'page_success_rate': (success_pages/total_pages)*100,
        'api_success_rate': (success_apis/total_apis)*100,
        'url_api_mapping': url_api_mapping
    }
    
    with open('frontend_api_integration_test.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    print("\n📄 詳細結果: frontend_api_integration_test.json")

if __name__ == "__main__":
    main()