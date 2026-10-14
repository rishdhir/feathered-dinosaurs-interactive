uniform vec4 uTime;
uniform vec4 uVoice;
uniform vec4 uPointer;
uniform vec4 uInteraction;
out vec4 fragColor;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
float potential(vec2 p,float t){return noise(p*6.+vec2(t*.16,t*.1))+.3*noise(p*15.-vec2(t*.22,t*.11));}
void main(){
 vec2 uv=vUV.st,px=vec2(1./1280.,1./720.);float t=uTime.x;float e=.002;
 vec2 grad=vec2(potential(uv+vec2(e,0),t)-potential(uv-vec2(e,0),t),potential(uv+vec2(0,e),t)-potential(uv-vec2(0,e),t))/(2.*e);
 vec2 velocity=vec2(grad.y,-grad.x)*(.00014+.00035*uVoice.x);
 velocity+=vec2(.00015*sin(t*.6+uv.y*9.),.0003);
 // A decaying pointer force perturbs the actual feedback state, not a video overlay.
 vec2 delta=(uv-uPointer.xy)*vec2(1.77778,1.);
 float influence=exp(-dot(delta,delta)/.075)*uInteraction.x;
 vec2 pointerVelocity=clamp(uPointer.zw*2.5,vec2(-.045),vec2(.045));
 vec2 swirl=vec2(-delta.y/1.77778,delta.x)*.055;
 velocity+=(pointerVelocity+swirl)*influence;
 vec4 target=texture(sTD2DInputs[1],uv);vec2 back=clamp(uv-velocity,px,1.-px);
 vec4 old=texture(sTD2DInputs[0],back);
 vec4 near=(texture(sTD2DInputs[0],back+vec2(px.x,0))+texture(sTD2DInputs[0],back-vec2(px.x,0))+texture(sTD2DInputs[0],back+vec2(0,px.y))+texture(sTD2DInputs[0],back-vec2(0,px.y)))*.25;
 old=mix(old,near,.19);
 float story=1.-.94*uInteraction.x;
 float injection=(.018+.026*uVoice.x+.024*uVoice.y)*target.r*(.28+.72*target.g)*story;
 float density=old.r*mix(.964,.997,uInteraction.x)+injection+.022*influence;
 density=mix(density,max(density,target.r*(.35+.18*target.g)),.085*story);
 float pigment=old.g*mix(.955,.996,uInteraction.x)+target.r*target.g*.044*story+.014*influence;
 float rim=old.b*.97+length(velocity)*18.*target.r;
 fragColor=TDOutputSwizzle(vec4(clamp(vec3(density,pigment,rim),0.,1.),1.));
}
