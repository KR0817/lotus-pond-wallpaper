const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const file=require('node:path').join(__dirname,'../script.js');
const source=fs.readFileSync(file,'utf8');
function load(store=new Map(),blocked=false){
  let seed=174;const math=Object.create(Math);math.random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
  const context=vm.createContext({Math:math,performance:{now:()=>0},requestAnimationFrame:()=>0,
    localStorage:{getItem:k=>{if(blocked)throw Error('blocked');return store.get(k)||null;},setItem:(k,v)=>{if(blocked)throw Error('blocked');store.set(k,v);}},
    document:{getElementById:()=>({getContext:()=>({scale(){}})}),body:{style:{}}},
    window:{innerWidth:1920,innerHeight:1080,devicePixelRatio:1,addEventListener(){}}});
  vm.runInContext(source,context);return context;
}
const run=(context,script)=>vm.runInContext(script,context);
const store=new Map(),context=load(store);
assert.equal(run(context,'typeof kois[0].growth'),'number','Missing individual feeding growth');
const species={koi:run(context,'kois.length')};
assert.equal(species.koi,60);
assert.ok(!/goldfish|medaka|blackmoor|SPECIES_ORDER/.test(source));
for(const slot of [0,1,3,10]) {
  const c=load();
  run(c,`kois=[kois[${slot}]];config.shyFish=false;foods=[new Food(kois[0].x,kois[0].y)];kois[0].trackedFood=foods[0];kois[0].responseDelay=0;kois[0].foodResponse=1;kois[0].update(1/60);`);
  assert.equal(run(c,'kois[0].meals'),1,'Every species must consume food and grow');
}
const countChange=load();
run(countChange,"kois[59].eat();livelyPropertyListener('fishCount',5);livelyPropertyListener('fishCount',60)");
assert.equal(run(countChange,'kois[59].meals'),1,'Temporarily removed slots retain growth');
run(context,`config.shyFish=false; kois.forEach((f,i)=>{f.x=960;f.y=540;});
  foods=[new Food(960,540)];kois.forEach(f=>{f.trackedFood=foods[0];f.responseDelay=0;f.foodResponse=1;});
  kois.forEach(f=>f.update(1/60));`);
assert.equal(run(context,'foods.length'),0);
assert.equal(run(context,'kois.reduce((n,f)=>n+f.meals,0)'),1,'A pellet must credit only one fish');
assert.equal(run(context,'kois.filter(f=>f.growthTarget>1).length'),1);
assert.ok(run(context,'kois[0].growth < kois[0].growthTarget && kois[0].growthTarget>1.08'));
const firstTarget=run(context,'kois[0].growthTarget');
run(context,'for(let i=0;i<600;i++)kois[0].update(1/60)');
assert.ok(Math.abs(run(context,'kois[0].growth')-firstTarget)<.001);
assert.equal(run(context,'kois[1].growth'),1,'Unfed fish should not grow');
const restored=load(store);
assert.equal(run(restored,'kois[0].meals'),1);
assert.equal(run(restored,'kois[0].growth'),firstTarget);
run(restored,"livelyPropertyListener('fishCount',5);livelyPropertyListener('fishCount',60)");
assert.equal(run(restored,'kois[0].meals'),1);

const migration=load(new Map([['lotus-pond-growth-v1',JSON.stringify({version:1,meals:Array.from({length:60},(_,i)=>i)})]]));
assert.ok(run(migration,'kois.every((f,i)=>f.meals===i&&f.growth===growthFromMeals(i))'));
const rates=[];
for(const fps of [30,60,144]){
  const c=load();
  run(c,`kois=[kois[0]];kois[0].eat();for(let i=0;i<${fps}*3;i++)kois[0].update(1/${fps});`);
  rates.push(run(c,'kois[0].growth'));
  run(c,'for(let i=0;i<1000;i++)kois[0].eat();for(let i=0;i<1200;i++)kois[0].update(1/60)');
  assert.ok(run(c,'kois[0].growth<=1.75 && kois[0].growthTarget<=1.75 && kois[0].meals<=100'));
}
assert.ok(Math.max(...rates)-Math.min(...rates)<1e-10,'Growth must be independent of refresh rate');
const expired=load();run(expired,'foods=[new Food(kois[0].x,kois[0].y)];foods[0].life=0;for(let i=0;i<120;i++)kois[0].update(1/60)');
assert.equal(run(expired,'kois[0].meals'),0);
const corrupt=load(new Map([['lotus-pond-growth-v1','{"version":1,"meals":[-1,999999,"bad",null]}']]));
assert.ok(run(corrupt,'kois.every(f=>Number.isFinite(f.growth)&&f.growth>=1&&f.growth<=1.75)'));
assert.doesNotThrow(()=>run(load(new Map(),true),'kois[0].eat()'));
assert.doesNotThrow(()=>load(new Map([['lotus-pond-growth-v1','invalid JSON']])));
const report={species,exclusivePelletCredit:true,firstMealTarget:firstTarget,growthAtThreeSeconds:rates,cap:1.75,persistence:true,storageFallback:true,expiredFoodIgnored:true};
console.log(JSON.stringify(report,null,2));
