/**
 * patch-gradle.mjs — Patches capacitor.build.gradle to enforce Java 17 for local JDK compatibility.
 * Run: node scripts/patch-gradle.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CAPACITOR_GRADLE_PATH = path.resolve(__dirname, '../android/app/capacitor.build.gradle');

if (fs.existsSync(CAPACITOR_GRADLE_PATH)) {
  let content = fs.readFileSync(CAPACITOR_GRADLE_PATH, 'utf8');
  if (content.includes('VERSION_21')) {
    content = content.replaceAll('VERSION_21', 'VERSION_17');
    fs.writeFileSync(CAPACITOR_GRADLE_PATH, content, 'utf8');
    console.log('✅ Patched android/app/capacitor.build.gradle: VERSION_21 → VERSION_17');
  } else {
    console.log('ℹ️ android/app/capacitor.build.gradle is already using VERSION_17');
  }
} else {
  console.warn('⚠️ capacitor.build.gradle not found at:', CAPACITOR_GRADLE_PATH);
}
