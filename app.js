import {SOURCE_OFFSET,DURATION,cueAt,interactionWeight,modeFor,formatTime} from './state.js';
const $=s=>document.querySelector(s),canvas=$('#fluid'),audio=$('#audio'),stage=$('#stage');
const W=1280,H=720,STEP=1/30;let ready=false,lastCue=-1,rendered=0,resetPending=false;
const pointer={x:.5,y:.5,dx:0,dy:0,last:-100,inside:false};
let forceWeight=0,flowClock=SOURCE_OFFSET,lastFrame=performance.now(),accumulator=0,statsStart=performance.now(),statsFrames=0,gl;
function fail(error){console.error(error);$('#error').hidden=false;$('#error').textContent='The local simulation could not start: '+error.message+'. Try a desktop browser with hardware acceleration enabled.';$('#mode').textContent='SIMULATION UNAVAILABLE';audio.pause();}
async function get(path,type='text'){const r=await fetch(path);if(!r.ok)throw Error(`${path}: ${r.status}`);return r[type]();}
try{
 gl=canvas.getContext('webgl2',{alpha:false,antialias:false,preserveDrawingBuffer:true,powerPreference:'high-performance'});
 if(!gl)throw Error('WebGL2 is unavailable');
 if(!gl.getExtension('EXT_color_buffer_float'))throw Error('Floating-point GPU feedback is unavailable');
 const [formSrc,advectSrc,surfaceSrc,score,featureBuffer]=await Promise.all([get('assets/form.frag'),get('assets/advect.frag'),get('assets/surface.frag'),get('assets/score.json','json'),get('assets/speech.f32','arrayBuffer')]);
 const features=new Float32Array(featureBuffer);if(features.length!==72000)throw Error('Audio feature data is incomplete');
 const vertex=`#version 300 es
 out vec2 vUV;void main(){vec2 p=vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2));vUV=p;gl_Position=vec4(p*2.-1.,0.,1.);}`;
 const prefix=`#version 300 es
 precision highp float;in vec2 vUV;uniform sampler2D sTD2DInputs[2];vec4 TDOutputSwizzle(vec4 x){return x;}
 `;
 function compile(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
 function program(source){const p=gl.createProgram(),vs=compile(gl.VERTEX_SHADER,vertex),fs=compile(gl.FRAGMENT_SHADER,prefix+source);gl.attachShader(p,vs);gl.attachShader(p,fs);gl.linkProgram(p);gl.deleteShader(vs);gl.deleteShader(fs);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));const uniforms={};for(const n of ['uTime','uVoice','uScore','uPointer','uInteraction','sTD2DInputs[0]','sTD2DInputs[1]'])uniforms[n]=gl.getUniformLocation(p,n);return {p,uniforms};}
 const programs={form:program(formSrc),advect:program(advectSrc),surface:program(surfaceSrc)};
 gl.bindVertexArray(gl.createVertexArray());gl.disable(gl.DEPTH_TEST);gl.disable(gl.BLEND);
 function target(){const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA16F,W,H,0,gl.RGBA,gl.HALF_FLOAT,null);for(const p of [gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER])gl.texParameteri(gl.TEXTURE_2D,p,gl.LINEAR);for(const p of [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T])gl.texParameteri(gl.TEXTURE_2D,p,gl.CLAMP_TO_EDGE);const fbo=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,fbo);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,texture,0);if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw Error('GPU feedback target is incomplete');return {texture,fbo};}
 const form=target(),history=[target(),target()];let front=0;
 function clear(){for(const x of history){gl.bindFramebuffer(gl.FRAMEBUFFER,x.fbo);gl.clearColor(0,0,0,1);gl.clear(gl.COLOR_BUFFER_BIT);}front=0;pointer.last=-100;forceWeight=0;}
 function draw(p,target,textures,time,voice,sc){gl.useProgram(p.p);gl.bindFramebuffer(gl.FRAMEBUFFER,target?.fbo??null);gl.viewport(0,0,W,H);for(let i=0;i<textures.length;i++){gl.activeTexture(gl.TEXTURE0+i);gl.bindTexture(gl.TEXTURE_2D,textures[i].texture);gl.uniform1i(p.uniforms[`sTD2DInputs[${i}]`],i);}gl.uniform4f(p.uniforms.uTime,time,time,0,0);gl.uniform4fv(p.uniforms.uVoice,voice);gl.uniform4fv(p.uniforms.uScore,sc);gl.uniform4f(p.uniforms.uPointer,pointer.x,pointer.y,pointer.dx,pointer.dy);gl.uniform4f(p.uniforms.uInteraction,forceWeight,0,0,0);gl.drawArrays(gl.TRIANGLES,0,3);}
 function uniforms(){const source=Math.min(599.9666667,audio.currentTime+SOURCE_OFFSET),q=cueAt(score.cues,source);if(q.index!==lastCue){$('#title').textContent=q.cue.title.toUpperCase();$('#subtitle').textContent=q.cue.subtitle;lastCue=q.index;}const i=Math.min(17999,Math.round(source*30))*4;return {source,voice:features.subarray(i,i+4),sc:[q.cue.form,q.previous.form,Math.min(1,(source-q.cue.start)/q.cue.transition_seconds),q.cue.extra],cue:q.index};}
 function step(now,warm=false){const u=uniforms();forceWeight=warm?0:interactionWeight(Math.max(0,now-pointer.last));flowClock+=STEP;draw(programs.form,form,[],u.source,u.voice,u.sc);draw(programs.advect,history[1-front],[history[front],form],flowClock,u.voice,u.sc);front=1-front;pointer.dx*=.85;pointer.dy*=.85;rendered++;}
 function present(){const u=uniforms();draw(programs.surface,null,[history[front],form],flowClock,u.voice,u.sc);const mode=modeFor(forceWeight);$('#mode').textContent=mode;stage.dataset.mode=mode;stage.dataset.force=forceWeight.toFixed(4);stage.dataset.cue=u.cue;stage.dataset.frames=rendered;$('#seek').value=audio.currentTime;$('#time').textContent=`${formatTime(audio.currentTime)} / ${formatTime(DURATION)}`;}
 clear();for(let i=0;i<90;i++)step(0,true);present();
 function tick(now){if(document.hidden){lastFrame=now;requestAnimationFrame(tick);return;}const dt=Math.min(.15,(now-lastFrame)/1000);lastFrame=now;accumulator+=dt;
  if(resetPending){clear();flowClock=audio.currentTime+SOURCE_OFFSET;for(let i=0;i<60;i++)step(now/1000,true);resetPending=false;accumulator=0;}
  let steps=0;while(accumulator>=STEP&&steps<3){step(now/1000);accumulator-=STEP;steps++;statsFrames++;}if(steps)present();
  if(now-statsStart>1000){const fps=statsFrames*1000/(now-statsStart);$('#stats').textContent=`${fps.toFixed(1)} simulation fps · WebGL2 · 1280 × 720 · pointer influence ${(forceWeight*100).toFixed(0)}% · audio ${audio.paused?'paused':'playing'} · cue ${lastCue+1}/52`;stage.dataset.fps=fps.toFixed(1);statsStart=now;statsFrames=0;}
  requestAnimationFrame(tick);
 }
 ready=true;document.body.dataset.ready='true';for(const b of ['play','seek','sound','restore'])$('#'+b).disabled=false;requestAnimationFrame(tick);
 canvas.addEventListener('pointermove',e=>{const rect=canvas.getBoundingClientRect(),x=Math.min(1,Math.max(0,(e.clientX-rect.left)/rect.width)),y=Math.min(1,Math.max(0,1-(e.clientY-rect.top)/rect.height));if(pointer.inside){const dx=x-pointer.x,dy=y-pointer.y;if(Math.hypot(dx,dy)>.0002){pointer.dx=Math.max(-.035,Math.min(.035,dx));pointer.dy=Math.max(-.035,Math.min(.035,dy));pointer.last=performance.now()/1000;}}pointer.x=x;pointer.y=y;pointer.inside=true;});
 canvas.addEventListener('pointerleave',()=>{pointer.inside=false;});
 canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);pointer.last=performance.now()/1000;});
 canvas.addEventListener('pointerup',e=>{if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);});
 $('#restore').onclick=()=>{pointer.last=-100;pointer.dx=pointer.dy=0;};
 audio.addEventListener('seeking',()=>{resetPending=true;});audio.addEventListener('ended',()=>{$('#play').textContent='Play again';});
 document.addEventListener('visibilitychange',()=>{lastFrame=performance.now();accumulator=0;if(!document.hidden)resetPending=true;});
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();fail(Error('The browser lost its GPU context. Reload this page'));});
}catch(e){fail(e);}
$('#play').onclick=async()=>{if(!ready)return;try{if(audio.paused){if(audio.currentTime>=DURATION-.1)audio.currentTime=0;await audio.play();}else audio.pause();}catch(e){$('#mode').textContent='CLICK PLAY TO ENABLE AUDIO';}};
audio.addEventListener('play',()=>{$('#play').textContent='Pause podcast';});audio.addEventListener('pause',()=>{$('#play').textContent='Play podcast';});
$('#seek').addEventListener('input',e=>{audio.currentTime=Number(e.target.value);});
$('#chapters').onchange=e=>{if(ready)audio.currentTime=Number(e.target.value);};
$('#sound').onclick=()=>{audio.muted=!audio.muted;$('#sound').textContent=audio.muted?'Sound off':'Sound on';$('#sound').setAttribute('aria-label',audio.muted?'Unmute podcast':'Mute podcast');};
$('#fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.querySelector('main').requestFullscreen();}catch{}};
audio.addEventListener('error',()=>{if(audio.error)fail(Error('The local podcast audio could not be loaded'));});
