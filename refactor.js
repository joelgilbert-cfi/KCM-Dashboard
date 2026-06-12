const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      if (!dirFile.includes('node_modules') && !dirFile.includes('.next')) {
        filelist = walkSync(dirFile, filelist);
      }
    } else {
      if (dirFile.endsWith('.tsx') || dirFile.endsWith('.ts')) {
        filelist.push(dirFile);
      }
    }
  });
  return filelist;
};

const replaceMap = {
  'bg-zinc-950': 'bg-background',
  'text-zinc-100': 'text-foreground',
  'bg-zinc-900': 'bg-card',
  'border-zinc-800': 'border-border',
  'text-zinc-400': 'text-muted-foreground',
  'text-zinc-500': 'text-muted-foreground',
  'bg-zinc-800': 'bg-secondary',
  'text-zinc-200': 'text-foreground',
  'text-zinc-300': 'text-foreground',
  'bg-zinc-700': 'bg-secondary-hover',
};

const regexStr = Object.keys(replaceMap).join('|');
const regex = new RegExp(`\\b(${regexStr})\\b`, 'g');

const files = walkSync(path.join(__dirname, 'app'));
const components = walkSync(path.join(__dirname, 'components'));

const allFiles = [...files, ...components];

let modifiedCount = 0;

allFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  content = content.replace(regex, (match) => replaceMap[match]);
  
  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    modifiedCount++;
    console.log(`Modified ${file}`);
  }
});

console.log(`Refactoring complete. Modified ${modifiedCount} files.`);
