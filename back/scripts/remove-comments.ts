#!/usr/bin/env ts-node

import fs from 'fs';
import path from 'path';

/**
 * Remove comments from TypeScript/JavaScript code
 * This removes both single-line (//) and multi-line (/* *\/) comments
 */
function removeComments(content: string): string {
  // Remove single-line comments
  let result = content.replace(/\/\/.*$/gm, '');
  
  // Remove multi-line comments
  result = result.replace(/\/\*[\s\S]*?\*\//g, '');
  
  // Remove empty lines left by comment removal
  result = result.replace(/^\s*\n/gm, '');
  
  return result;
}

/**
 * Process all TypeScript files in the src directory
 */
function processDirectory(directory: string): void {
  const files = fs.readdirSync(directory, { withFileTypes: true });
  
  for (const file of files) {
    const fullPath = path.join(directory, file.name);
    
    if (file.isDirectory()) {
      // Recursively process subdirectories
      processDirectory(fullPath);
    } else if (file.isFile() && file.name.endsWith('.ts')) {
      // Process TypeScript files
      processFile(fullPath);
    }
  }
}

/**
 * Process a single file - read, remove comments, write back
 */
function processFile(filePath: string): void {
  try {
    console.log(`Processing: ${filePath}`);
    
    const content = fs.readFileSync(filePath, 'utf8');
    const cleanedContent = removeComments(content);
    
    // Write the cleaned content back to the file
    fs.writeFileSync(filePath, cleanedContent, 'utf8');
    
    console.log(`✓ Cleaned: ${filePath}`);
  } catch (error) {
    console.error(`✗ Error processing ${filePath}:`, error);
  }
}

/**
 * Main function
 */
function main(): void {
  const srcDir = path.join(__dirname, '..', 'src');
  
  if (!fs.existsSync(srcDir)) {
    console.error(`Source directory not found: ${srcDir}`);
    process.exit(1);
  }
  
  console.log('Starting comment removal from backend source files...');
  console.log(`Target directory: ${srcDir}`);
  console.log('---');
  
  processDirectory(srcDir);
  
  console.log('---');
  console.log('Comment removal completed!');
}

// Run the script
if (require.main === module) {
  main();
}