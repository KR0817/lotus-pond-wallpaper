const fs = require('node:fs');
const vm = require('node:vm');
function simulate(file, kind, fps) {
  let seed=371;
  const math=Object.create(Math);
  math.random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
  const context=vm.createContext({Math:math,performance:{now:()=>0},requestAnimationFrame:()=>0,
    document:{getElementById:()=>({getContext:()=>({scale(){}})}),body:{style:{}}},
    window:{innerWidth:1920,innerHeight:1080,devicePixelRatio:1,addEventListener(){}}});
  vm.runInContext(fs.readFileSync(file,'utf8'),context);
  return vm.runInContext(`(() => {
    const f=new Koi(); kois=[f]; f.x=500;f.y=500;f.angle=Math.PI;f.vx=-.5;f.vy=0;
    f.speed=f.baseSpeed*60*config.fishSpeed;
    if ('${kind}'==='food') foods.push(new Food(620,500));
    if ('${kind}'==='avoid') {mouse.x=440;mouse.y=500;mouse.active=true;}
    if ('${kind}'==='edge') {f.x=20;f.y=20;f.angle=-2.35;f.vx=-.3;f.vy=-.3;}
    let angle=f.angle,x=f.x,y=f.y,prevSpeed=null,maxTurn=0,maxSpeedStep=0,outside=false,fed=false;
    for(let i=0;i<${fps}*30;i++) {
      f.update(1/${fps});
      const delta=Math.atan2(Math.sin(f.angle-angle),Math.cos(f.angle-angle));
      const speed=Math.hypot(f.x-x,f.y-y)*${fps};
      if(prevSpeed!==null) maxSpeedStep=Math.max(maxSpeedStep,Math.abs(speed-prevSpeed));
      maxTurn=Math.max(maxTurn,Math.abs(delta));
      outside ||= f.x < -2 || f.x > width+2 || f.y < -2 || f.y > height+2;
      fed ||= f.fedTimer>0;
      angle=f.angle;x=f.x;y=f.y;prevSpeed=speed;
    }
    return {maxTurnDegrees:maxTurn*180/Math.PI,maxSpeedStep,outside,fed,x,y};
  })()`,context);
}
const file=require('node:path').join(__dirname,'../script.js');
const result={};
for(const fps of [30,60,144]) for(const kind of ['cruise','food','avoid','edge']) result[`${kind}_${fps}`]=simulate(file,kind,fps);
console.log(JSON.stringify(result,null,2));

for(const [name,r] of Object.entries(result)) {
 if(r.outside || !Number.isFinite(r.x+r.y+r.maxTurnDegrees) || r.maxTurnDegrees>3.2 || (name.startsWith('food')&&!r.fed))process.exitCode=1;
}
