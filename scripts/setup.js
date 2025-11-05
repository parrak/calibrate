#!/usr/bin/env node
/**
 * Cross-platform setup script wrapper
 * Detects the OS and runs the appropriate setup script
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const isWindows = process.platform === 'win32';
const isUnix = process.platform === 'linux' || process.platform === 'darwin' || process.platform === 'freebsd';

const scriptsDir = path.join(__dirname);

if (isWindows) {
    // Use PowerShell on Windows
    const scriptPath = path.join(scriptsDir, 'setup.ps1');
    if (!fs.existsSync(scriptPath)) {
        console.error('❌ setup.ps1 not found');
        process.exit(1);
    }
    console.log('🚀 Running setup script (PowerShell)...\n');
    try {
        execSync(`powershell -ExecutionPolicy Bypass -File "${scriptPath}"`, {
            stdio: 'inherit',
            cwd: path.join(__dirname, '..')
        });
    } catch (error) {
        process.exit(error.status || 1);
    }
} else if (isUnix) {
    // Use Bash on Unix-like systems
    const scriptPath = path.join(scriptsDir, 'setup.sh');
    if (!fs.existsSync(scriptPath)) {
        console.error('❌ setup.sh not found');
        process.exit(1);
    }
    // Make script executable
    try {
        fs.chmodSync(scriptPath, '755');
    } catch (err) {
        // Ignore if chmod fails
    }
    console.log('🚀 Running setup script (Bash)...\n');
    try {
        execSync(`bash "${scriptPath}"`, {
            stdio: 'inherit',
            cwd: path.join(__dirname, '..')
        });
    } catch (error) {
        process.exit(error.status || 1);
    }
} else {
    console.error('❌ Unsupported platform:', process.platform);
    console.error('Please run the setup script manually:');
    if (fs.existsSync(path.join(scriptsDir, 'setup.ps1'))) {
        console.error('  PowerShell: powershell -ExecutionPolicy Bypass -File scripts/setup.ps1');
    }
    if (fs.existsSync(path.join(scriptsDir, 'setup.sh'))) {
        console.error('  Bash: bash scripts/setup.sh');
    }
    process.exit(1);
}

