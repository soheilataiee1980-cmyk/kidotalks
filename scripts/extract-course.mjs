import vm from 'node:vm';
import ts from 'typescript';
import { readPrototype } from './prototype-reader.mjs';

const basename = value => value === null ? null : value.split('/').at(-1);
const model = ([en, fa]) => ({ en, fa });
const question = ([prompt, answer, ...rest], hint = null) => ({ prompt, hint: rest[2] ?? hint, answer, options: [answer, ...rest.slice(0, 2)], sceneHtml: null, audio: null, answerAudio: null });
const runtimeQuestion = q => ({ prompt: null, hint: q.hint ?? null, answer: q.ok, options: q.o.map(o => o[0]), sceneHtml: q.top, optionHtml: q.o.map(o => o[1]), audio: q.say ?? null, answerAudio: q.sayOk ?? null });
const distinctModels = sets => [...new Map(sets.flatMap(s => s.sentences).map(m => [JSON.stringify(m),m])).values()];

// Every original string/template fragment is retained, including overwritten
// legacy lesson variants. This is inert source data, never evaluated by the app.
export function textInventory(ast) {
 const records=[];
 function visit(node) {
  if(ts.isStringLiteral(node)||ts.isNoSubstitutionTemplateLiteral(node)||ts.isTemplateHead(node)||ts.isTemplateMiddle(node)||ts.isTemplateTail(node)) {
   const start=node.getStart(ast);const {line,character}=ast.getLineAndCharacterOfPosition(start);
   records.push({line:line+1,column:character+1,kind:ts.SyntaxKind[node.kind],text:node.text});
  }
  ts.forEachChild(node,visit);
 }
 visit(ast);return records;
}

export function literalInventory(ast) {
 const missing=Symbol('dynamic');
 function value(node) {
  if(ts.isStringLiteralLike(node))return node.text;
  if(ts.isNumericLiteral(node))return Number(node.text);
  if(node.kind===ts.SyntaxKind.NullKeyword)return null;
  if(node.kind===ts.SyntaxKind.TrueKeyword)return true;
  if(node.kind===ts.SyntaxKind.FalseKeyword)return false;
  if(ts.isArrayLiteralExpression(node)) {const a=node.elements.map(value);return a.includes(missing)?missing:a;}
  if(ts.isObjectLiteralExpression(node)) {
   const out={};for(const prop of node.properties) {
    if(!ts.isPropertyAssignment(prop)||ts.isComputedPropertyName(prop.name))return missing;
    const v=value(prop.initializer);if(v===missing)return missing;out[prop.name.text]=v;
   }return out;
  }
  return missing;
 }
 const records=[];
 function visit(node) {
  if(ts.isArrayLiteralExpression(node)||ts.isObjectLiteralExpression(node)) {
   const data=value(node);if(data!==missing) {
    const {line,character}=ast.getLineAndCharacterOfPosition(node.getStart(ast));
    records.push({line:line+1,column:character+1,value:data});return;
   }
  }
  ts.forEachChild(node,visit);
 }
 visit(ast);return records;
}

export function extractCourse() {
 const p=readPrototype();
 vm.runInContext(`Math.random=()=>0.5; go=()=>{}; screen=html=>{globalThis.__html=html}; mc=(key,items)=>{globalThis.__bank=items};`,p.context);
 const run=code=>vm.runInContext(code,p.context,{timeout:10000});
 const raw=p.evaluate('({COURSE,COURSE_TITLES,COURSE_EXTRA,SOURCE_PAGES,WORD_PICTURES,TEACH_TIPS,SIMPLE_READ,U1,TOYS,BODY3,PH2,PH3,SENT2,LEGACY_WD,ART,BL,CT,LESSON_NAMES,CURATED,VIDEO_ORIGINAL,PHONICS_LINK,COURSE_ACTS})');
 const bank=code=>{run('globalThis.__bank=null;'+code);return p.evaluate('__bank')?.map(runtimeQuestion)??[];};
 const capture=code=>{run('globalThis.__html=null;'+code);return p.evaluate('__html');};
 const units=[];
 for(let id=1;id<=15;id++) {
  run(`selectUnit(${id},'lessons');`);
  const d=raw.COURSE[id], title=raw.COURSE_TITLES[id];
  const entries=id===1?raw.U1.ALL.map(w=>[w,raw.LEGACY_WD[w][0],null]):id===2?Object.entries(raw.TOYS).map(([w,[fa,emoji]])=>[w,fa,emoji]):id===3?Object.entries(raw.BODY3).map(([w,fa])=>[w,fa,null]):d.vocab;
  const words=entries.map(([en,fa,emoji],i)=>({en,fa,emoji,section:i<(d.first??5)?1:3,imageFile:basename(raw.WORD_PICTURES[id]?.[en]??null),svg:id<=3?(raw.ART[en]??raw.LEGACY_WD[en]?.[1]??null):null}));
  words.forEach(w=>{if(w.svg&&!w.svg.startsWith('<svg'))w.svg=null;});
  const sets=[{source:`COURSE[${id}].models`,sentences:d.models.map(model)}];
  if(id===1) {sets.push({source:'U1.SENT',sentences:raw.U1.SENT.map(model)},{source:'teacherModels()',sentences:p.evaluate('teacherModels()').map(model)});}
  if(id===3)sets.push({source:'selectUnit(3).SENT',sentences:p.evaluate('SENT').map(model)});
  const exerciseBanks={};
  if(id===1) for(const [key,fn] of Object.entries({blank:'blankG',circle:'circleG',count:'countG',abcd:'abcdG'}))exerciseBanks[key]=bank(`${fn}()`);
  if(id===2)for(const key of ['blank','order','abcd','count','read','listen'])exerciseBanks[key]=bank(`unitGames.${key}()`);
  if(id===3)for(const key of ['blank','plural','abcd','read','listen','count','pattern'])exerciseBanks[key]=bank(`games3.${key}()`);
  if(id>=4)for(const key of ['blank','mechanics','read','readwb','listen','abcd','extension'])exerciseBanks[key]=p.evaluate(`courseQuestions('${key}')`).map(runtimeQuestion);
  const grammarQuestions=id>=4?d.grammar.map(q=>question(q)):id===2?[...exerciseBanks.blank,...exerciseBanks.order]:id===3?[...exerciseBanks.blank,...exerciseBanks.plural]:exerciseBanks.blank;
  const ph=id===1?p.evaluate(`[['a','apple','🍎'],['b','bird','🐦'],['c','cat','🐱'],['d','dog','🐶']]`):id<=3?raw[id===2?'PH2':'PH3'].map(x=>[x[1],x[3],x[2],x[4]??({egg:'تخم‌مرغ',fig:'انجیر',goat:'بز',hat:'کلاه'})[x[3]]??null]):d.ph.map(x=>[...x,null,null]);
  const read=id<=3?raw.SIMPLE_READ[id]:d.read;
  const lessonHtml={};
  lessonHtml.original=capture(id===1?'oldLessonsCourse()':id===2?'lessons2()':id===3?'lessons3()':'lessonsCourse()');
  for(let section=1;section<=((id===1||id===3)?6:7);section++) {
   run(`child().route.lesson=${section}`);
   // Unit 1 lessonTeaching(6) exists, but is separate from the old lessons page.
   lessonHtml[`teaching${section}`]=p.evaluate(`lessonTeaching(${section})`);
  }
  lessonHtml.writing=capture('courseWriting()');
  if(id===2){lessonHtml.originalWriting=capture('writing2()');lessonHtml.board=capture('board2()');}
  if(id===3){lessonHtml.originalWriting=capture('writing3()');lessonHtml.craft=capture('craft3()');lessonHtml.actions=capture('actions3()');}
  if(id>=4)lessonHtml.speaking=capture('courseSpeaking()');
  const speaking=id>=4?[d.talk]:id===1?raw.TEACH_TIPS[1]:id===2?['از یک دوست بپرس:','What’s your favorite toy?','بعد رنگ مورد علاقه‌اش را بپرس و پاسخ خودت را بنویس.']:['حیوان کاغذی‌ات را توصیف کن:','It is yellow. It has two ears. What is it?','دوستت حدس بزند:','It is a lion.'];
  units.push({id,title:{en:title[0],fa:title[1]},icon:title[2],words,grammar:{rules:d.rule?[d.rule]:raw.TEACH_TIPS[id],teachingTips:raw.TEACH_TIPS[id],questions:grammarQuestions},models:distinctModels(sets),modelSets:sets,phonics:{mode:d.phonics==='alphabet'?'alphabet':'sounds',label:d.phonicsLabel??null,items:ph.map(([sound,word,emoji,fa])=>({sound,word,emoji:emoji??null,fa:fa??null})),alphabet:d.phonics==='alphabet'?'ABCDEFGHIJKLMNOPQRSTUVWXYZ':null},reading:{text:read[0],questions:read[1].map(q=>question(q)),note:d.readNote??null},workbookReading:d.readwb?{text:d.readwb[0],questions:d.readwb[1].map(q=>question(q)),note:null}:null,writing:{prompt:d.write,sample:d.sample,mechanics:d.mechanic,questions:d.edit?.map(q=>question(q,d.mechanic))??[]},speaking:{prompts:speaking},extra:raw.COURSE_EXTRA[id]??null,sections:raw.LESSON_NAMES.map((label,i)=>({id:i+1,label})).concat([{id:7,label:'تکمیلی'}]),sourcePages:{firstPrintedPage:d.page,studentBook:raw.SOURCE_PAGES[id].SB.map(basename),workbook:raw.SOURCE_PAGES[id].WB.map(basename),note:d.sourceNote??null},activities:p.evaluate('ACTS').map(([key,en,fa,icon])=>({key,en,fa,icon})),exerciseBanks,videoTopics:p.evaluate('VIDS').map(([title,description,url])=>({title,description,url})),curatedVideos:raw.CURATED[id]??[],lessonHtml,original:d});
 }
 return {units,shared:{lessonNames:raw.LESSON_NAMES,phonicsGuide:raw.PHONICS_LINK,originalWordArt:raw.LEGACY_WD,additionalArt:raw.ART,originalUnit1:raw.U1,originalBlanks:raw.BL,wordCounting:raw.CT,originalVideos:raw.VIDEO_ORIGINAL,sourceText:textInventory(p.ast),sourceLiterals:literalInventory(p.ast)},prototype:p};
}
