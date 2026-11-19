import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const script=readFileSync(new URL('../assets/js/photo-viewer.js',import.meta.url),'utf8');
function setup(supported=true){
  const node=()=>({listeners:{},hidden:false,textContent:'',addEventListener(event,fn){this.listeners[event]=fn;}});
  const image=node(),caption=node(),counter=node(),error=node(),fallback=node();
  const close=node(),prev=node(),next=node();
  const nodes={'.photo-full':image,'#photo-caption':caption,'.photo-counter':counter,'.photo-error':error,'.photo-fallback':fallback,'.photo-close':close,'[data-photo-prev]':prev,'[data-photo-next]':next};
  const viewer={...node(),open:false,querySelector:s=>nodes[s],close(){this.open=false;this.listeners.close();}};
  if(supported)viewer.showModal=()=>{viewer.open=true;};
  const photos=[0,1,2].map(i=>({...node(),href:`/photos/${i}.webp`,dataset:{caption:`Photo ${i}`},querySelector:()=>({alt:`Description ${i}`}),focus(){this.focused=true;}}));
  const classes=new Set();
  runInNewContext(script,{document:{querySelector:()=>viewer,querySelectorAll:()=>photos,body:{classList:{add:x=>classes.add(x),remove:x=>classes.delete(x)}}}});
  function click(index,overrides={}){let prevented=false;photos[index].listeners.click?.({button:0,preventDefault(){prevented=true},...overrides});return prevented;}
  return {viewer,photos,image,caption,counter,error,fallback,close,prev,next,classes,click};
}
test('photo links open the chosen photo and navigation wraps with matching captions',()=>{
 const s=setup();assert.equal(s.click(1),true);assert.equal(s.viewer.open,true);
 assert.equal(s.image.src,'/photos/1.webp');assert.equal(s.image.alt,'Description 1');assert.equal(s.caption.textContent,'Photo 1');assert.equal(s.counter.textContent,'2 / 3');
 s.next.listeners.click();s.next.listeners.click();assert.equal(s.image.src,'/photos/0.webp');
 s.prev.listeners.click();assert.equal(s.counter.textContent,'3 / 3');
 let prevented=false;s.viewer.listeners.keydown({key:'ArrowLeft',preventDefault(){prevented=true}});assert(prevented);assert.equal(s.image.src,'/photos/1.webp');
});
test('closing, including native Escape, unlocks scrolling and restores the opening link',()=>{
 const s=setup();s.click(2);assert(s.classes.has('photo-viewing'));s.prev.listeners.click();s.close.listeners.click();
 assert.equal(s.viewer.open,false);assert.equal(s.classes.has('photo-viewing'),false);assert.equal(s.photos[2].focused,true);
 s.click(0);s.viewer.listeners.close();assert.equal(s.classes.size,0);assert.equal(s.photos[0].focused,true);
});
test('modified clicks and unsupported dialogs preserve normal image-link navigation',()=>{
 for(const modifiers of [{ctrlKey:true},{metaKey:true},{shiftKey:true},{altKey:true},{button:1}]){const s=setup();assert.equal(s.click(0,modifiers),false);assert.equal(s.viewer.open,false);}
 const s=setup(false);assert.equal(s.photos[0].listeners.click,undefined);
});
test('failed image loads expose a direct link and clear on the next selection',()=>{
 const s=setup();s.click(0);s.image.listeners.error();assert.equal(s.error.hidden,false);assert.equal(s.fallback.href,'/photos/0.webp');
 s.next.listeners.click();assert.equal(s.error.hidden,true);assert.equal(s.fallback.href,'/photos/1.webp');
});
test('photo manifest contains unique, complete local WebP pairs and usable image descriptions',()=>{
 const photos=JSON.parse(readFileSync(new URL('../_data/photos.json',import.meta.url)));
 assert.equal(new Set(photos.map(p=>p.id)).size,photos.length);
 assert.equal(photos.filter(p=>p.group==='intro').length,1);
 for(const p of photos){assert(['intro','community','life'].includes(p.group));assert(p.width>0&&p.height>0);assert(p.alt.length>20);assert(p.caption.length>0);
  for(const key of ['src','full']){assert.match(p[key],/^\/assets\/portfolio\/photos\/[a-z-]+\.webp$/);const bytes=readFileSync(new URL(`..${p[key]}`,import.meta.url));assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.toString('ascii',8,12),'WEBP');}
 }
});

test('expanded albums preserve the selected prints and include the supplied speaking photos',()=>{
 const photos=JSON.parse(readFileSync(new URL('../_data/photos.json',import.meta.url)));
 assert.equal(photos.length,54);
 assert.equal(photos.filter(p=>!p.more).length,11);
 assert.equal(photos.filter(p=>p.more).length,43);
 for(const id of ['on-stage','agent-framework','llama-playground','devfest-stage','jain-talk','neysa-workshop','meetup-audience'])assert(photos.some(p=>p.id===id&&p.group==='community'&&p.more));
 assert(photos.filter(p=>p.more).every(p=>p.group!=='intro'));
});
