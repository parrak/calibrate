const fs = require('fs');
const path = require('path');

function fixTrailingSpaces(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory()) {
      // Skip node_modules, .next, dist, etc.
      if (!['node_modules', '.next', 'dist', 'build', 'out', '.git'].includes(file.name)) {
        fixTrailingSpaces(fullPath);
      }
    } else if (file.isFile() && /\.(ts|tsx|js|jsx)$/.test(file.name)) {
      try {
        let content = fs.readFileSync(fullPath, 'utf8');
        const originalContent = content;
        
        // Remove trailing spaces from each line
        content = content.split('\n').map(line => line.replace(/[ \t]+$/, '')).join('\n');
        
        if (content !== originalContent) {
          fs.writeFileSync(fullPath, content, 'utf8');
          console.log(`Fixed: ${fullPath}`);
        }
      } catch (err) {
        console.error(`Error processing ${fullPath}:`, err.message);
      }
    }
  }
}

// Fix trailing spaces in apps/api and apps/console
if (process.argv[2]) {
  fixTrailingSpaces(process.argv[2]);
} else {
  fixTrailingSpaces(path.join(__dirname, '../apps/api'));
  fixTrailingSpaces(path.join(__dirname, '../apps/console'));
}

