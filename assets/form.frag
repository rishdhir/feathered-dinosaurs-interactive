uniform vec4 uTime;
uniform vec4 uVoice;
uniform vec4 uScore;
out vec4 fragColor;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 a=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(a),h(a+vec2(1,0)),f.x),mix(h(a+vec2(0,1)),h(a+1.),f.x),f.y);}
float fbm(vec2 p){return .57*n(p)+.28*n(p*2.03+17.)+.15*n(p*4.11+43.);}
float sm(float a,float b,float k){float h=clamp(.5+.5*(b-a)/k,0.,1.);return mix(b,a,h)-k*h*(1.-h);}
float cap(vec2 p,vec2 a,vec2 b,float r){vec2 q=p-a,v=b-a;return length(q-v*clamp(dot(q,v)/dot(v,v),0.,1.))-r;}
float ell(vec2 p,vec2 r){return (length(p/r)-1.)*min(r.x,r.y);}
mat2 rot(float a){return mat2(cos(a),-sin(a),sin(a),cos(a));}
float dinosaur(vec2 p,float activity,float t){
 p.y-=.016*sin(t*1.7);float gait=sin(t*(1.2+activity*1.4));
 float d=ell(p,vec2(.24,.115));
 vec2 neck=mix(vec2(.22,.18),vec2(.25,.08),activity),head=mix(vec2(.32,.27),vec2(.37,.15),activity);
 d=sm(d,cap(p,vec2(.14,.06),neck,mix(.059,.050,activity)),.06);
 d=sm(d,cap(p,neck,head,mix(.046,.04,activity)),.025);
 d=sm(d,ell(p-head,vec2(.077,.048)),.02);
 d=sm(d,cap(p,head,head+vec2(.084,-.005),.030),.018);
 for(int i=0;i<12;i++){float k=float(i)/12.;vec2 a=vec2(-.18-.44*k,.025+.07*sin(k*2.2+t*.8)*k);vec2 b=vec2(-.18-.44*(k+1./12.),.025+.07*sin((k+1./12.)*2.2+t*.8)*(k+1./12.));d=sm(d,cap(p,a,b,.052*(1.-k)+.002),.015);}
 for(int j=0;j<2;j++){float s=j==0?-1.:1.;float x=-.09+s*.105;vec2 hip=vec2(x,-.065),knee=vec2(x+.05*activity+s*.025*gait,-.18),foot=vec2(x+.045*activity-s*.045*gait,-.285+.02*max(0.,s*gait));
  d=sm(d,cap(p,hip,knee,.038),.028);d=sm(d,cap(p,knee,foot,.022),.018);d=min(d,cap(p,foot,foot+vec2(.075,.002),.016));
 }
 float arm=cap(p,vec2(.18,.015),vec2(.23,-.065+.018*gait),.019);d=sm(d,arm,.02);
 if(activity>.05){for(int j=0;j<16;j++){float k=float(j)/15.;vec2 a=vec2(-.39+k*.57,.075+.055*sin(k*3.));vec2 b=a+vec2(-.055-.04*k,.05+.045*sin(k*3.14));d=sm(d,cap(p,a,b,.008*activity),.01*activity);}}
 // Eye and jaw are negative space, so the flowing material retains readable anatomy.
 d=max(d,-(length(p-(head+vec2(.025,.013)))-.008));
 d=max(d,-cap(p,head+vec2(.02,-.018),head+vec2(.09,-.02),.003));
 return d;
}
float feather(vec2 p,float t,float width){
 p=rot(.14*sin(t*.8))*p;p.x-=.028*sin(p.y*5.+t*.8);
 float y=p.y+.29;float wid=width*pow(max(0.,sin(clamp(y/.64,0.,1.)*3.14159)),.72);
 float vane=max(abs(p.x)-wid,max(-y,y-.64));
 float barb=.5+.5*sin(p.y*190.-abs(p.x)*110.+t*.7);
 vane+=.0035*barb;
 return min(vane,cap(p,vec2(0,-.37),vec2(0,.33),.004));
}
float fossil(vec2 p,float t){
 p=rot(-.15+.025*sin(t*.3))*p;
 float d=cap(p,vec2(-.39,.015),vec2(.28,.07),.012);
 for(int j=0;j<14;j++){float x=-.23+float(j)*.034;float len=.11*sqrt(max(0.,1.-pow((x+.02)/.3,2.)));d=min(d,cap(p,vec2(x,.05),vec2(x-.028,.05-len),.008));d=min(d,cap(p,vec2(x,.05),vec2(x-.025,.05+len*.7),.006));}
 d=min(d,ell(p-vec2(.36,.09),vec2(.055,.038)));
 d=min(d,cap(p,vec2(.22,.06),vec2(.33,.10),.013));
 d=min(d,cap(p,vec2(-.05,0),vec2(.04,-.14),.017));d=min(d,cap(p,vec2(.04,-.14),vec2(-.10,-.26),.010));
 d=min(d,cap(p,vec2(.14,.04),vec2(.23,-.07),.010));d=min(d,cap(p,vec2(.23,-.07),vec2(.38,-.08),.007));
 for(int j=0;j<10;j++){float k=float(j);d=min(d,cap(p,vec2(-.27+k*.028,.08),vec2(-.38+k*.043,.23+.04*sin(k*.3)),.0035));}
 return d;
}
float field(vec2 p,int mode,float t){
 if(mode==0)return dinosaur(p,0.,t);
 if(mode==1)return dinosaur(p,1.,t);
 if(mode==2)return fossil(p,t);
 if(mode==3){float d=10.;for(int j=0;j<5;j++){float k=float(j)-2.;vec2 q=rot(k*.40+.10*sin(t*.6))*(p-vec2(0,-.06));q.y-=.08;d=min(d,feather(q*1.27,t+k,.095)/1.27);}return d;}
 if(mode==4){float a=feather((p-vec2(-.29,-.02))*1.1,t,.14)/1.1;float b=feather((p-vec2(.26,.015))*1.0,t+2.,.18);return min(a,b);}
 if(mode==5)return sm(dinosaur((p-vec2(-.12,-.04))*1.3,1.,t)/1.3,feather(rot(-.4)*(p-vec2(.38,.0))*1.4,t,.14)/1.4,.018);
 if(mode==6){
  float d=10.;for(int j=0;j<36;j++){float y=-.29+float(j)*.017;float x=.16*sin(y*16.+t*.48);
   d=sm(d,length(p-vec2(x,y))-.029,.025);d=sm(d,length(p-vec2(-x,y))-.029,.025);
   if(j%3==0)d=min(d,cap(p,vec2(x,y),vec2(-x,y),.008));}return d;
 }
 if(mode==7){
  float d=10.;for(int j=0;j<6;j++){float k=float(j);vec2 q=p;q.y-=-.23+k*.087+.016*sin(p.x*5.+t*.23+k);float band=max(abs(q.y)-.026,abs(q.x)-(.58-.035*k));d=sm(d,band,.009);}return d;
 }
 if(mode==8){
  // Equal shape; ratio of scale factors sqrt(10), hence 10:1 area.
  float a=dinosaur((p-vec2(-.12,.035))*1.10,0.,t)/1.10;
  float b=dinosaur((p-vec2(.55,-.20))*3.478505,0.,t+1.)/3.478505;return min(a,b);
 }
 if(mode==9){
  float d=ell(p-vec2(0,-.03),vec2(.15,.075));float flap=.25+.16*sin(t*1.7);
  for(int j=0;j<2;j++){float s=j==0?-1.:1.;vec2 q=p-vec2(s*.16,.015);q=rot(s*flap)*q;d=sm(d,ell(q,vec2(.25,.070)),.03);
   for(int k=0;k<7;k++){float a=float(k);d=sm(d,cap(p,vec2(s*(.16+.032*a),.04+a*.014),vec2(s*(.18+.036*a),.13+a*.012+.045*sin(t*1.7)),.014),.012);}}
  d=sm(d,ell(p-vec2(.18,.02),vec2(.045,.038)),.025);d=min(d,cap(p,vec2(.20,.015),vec2(.27,.005),.014));return d;
 }
 if(mode==10){
  float d=10.;float drift=.045+.025*sin(t*.13);
  for(int j=0;j<5;j++){float k=float(j);vec2 center=vec2((k-2.)*(.17+drift),.10*sin(k*2.));vec2 q=rot(k*.7+.02*sin(t*.2))*(p-center);float island=ell(q,vec2(.12,.18))+.018*(fbm(q*18.+k)-.5);d=min(d,island);}return d;
 }
 if(mode==11){
  float a=dinosaur((p-vec2(-.40,.04))*2.4,0.,t)/2.4;
  float b=dinosaur((p-vec2(.06,-.07))*2.65,0.,t+2.)/2.65;
  for(int j=0;j<5;j++){float x=-.01+float(j)*.027;b=min(b,ell(p-vec2(x,.006+float(j)*.003),vec2(.012,.036)));}
  float d=dinosaur((p-vec2(.48,.04))*2.6,1.,t+1.)/2.6;return min(a,min(b,d));
 }
 float ripple=abs(length(p-vec2(-.20,.12))-(.15+.13*(.5+.5*sin(t*.50))))-.020;
 return min(ripple,feather((p-vec2(.25,-.01))*1.4,t,.12)/1.4);
}
void main(){
 vec2 uv=vUV.st,p=(uv-vec2(.53,.43))*vec2(1.77778,1.);float t=uTime.x;
 int mode=int(uScore.x+.5),previous=int(uScore.y+.5);float blend=smoothstep(0.,1.,uScore.z);
 vec2 warp=vec2(fbm(p*7.+vec2(t*.18,0)),fbm(p*7.+vec2(22.,t*.16)))-.5;
 p+=warp*(.010+.014*uVoice.x);
 float d=field(p,mode,t);
 if(blend<1. && previous!=mode)d=mix(field(p,previous,t),d,blend);
 // Secondary semantic details remain at the periphery and emerge with each phrase.
 int extra=int(uScore.w+.5);float e=10.;
 if(extra==1){for(int j=0;j<2;j++){float s=j==0?-1.:1.;vec2 q=rot(s*.35+.08*sin(t*.4))*(p-vec2(s*.63,.08+.025*sin(t*.8+s)));e=min(e,feather(q*3.8,t+s,.10)/3.8);}}
 if(extra==2){for(int j=0;j<3;j++){float k=float(j);vec2 center=vec2(-.57+k*.55,-.25+.02*sin(t*.5+k));e=min(e,ell(rot(t*.12+k)*(p-center),vec2(.035,.014)));}}
 if(extra==3){for(int j=0;j<7;j++){float k=float(j);vec2 center=vec2(-.58+k*.19,.25+.025*sin(t*.8+k));e=min(e,length(p-center)-(.014+.007*uVoice.x));}}
 d=min(d,e+(1.-blend)*.2);
 float grain=fbm(p*32.-vec2(t*.35,t*.13));
 float mask=1.-smoothstep(-.004,.008,d);
 float strata=.5+.5*sin(p.x*36.+p.y*54.+grain*13.+t*.6);
 float vein=pow(.5+.5*sin(grain*24.+p.y*65.-t*1.4),6.);
 float detail=mix(strata,vein,.6);
 if(mode==4){vec2 q=p-(p.x<0.?vec2(-.29,-.02):vec2(.26,.015));q=rot(.14*sin((t+(p.x<0.?0.:2.))*.8))*q;
  float ribs=pow(.5+.5*cos(q.y*145.-abs(q.x)*110.),8.);float shaft=exp(-abs(q.x)*210.);detail=mix(detail,clamp(.15+.7*ribs+shaft,0.,1.),blend*.72);}
 float safe=smoothstep(.10,.15,uv.y)*(1.-smoothstep(.75,.80,uv.y));
 fragColor=TDOutputSwizzle(vec4(mask*safe,detail,clamp(d*10.+.5,0.,1.),1.));
}
