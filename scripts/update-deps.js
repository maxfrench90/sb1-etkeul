import { readFileSync, writeFileSync } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import { errorMonitor } from '../src/lib/monitoring';

const execAsync = promisify(exec);

interface UpdateResult {
  name: string;
  from: string;
  to: string;
  success: boolean;
  error?: string;
}

async function updateDependencies() {
  try {
    // Read current package.json
    const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
    const results: UpdateResult[] = [];

    // Get outdated packages
    const { stdout: outdatedOutput } = await execAsync('npm outdated --json');
    const outdatedPackages = JSON.parse(outdatedOutput);

    for (const [name, info] of Object.entries(outdatedPackages)) {
      try {
        // Install latest version
        await execAsync(`npm install ${name}@${info.latest} --save-exact`);

        // Run tests
        await execAsync('npm test');

        results.push({
          name,
          from: info.current,
          to: info.latest,
          success: true
        });
      } catch (error) {
        // Rollback on failure
        await execAsync(`npm install ${name}@${info.current} --save-exact`);

        results.push({
          name,
          from: info.current,
          to: info.latest,
          success: false,
          error: error instanceof Error ? error.message : 'Update failed'
        });
      }
    }

    // Log results
    console.log('\n📦 Dependency Update Results:\n');
    
    results.forEach(result => {
      console.log(`\n${result.name}:`);
      console.log(`  From: ${result.from}`);
      console.log(`  To:   ${result.to}`);
      console.log(`  Status: ${result.success ? '✅ Updated' : '❌ Failed'}`);
      if (result.error) {
        console.log(`  Error: ${result.error}`);
      }
    });

    // Log to monitoring system
    await errorMonitor.logSuccess({
      operation: 'dependency.update',
      attempts: 1,
      duration: 0,
      context: {
        totalUpdates: results.length,
        successfulUpdates: results.filter(r => r.success).length,
        failedUpdates: results.filter(r => !r.success).length
      }
    });

    // Exit with error if any updates failed
    if (results.some(r => !r.success)) {
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Dependency update failed:', error);
    
    await errorMonitor.logError({
      operation: 'dependency.update',
      error: error instanceof Error ? error.message : 'Dependency update failed',
      severity: 'high',
      timestamp: new Date().toISOString()
    });
    
    process.exit(1);
  }
}

updateDependencies();