import test from 'node:test';
import assert from 'node:assert/strict';
import { BREW_DURATION, poseAt, mountCoffee } from '../assets/js/coffee-motion.mjs';

function setup(reduced = false) {
  const listeners = {}, frames = new Map();
  let id = 0;
  const button = { hidden: true, disabled: false, addEventListener: (e, f) => listeners[e] = f };
  const status = { textContent: '' };
  const motionChoice = {hidden:true};
  const motionButton = {disabled:false,addEventListener:(_,fn)=>listeners.playMotion=fn};
  const names = ['body','head','press','plunger','cup','left-hand','right-hand','left-outline','right-outline','left-sleeve','right-sleeve','left-skin','right-skin','steam'];
  const parts = Object.fromEntries(names.map(name => [name, { dataset: { brew:name }, attrs:{}, setAttribute(k,v){this.attrs[k]=v;} }]));
  const coffee = { dataset: {state:'ready'}, querySelector: s=>({'#brew-button':button,'#brew-status':status,'#brew-motion-choice':motionChoice,'#brew-motion':motionButton})[s], querySelectorAll:()=>Object.values(parts) };
  const motion = { matches:reduced, addEventListener:(_,f)=>listeners.motion=f };
  mountCoffee(coffee, {motion, requestFrame:fn=>{ frames.set(++id,fn); return id; }, cancelFrame:id=>frames.delete(id)});
  const advance = time => { const pending=[...frames.values()]; frames.clear(); pending.forEach(fn=>fn(time)); };
  return {coffee,button,status,parts,motion,motionChoice,motionButton,listeners,frames,advance};
}
test('press stays on the mug until extracted; cup lifts only after brewer is set aside',()=>{
  for (let t=0;t<=4000;t+=100) {
    const [plunge,bx,by,cx,cy,, ,lx,ly,rx,ry]=poseAt(t);
    assert.ok(plunge>=0 && plunge<=62);
    assert.deepEqual([bx,by,cx,cy],[0,0,0,0]);
    assert.equal(lx,177); assert.equal(ly,225+plunge);
    assert.deepEqual([rx,ry],[211,322]);
  }
  for(let t=4600;t<=7000;t+=100){
    const [,bx,by,cx,cy,,,,,rx,ry]=poseAt(t);
    assert.ok(Math.abs(rx-(211+bx))<1e-9); assert.ok(Math.abs(ry-(322+by))<1e-9);
    assert.deepEqual([cx,cy],[0,0]);
  }
  const end=poseAt(BREW_DURATION);
  assert.deepEqual(end.slice(1,3),[84,49]);
  assert.ok(end[4]<-100);
});
test('all joint positions are finite and continuous, including action boundaries',()=>{
  let last=poseAt(0);
  for(let t=1;t<=BREW_DURATION;t++){
    const pose=poseAt(t);
    pose.forEach((v,i)=>{assert.ok(Number.isFinite(v));assert.ok(Math.abs(v-last[i])<.3,`joint ${i}, t=${t}`);});
    last=pose;
  }
  assert.deepEqual(poseAt(-1),poseAt(0));
  assert.deepEqual(poseAt(BREW_DURATION+1),poseAt(BREW_DURATION));
});
test('one animation at a time, intermediate movement, completion and replay',()=>{
  const s=setup();
  assert.equal(s.button.hidden,false);
  s.listeners.click(); s.listeners.click();
  assert.equal(s.frames.size,1); assert.equal(s.button.disabled,true);
  s.advance(100); s.advance(2100);
  assert.notEqual(s.parts.plunger.attrs.transform,'translate(0 0)');
  s.advance(100+BREW_DURATION);
  assert.equal(s.coffee.dataset.state,'done'); assert.equal(s.button.disabled,false);
  assert.equal(s.frames.size,0); assert.equal(s.status.textContent,'That’s better. Enjoy your cup.');
  s.listeners.click(); assert.equal(s.parts.cup.attrs.transform,'translate(0 0) rotate(0 180 398)');
  assert.equal(s.frames.size,1);
});
test('reduced motion finishes immediately and cancels a running frame',()=>{
  const s=setup(true);s.listeners.click();assert.equal(s.coffee.dataset.state,'done');assert.equal(s.frames.size,0);
  const changing=setup(); changing.listeners.click(); changing.advance(0); changing.advance(2000);
  changing.motion.matches=true; changing.listeners.motion();
  assert.equal(changing.coffee.dataset.state,'done');assert.equal(changing.frames.size,0);
  assert.equal(changing.button.disabled,false);
});

test('reduced-motion users can explicitly opt into one full animation',()=>{
  const s=setup(true); assert.equal(s.motionChoice.hidden,false);
  s.listeners.playMotion(); assert.equal(s.coffee.dataset.state,'brewing'); assert.equal(s.motionButton.disabled,true);
  s.advance(0); s.advance(BREW_DURATION);
  assert.equal(s.coffee.dataset.state,'done'); assert.equal(s.motionButton.disabled,false);
  s.listeners.click(); assert.equal(s.frames.size,0); // Normal control still respects preference.
  s.motion.matches=false; s.listeners.motion(); assert.equal(s.motionChoice.hidden,true);
});
