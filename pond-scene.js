// Local lotus scenery. Cached textures keep per-frame work small.
const pondScene = (() => {
    let bed, foliage, canopy, waterLight, lightMask, w = 0, h = 0, hue = -1;
    let lastLightTime = -1;
    let leaves = [];
    let seed = 72891;
    const random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
    const layer = (width, height) => {
        const c = document.createElement('canvas');
        c.width = width; c.height = height;
        return c;
    };
    function stone(c, x, y, r) {
        c.save(); c.translate(x, y); c.rotate(random() * 6.28);
        const g = c.createRadialGradient(-r * .3, -r * .4, 0, 0, 0, r);
        g.addColorStop(0, '#97a58a'); g.addColorStop(.6, '#6c8170'); g.addColorStop(1, '#425e52');
        c.fillStyle = g; c.beginPath();
        for (let i = 0; i < 10; i++) {
            const a = i / 10 * 6.28, d = r * (.8 + random() * .23);
            const px = Math.cos(a) * d, py = Math.sin(a) * d * .72;
            if (!i) c.moveTo(px, py); else c.lineTo(px, py);
        }
        c.closePath(); c.fill();
        c.save(); c.clip();
        for(let i=0;i<20;i++) {
            c.fillStyle = random() > .5 ? 'rgba(218,222,186,.13)' : 'rgba(24,50,43,.1)';
            c.fillRect((random()*2-1)*r,(random()*2-1)*r,1+random()*r*.3,1+random()*r*.15);
        }
        c.restore();
        c.restore();
    }
    function leaf(c, x, y, r, rotation, age, tilt) {
        c.save(); c.translate(x, y); c.rotate(rotation); c.scale(1, tilt);
        c.shadowColor = 'rgba(17,48,28,.38)'; c.shadowBlur = r * .22; c.shadowOffsetY = r * .15;
        c.beginPath();
        for (let i = 0; i <= 100; i++) {
            const a = i / 100 * Math.PI * 2;
            const rr = r * (.97 + .035 * Math.sin(a * 5+.7) + .012 * Math.sin(a * 17));
            const px=Math.sin(a)*rr,py=Math.cos(a)*rr;
            if(!i)c.moveTo(px,py);else c.lineTo(px,py);
        }
        c.closePath();
        const g = c.createRadialGradient(-r * .28, -r * .4, 0, 0, 0, r);
        g.addColorStop(0, age < .35 ? '#8ca870' : '#719363'); g.addColorStop(.38, '#537d55'); g.addColorStop(.82, '#365f46'); g.addColorStop(1, age > .8 ? '#75875c' : '#537751');
        c.fillStyle = g; c.fill(); c.shadowColor = 'transparent';
        c.save(); c.clip();
        for (let i = 0; i < 340; i++) {
            c.fillStyle = `rgba(${random() > .5 ? '196,206,108' : '30,65,42'},${.025 + random() * .08})`;
            c.beginPath(); c.ellipse((random() * 2 - 1) * r, (random() * 2 - 1) * r, 1 + random() * r * .14, 1 + random() * r * .1, random() * 6, 0, 6.29); c.fill();
        }
        for (let i = 0; i < 30; i++) {
            const a=random()*6.28,d=r*(.73+random()*.3);
            c.fillStyle=`rgba(216,215,126,${.025+random()*.07})`;
            c.beginPath();c.ellipse(Math.cos(a)*d,Math.sin(a)*d,2+random()*r*.11,1+random()*r*.055,a,0,6.29);c.fill();
        }
        for (let i = 0; i < 17; i++) {
            const a = i / 17 * 6.28;
            const dx = Math.sin(a), dy = Math.cos(a);
            c.strokeStyle = 'rgba(181,208,149,.19)'; c.lineWidth = r*.008;
            c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(dx * r * .4 + 3, dy * r * .4, dx * r, dy * r); c.stroke();
            for (let j = 2; j <= 7; j++) {
                const t = j / 9;
                c.strokeStyle = 'rgba(190,210,145,.14)'; c.lineWidth = .45;
                for (const side of [-1, 1]) {
                    c.beginPath(); c.moveTo(dx * r * t, dy * r * t);
                    c.lineTo(dx * r * (t + .13) + dy * side * r * .06, dy * r * (t + .13) - dx * side * r * .06); c.stroke();
                }
            }
        }
        // Broad highlights and a turned rim give the leaf a shallow bowl shape.
        c.strokeStyle='rgba(178,202,149,.24)';c.lineWidth=r*.035;
        c.beginPath();c.ellipse(-r*.015,-r*.01,r*.952,r*.94,0,3.45,5.25);c.stroke();
        c.strokeStyle='rgba(25,58,38,.24)';c.lineWidth=r*.045;
        c.beginPath();c.ellipse(0,r*.01,r*.925,r*.94,0,.1,1.55);c.stroke();
        for(let i=0;i<7;i++) {
            const a=random()*6.28,d=r*(.18+random()*.57),px=Math.cos(a)*d,py=Math.sin(a)*d,rr=r*(.015+random()*.018);
            const water=c.createRadialGradient(px-rr*.3,py-rr*.4,rr*.1,px,py,rr);
            water.addColorStop(0,'rgba(235,251,220,.82)');water.addColorStop(.32,'rgba(154,187,147,.18)');water.addColorStop(1,'rgba(29,65,47,.55)');
            c.fillStyle=water;c.beginPath();c.ellipse(px,py,rr,rr*.78,0,0,6.29);c.fill();
        }
        c.restore();
        c.fillStyle = '#adc18a'; c.beginPath(); c.ellipse(0, 0, r * .025,r*.019,0,0,6.29); c.fill();
        c.restore();
    }
    function blossom(c, x, y, r) {
        c.save(); c.translate(x, y);c.rotate(-.24);c.scale(1,.83);
        c.shadowColor = 'rgba(38,47,26,.3)'; c.shadowBlur = 9; c.shadowOffsetY = 6;
        for (let ring = 0; ring < 3; ring++) {
            const count = 9 - ring*2, length = r * (1 - ring * .24);
            for (let i = 0; i < count; i++) {
                c.save(); c.rotate(i / count * 6.28 + ring * .51);c.scale(.92+random()*.16,.87+random()*.2);
                const g = c.createLinearGradient(0, 0, 0, -length);
                g.addColorStop(0, '#f6ecd5'); g.addColorStop(.43, '#f5c7ce');g.addColorStop(.78,'#eaa6bc'); g.addColorStop(1, '#c76a92');
                c.fillStyle = g; c.strokeStyle = 'rgba(168,78,116,.28)'; c.lineWidth = .7;
                c.beginPath(); c.moveTo(0, 3); c.bezierCurveTo(-length * .45, -length * .35, -length * .27, -length * .72, 0, -length);
                c.bezierCurveTo(length * .28, -length * .7, length * .42, -length * .3, 0, 3); c.fill(); c.stroke();
                c.strokeStyle='rgba(254,238,231,.5)';c.lineWidth=.6;c.beginPath();c.moveTo(0,-length*.1);c.quadraticCurveTo(-length*.07,-length*.5,0,-length*.9);c.stroke();c.restore();
            }
            c.shadowColor = 'transparent';
        }
        c.fillStyle = '#e5b950'; c.beginPath(); c.arc(0, 0, r * .16, 0, 6.29); c.fill();
        for (let i = 0; i < 16; i++) {
            const a = i * 2.4, d = Math.sqrt(i / 16) * r * .14;
            c.fillStyle = '#fff1ac'; c.beginPath(); c.arc(Math.cos(a) * d, Math.sin(a) * d, 1.2, 0, 6.29); c.fill();
        }
        c.restore();
    }
    function build(width, height, waterHue) {
        w = width; h = height; hue = waterHue; seed = 72891;
        bed = layer(w, h); foliage = layer(w, h); canopy = layer(w, h); leaves = [];
        waterLight=layer(Math.ceil(w/2),Math.ceil(h/2)); lightMask=layer(waterLight.width,waterLight.height); lastLightTime=-1;
        const c = bed.getContext('2d'), f = foliage.getContext('2d');
        const g = c.createRadialGradient(w*.54,h*.48,h*.08,w*.52,h*.5,Math.max(w,h)*.67);
        g.addColorStop(0, `hsl(${hue-6},25%,32%)`); g.addColorStop(.48, `hsl(${hue-12},23%,42%)`); g.addColorStop(1, `hsl(${hue-29},23%,55%)`);
        c.fillStyle = g; c.fillRect(0, 0, w, h);
        // Layered sand and submerged vegetation, generated once per resize.
        for (let i = 0; i < 26000; i++) {
            const x = random() * w, y = random() * h;
            const band = Math.sin(x / w * 15 + Math.sin(y / h * 8) * 2);
            const radius = 1 + random() * (band > .3 ? 11 : 4);
            c.fillStyle = random() > .45 ? 'rgba(39,75,60,.024)' : 'rgba(225,222,169,.024)';
            c.beginPath(); c.ellipse(x, y, radius, radius * .6, random() * 6.28, 0, 6.29); c.fill();
        }
        const scale = Math.min(w / 1920, h / 1080);
        const plantY = (x,y) => x<.3&&y<.5 ? h*.05+(y-.05)*1080*scale :
            x>.78&&y>.5 ? h*.90+(y-.90)*1080*scale : h*y;
        // Cluster submerged vegetation so open swimming water remains legible.
        for (let patch=0;patch<110;patch++) {
            const x=random()*w,y=random()*h;
            if(x>w*.18&&x<w*.84&&y>h*.16&&y<h*.82&&random()>.18)continue;
            for(let stem=0;stem<22;stem++){
                const px=x+(random()-.5)*90*scale,py=y+(random()-.5)*65*scale;
                const a=random()*6.28,len=(6+random()*16)*scale;
                c.strokeStyle='rgba(48,80,57,.1)'; c.lineWidth=1;
                c.beginPath();c.moveTo(px,py);c.lineTo(px+Math.cos(a)*len,py+Math.sin(a)*len);c.stroke();
                c.fillStyle=random()>.5?'rgba(51,86,65,.13)':'rgba(126,144,91,.13)';
                for(let j=1;j<4;j++){
                    c.beginPath();c.ellipse(px+Math.cos(a)*len*j/4,py+Math.sin(a)*len*j/4,4*scale,1.8*scale,a+.6,0,6.29);c.fill();
                }
            }
        }
        for (let i = 0; i < 320; i++) {
            const x = random() * w, y = random() * h;
            if (x > w * .14 && x < w * .88 && y > h * .16 && y < h * .88 && random() > .12) continue;
            c.globalAlpha = .24 + random() * .28; stone(c, x, y, (3 + random() * 20) * scale);
        }
        c.globalAlpha = 1;
        // Individual cached sprites allow independent motion without rebuilding leaf veins.
        const positions = [
            [.015,.045,155,.1],[.095,.048,140,-.4],[.19,.09,105,.6],
            [.025,.235,155,.7],[.10,.205,144,-.8],[.205,.205,93,.3],
            [.06,.38,113,-.3],[.155,.325,82,.9],
            [.985,.91,147,.4],[.885,.94,127,-.8],[.965,.72,141,.7],
            [.875,.77,108,-.4],[.93,.565,88,.3],[.81,.885,72,.8],
            [.028,.80,49,-.5],[.74,.025,35,.2]
        ];
        positions.forEach(([x,y,r,a],i) => {
            const radius=r*scale, extent=Math.ceil(radius*1.45), sprite=layer(extent*2,extent*2);
            leaf(sprite.getContext('2d'),extent,extent,radius,a,random(),.65+random()*.3);
            leaves.push({sprite,x:w*x,y:plantY(x,y),extent,phase:i*2.39,rate:.18+random()*.14});
        });
        [[.153,.131,43],[.055,.305,29],[.89,.673,40],[.835,.892,25]].forEach(([x,y,r]) => {
            const py=plantY(x,y);
            c.strokeStyle='rgba(56,86,49,.24)';c.lineWidth=2*scale;c.beginPath();c.moveTo(w*x-12*scale,py+38*scale);c.quadraticCurveTo(w*x+9*scale,py+20*scale,w*x,py);c.stroke();
            blossom(f,w*x,py,r*scale);
        });
        f.save();f.translate(w*.235,plantY(.235,.255));f.rotate(.38);
        const bud=f.createLinearGradient(0,-15*scale,0,10*scale);bud.addColorStop(0,'#d8869d');bud.addColorStop(.55,'#d9aca8');bud.addColorStop(1,'#648359');f.fillStyle=bud;
        f.beginPath();f.moveTo(0,-16*scale);f.bezierCurveTo(-14*scale,0,-7*scale,13*scale,0,14*scale);f.bezierCurveTo(8*scale,11*scale,12*scale,-2*scale,0,-16*scale);f.fill();f.restore();
        // Center depth and canopy shade attenuate caustics rather than brightening all water equally.
        const mask=lightMask.getContext('2d'), mw=lightMask.width, mh=lightMask.height;
        const mg=mask.createRadialGradient(mw*.53,mh*.48,mh*.05,mw*.5,mh*.5,mw*.65);
        mg.addColorStop(0,'rgba(255,255,255,.14)');mg.addColorStop(.6,'rgba(255,255,255,.60)');mg.addColorStop(1,'rgba(255,255,255,.8)');
        mask.fillStyle=mg;mask.fillRect(0,0,mw,mh);
        mask.globalCompositeOperation='destination-out';
        const shadow=mask.createRadialGradient(mw*.97,mh*.08,0,mw*.97,mh*.08,mh*.5);
        shadow.addColorStop(0,'rgba(0,0,0,.75)');shadow.addColorStop(1,'rgba(0,0,0,0)');mask.fillStyle=shadow;mask.fillRect(0,0,mw,mh);
        const shade=canopy.getContext('2d');
        for(let i=0;i<340;i++) {
            const x=w*(.72+random()*.32),y=h*random()*.43;
            if((x-w*.98)**2/(w*.27)**2+(y-h*.05)**2/(h*.39)**2>1.2)continue;
            shade.fillStyle=`rgba(35,64,41,${.025+random()*.055})`;
            shade.beginPath();shade.ellipse(x,y,(6+random()*19)*scale,(3+random()*8)*scale,random()*6.28,0,6.29);shade.fill();
        }
    }
    return {
        bed(c, width, height, waterHue) {
            if (w !== width || h !== height || hue !== waterHue) build(width, height, waterHue);
            c.drawImage(bed, 0, 0);
        },
        light(c, time) {
            // A warped interference field gives connected, deforming light cells.
            // Cache at 15 Hz and half resolution rather than blurring a full screen every frame.
            if(time-lastLightTime>1/15 || lastLightTime<0) {
                lastLightTime=time;
                const lc=waterLight.getContext('2d'),lw=waterLight.width,lh=waterLight.height;
                lc.clearRect(0,0,lw,lh);
                const cols=96,rows=Math.max(24,Math.round(cols*lh/lw));
                const dx=lw/cols,dy=lh/rows,grid=[];
                for(let y=0;y<=rows;y++)for(let x=0;x<=cols;x++){
                    const u=x/cols*19,v=y/cols*19;
                    const a=u+Math.sin(v*1.8+time*.18)*.48+Math.cos(v*.8-time*.11)*.35;
                    const b=v+Math.cos(u*1.5-time*.15)*.43;
                    grid.push(Math.sin(a*3.6)+Math.cos(b*3.6)+.42*Math.sin(a*2-b*2+time*.12)+.28*Math.cos(a*4.6+b*3.7-time*.15));
                }
                lc.beginPath();
                for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
                    const values=[grid[y*(cols+1)+x],grid[y*(cols+1)+x+1],grid[(y+1)*(cols+1)+x+1],grid[(y+1)*(cols+1)+x]];
                    const corners=[[x*dx,y*dy],[(x+1)*dx,y*dy],[(x+1)*dx,(y+1)*dy],[x*dx,(y+1)*dy]],hits=[];
                    for(let e=0;e<4;e++){
                        const n=(e+1)%4,a=values[e]-.65,b=values[n]-.65;
                        if((a<0)!==(b<0)){
                            const t=a/(a-b);hits.push([corners[e][0]+t*(corners[n][0]-corners[e][0]),corners[e][1]+t*(corners[n][1]-corners[e][1])]);
                        }
                    }
                    // Slowly varying gaps break the continuous contour-map appearance.
                    if(Math.sin(x*.24+y*.32+time*.23)+Math.cos(y*.29-x*.17-time*.19) > -.25)
                        for(let i=0;i+1<hits.length;i+=2){lc.moveTo(...hits[i]);lc.lineTo(...hits[i+1]);}
                }
                lc.lineJoin='round';lc.lineCap='round';
                lc.strokeStyle='rgba(223,243,186,.032)';lc.lineWidth=2.2;lc.stroke();
                lc.strokeStyle='rgba(231,246,203,.055)';lc.lineWidth=1.0;lc.stroke();
                lc.strokeStyle='rgba(242,255,222,.085)';lc.lineWidth=.5;lc.stroke();
                lc.globalCompositeOperation='destination-in';lc.drawImage(lightMask,0,0);lc.globalCompositeOperation='source-over';
            }
            c.save();c.globalCompositeOperation='screen';c.drawImage(waterLight,0,0,w,h);c.restore();
        },
        surface(c, time) {
            c.save();
            const sun=c.createLinearGradient(0,h,w,0);
            sun.addColorStop(0,'rgba(224,221,161,0)');sun.addColorStop(.42,'rgba(224,221,161,0)');
            sun.addColorStop(.5,'rgba(239,224,153,.045)');sun.addColorStop(.57,'rgba(224,221,161,0)');sun.addColorStop(1,'rgba(224,221,161,0)');
            c.fillStyle=sun;c.fillRect(0,0,w,h);
            c.drawImage(canopy,Math.sin(time*.17)*3,Math.cos(time*.14)*2);
            c.restore();
            for(const item of leaves) {
                c.save();c.translate(item.x+Math.sin(time*item.rate+item.phase)*1.6,item.y+Math.cos(time*item.rate*.83+item.phase)*1.1);
                c.rotate(Math.sin(time*item.rate*.65+item.phase)*.013);
                c.drawImage(item.sprite,-item.extent,-item.extent);c.restore();
            }
            c.drawImage(foliage, Math.sin(time * .23) * .7, Math.cos(time * .19) * .5);
        }
    };
})();
