#!/usr/bin/env ts-node

import fs from 'fs';
import path from 'path';

/**
 * Remove comments from TypeScript/JavaScript code
 * This removes both single-line (//) and multi-line (/* *\/) comments
 * while preserving URLs and other strings that contain double slashes
 */
function removeComments(content: string): string {
  let result = content;
  
  // First remove multi-line comments
  result = result.replace(/\/\*[\s\S]*?\*\//g, '');
  
  // Remove single-line comments more carefully
  // This approach processes line by line to avoid removing URLs
  const lines = result.split('\n');
  const cleanedLines: string[] = [];
  
  for (const line of lines) {
    let cleanedLine = line;
    
    // Only remove // comments that are not part of strings/URLs
    // Look for // that are not preceded by : (to avoid http://, https://)
    // and not inside quotes
    const commentIndex = cleanedLine.indexOf('//');
    
    if (commentIndex !== -1) {
      // Check if the // is part of a URL or string
      const beforeComment = cleanedLine.substring(0, commentIndex);
      
      // If // is not preceded by : (avoid URLs) and not inside quotes
      if (!beforeComment.includes('://') && 
          !isInsideQuotes(cleanedLine, commentIndex)) {
        // Remove the comment part
        cleanedLine = cleanedLine.substring(0, commentIndex).trimEnd();
      }
    }
    
    cleanedLines.push(cleanedLine);
  }
  
  result = cleanedLines.join('\n');
  
  // Remove empty lines left by comment removal
  result = result.replace(/^\s*\n/gm, '');
  
  return result;
}

/**
 * Check if a position in a string is inside quotes
 */
function isInsideQuotes(line: string, position: number): boolean {
  const textBefore = line.substring(0, position);
  const singleQuotes = (textBefore.match(/'/g) || []).length;
  const doubleQuotes = (textBefore.match(/"/g) || []).length;
  const backticks = (textBefore.match(/`/g) || []).length;
  
  // If odd number of quotes, we're inside a string
  return (singleQuotes % 2 === 1) || 
         (doubleQuotes % 2 === 1) || 
         (backticks % 2 === 1);
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