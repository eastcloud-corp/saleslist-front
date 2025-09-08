const puppeteer = require('puppeteer');

/**
 * シンプルなコンソールエラー検出テスト
 */

async function testPageForErrors(url, pageName) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  const errors = [];
  const warnings = [];
  const networkErrors = [];
  
  // コンソール監視
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
      console.log(`❌ [${pageName}] Console Error: ${msg.text()}`);
    } else if (msg.type() === 'warning') {
      warnings.push(msg.text());
      console.log(`⚠️  [${pageName}] Console Warning: ${msg.text()}`);
    }
  });
  
  // ネットワークエラー監視
  page.on('response', response => {
    if (response.status() >= 500) {
      networkErrors.push(`${response.status()} ${response.url()}`);
      console.log(`🌐 [${pageName}] Network Error: ${response.status()} ${response.url()}`);
    }
  });
  
  try {
    console.log(`🔍 Testing ${pageName}: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });
    
    // 少し待機してJSが実行されるのを待つ
    await page.waitForTimeout(3000);
    
    console.log(`✅ [${pageName}] Page loaded successfully`);
    console.log(`   - Console Errors: ${errors.length}`);
    console.log(`   - Console Warnings: ${warnings.length}`);
    console.log(`   - Network Errors (5xx): ${networkErrors.length}`);
    
    await browser.close();
    
    return {
      page: pageName,
      url: url,
      errors: errors.length,
      warnings: warnings.length,
      networkErrors: networkErrors.length,
      success: errors.length === 0 && networkErrors.length === 0
    };
    
  } catch (error) {
    console.log(`💥 [${pageName}] Failed to load: ${error.message}`);
    await browser.close();
    
    return {
      page: pageName,
      url: url,
      errors: errors.length + 1,
      warnings: warnings.length,
      networkErrors: networkErrors.length,
      success: false,
      loadError: error.message
    };
  }
}

async function runAllTests() {
  console.log('🚀 Starting Console Error Detection Tests\n');
  
  const testPages = [
    { url: 'http://localhost:3007/dashboard', name: 'Dashboard' },
    { url: 'http://localhost:3007/projects', name: 'Projects List' },
    { url: 'http://localhost:3007/companies', name: 'Companies List' },
    { url: 'http://localhost:3007/clients', name: 'Clients List' },
    { url: 'http://localhost:3007/login', name: 'Login Page' },
    { url: 'http://localhost:3007/projects/6', name: 'Project Detail' },
    { url: 'http://localhost:3007/companies/2', name: 'Company Detail' }
  ];
  
  const results = [];
  
  for (const testPage of testPages) {
    const result = await testPageForErrors(testPage.url, testPage.name);
    results.push(result);
    console.log(''); // 空行
  }
  
  // サマリー
  console.log('📊 Test Summary:');
  console.log('================');
  
  let totalErrors = 0;
  let totalWarnings = 0;
  let passedTests = 0;
  
  results.forEach(result => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${result.page}`);
    if (!result.success && result.loadError) {
      console.log(`    Load Error: ${result.loadError}`);
    }
    if (result.errors > 0) {
      console.log(`    Console Errors: ${result.errors}`);
    }
    if (result.warnings > 0) {
      console.log(`    Console Warnings: ${result.warnings}`);
    }
    if (result.networkErrors > 0) {
      console.log(`    Network Errors: ${result.networkErrors}`);
    }
    
    totalErrors += result.errors;
    totalWarnings += result.warnings;
    if (result.success) passedTests++;
  });
  
  console.log('');
  console.log(`Total Tests: ${results.length}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${results.length - passedTests}`);
  console.log(`Total Console Errors: ${totalErrors}`);
  console.log(`Total Console Warnings: ${totalWarnings}`);
  
  const successRate = Math.round((passedTests / results.length) * 100);
  console.log(`Success Rate: ${successRate}%`);
  
  if (successRate >= 100) {
    console.log('\n🎉 All tests passed! No console errors detected.');
    process.exit(0);
  } else if (successRate >= 80) {
    console.log('\n⚠️  Some tests failed. Please review the errors above.');
    process.exit(1);
  } else {
    console.log('\n💥 Multiple tests failed. Critical issues detected.');
    process.exit(2);
  }
}

runAllTests().catch(console.error);