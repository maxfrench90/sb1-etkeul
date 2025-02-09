import { readFileSync } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import { errorMonitor } from '../src/lib/monitoring';

const execAsync = promisify(exec);

interface DependencyCheck {
  name: string;
  currentVersion: string;
  latestVersion: string;
  isOutdated: boolean;
  hasVulnerabilities: boolean;
  peerDependencyIssues: string[];
}

async function checkDependencies() {
  try {
    // Read package.json
    const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
    const checks: DependencyCheck[] = [];

    // Check for version ranges
    const hasRanges = Object.values({
      ...pkg.dependencies,
      ...pkg.devDependencies
    }).some(version => version.startsWith('^') || version.startsWith('~'));

    if (hasRanges) {
      console.error('❌ Found version ranges. All dependencies must use exact versions.');
      process.exit(1);
    }

    // Run npm audit
    const { stdout: auditOutput } = await execAsync('npm audit --json');
    const auditResult = JSON.parse(auditOutput);
    
    if (auditResult.metadata.vulnerabilities.total > 0) {
      console.error('❌ Security vulnerabilities found:', auditResult.metadata.vulnerabilities);
      process.exit(1);
    }

    // Check outdated packages
    const { stdout: outdatedOutput } = await execAsync('npm outdated --json');
    const outdatedPackages = JSON.parse(outdatedOutput);

    // Check peer dependencies
    const { stdout: peerOutput } = await execAsync('npm ls --json');
    const peerResult = JSON.parse(peerOutput);

    // Analyze each dependency
    for (const [name, info] of Object.entries(outdatedPackages)) {
      const check: DependencyCheck = {
        name,
        currentVersion: info.current,
        latestVersion: info.latest,
        isOutdated: info.current !== info.latest,
        hasVulnerabilities: auditResult.advisories?.[name] !== undefined,
        peerDependencyIssues: []
      };

      // Check peer dependency issues
      if (peerResult.problems) {
        check.peerDependencyIssues = peerResult.problems
          .filter(problem => problem.includes(name))
          .map(problem => problem.replace(/^(peer dep|invalid):\s+/, ''));
      }

      checks.push(check);
    }

    // Log results
    console.log('\n📦 Dependency Check Results:\n');
    
    if (checks.length === 0) {
      console.log('✅ All dependencies are up to date and secure!');
    } else {
      checks.forEach(check => {
        console.log(`\n${check.name}:`);
        console.log(`  Current: ${check.currentVersion}`);
        console.log(`  Latest:  ${check.latestVersion}`);
        console.log(`  Status:  ${check.isOutdated ? '🔄 Outdated' : '✅ Up to date'}`);
        console.log(`  Security: ${check.hasVulnerabilities ? '❌ Vulnerabilities found' : '✅ Secure'}`);
        
        if (check.peerDependencyIssues.length > 0) {
          console.log('  Peer Dependency Issues:');
          check.peerDependencyIssues.forEach(issue => {
            console.log(`    - ${issue}`);
          });
        }
      });
    }

    // Log to monitoring system
    await errorMonitor.logSuccess({
      operation: 'dependency.check',
      attempts: 1,
      duration: 0,
      context: {
        totalDependencies: Object.keys(pkg.dependencies || {}).length + 
                          Object.keys(pkg.devDependencies || {}).length,
        outdatedCount: checks.filter(c => c.isOutdated).length,
        vulnerableCount: checks.filter(c => c.hasVulnerabilities).length
      }
    });

    // Exit with error if there are vulnerabilities
    if (checks.some(c => c.hasVulnerabilities)) {
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Dependency check failed:', error);
    
    await errorMonitor.logError({
      operation: 'dependency.check',
      error: error instanceof Error ? error.message : 'Dependency check failed',
      severity: 'high',
      timestamp: new Date().toISOString()
    });
    
    process.exit(1);
  }
}

checkDependencies();