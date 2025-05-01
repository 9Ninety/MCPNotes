import fs from 'node:fs/promises';
import path from 'node:path';
export async function getVersion() {
  const packagePath = path.resolve(import.meta.dir, '../../package.json');
  const packageJSON = await fs.readFile(packagePath, 'utf-8');
  const { version } = JSON.parse(packageJSON);
  
  return version;
}