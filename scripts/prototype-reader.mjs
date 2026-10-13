import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
export const prototypePath = new URL('../legacy/index.html', import.meta.url);
export function readPrototype() {
 const html=fs.readFileSync(prototypePath,'utf8');
 const source=html.match(/<script>([\s\S]*?)<\/script>/)[1];
 const nodes=new Map();
 function element(id='') { if(nodes.has(id))return nodes.get(id); const e={innerHTML:'',textContent:'',value:'',dataset:{},style:{},classList:{add(){},remove(){},toggle(){}},setAttribute(){},getAttribute(){return null},focus(){},appendChild(){},remove(){},querySelectorAll(){return []},addEventListener(){}};nodes.set(id,e);return e; }
 const context=vm.createContext({document:{getElementById:element,querySelector:()=>null,querySelectorAll:()=>[],createElement:()=>element(),addEventListener(){},body:element('body')},window:{addEventListener(){},scrollTo(){}},localStorage:{getItem(){return null},setItem(){}},location:{hash:''},history:{replaceState(){},pushState(){}},setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},speechSynthesis:{cancel(){}},URL,URLSearchParams,console});
 vm.runInContext(source,context,{timeout:10000,filename:'legacy/index.html'});
 const evaluate=expression=>JSON.parse(vm.runInContext(`JSON.stringify(${expression})`,context,{timeout:10000}));
 const ast=ts.createSourceFile('prototype.js',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
 return {html,source,context,evaluate,ast};
}
if(process.argv[1]?.endsWith('prototype-reader.mjs')) {
 const p=readPrototype();console.log(p.evaluate('Object.fromEntries(Object.entries(COURSE).map(([id,d])=>[id,Object.keys(d)]))'));
}
