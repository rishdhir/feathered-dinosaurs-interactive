// Reuse the user's actual Liquid Glass module; don't reimplement its optics.
const stage=document.querySelector('#stage'),mode=document.querySelector('#mode');stage.append(mode);
mode.classList.add('glass-surface');const jump=document.querySelector('.jump');jump.classList.add('glass-surface');
const controls=document.querySelector('.controls');
// The dock sits outside the image, so a small, low-rate copy of the live artwork
// supplies a real changing backdrop. It is decorative and never captures input.
const housing=document.createElement('div');housing.className='dock-housing';controls.before(housing);housing.append(controls);
const underlay=document.createElement('canvas');underlay.className='glass-underlay';underlay.width=380;underlay.height=42;underlay.setAttribute('aria-hidden','true');housing.prepend(underlay);
const ctx=underlay.getContext('2d'),source=document.querySelector('#fluid');let previous=0;
function backdrop(now){if(!document.hidden&&now-previous>125){ctx.clearRect(0,0,380,42);ctx.drawImage(source,100,220,1080,420,0,0,380,42);previous=now;}requestAnimationFrame(backdrop);}requestAnimationFrame(backdrop);
const glassInstances=[
 window.liquidGlass(controls,{scale:-60,chroma:3,border:.12,mapBlur:12,blur:3,saturate:1.25,radius:30}),
 window.liquidGlass(jump,{scale:-48,chroma:2,border:.12,mapBlur:10,blur:3,saturate:1.2,radius:24}),
 window.liquidGlass(mode,{scale:-35,chroma:2,border:.14,mapBlur:8,blur:3,saturate:1.2,radius:18})
];
document.body.dataset.glass=glassInstances.every(x=>x.supported)?'refractive':'frosted-fallback';
for(const el of [controls,jump])el.addEventListener('pointermove',e=>{const r=el.getBoundingClientRect();el.style.setProperty('--glass-x',`${(e.clientX-r.left)/r.width*100}%`);});
window.addEventListener('pagehide',()=>glassInstances.forEach(x=>x.destroy()),{once:true});
