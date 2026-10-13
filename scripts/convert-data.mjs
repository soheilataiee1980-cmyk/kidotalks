import fs from 'node:fs';
import { extractCourse } from './extract-course.mjs';

const { units, shared } = extractCourse();
const output = new URL('../data/', import.meta.url);
fs.mkdirSync(new URL('units/', output), { recursive: true });
const write = (file, value, type, relative) => fs.writeFileSync(new URL(file, output),
  `// Generated from legacy/index.html by scripts/convert-data.mjs.\nimport type { ${type} } from "${relative}";\n\nconst data = ${JSON.stringify(value, null, 2)} satisfies ${type};\n\nexport default data;\n`);
for (const unit of units) write(`units/unit-${String(unit.id).padStart(2, '0')}.ts`, unit, 'CourseUnit', '../types');
write('shared.ts', shared, 'SharedContent', './types');
fs.writeFileSync(new URL('index.ts', output),
  `import type { CourseUnit } from "./types";\n` +
  units.map(u => `import unit${u.id} from "./units/unit-${String(u.id).padStart(2, '0')}";`).join('\n') +
  `\n\nexport const courseUnits: readonly CourseUnit[] = [${units.map(u => `unit${u.id}`).join(', ')}];\nexport type * from "./types";\nexport { default as sharedContent } from "./shared";\n`);
console.log('داده‌های ۱۵ یونیت و محتوای مشترک ساخته شدند.');
