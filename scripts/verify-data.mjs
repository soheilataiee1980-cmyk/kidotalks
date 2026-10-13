import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { extractCourse, textInventory, literalInventory } from './extract-course.mjs';
import { readPrototype } from './prototype-reader.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const dataDirectory = path.join(root, 'data');

// Read JSON-shaped TS initializers without executing generated application code.
function readData(file) {
  const text = fs.readFileSync(file, 'utf8');
  const ast = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
  for (const statement of ast.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    const declaration = statement.declarationList.declarations.find(d => d.name.getText(ast) === 'data');
    if (declaration) {
      const expression = ts.isSatisfiesExpression(declaration.initializer)
        ? declaration.initializer.expression : declaration.initializer;
      return JSON.parse(expression.getText(ast));
    }
  }
  throw new Error(`داده پیدا نشد: ${file}`);
}

function differences(actual, expected, at = 'data', errors = []) {
  if (Object.is(actual, expected)) return errors;
  if (actual === null || expected === null || typeof actual !== 'object' || typeof expected !== 'object') {
    errors.push(`${at}: مقدار تغییر کرده یا حذف شده`); return errors;
  }
  if (Array.isArray(actual) !== Array.isArray(expected)) {
    errors.push(`${at}: نوع داده نادرست است`); return errors;
  }
  if (Array.isArray(expected) && actual.length !== expected.length) errors.push(`${at}: تعداد ${actual.length} به‌جای ${expected.length}`);
  for (const key of new Set([...Object.keys(expected), ...Object.keys(actual)])) {
    differences(actual[key], expected[key], `${at}.${key}`, errors);
  }
  return errors;
}

function audit(units, shared, expected, reference) {
  const errors = differences(units, expected.units, 'units');
  differences(shared, expected.shared, 'shared', errors);
  // Independent checks against raw prototype tables (not just regeneration).
  const raw = reference.evaluate('({COURSE,COURSE_TITLES,COURSE_EXTRA,TOYS,BODY3,U1,LEGACY_WD,SOURCE_PAGES,WORD_PICTURES,TEACH_TIPS,SIMPLE_READ})');
  differences(shared.sourceText, textInventory(reference.ast), 'sourceText', errors);
  differences(shared.sourceLiterals, literalInventory(reference.ast), 'sourceLiterals', errors);
  const warn = [];
  if (units.length !== 15 || new Set(units.map(u => u.id)).size !== 15) errors.push('باید دقیقاً ۱۵ یونیت یکتا موجود باشد.');
  for (const u of units) {
    const d = raw.COURSE[u.id];
    if (!d) { errors.push(`یونیت ناشناخته ${u.id}`); continue; }
    const titles = raw.COURSE_TITLES[u.id];
    differences([u.title.en,u.title.fa,u.icon], titles, `U${u.id}.title`, errors);
    const words = u.id === 1 ? raw.U1.ALL.map(w=>[w,raw.LEGACY_WD[w][0],null])
      : u.id === 2 ? Object.entries(raw.TOYS).map(([w,[fa,e]])=>[w,fa,e])
      : u.id === 3 ? Object.entries(raw.BODY3).map(([w,fa])=>[w,fa,null]) : d.words.split(';').map(w=>w.split('|'));
    differences(u.words.map(w=>[w.en,w.fa,w.emoji]),words,`U${u.id}.words`,errors);
    if (new Set(u.words.map(w=>w.en)).size !== u.words.length) errors.push(`U${u.id}: واژهٔ تکراری`);
    for (const pair of d.models) if (!u.models.some(m=>m.en===pair[0]&&m.fa===pair[1])) errors.push(`U${u.id}: جمله حذف شده: ${pair[0]}`);
    if (d.rule) differences(u.grammar.rules,[d.rule],`U${u.id}.rule`,errors);
    if (d.grammar) differences(u.grammar.questions.map(q=>[q.prompt,q.answer,...q.options.slice(1),q.hint]),d.grammar,`U${u.id}.grammar`,errors);
    const read = u.id < 4 ? raw.SIMPLE_READ[u.id] : d.read;
    differences(u.reading.text,read[0],`U${u.id}.reading`,errors);
    differences(u.reading.questions.map(q=>[q.prompt,...q.options]),read[1],`U${u.id}.readingQuestions`,errors);
    differences([u.writing.prompt,u.writing.sample,u.writing.mechanics],[d.write,d.sample,d.mechanic],`U${u.id}.writing`,errors);
    differences(u.extra,raw.COURSE_EXTRA[u.id]??null,`U${u.id}.extra`,errors);
    for (const [field,kind] of [['studentBook','SB'],['workbook','WB']]) {
      const refs=raw.SOURCE_PAGES[u.id][kind].map(s=>s===null?null:s.split('/').at(-1));
      differences(u.sourcePages[field],refs,`U${u.id}.${field}`,errors);
      u.sourcePages[field].forEach((file,i)=>{
        if (file===null) warn.push(`یونیت ${u.id}، ${kind}، صفحهٔ ${i+1}: مرجع در خود نمونه خالی است.`);
        else if (path.basename(file)!==file || !fs.existsSync(path.join(root,'legacy','assets','book',file))) errors.push(`مرجع کتاب نامعتبر یا گمشده: ${file}`);
      });
    }
    for (const w of u.words) {
      const source=raw.WORD_PICTURES[u.id]?.[w.en];
      differences(w.imageFile,source?source.split('/').at(-1):null,`U${u.id}.${w.en}.image`,errors);
      if(w.imageFile && (path.basename(w.imageFile)!==w.imageFile || !fs.existsSync(path.join(root,'legacy','assets','words',w.imageFile)))) errors.push(`مرجع تصویر واژه گمشده: ${w.imageFile}`);
      if(!w.emoji&&!w.svg&&!w.imageFile)errors.push(`U${u.id}.${w.en}: تصویر و ایموجی هر دو گم شده‌اند`);
    }
    if(!u.words.length||!u.models.length||!u.grammar.questions.length||!u.reading.text||!u.writing.prompt||!u.speaking.prompts.length)errors.push(`U${u.id}: بخش اصلی خالی است`);
    if(u.phonics.mode!=='alphabet'&&!u.phonics.items.length)errors.push(`U${u.id}: فونیکس خالی است`);
    for(const [name,bank] of Object.entries({grammar:u.grammar.questions,reading:u.reading.questions,...u.exerciseBanks})) {
      for(const [i,q] of bank.entries())if(!q.options.includes(q.answer))errors.push(`U${u.id}.${name}[${i}]: پاسخ در گزینه‌ها نیست`);
    }
  }
  return { errors, warnings: warn };
}

const expected = extractCourse();
const reference = readPrototype();
const unitFiles=fs.readdirSync(path.join(dataDirectory,'units')).filter(f=>f.endsWith('.ts')).sort();
const units=unitFiles.map(f=>readData(path.join(dataDirectory,'units',f)));
const shared=readData(path.join(dataDirectory,'shared.ts'));
const result=audit(units,shared,expected,reference);

if(process.argv.includes('--self-test')) {
  const mutations=[
    u=>u[0].words.pop(),
    u=>u[1].grammar.questions.pop(),
    u=>{u[2].models[0].en+='!';},
    u=>{u[3].reading.text=u[3].reading.text.replace('Milly','MILLY');},
    u=>{u[12].sourcePages.studentBook[1]='invented.webp';},
    u=>{u[14].words[0].fa='تغییر';},
  ];
  for(const mutate of mutations){const copy=structuredClone(units);mutate(copy);assert.ok(audit(copy,shared,expected,reference).errors.length,'خطای عمدی باید شناسایی شود');}
  const copy=structuredClone(shared);copy.sourceText.pop();assert.ok(audit(units,copy,expected,reference).errors.length);
  console.log('آزمون خودِ بررسی‌کننده: هر ۷ حذف یا تغییر عمدی شناسایی شد. هیچ فایل داده‌ای تغییر نکرد.');
}

const totals=units.reduce((a,u)=>a.map((n,i)=>n+[u.words.length,u.grammar.questions.length,u.models.length][i]),[0,0,0]);
const lines=[
  '# گزارش تطبیق داده‌های T3', '',
  '| یونیت | واژه | سؤال گرامر | جملهٔ نمونه |',
  '|---|---:|---:|---:|',
  ...units.map(u=>`| ${u.id} | ${u.words.length} | ${u.grammar.questions.length} | ${u.models.length} |`),
  `| مجموع | ${totals.join(' | ')} |`, '',
  `خطای انتقال: ${result.errors.length}`,
  `قطعهٔ متن اصلی حفظ‌شده: ${shared.sourceText.length}`,
  `ساختار ثابت اصلی حفظ‌شده: ${shared.sourceLiterals.length}`, '',
  'جمله‌ها بر اساس جفت متن انگلیسی/فارسی شمرده شده‌اند؛ نسخه‌های قدیمی نیز حفظ شده‌اند.',
  'گرامر یونیت ۲ شامل پرسش‌وپاسخ مالکیت و یونیت ۳ شامل مفرد/جمع است.',
  'واژه‌های یونیت ۱ و ۳ در نمونه SVG دارند، نه ایموجی؛ مقدار emoji برای آن‌ها null است.',
  'برای یونیت‌های ۱ تا ۳ متن مستقل خواندن ورک‌بوک تعریف نشده؛ مقدار آن null است.', '',
  'کمبودهای خود نمونه:', ...result.warnings.map(w=>`- ${w}`), '',
  ...result.errors.slice(0,60).map(e=>`- خطا: ${e}`),
  `SHA-256 نمونه: ${createHash('sha256').update(reference.html).digest('hex')}`, '',
];
console.log(lines.join('\n'));
if(process.argv.includes('--write-report'))fs.writeFileSync(path.join(dataDirectory,'verification-report.md'),lines.join('\n'));
if(result.errors.length)process.exitCode=1;
