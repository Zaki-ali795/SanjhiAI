import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const trackerPath = path.join(rootDir, 'FILE_COPY_TRACKER.md');

if (!fs.existsSync(trackerPath)) {
  console.error(`Tracker file not found at: ${trackerPath}`);
  process.exit(1);
}

let content = fs.readFileSync(trackerPath, 'utf8');

// Regex to capture directory paths mentioned in checklist headers or tree if needed,
// but all files in section checklist are formatted like:
// - [ ] `path/to/file`
// or
// - [x] `path/to/file`

const fileLineRegex = /- \[(x| )\] `([^`]+)`/g;

let totalFiles = 0;
let copiedCount = 0;

const updatedContent = content.replace(fileLineRegex, (match, status, filePath) => {
  totalFiles++;
  const fullPath = path.join(rootDir, filePath);
  
  // Ensure directory exists
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const isCopied = fs.existsSync(fullPath);
  if (isCopied) {
    copiedCount++;
    return `- [x] \`${filePath}\``;
  } else {
    return `- [ ] \`${filePath}\``;
  }
});

// Calculate progress bar
const percentage = totalFiles > 0 ? Math.round((copiedCount / totalFiles) * 100) : 0;
const filledBlocks = Math.round((percentage / 100) * 20);
const emptyBlocks = 20 - filledBlocks;
const progressBar = `[${'█'.repeat(filledBlocks)}${'░'.repeat(emptyBlocks)}] ${percentage}%`;

// Replace Summary section
// ## 📊 Summary
// - **Total Files**: 230
// - **Status**: 0 / 230 Copied
// - **Progress**: `[░░░░░░░░░░░░░░░░░░░░]` 0%

let finalContent = updatedContent.replace(
  /## 📊 Summary[\s\S]*?(?=---)/,
  `## 📊 Summary\n- **Total Files**: ${totalFiles}\n- **Status**: ${copiedCount} / ${totalFiles} Copied\n- **Progress**: \`${progressBar}\` \n\n`
);

fs.writeFileSync(trackerPath, finalContent, 'utf8');

console.log(`✅ Tracker updated successfully!`);
console.log(`📊 Progress: ${copiedCount} / ${totalFiles} files copied (${percentage}%).`);
