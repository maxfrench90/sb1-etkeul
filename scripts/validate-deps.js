import { readFileSync } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function validateDependencies() {
  try {
    // Read package.json
    const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
    
    // Check for exact versions
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

    // Check peer dependencies
    const { stdout: peerOutput } = await execAsync('npm ls --json');
    const peerResult = JSON.parse(peerOutput);
    
    if (peerResult.peerDependencies) {
      console.warn('⚠️ Peer dependency conflicts found. Please review:', peerResult.peerDependencies);
    }

    console.log('✅ All dependency checks passed!');
  } catch (error) {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  }
}

validateDependencies();