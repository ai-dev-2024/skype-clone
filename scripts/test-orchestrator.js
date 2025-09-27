#!/usr/bin/env node

/**
 * Test Orchestration Script
 * Coordinates testing across all packages with comprehensive reporting
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const packages = [
  { name: 'backend', path: 'packages/backend', type: 'unit' },
  { name: 'web', path: 'packages/web', type: 'unit' },
  { name: 'shared', path: 'packages/shared', type: 'unit' }
];

const e2ePackages = [
  { name: 'backend', path: 'packages/backend', type: 'e2e' },
  { name: 'web', path: 'packages/web', type: 'e2e' }
];

class TestOrchestrator {
  constructor() {
    this.results = {
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        duration: 0
      },
      packages: {},
      errors: []
    };
    this.startTime = Date.now();
  }

  async runCommand(command, args, cwd, env = {}) {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        cwd,
        stdio: 'inherit',
        env: { ...process.env, ...env },
        shell: true
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve(code);
        } else {
          reject(new Error(`Command failed with exit code ${code}`));
        }
      });

      child.on('error', (error) => {
        reject(error);
      });
    });
  }

  async runPackageTests(packageInfo, testType = 'unit') {
    const { name, path: packagePath, type } = packageInfo;
    console.log(`\n🧪 Running ${testType} tests for ${name}...`);

    try {
      const testCommand = testType === 'e2e' ? 'test:e2e' : 'test';
      await this.runCommand('npm', ['run', testCommand], packagePath);

      console.log(`✅ ${name} ${testType} tests passed`);
      this.results.packages[name] = this.results.packages[name] || {};
      this.results.packages[name][testType] = { status: 'passed' };
      this.results.summary.passed++;

    } catch (error) {
      console.log(`❌ ${name} ${testType} tests failed`);
      this.results.packages[name] = this.results.packages[name] || {};
      this.results.packages[name][testType] = { status: 'failed', error: error.message };
      this.results.errors.push(`${name} ${testType}: ${error.message}`);
      this.results.summary.failed++;
    }

    this.results.summary.total++;
  }

  async runCoverageReport() {
    console.log('\n📊 Generating coverage report...');

    try {
      // Combine coverage reports from all packages
      const coverageDir = path.join(process.cwd(), 'coverage');

      if (!fs.existsSync(coverageDir)) {
        fs.mkdirSync(coverageDir, { recursive: true });
      }

      // Copy coverage reports from individual packages
      for (const packageInfo of packages) {
        const packageCoverage = path.join(packageInfo.path, 'coverage');
        if (fs.existsSync(packageCoverage)) {
          const targetDir = path.join(coverageDir, packageInfo.name);
          if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
          }

          // Copy coverage files (simplified - in real implementation use a proper merge tool)
          const coverageFiles = fs.readdirSync(packageCoverage);
          for (const file of coverageFiles) {
            if (file.endsWith('.json') || file.endsWith('.html')) {
              fs.copyFileSync(
                path.join(packageCoverage, file),
                path.join(targetDir, file)
              );
            }
          }
        }
      }

      console.log('✅ Coverage report generated');
    } catch (error) {
      console.log('⚠️  Coverage report generation failed:', error.message);
    }
  }

  async runSecurityTests() {
    console.log('\n🔒 Running security tests...');

    try {
      await this.runCommand('npm', ['audit', '--audit-level', 'moderate'], process.cwd());
      console.log('✅ Security audit passed');
    } catch (error) {
      console.log('⚠️  Security vulnerabilities found');
      this.results.errors.push(`Security: ${error.message}`);
    }
  }

  async runLinting() {
    console.log('\n🔍 Running linting...');

    try {
      await this.runCommand('npm', ['run', 'lint'], process.cwd());
      console.log('✅ Linting passed');
    } catch (error) {
      console.log('⚠️  Linting failed');
      this.results.errors.push(`Linting: ${error.message}`);
    }
  }

  generateReport() {
    const duration = Date.now() - this.startTime;
    this.results.summary.duration = duration;

    console.log('\n' + '='.repeat(60));
    console.log('📋 TEST EXECUTION REPORT');
    console.log('='.repeat(60));

    console.log(`\n⏱️  Total Duration: ${(duration / 1000).toFixed(2)}s`);
    console.log(`📊 Tests Run: ${this.results.summary.total}`);
    console.log(`✅ Passed: ${this.results.summary.passed}`);
    console.log(`❌ Failed: ${this.results.summary.failed}`);
    console.log(`⏭️  Skipped: ${this.results.summary.skipped}`);

    if (this.results.errors.length > 0) {
      console.log('\n🚨 ERRORS:');
      this.results.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }

    console.log('\n📦 PACKAGE RESULTS:');
    Object.entries(this.results.packages).forEach(([packageName, results]) => {
      console.log(`   ${packageName}:`);
      Object.entries(results).forEach(([testType, result]) => {
        const status = result.status === 'passed' ? '✅' : '❌';
        console.log(`     ${testType}: ${status}`);
        if (result.error) {
          console.log(`       Error: ${result.error}`);
        }
      });
    });

    console.log('\n' + '='.repeat(60));

    // Save detailed report to file
    const reportPath = path.join(process.cwd(), 'test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    console.log(`📄 Detailed report saved to: ${reportPath}`);

    return this.results.summary.failed === 0;
  }

  async runAllTests(options = {}) {
    const { skipE2E = false, skipSecurity = false, skipLinting = false } = options;

    console.log('🚀 Starting comprehensive test suite...\n');

    try {
      // Run linting
      if (!skipLinting) {
        await this.runLinting();
      }

      // Run unit tests for all packages
      for (const packageInfo of packages) {
        await this.runPackageTests(packageInfo, 'unit');
      }

      // Run E2E tests if not skipped
      if (!skipE2E) {
        console.log('\n🔄 Running E2E tests...');
        for (const packageInfo of e2ePackages) {
          await this.runPackageTests(packageInfo, 'e2e');
        }
      }

      // Run security tests
      if (!skipSecurity) {
        await this.runSecurityTests();
      }

      // Generate coverage report
      await this.runCoverageReport();

    } catch (error) {
      console.error('💥 Test orchestration failed:', error);
      this.results.errors.push(`Orchestration: ${error.message}`);
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
  skipE2E: args.includes('--skip-e2e'),
  skipSecurity: args.includes('--skip-security'),
  skipLinting: args.includes('--skip-linting')
};

const orchestrator = new TestOrchestrator();
orchestrator.runAllTests(options);
