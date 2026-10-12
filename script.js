const canvas = document.getElementById('wallpaper-canvas');
const ctx = canvas.getContext('2d');

let config = {
    fishCount: 60,
    waterHue: 157,
    fishSpeed: 0.8,
    enableCaustics: true,
    enableFeeding: true,
    shyFish: true,
    fishTheme: 0,
    fishSize: 0.36,
    rippleStrength: 1.0
};

const FOOD_DETECT_RADIUS_SQ = 90000;
const EAT_RADIUS_SQ = 400;
const FEAR_RADIUS_SQ = 40000;

let width, height;
function resize() {
    const previousWidth = width, previousHeight = height;
    let dpr = window.devicePixelRatio || 1;
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    // Preserve the layout when changing aspect ratio instead of clamping fish into an edge pile.
    if (previousWidth && previousHeight) {
        for (const item of [...kois, ...foods, ...ripples]) {
            item.x *= width / previousWidth;
            item.y *= height / previousHeight;
        }
    }
}
window.addEventListener('resize', resize);
resize();

let kois = [];
let foods = [];
let ripples = [];
let causticTime = 0;

let mouse = { x: null, y: null, active: false };
window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.active = true;
    
    if (Math.random() < 0.1) {
        ripples.push(new Ripple(mouse.x, mouse.y, 0.5 * config.rippleStrength));
    }
});
window.addEventListener('mouseout', () => { mouse.active = false; });

window.addEventListener('click', (e) => {
    if (config.enableFeeding) {
        foods.push(new Food(e.clientX, e.clientY));
    }
    ripples.push(new Ripple(e.clientX, e.clientY, 1.5 * config.rippleStrength));
});

window.wallpaperPropertyListener = {
    applyUserProperties: function(properties) {
        if (properties.fishCount !== undefined) {
            config.fishCount = properties.fishCount.value;
            syncKois();
        }
        if (properties.waterHue !== undefined) {
            config.waterHue = properties.waterHue.value;
            document.body.style.backgroundColor = `hsl(${config.waterHue}, 75%, 18%)`;
        }
        if (properties.fishSpeed !== undefined) {
            config.fishSpeed = properties.fishSpeed.value;
        }
        if (properties.enableCaustics !== undefined) {
            config.enableCaustics = properties.enableCaustics.value;
        }
        if (properties.enableFeeding !== undefined) {
            config.enableFeeding = properties.enableFeeding.value;
        }
        if (properties.shyFish !== undefined) {
            config.shyFish = properties.shyFish.value;
        }
        if (properties.fishTheme !== undefined) {
            config.fishTheme = properties.fishTheme.value;
            kois.forEach(k => k.updateColorTheme());
        }
        if (properties.fishSize !== undefined) {
            config.fishSize = properties.fishSize.value;
        }
        if (properties.rippleStrength !== undefined) {
            config.rippleStrength = properties.rippleStrength.value;
        }
    }
};





function distanceSq(a, b) {
    let dx = a.x - b.x;
    let dy = a.y - b.y;
    return dx * dx + dy * dy;
}


class Ripple {
    constructor(x, y, power) {
        this.x = x;
        this.y = y;
        this.radius = 1;
        this.power = power;
        this.maxRadius = power * 100;
        this.life = 1;
    }
    update(dt) {
        let dtMult = dt * 60;
        this.radius += 1 * this.power * dtMult;
        this.life -= 0.01 * dtMult;
    }
    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 255, 255, ${this.life * 0.3})`;
        ctx.lineWidth = 2 * this.life;
        ctx.stroke();
    }
}

class Food {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 3;
        this.life = 1000;
    }
    update(dt) {
        let dtMult = dt * 60;
        this.life -= 1 * dtMult;
    }
    draw(ctx) {
        ctx.shadowBlur = 5;
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#f4a460';
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

class Koi {
    constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 1;
        this.vy = (Math.random() - 0.5) * 1;
        this.baseSpeed = 0.4 + Math.random() * 0.4;
        
        this.updateColorTheme();
        this.primary = Math.random() < .25;
        this.bodyScale = this.primary ? 1.5 + Math.random() * .4 : .72 + Math.random() * .46;
        this.waterDepth = .12 + Math.random() * .35;
        this.depthPhase = Math.random() * Math.PI * 2;
        this.sociability = .2 + Math.random() * .6;
        this.swimState = 'cruise';
        this.stateTime = 2 + Math.random() * 10;
        this.trackedFood = null;
        this.foodResponse = 0;
        this.responseDelay = 0;
        this.wakeTime = Math.random() * 2;

        this.angle = Math.atan2(this.vy, this.vx);
        this.speed = this.baseSpeed * 60 * config.fishSpeed;
        this.turnRate = 0;
        this.motionTime = 0;
        this.rhythm = Math.random() * Math.PI * 2;
        this.tailEffort = .7;
        this.swimCycle = Math.random() * Math.PI * 2;
        this.fedTimer = 0;
    }

    updateColorTheme() {
        let colors;
        if (config.fishTheme === 0) {
            colors = ['#c65b32', '#e8e4cf', '#cbae57', '#bc442e'];
        } else if (config.fishTheme === 1) {
            colors = ['#00ffcc', '#ff00ff', '#ccff00', '#00ccff'];
        } else {
            colors = ['#ffffff', '#cccccc', '#999999', '#666666'];
        }
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.skin = config.fishTheme === 0 ? (Math.random() > .24 ? '#ede9d9' : '#d5bc7e') : '#e0e4d9';
        this.markings = Array.from({length: 5 + Math.floor(Math.random() * 3)}, () => ({
            x: 5 - Math.random() * 62, y: (Math.random() - .5) * 10,
            rx: 3 + Math.random() * 8, ry: 3 + Math.random() * 5,
            angle: Math.random() * 6.28, dark: Math.random() < .24
        }));
    }

    update(dt) {
        if (dt <= 0) return;
        this.motionTime += dt;
        this.fedTimer = Math.max(0, this.fedTimer - dt * 60);
        this.stateTime -= dt;
        if(this.stateTime <= 0) {
            const choice=Math.random();
            this.swimState=choice<.60?'cruise':choice<.87?'coast':'hover';
            this.stateTime=(this.swimState==='cruise'?6:2)+Math.random()*5;
        }
        const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
        const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
        const cruise = this.baseSpeed * 60 * config.fishSpeed;
        const stroke = .5 + .5 * Math.sin(this.motionTime * 1.25 + this.rhythm);
        let target = null, nearest = Infinity;
        for (const food of foods) {
            const d = distanceSq(this, food);
            if (d < nearest) { nearest = d; target = food; }
        }
        if(target !== this.trackedFood) {
            this.trackedFood=target;this.foodResponse=0;
            this.responseDelay=.08+Math.random()*.14+Math.sqrt(nearest)/750;
        }
        this.foodResponse += dt;
        const responding=target && nearest<FOOD_DETECT_RADIUS_SQ && this.foodResponse>=this.responseDelay;
        const targetDepth=responding?.06:.16+.34*(.5+.5*Math.sin(this.motionTime*.10+this.depthPhase));
        this.waterDepth+=(targetDepth-this.waterDepth)*(1-Math.exp(-dt/3.2));
        // Continuous wandering has the same rhythm at different refresh rates.
        let desiredAngle = this.angle + .55 * Math.sin(this.motionTime * .38 + this.rhythm)
            + .22 * Math.sin(this.motionTime * .81 + this.rhythm * 2);
        let desiredSpeed = cruise * (.68 + .32 * stroke) * (this.swimState==='coast'?.48:this.swimState==='hover'?.16:1);
        let active = false;
        if (responding) {
            desiredAngle = Math.atan2(target.y - this.y, target.x - this.x);
            desiredSpeed = cruise * (.38 + 1.12 * Math.min(1, Math.sqrt(nearest) / 160));
            active = true;
            if (nearest < EAT_RADIUS_SQ) {
                foods.splice(foods.indexOf(target), 1);
                ripples.push(new Ripple(this.x, this.y, .8 * config.rippleStrength));
                this.fedTimer = 180;
            }
        } else if (this.fedTimer <= 0 && config.shyFish && mouse.active && distanceSq(this, mouse) < FEAR_RADIUS_SQ) {
            desiredAngle = Math.atan2(this.y - mouse.y, this.x - mouse.x);
            desiredSpeed = cruise * 1.65;
            active = true;
        }
        let sx=0,sy=0,cx=0,cy=0,hx=0,hy=0,neighbors=0;
        const spacing=Math.max(18,config.fishSize*this.bodyScale*88);
        let ahead=0;
        for(const other of kois) {
            if(other===this)continue;
            const dx=this.x-other.x,dy=this.y-other.y,d2=dx*dx+dy*dy;
            if(d2>.01&&d2<spacing*spacing){
                const d=Math.sqrt(d2),weight=1-d/spacing;
                sx+=dx/d*weight;sy+=dy/d*weight;
                if((-dx*Math.cos(this.angle)-dy*Math.sin(this.angle))/d>.6)ahead=Math.max(ahead,weight);
            }
            if(d2<140*140 && d2>spacing*spacing && Math.cos(this.angle-other.angle)>.2){
                cx+=other.x;cy+=other.y;hx+=Math.cos(other.angle);hy+=Math.sin(other.angle);neighbors++;
            }
        }
        let steeringX=Math.cos(desiredAngle),steeringY=Math.sin(desiredAngle);
        if(!active&&neighbors>0){
            const tx=cx/neighbors-this.x,ty=cy/neighbors-this.y,d=Math.hypot(tx,ty)||1;
            const social=this.sociability*(.5+.5*Math.sin(this.motionTime*.13+this.rhythm));
            steeringX+=social*(.55*hx/neighbors+.14*tx/d);
            steeringY+=social*(.55*hy/neighbors+.14*ty/d);
        }
        steeringX+=sx*2.2;steeringY+=sy*2.2;
        desiredSpeed*=1-.68*ahead;
        desiredAngle=Math.atan2(steeringY,steeringX);
        const margin = Math.min(140, width * .22, height * .22);
        const left = Math.max(0, 1 - this.x / margin);
        const right = Math.max(0, 1 - (width - this.x) / margin);
        const top = Math.max(0, 1 - this.y / margin);
        const bottom = Math.max(0, 1 - (height - this.y) / margin);
        const wall = Math.max(left, right, top, bottom);
        const dx = Math.cos(desiredAngle) + 5 * (left * left - right * right);
        const dy = Math.sin(desiredAngle) + 5 * (top * top - bottom * bottom);
        desiredAngle = Math.atan2(dy, dx);
        const error = wrap(desiredAngle - this.angle);
        const maxTurn = active || wall > .25 ? 1.65 : .75;
        const wantedTurn = clamp(error * 1.8, -maxTurn, maxTurn);
        const previousTurn = this.turnRate;
        this.turnRate += (wantedTurn - this.turnRate) * (1 - Math.exp(-dt / .38));
        this.angle = wrap(this.angle + (previousTurn + this.turnRate) * .5 * dt);
        // Slow before a tight turn instead of reversing the velocity vector.
        desiredSpeed *= 1 - .48 * Math.min(1, Math.abs(error) / Math.PI);
        if (wall > .55 && Math.abs(error) > 1) desiredSpeed *= .32;
        const previousSpeed = this.speed;
        const speedResponse = wall > .55 && Math.abs(error) > 1 ? .18 : .85;
        this.speed += (desiredSpeed - this.speed) * (1 - Math.exp(-dt / speedResponse));
        const travel = (previousSpeed + this.speed) * .5;
        this.vx = Math.cos(this.angle) * travel;
        this.vy = Math.sin(this.angle) * travel;
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        // Only an abrupt viewport resize should require positional correction.
        this.x = clamp(this.x, 2, Math.max(2, width - 2));
        this.y = clamp(this.y, 2, Math.max(2, height - 2));
        const effort = clamp(this.speed / Math.max(1, cruise)+(this.speed-previousSpeed)/Math.max(.01,dt)/100, .05, 1.8);
        this.tailEffort += ((.52 + .48 * stroke) * effort - this.tailEffort) * (1 - Math.exp(-dt / .5));
        this.swimCycle += dt * (1.8 + 3.2 * this.tailEffort);
        this.wakeTime -= dt;
        if(this.wakeTime<=0 && this.waterDepth<.13 && this.speed>cruise*.75) {
            ripples.push(new Ripple(this.x,this.y,.22*config.rippleStrength));
            this.wakeTime=1.8+Math.random();
        }
    }

    bodyBend(x) {
        const t = Math.max(0, Math.min(1.2, (8 - x) / 74));
        const wave = Math.sin(this.swimCycle - t * 3.8) * t * t * (.5 + 6 * this.tailEffort);
        return wave + this.turnRate * t * t * 10;
    }

    draw(ctx) {
        const size = config.fishSize * this.bodyScale * (1-this.waterDepth*.12);
        const phase = this.swimCycle;
        const bend = x => this.bodyBend(x);
        // A shared deforming centerline keeps outline, markings and fins attached during turns.
        const stations=[[14,0],[9,5.8],[0,8.7],[-12,10.3],[-25,9.1],[-38,6.9],[-50,4.2],[-64,1.55]];
        const outline = () => {
            const points=[];
            for(const side of [-1,1]) {
                const row=side===-1?stations:stations.slice().reverse();
                for(const [x,r] of row)points.push([x,bend(x)+side*r]);
            }
            ctx.beginPath();
            const first=points[0],last=points[points.length-1];ctx.moveTo((first[0]+last[0])/2,(first[1]+last[1])/2);
            for(let i=0;i<points.length;i++) {
                const a=points[i],b=points[(i+1)%points.length];ctx.quadraticCurveTo(a[0],a[1],(a[0]+b[0])/2,(a[1]+b[1])/2);
            }
            ctx.closePath();
        };
        ctx.save(); ctx.globalAlpha=1-this.waterDepth*.7;
        ctx.translate(this.x, this.y); ctx.rotate(this.angle); ctx.scale(size, size);
        // Soft displaced shadow places the fish below the water surface.
        ctx.save(); ctx.translate(4+this.waterDepth*15, 7+this.waterDepth*20); ctx.globalAlpha = .07+this.waterDepth*.16;
        ctx.fillStyle = '#294d42'; ctx.shadowColor = '#294d42'; ctx.shadowBlur = 3+this.waterDepth*12;
        outline(); ctx.fill(); ctx.restore();

        const fin = (x, side, length) => {
            ctx.save(); ctx.translate(x, bend(x)); ctx.rotate(Math.atan2(bend(x + 1) - bend(x - 1), 2)); ctx.scale(1, side);
            const fan = Math.sin(phase * .65 + side) * (1.2+Math.abs(this.turnRate)*2)+(this.swimState==='hover'?3:0);
            const g = ctx.createLinearGradient(x, 4, x - 12, length);
            g.addColorStop(0, 'rgba(214,221,195,.66)'); g.addColorStop(1, 'rgba(234,239,213,.10)');
            ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(1, 5);
            ctx.bezierCurveTo(-2, 10, -9, length + fan, -18, length - 3);
            ctx.quadraticCurveTo(-15, 9, -9, 5); ctx.closePath(); ctx.fill();
            ctx.strokeStyle = 'rgba(221,230,205,.27)'; ctx.lineWidth = .45;
            for (let n = 0; n < 4; n++) {
                ctx.beginPath(); ctx.moveTo(-3, 6); ctx.quadraticCurveTo(-9, 9 + n, -12 - n * 1.5, length - 4 + n * .6); ctx.stroke();
            }
            ctx.restore();
        };
        fin(-7, 1, 18); fin(-7, -1, 18); fin(-38, 1, 10); fin(-38, -1, 10);

        ctx.save(); ctx.translate(-63, bend(-63)); ctx.rotate(Math.atan2(bend(-62) - bend(-64), 2) + Math.sin(phase - 4.1) * .10 * this.tailEffort);
        const tail = ctx.createLinearGradient(0, 0, -25, 0);
        tail.addColorStop(0, 'rgba(207,214,188,.74)');tail.addColorStop(.55,'rgba(236,240,217,.4)'); tail.addColorStop(1, 'rgba(229,236,212,.12)');
        ctx.fillStyle = tail; ctx.beginPath(); ctx.moveTo(1, -1);
        ctx.bezierCurveTo(-8, -2, -15, -13, -25, -12);
        ctx.quadraticCurveTo(-24, -5, -17, 0);
        ctx.quadraticCurveTo(-24, 6, -25, 12);
        ctx.bezierCurveTo(-14, 12, -8, 2, 1, 1); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(227,232,210,.34)'; ctx.lineWidth = .5;
        for (const side of [-1, 1]) for (let n = 0; n < 4; n++) {
            ctx.beginPath(); ctx.moveTo(-1, 0); ctx.quadraticCurveTo(-12, side * n, -23, side * (4 + n * 2)); ctx.stroke();
        }
        ctx.restore();

        ctx.save(); outline(); ctx.clip();
        ctx.fillStyle = this.skin; ctx.fillRect(-70, -18, 90, 36);
        // Stable, asymmetric islands replace the old repeated cross-body bands.
        for (const spot of this.markings) {
            ctx.save(); ctx.translate(spot.x, spot.y + bend(spot.x)); ctx.rotate(spot.angle + Math.atan2(bend(spot.x + 1) - bend(spot.x - 1), 2));
            ctx.fillStyle = spot.dark ? '#344239' : this.color;
            ctx.beginPath();
            for (let j = 0; j <= 12; j++) {
                const a = j / 12 * Math.PI * 2;
                const r = 1 + .16 * Math.sin(a * 3 + spot.angle) + .12 * Math.cos(a * 5);
                const x = Math.cos(a) * spot.rx * r, y = Math.sin(a) * spot.ry * r;
                if (j === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            }
            ctx.closePath(); ctx.fill(); ctx.restore();
        }
        // Fine scales are subpixel at desktop size; draw them only in close views.
        if (size > .8) {
            ctx.strokeStyle = 'rgba(68,83,58,.13)'; ctx.lineWidth = .45;
            for (let row = -2; row <= 2; row++) for (let col = 0; col < 13; col++) {
                const x = -7 - col * 3.7 + (row % 2) * 1.7, y = row * 3 + bend(x);
                ctx.beginPath(); ctx.ellipse(x, y, 2.2, 1.7, 0, -.9, .9); ctx.stroke();
            }
        }
        const shade = ctx.createLinearGradient(0, -10, 0, 10);
        shade.addColorStop(0, 'rgba(24,54,42,.40)'); shade.addColorStop(.32, 'rgba(255,253,232,.28)');
        shade.addColorStop(.54, 'rgba(255,253,224,.05)'); shade.addColorStop(1, 'rgba(24,54,42,.43)');
        ctx.fillStyle = shade; ctx.fillRect(-72, -18, 90, 36);
        ctx.fillStyle=`hsla(${config.waterHue},26%,35%,${this.waterDepth*.55})`;ctx.fillRect(-75,-24,96,48);
        ctx.restore();

        // A low translucent dorsal fin follows the same deforming centerline.
        ctx.fillStyle='rgba(235,239,211,.23)';ctx.strokeStyle='rgba(78,94,66,.25)';ctx.lineWidth=.55;
        ctx.beginPath();ctx.moveTo(-12,bend(-12));ctx.bezierCurveTo(-19,-3+bend(-19),-32,-3+bend(-32),-44,bend(-44));ctx.lineTo(-13,1+bend(-13));ctx.closePath();ctx.fill();ctx.stroke();
        // Thin dorsal ridge, paired eyes and gill folds remain subtle at desktop size.
        ctx.strokeStyle = 'rgba(247,244,218,.32)'; ctx.lineWidth = .65;
        ctx.beginPath(); ctx.moveTo(-13, bend(-13)-1); ctx.quadraticCurveTo(-28, bend(-28)-2, -43, bend(-43)); ctx.stroke();
        for (const side of [-1, 1]) {
            ctx.strokeStyle = 'rgba(58,76,53,.32)'; ctx.lineWidth = .6;
            ctx.beginPath(); ctx.moveTo(-1, side * 6.5); ctx.quadraticCurveTo(2, side * 3.7, 0, side * 2.8); ctx.stroke();
            ctx.fillStyle = '#35463c'; ctx.beginPath(); ctx.ellipse(8, side * 4.5, 1.15, .85, .3 * side, 0, 6.29); ctx.fill();
            ctx.fillStyle = 'rgba(247,241,207,.8)'; ctx.beginPath(); ctx.arc(8.2, side * 4.5 - .2, .3, 0, 6.29); ctx.fill();
            ctx.strokeStyle='rgba(231,226,193,.65)';ctx.lineWidth=.55;ctx.beginPath();ctx.moveTo(12,side*2.4);ctx.quadraticCurveTo(16,side*3.1,15,side*5);ctx.stroke();
        }
        ctx.strokeStyle='rgba(74,84,62,.5)';ctx.lineWidth=.65;ctx.beginPath();ctx.moveTo(13,-1.9);ctx.quadraticCurveTo(11.8,0,13,1.9);ctx.stroke();
        ctx.restore();
    }

}

function syncKois() {
    while (kois.length < config.fishCount) {
        kois.push(new Koi());
    }
    while (kois.length > config.fishCount) {
        kois.pop();
    }
}

syncKois();

function drawCaustics(dt) {
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    causticTime += dt * 0.3 * config.fishSpeed;
    let time = causticTime;
    for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        let lx = (Math.sin(time + i) * 200) + width / 2;
        let ly = (Math.cos(time - i) * 200) + height / 2;
        ctx.arc(lx, ly, 400 + Math.sin(time)*100, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
}

let lastTime = performance.now();

function render(currentTime) {
    if (!currentTime) currentTime = performance.now();
    let dt = (currentTime - lastTime) / 1000;
    lastTime = currentTime;
    
    // Cap dt to prevent massive jumps if tab is inactive
    if (dt > 0.1) dt = 0.1;

    ctx.clearRect(0, 0, width, height);
    pondScene.bed(ctx, width, height, config.waterHue);

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (config.enableCaustics) pondScene.light(ctx, currentTime / 1000);

    for (let i = foods.length - 1; i >= 0; i--) {
        foods[i].update(dt);
        foods[i].draw(ctx);
        if (foods[i].life <= 0) foods.splice(i, 1);
    }

    for (const fish of kois) fish.update(dt);
    // Sort a view rather than changing update order as fish cross in depth.
    for (const fish of [...kois].sort((a,b)=>b.waterDepth-a.waterDepth)) fish.draw(ctx);
    
    for (let i = ripples.length - 1; i >= 0; i--) {
        ripples[i].update(dt);
        ripples[i].draw(ctx);
        if (ripples[i].life <= 0) ripples.splice(i, 1);
    }

    pondScene.surface(ctx, currentTime / 1000);
    requestAnimationFrame(render);
}

requestAnimationFrame(render);

// ---------------------------------------------------------
// Lively Wallpaper Support
// 
// Note: If you acquired this code from the Steam Workshop / Wallpaper Engine build,
// the required 'LivelyProperties.json' file is not bundled with it.
// To use this project seamlessly on Lively Wallpaper, please download the necessary
// configuration files directly from the official GitHub repository:
// 👉 https://github.com/rzrabbi/interactive-koi-pond
// ---------------------------------------------------------
function livelyPropertyListener(name, val) {
    const props = {};
    props[name] = { value: val };
    window.wallpaperPropertyListener.applyUserProperties(props);
}
