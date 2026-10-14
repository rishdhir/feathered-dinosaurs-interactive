uniform vec4 uTime;
uniform vec4 uVoice;
out vec4 fragColor;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
void main(){
 vec2 uv=vUV.st,px=vec2(1./1280.,1./720.);vec4 a=texture(sTD2DInputs[0],uv),m=texture(sTD2DInputs[1],uv);
 float dx=texture(sTD2DInputs[0],uv+vec2(px.x*2.,0)).r-texture(sTD2DInputs[0],uv-vec2(px.x*2.,0)).r;
 float dy=texture(sTD2DInputs[0],uv+vec2(0,px.y*2.)).r-texture(sTD2DInputs[0],uv-vec2(0,px.y*2.)).r;
 vec3 normal=normalize(vec3(-dx*13.,-dy*13.,.28));vec3 light=normalize(vec3(-.45,.65,1.));
 float diffuse=max(0.,dot(normal,light));float spec=pow(max(0.,dot(reflect(-light,normal),vec3(0,0,1))),25.);
 vec3 bg=mix(vec3(.008,.020,.029),vec3(.016,.043,.055),uv.y);
 float cloud=pow(max(a.r,0.),.70)*1.55;float hue=clamp(a.g*1.8+m.g*.28+uVoice.y*.06,0.,1.);
 vec3 material=mix(vec3(.035,.28,.30),vec3(.26,.72,.64),smoothstep(.1,.65,hue));
 material=mix(material,vec3(1.,.47,.18),smoothstep(.62,.91,hue));
 material=mix(material,vec3(1.,.90,.64),smoothstep(.89,1.,hue));
 vec3 c=bg+material*cloud*(.45+diffuse*.8)+vec3(.74,.97,.93)*spec*cloud*.6;
 float edge=length(vec2(dx,dy));c+=vec3(.14,.49,.47)*edge*1.5;
 float mist=texture(sTD2DInputs[0],uv+vec2(.008,.006)).r;c+=vec3(.025,.12,.13)*mist;
 float grain=hash(floor(uv*vec2(1280,720)));c+=vec3(grain-.5)*.014;
 // Suspended bright grains follow the changing density, not an unrelated particle overlay.
 c+=vec3(.75,.89,.76)*step(.996,grain)*cloud*.55;
 float vignette=1.-.38*length((uv-.5)*vec2(1.2,1.));c*=vignette;
 fragColor=TDOutputSwizzle(vec4(c,1.));
}
