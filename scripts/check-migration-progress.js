#!/usr/bin/env node

/**
 * TypeScript Migration Progress Checker
 * 
 * Analyzes the TypeScript migration progress by checking:
 * - Task completion status from tasks.md
 * - File migration status (JS → TS)
 * - Type coverage statistics
 * - Configuration completeness
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const TASKS_FILE = path.join(PROJECT_ROOT, 'specs/005-typescript-migration/tasks.md');
const APP_DIR = path.join(PROJECT_ROOT, 'app/src');
const SERVER_DIR = path.join(PROJECT_ROOT, 'server/src');
const SHARED_DIR = path.join(PROJECT_ROOT, 'shared');

console.log('📊 TypeScript Migration Progress Report\n');
console.log('=' .repeat(50));

/**
 * Parse tasks.md file to extract task completion status
 */
function parseTasksFile() {
  if (!fs.existsSync(TASKS_FILE)) {
    console.log('❌ Tasks file not found:', TASKS_FILE);
    return { total: 0, completed: 0, tasks: [] };
  }

  const content = fs.readFileSync(TASKS_FILE, 'utf8');
  const lines = content.split('\n');
  
  const tasks = [];
  let total = 0;
  let completed = 0;

  for (const line of lines) {
    // Match task lines: - [x] T001 or - [ ] T001
    const taskMatch = line.match(/^- \[([ x])\] (T\d+)/);
    if (taskMatch) {
      const isCompleted = taskMatch[1] === 'x';
      const taskId = taskMatch[2];
      const description = line.replace(/^- \[([ x])\] T\d+\s*/, '');
      
      tasks.push({
        id: taskId,
        completed: isCompleted,
        description: description
      });
      
      total++;
      if (isCompleted) completed++;
    }
  }

  return { total, completed, tasks };
}

/**
 * Count files by extension in a directory
 */
function countFilesByExtension(dir, extensions) {
  if (!fs.existsSync(dir)) {
    return {};
  }

  const counts = {};
  extensions.forEach(ext => counts[ext] = 0);

  function scanDirectory(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        scanDirectory(fullPath);
      } else if (stat.isFile()) {
        const ext = path.extname(item);
        if (extensions.includes(ext)) {
          counts[ext]++;
        }
      }
    }
  }

  scanDirectory(dir);
  return counts;
}

/**
 * Check TypeScript configuration status
 */
function checkTypeScriptConfig() {
  const configs = [
    { name: 'Root tsconfig', path: path.join(PROJECT_ROOT, 'tsconfig.json') },
    { name: 'App tsconfig', path: path.join(PROJECT_ROOT, 'app/tsconfig.json') },
    { name: 'Server tsconfig', path: path.join(PROJECT_ROOT, 'server/tsconfig.json') }
  ];

  const status = {};
  
  for (const config of configs) {
    status[config.name] = fs.existsSync(config.path);
  }

  return status;
}

/**
 * Check shared types status
 */
function checkSharedTypes() {
  const sharedFiles = [
    'shared/types/index.ts',
    'shared/types/common.ts',
    'shared/types/market.ts'
  ];

  const status = {};
  
  for (const file of sharedFiles) {
    const fullPath = path.join(PROJECT_ROOT, file);
    status[file] = fs.existsSync(fullPath);
  }

  return status;
}

/**
 * Try to run TypeScript compilation check
 */
function checkTypeScriptCompilation() {
  const results = {};
  
  try {
    execSync('cd ' + PROJECT_ROOT + '/server && tsc --noEmit', { stdio: 'pipe' });
    results.server = '✅ Success';
  } catch (error) {
    results.server = '❌ Failed';
  }

  try {
    execSync('cd ' + PROJECT_ROOT + '/app && tsc --noEmit --allowJs --skipLibCheck', { stdio: 'pipe' });
    results.app = '✅ Success';
  } catch (error) {
    results.app = '❌ Failed';
  }

  return results;
}

/**
 * Main execution
 */
function main() {
  // 1. Task Progress
  console.log('📋 Task Progress');
  console.log('-'.repeat(30));
  
  const taskStatus = parseTasksFile();
  const completionRate = taskStatus.total > 0 ? (taskStatus.completed / taskStatus.total * 100).toFixed(1) : 0;
  
  console.log(`Total Tasks: ${taskStatus.total}`);
  console.log(`Completed: ${taskStatus.completed}`);
  console.log(`Progress: ${completionRate}%`);
  console.log(`Status: ${'█'.repeat(Math.floor(completionRate / 5))}${'░'.repeat(20 - Math.floor(completionRate / 5))} ${completionRate}%`);
  
  // Show recent tasks
  if (taskStatus.tasks.length > 0) {
    console.log('\n📝 Recent Tasks:');
    const recentTasks = taskStatus.tasks.slice(-5);
    for (const task of recentTasks) {
      const status = task.completed ? '✅' : '⏳';
      console.log(`  ${status} ${task.id}: ${task.description.substring(0, 60)}${task.description.length > 60 ? '...' : ''}`);
    }
  }

  // 2. File Migration Status
  console.log('\n\n📁 File Migration Status');
  console.log('-'.repeat(30));
  
  const appFiles = countFilesByExtension(APP_DIR, ['.js', '.ts', '.vue']);
  const serverFiles = countFilesByExtension(SERVER_DIR, ['.js', '.ts']);
  
  console.log('Frontend (app/src/):');
  console.log(`  JavaScript: ${appFiles['.js'] || 0} files`);
  console.log(`  TypeScript: ${appFiles['.ts'] || 0} files`);
  console.log(`  Vue: ${appFiles['.vue'] || 0} files`);
  
  console.log('\nBackend (server/src/):');
  console.log(`  JavaScript: ${serverFiles['.js'] || 0} files`);
  console.log(`  TypeScript: ${serverFiles['.ts'] || 0} files`);

  // 3. Configuration Status
  console.log('\n\n⚙️  Configuration Status');
  console.log('-'.repeat(30));
  
  const configStatus = checkTypeScriptConfig();
  for (const [name, exists] of Object.entries(configStatus)) {
    console.log(`  ${exists ? '✅' : '❌'} ${name}`);
  }

  // 4. Shared Types Status
  console.log('\n\n🔗 Shared Types Status');
  console.log('-'.repeat(30));
  
  const sharedStatus = checkSharedTypes();
  for (const [file, exists] of Object.entries(sharedStatus)) {
    console.log(`  ${exists ? '✅' : '❌'} ${file}`);
  }

  // 5. Compilation Status
  console.log('\n\n🔨 Compilation Status');
  console.log('-'.repeat(30));
  
  const compilationStatus = checkTypeScriptCompilation();
  for (const [target, status] of Object.entries(compilationStatus)) {
    console.log(`  ${target}: ${status}`);
  }

  // 6. Next Steps
  console.log('\n\n🎯 Next Steps');
  console.log('-'.repeat(30));
  
  if (completionRate < 100) {
    const incompleteTasks = taskStatus.tasks.filter(task => !task.completed).slice(0, 3);
    if (incompleteTasks.length > 0) {
      console.log('Upcoming tasks:');
      for (const task of incompleteTasks) {
        console.log(`  ⏳ ${task.id}: ${task.description.substring(0, 60)}${task.description.length > 60 ? '...' : ''}`);
      }
    }
  } else {
    console.log('🎉 All tasks completed! TypeScript migration is done.');
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 Migration Progress Report Complete\n');
}

// Run the script
main();