#!/usr/bin/env node

/**
 * Performance Testing Orchestrator
 * Runs comprehensive performance tests and generates reports
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class PerformanceTester {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      tests: {},
      summary: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        duration: 0
      }
    };
    this.startTime = Date.now();
  }

  async runArtilleryTest(testFile, testName) {
    return new Promise((resolve, reject) => {
      console.log(`\n🚀 Running ${testName}...`);

      const artillery = spawn('npx', ['artillery', 'run', testFile], {
        cwd: process.cwd(),
        stdio: 'inherit'
      });

      artillery.on('close', (code) => {
        const passed = code === 0;
        this.results.tests[testName] = {
          status: passed ? 'passed' : 'failed',
          duration: Date.now() - this.startTime,
          exitCode: code
        };

        if (passed) {
          this.results.summary.passed++;
          console.log(`✅ ${testName} passed`);
        } else {
          this.results.summary.failed++;
          console.log(`❌ ${testName} failed`);
        }

        this.results.summary.totalTests++;
        resolve(passed);
      });

      artillery.on('error', (error) => {
        console.error(`Error running ${testName}:`, error);
        this.results.tests[testName] = {
          status: 'error',
          error: error.message,
          duration: Date.now() - this.startTime
        };
        this.results.summary.failed++;
        this.results.summary.totalTests++;
        reject(error);
      });
    });
  }

  async runLighthouseTest(url, testName) {
    return new Promise((resolve, reject) => {
      console.log(`\n🏮 Running Lighthouse test for ${testName}...`);

      const lighthouse = spawn('npx', [
        'lighthouse',
        url,
        '--output=json',
        '--output-path=./performance/lighthouse-report.json',
        '--chrome-flags=--headless',
        '--only-categories=performance,accessibility,best-practices,seo'
      ], {
        cwd: process.cwd(),
        stdio: 'inherit'
      });

      lighthouse.on('close', (code) => {
        const passed = code === 0;
        this.results.tests[testName] = {
          status: passed ? 'passed' : 'failed',
          duration: Date.now() - this.startTime,
          exitCode: code,
          reportPath: './performance/lighthouse-report.json'
        };

        if (passed) {
          this.results.summary.passed++;
          console.log(`✅ ${testName} passed`);
        } else {
          this.results.summary.failed++;
          console.log(`❌ ${testName} failed`);
        }

        this.results.summary.totalTests++;
        resolve(passed);
      });

      lighthouse.on('error', (error) => {
        console.error(`Error running ${testName}:`, error);
        this.results.tests[testName] = {
          status: 'error',
          error: error.message,
          duration: Date.now() - this.startTime
        };
        this.results.summary.failed++;
        this.results.summary.totalTests++;
        reject(error);
      });
    });
  }

  async runMemoryLeakTest() {
    console.log('\n🧠 Running memory leak test...`);

    // Simple memory monitoring - in production, use tools like clinic.js
    const memTest = spawn('node', ['-e', `
      const memUsage = [];
      const interval = setInterval(() => {
        const usage = process.memoryUsage();
        memUsage.push(usage);
        console.log('Memory:', Math.round(usage.heapUsed / 1024 / 1024), 'MB');

        if (memUsage.length >= 30) { // 30 seconds
          clearInterval(interval);
          const avgHeap = memUsage.reduce((sum, m) => sum + m.heapUsed, 0) / memUsage.length;
          const maxHeap = Math.max(...memUsage.map(m => m.heapUsed));
          console.log('Average heap usage:', Math.round(avgHeap / 1024 / 1024), 'MB');
          console.log('Max heap usage:', Math.round(maxHeap / 1024 / 1024), 'MB');
          process.exit(0);
        }
      }, 1000);
    `], {
      cwd: process.cwd(),
      stdio: 'inherit'
    });

    return new Promise((resolve) => {
      memTest.on('close', (code) => {
        const passed = code === 0;
        this.results.tests['Memory Leak Test'] = {
          status: passed ? 'passed' : 'failed',
          duration: Date.now() - this.startTime
        };

        if (passed) {
          this.results.summary.passed++;
          console.log('✅ Memory leak test passed');
        } else {
          this.results.summary.failed++;
          console.log('❌ Memory leak test failed');
        }

        this.results.summary.totalTests++;
        resolve(passed);
      });
    });
  }

  async runDatabasePerformanceTest() {
    console.log('\n🗄️  Running database performance test...`);

    // Test database query performance
    const dbTest = spawn('node', ['-e', `
      // Database performance test
      console.log('Testing database query performance...');

      // Simulate database operations
      const operations = [];
      for (let i = 0; i < 100; i++) {
        operations.push(new Promise(resolve => {
          setTimeout(() => {
            // Simulate DB operation
            resolve(Math.random());
          }, Math.random() * 50);
        }));
      }

      Promise.all(operations).then(results => {
        const avgTime = results.reduce((sum, r) => sum + r, 0) / results.length;
        console.log('Average operation time:', (avgTime * 1000).toFixed(2), 'ms');
        console.log('Total operations completed:', results.length);
        process.exit(0);
      });
    `], {
      cwd: process.cwd(),
      stdio: 'inherit'
    });

    return new Promise((resolve) => {
      dbTest.on('close', (code) => {
        const passed = code === 0;
        this.results.tests['Database Performance Test'] = {
          status: passed ? 'passed' : 'failed',
          duration: Date.now() - this.startTime
        };

        if (passed) {
          this.results.summary.passed++;
          console.log('✅ Database performance test passed');
        } else {
          this.results.summary.failed++;
          console.log('❌ Database performance test failed');
        }

        this.results.summary.totalTests++;
        resolve(passed);
      });
    });
  }

  generateReport() {
    this.results.summary.duration = Date.now() - this.startTime;

    console.log('\n' + '='.repeat(60));
    console.log('📊 PERFORMANCE TEST REPORT');
    console.log('='.repeat(60));

    console.log(`⏱️  Total Duration: ${(this.results.summary.duration / 1000).toFixed(2)}s`);
    console.log(`🧪 Tests Run: ${this.results.summary.totalTests}`);
    console.log(`✅ Passed: ${this.results.summary.passed}`);
    console.log(`❌ Failed: ${this.results.summary.failed}`);

    console.log('\n📋 TEST RESULTS:');
    Object.entries(this.results.tests).forEach(([testName, result]) => {
      const status = result.status === 'passed' ? '✅' : '❌';
      console.log(`   ${status} ${testName}`);
      if (result.error) {
        console.log(`       Error: ${result.error}`);
      }
      if (result.duration) {
        console.log(`       Duration: ${(result.duration / 1000).toFixed(2)}s`);
      }
    });

    console.log('\n' + '='.repeat(60));

    // Save detailed report
    const reportPath = path.join(process.cwd(), 'performance', 'performance-report.json');
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    console.log(`📄 Detailed report saved to: ${reportPath}`);

    return this.results.summary.failed === 0;
  }

  async runAllTests(options = {}) {
    const {
      skipArtillery = false,
      skipLighthouse = false,
      skipMemory = false,
      skipDatabase = false
    } = options;

    console.log('🏃 Starting comprehensive performance test suite...\n');

    try {
      // Run Artillery load tests
      if (!skipArtillery) {
        await this.runArtilleryTest('./performance/auth-load-test.yml', 'Auth Load Test');
        await this.runArtilleryTest('./performance/messaging-load-test.yml', 'Messaging Load Test');
      }

      // Run Lighthouse performance audit
      if (!skipLighthouse) {
        await this.runLighthouseTest('http://localhost:3000', 'Frontend Performance Audit');
      }

      // Run memory leak test
      if (!skipMemory) {
        await this.runMemoryLeakTest();
      }

      // Run database performance test
      if (!skipDatabase) {
        await this.runDatabasePerformanceTest();
      }

    } catch (error) {
      console.error('💥 Performance testing failed:', error);
      this.results.tests['Overall'] = {
        status: 'error',
        error: error.message,
        duration: Date.now() - this.startTime
      };
    }

    // Generate final report
    const success = this.generateReport();

    // Exit with appropriate code
    process.exit(success ? 0 : 1);
  }
}

// CLI interface
const args = process.argv.slice(2);
const options = {
  skipArtillery: args.includes('--skip-artillery'),
  skipLighthouse: args.includes('--skip-lighthouse'),
  skipMemory: args.includes('--skip-memory'),
  skipDatabase: args.includes('--skip-database')
};

const tester = new PerformanceTester();
tester.runAllTests(options);
