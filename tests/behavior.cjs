const fs=require('node:fs'),vm=require('node:vm');
const file=require('node:path').join(__dirname,'../script.js');
let seed=174;
const math=Object.create(Math);math.random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
const context=vm.createContext({Math:math,performance:{now:()=>0},requestAnimationFrame:()=>0,document:{getElementById:()=>({getContext:()=>({scale(){}})}),body:{style:{}}},window:{innerWidth:1920,innerHeight:1080,devicePixelRatio:1,addEventListener(){}}});
vm.runInContext(fs.readFileSync(file,'utf8'),context);
const report=vm.runInContext(`(()=>{
 const initial=kois.map(f=>({depth:f.waterDepth,x:f.x,y:f.y}));
 const states=new Set();let maxTurn=0,finite=true,outside=0,maxDepthChange=0,eaten=0,peakNearPairs=0,nearestSum=0;
 for(let step=0;step<5400;step++){
   if(step>=1800&&step<3600&&step%60===0)foods.push(new Food(width*.5,height*.5));
   const foodCount=foods.length;
   for(const f of kois){
     const before=f.angle,depth=f.waterDepth;f.update(1/60);
     maxTurn=Math.max(maxTurn,Math.abs(Math.atan2(Math.sin(f.angle-before),Math.cos(f.angle-before))));
     maxDepthChange=Math.max(maxDepthChange,Math.abs(depth-f.waterDepth));
     finite&&=Number.isFinite(f.x+f.y+f.angle+f.waterDepth);
     states.add(f.swimState);if(f.x<0||f.x>width||f.y<0||f.y>height)outside++;
   }
   eaten+=foodCount-foods.length;
   for(let i=foods.length-1;i>=0;i--){foods[i].update(1/60);if(foods[i].life<=0)foods.splice(i,1);}
   for(let i=ripples.length-1;i>=0;i--){ripples[i].update(1/60);if(ripples[i].life<=0)ripples.splice(i,1);}
   if(step%60===0){
     let close=0;
     for(let i=0;i<kois.length;i++)for(let j=i+1;j<kois.length;j++)if(distanceSq(kois[i],kois[j])<100)close++;
     peakNearPairs=Math.max(peakNearPairs,close);
   }
 }
 const distances=kois.map(f=>Math.min(...kois.filter(o=>o!==f).map(o=>Math.hypot(f.x-o.x,f.y-o.y)))).sort((a,b)=>a-b);
 return {fish:kois.length,finite,outside,maxTurnDegrees:maxTurn*180/Math.PI,states:[...states],
  dynamicDepth:kois.filter((f,i)=>Math.abs(f.waterDepth-initial[i].depth)>.02).length,maxDepthChangePerFrame:maxDepthChange,
  eaten,peakPairsWithin10px:peakNearPairs,medianNearestDistance:distances[30],
  occupiedStartCells:new Set(initial.map(f=>Math.floor(f.x/480)+','+Math.floor(f.y/270))).size};
})()`,context);
console.log(JSON.stringify(report,null,2));
if(!report.finite||report.outside||report.maxTurnDegrees>1.7||report.states.length<3||report.dynamicDepth<45||report.maxDepthChangePerFrame>.004||report.eaten<5||report.medianNearestDistance<20||report.occupiedStartCells<12)process.exitCode=1;
