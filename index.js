#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const command = process.argv[2]; // 'split' or 'join'
const filePath = process.argv[3]; // The file or base name
const CHUNK_SIZE = 50 * 1024 * 1024; // 50MB

// Help Menu
if (command === "--help" || command === "-h" || !command || !filePath) {
  console.log(`
    Zip Tool CLI - Split & Join files for GitHub
    
    Usage:
      zip-tool split <filename>   (Splits into 50MB chunks)
      zip-tool join <filename>    (Joins chunks back into original file)
      
    Example:
      zip-tool split archive.zip
    `);
  process.exit(0);
}

if (!command || !filePath) {
  console.error("Usage: node index.js [split|join] [filename]");
  process.exit(1);
}

if (command === "split") {
  if (!fs.existsSync(filePath)) {
    console.error(`Error: File ${filePath} not found.`);
    process.exit(1);
  }

  const stats = fs.statSync(filePath);
  const fd = fs.openSync(filePath, "r");
  const buffer = Buffer.alloc(CHUNK_SIZE);
  let bytesRead = 0;
  let chunkIndex = 1;

  console.log(`Splitting ${filePath}...`);

  while ((bytesRead = fs.readSync(fd, buffer, 0, CHUNK_SIZE, null)) > 0) {
    const chunkName = `${filePath}.part.${chunkIndex}`;
    // Only write the actual bytes read (important for the last chunk)
    fs.writeFileSync(chunkName, buffer.slice(0, bytesRead));
    console.log(`Created: ${chunkName}`);
    chunkIndex++;
  }

  fs.closeSync(fd);
  console.log("Split complete!");
} else if (command === "join") {
  // Look for files starting with the name and ending in .part.1, .part.2...
  const dir = path.dirname(filePath);
  const baseName = path.basename(filePath);

  const parts = fs
    .readdirSync(dir || ".")
    .filter((fn) => fn.startsWith(baseName + ".part."))
    .sort((a, b) => {
      return parseInt(a.split(".part.")[1]) - parseInt(b.split(".part.")[1]);
    });

  if (parts.length === 0) {
    console.error(`No parts found for ${filePath}`);
    process.exit(1);
  }

  const writeStream = fs.createWriteStream(filePath);

  console.log(`Joining ${parts.length} parts into ${filePath}...`);

  parts.forEach((part) => {
    const partPath = dir ? path.join(dir, part) : part;
    const data = fs.readFileSync(partPath);
    writeStream.write(data);
    console.log(`Processed: ${part}`);
  });

  writeStream.end();
  console.log("Join complete! File restored.");
} else {
  console.error('Invalid command. Use "split" or "join".');
}
