/**
 * Runs all backend integration test scripts sequentially.
 */
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TEST_SUITES, TEST_TYPES } from '../constants/testCatalog.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const scriptsDir = path.join(__dirname);

const integrationSuites = TEST_SUITES.filter((suite) => suite.type === TEST_TYPES.INTEGRATION);

const runScript = (scriptName) =>
  new Promise((resolve) => {
    const startedAt = Date.now();
    const child = spawn(process.execPath, [path.join(scriptsDir, scriptName)], {
      stdio: 'inherit',
      env: { ...process.env, DISABLE_GPS_SIMULATOR: 'true' },
      shell: process.platform === 'win32',
    });

    child.on('close', (code) => {
      resolve({
        script: scriptName,
        status: code === 0 ? 'passed' : 'failed',
        exitCode: code ?? 1,
        durationMs: Date.now() - startedAt,
      });
    });
  });

const runAll = async () => {
  console.log('\n========================================');
  console.log(' Fleet Management — Full Integration Test Run');
  console.log('========================================\n');

  const results = [];

  for (const suite of integrationSuites) {
    console.log(`\n--- Running ${suite.name} (${suite.script}) ---\n`);
    const result = await runScript(suite.script);
    results.push({ ...suite, ...result });
  }

  const passed = results.filter((r) => r.status === 'passed').length;
  const failed = results.filter((r) => r.status === 'failed').length;

  console.log('\n========================================');
  console.log(' Integration Test Summary');
  console.log('========================================');
  results.forEach((result) => {
    console.log(`${result.status === 'passed' ? 'PASS' : 'FAIL'} — ${result.name} (${result.durationMs}ms)`);
  });
  console.log(`\nTotal: ${results.length} | Passed: ${passed} | Failed: ${failed}\n`);

  process.exit(failed > 0 ? 1 : 0);
};

runAll().catch((error) => {
  console.error('Test runner failed:', error);
  process.exit(1);
});
