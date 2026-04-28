import fs from 'fs';
import path from 'path';

const imagesDir = '../assets/images';

fs.readdirSync(imagesDir).forEach(file => {
  let newName = file;
  
  // Replace non-breaking spaces and other weird whitespace
  newName = newName.replace(/[\u00A0\u1680\u180E\u2000-\u200B\u202F\u205F\u3000\uFEFF]/g, ' ');
  
  // Replace multiple spaces with single space
  newName = newName.replace(/\s+/g, ' ');
  
  // Replace 'women' with 'woman'
  if (newName.endsWith('women.png')) {
    newName = newName.replace('women.png', 'woman.png');
  }

  if (newName !== file) {
    const oldPath = path.join(imagesDir, file);
    const newPath = path.join(imagesDir, newName);
    console.log(`Renaming: "${file}" -> "${newName}"`);
    if (fs.existsSync(newPath)) {
      console.log(`Warning: ${newPath} already exists, skipping.`);
    } else {
      fs.renameSync(oldPath, newPath);
    }
  }
});
