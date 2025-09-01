#!/usr/bin/env python3
"""
フロントエンドJavaScriptエラー検出テスト
ブラウザなしでNext.jsページのJavaScriptエラーを検出
"""

import requests
import re
import json
from datetime import datetime

FRONTEND_URL = "http://localhost:3002"

def check_js_errors_in_html(page_url):
    """HTMLレスポンス内のJavaScriptエラーを検出"""
    try:
        response = requests.get(f"{FRONTEND_URL}{page_url}")
        html_content = response.text
        
        js_errors = []
        
        # エラーパターンを検出
        error_patterns = [
            r'TypeError.*Cannot read properties of undefined',
            r'ReferenceError.*is not defined', 
            r'SyntaxError.*Unexpected token',
            r'Error.*at.*\.tsx?:',
            r'Cannot read properties of null',
            r'undefined is not a function',
            r'Cannot access before initialization',
        ]
        
        for pattern in error_patterns:
            matches = re.findall(pattern, html_content, re.IGNORECASE)
            for match in matches:
                js_errors.append({
                    'type': 'JavaScript Error',
                    'pattern': pattern,
                    'match': match,
                    'page': page_url
                })
        
        # React hydration エラーも検出
        if 'Hydration failed' in html_content or 'Hydration error' in html_content:
            js_errors.append({
                'type': 'Hydration Error',
                'page': page_url
            })
        
        # Console.error 呼び出しも検出
        console_errors = re.findall(r'console\.error\([^)]*\)', html_content)
        for error in console_errors:
            js_errors.append({
                'type': 'Console Error Call',
                'error': error,
                'page': page_url
            })
        
        return {
            'success': response.status_code == 200,
            'status': response.status_code,
            'js_errors': js_errors,
            'has_js_errors': len(js_errors) > 0
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'js_errors': [],
            'has_js_errors': False
        }

def main():
    print("🔍 フロントエンドJavaScriptエラー検出テスト")
    print("=" * 60)
    
    # Next.jsサーバー確認
    frontend_status = check_js_errors_in_html("/")
    if not frontend_status['success']:
        print("❌ Next.jsサーバー応答なし")
        return
    
    print("✅ Next.jsサーバー稼働中")
    print("")
    
    # 全ページのJavaScriptエラーチェック
    test_pages = [
        '/login',
        '/',
        '/dashboard', 
        '/clients',
        '/clients/new',
        '/clients/1',
        '/clients/1/select-companies',
        '/companies',
        '/companies/new',
        '/companies/5',  # エラー報告があったページ
        '/projects',
        '/projects/1',
        '/projects/1/add-companies',
        '/settings'
    ]
    
    total_pages = len(test_pages)
    pages_with_errors = 0
    total_js_errors = 0
    all_errors = []
    
    for page_url in test_pages:
        result = check_js_errors_in_html(page_url)
        
        if result['success']:
            if result['has_js_errors']:
                pages_with_errors += 1
                total_js_errors += len(result['js_errors'])
                print(f"❌ {page_url} - {len(result['js_errors'])}個のJavaScriptエラー")
                
                for error in result['js_errors']:
                    print(f"   🚨 {error['type']}: {error.get('match', error.get('error', 'Unknown'))}")
                    all_errors.append(error)
            else:
                print(f"✅ {page_url} - JavaScriptエラー0件")
        else:
            print(f"❌ {page_url} - ページ表示エラー")
    
    print("")
    print("=" * 60)
    print(f"📊 JavaScriptエラー検出結果")
    print(f"   テスト対象: {total_pages}ページ")
    print(f"   エラー無しページ: {total_pages - pages_with_errors}")
    print(f"   エラー有りページ: {pages_with_errors}")
    print(f"   総JavaScriptエラー数: {total_js_errors}")
    
    if total_js_errors == 0:
        print("🎉 全ページでJavaScriptエラー0件達成！")
    else:
        print(f"⚠️ {total_js_errors}個のJavaScriptエラーが検出されました")
        print("\n🔧 要修正エラー一覧:")
        for error in all_errors:
            print(f"   - {error['page']}: {error['type']}")
    
    # 詳細結果をJSONで保存
    results = {
        'timestamp': datetime.now().isoformat(),
        'total_pages': total_pages,
        'pages_with_errors': pages_with_errors,
        'total_js_errors': total_js_errors,
        'error_free_rate': ((total_pages - pages_with_errors) / total_pages) * 100,
        'all_errors': all_errors
    }
    
    with open('frontend_js_errors.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    print(f"\n📄 詳細結果: frontend_js_errors.json")

if __name__ == "__main__":
    main()