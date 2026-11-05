/* Innsiden — private architectural WebGL2 exhibition. No external dependencies. */
(function (global) {
  'use strict';
  const VERT = `#version 300 es
  precision highp float;
  layout(location=0) in vec3 aPosition;
  layout(location=1) in vec3 aNormal;
  layout(location=2) in vec2 aUV;
  layout(location=3) in float aMaterial;
  uniform mat4 uViewProjection;
  out vec3 vWorld; out vec3 vNormal; out vec2 vUV; flat out int vMaterial;
  void main(){vWorld=aPosition;vNormal=aNormal;vUV=aUV;vMaterial=int(aMaterial+.5);gl_Position=uViewProjection*vec4(aPosition,1.);}`;
  const FRAG = `#version 300 es
  precision highp float;
  in vec3 vWorld; in vec3 vNormal; in vec2 vUV; flat in int vMaterial;
  uniform vec3 uEye; uniform float uQuality;
  out vec4 outColor;
  float hash(vec3 p){p=fract(p*.1031);p+=dot(p,p.yzx+33.33);return fract((p.x+p.y)*p.z);}
  float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
  void main(){
    vec3 N=normalize(vNormal),V=normalize(uEye-vWorld);
    float grain=noise(vWorld*12.)-.5;
    float fine=noise(vWorld*49.)-.5;
    float strata=noise(vec3(vWorld.x*1.7,vWorld.y*.12,vWorld.z*1.7))-.5;
    vec3 base=vec3(.28,.285,.27);float rough=.91,metal=0.;
    if(vMaterial==1){float stoneCloud=noise(vWorld*2.8)-.5;float slab=noise(floor(vWorld.xz/2.5).xyx)-.5;base=vec3(.40,.38,.34)+strata*.035+stoneCloud*.026+slab*.018+grain*.018;rough=.83;}
    if(vMaterial==2){base=vec3(.47,.32,.16)+grain*.012;rough=.43;metal=.78;}
    if(vMaterial==3){base=vec3(.15,.17,.17)+strata*.018;rough=.78;}
    if(vMaterial==4){base=vec3(.56,.48,.31)+grain*.012;rough=.48;metal=.72;}
    if(vMaterial==5){base=vec3(.10,.11,.11);rough=.51;}
    if(vMaterial==6){base=vec3(.57,.45,.26);rough=.52;metal=.62;}
    if(vMaterial==7){base=vec3(.90,.86,.71);rough=.83;}
    if(vMaterial==8){base=vec3(.055,.063,.065);rough=.34;metal=.14;}
    if(vMaterial==9){base=vec3(.65,.69,.67);rough=.2;metal=.7;}
    if(vMaterial==0){float plasterCloud=noise(vWorld*2.4)-.5;base+=strata*.018+plasterCloud*.031+grain*.017+fine*.007;}
    // Derivative-based relief is subtle enough to read as plaster and honed stone.
    if(vMaterial==0||vMaterial==1||vMaterial==3){float relief=grain*.018+fine*.006;N=normalize(N-vec3(dFdx(relief),0.,dFdy(relief))*.18);}
    vec3 ambient=vec3(.18,.19,.18);
    vec3 L1=normalize(vec3(-.52,.82,.27)),L2=normalize(vec3(.55,.70,-.36));
    float d1=max(dot(N,L1),0.),d2=max(dot(N,L2),0.);
    float cavity=1.;
    if(vMaterial==1){float seam=min(fract(abs(vWorld.x)*.52),fract(abs(vWorld.z)*.52));cavity-=.045*(1.-smoothstep(.006,.025,seam));}
    if(vMaterial==0||vMaterial==3){
      float formLine=abs(fract((vWorld.y+.13)/1.52)-.5);
      cavity-=.026*(1.-smoothstep(.002,.012,formLine));
      cavity-=.15*(1.-smoothstep(.04,.72,vWorld.y));
      for(int i=0;i<5;i++){float z=14.1-float(i)*7.5;cavity-=.10*(1.-smoothstep(.03,.55,abs(vWorld.z-z)))*max(abs(N.x),.1);}
    }
    vec3 light=ambient+vec3(.93,.85,.70)*d1*.65+vec3(.41,.48,.47)*d2*.31;
    float pool=0.;
    for(int i=0;i<5;i++){float z=13.-float(i)*7.5;float r=length((vWorld.xz-vec2(0.,z))*vec2(.72,1.));pool+=exp(-r*r*.17)*.30;}
    light+=vec3(.88,.72,.50)*pool*max(N.y,.15);
    float wallWash=0.;for(int i=0;i<5;i++){float z=10.-float(i)*7.5;float wall=exp(-pow(abs(vWorld.x)-5.2,2.)*.28);float spot=exp(-pow((vWorld.z-z)*.55,2.)-pow((vWorld.y-3.3)*.33,2.));wallWash+=wall*spot;}
    light+=vec3(.90,.75,.55)*wallWash*.48*max(abs(N.x),.24);
    float daylight=exp(-pow((vWorld.x+4.7+(vWorld.z-8.)*.13)*.35,2.))*exp(-pow((vWorld.z-4.)*.06,2.));
    light+=vec3(.51,.57,.55)*daylight*max(N.y,.18)*.48;
    float edge=max(dot(N,V),0.);float fres=pow(1.-edge,5.);
    vec3 H=normalize(V+L1);float specPower=mix(9.,90.,1.-rough);float spec=pow(max(dot(N,H),0.),specPower)*(1.-rough)*(.27+metal*.74);
    vec3 color=base*light*cavity+mix(vec3(.39,.38,.34),vec3(.84,.68,.43),metal)*spec*d1;
    if(metal>.4){float longHighlight=pow(max(dot(N,normalize(V+L2)),0.),mix(9.,55.,1.-rough));color+=base*longHighlight*.14*d2;}
    // Narrow glazing and its mullions cast a legible, soft diagonal pattern on the floor.
    if(vMaterial==1){float windowZone=exp(-pow((vWorld.z-2.)*.055,2.));float beam=1.-smoothstep(.26,.75,abs(vWorld.x+2.5+(vWorld.z-2.)*.17));
      float mullion=1.-.72*(1.-smoothstep(.025,.11,abs(fract((vWorld.x+2.5+(vWorld.z-2.)*.17)*.72)-.5)));color+=base*vec3(.18,.21,.19)*beam*windowZone*mullion;}
    if(vMaterial==1){
      float reflected=exp(-pow((vWorld.x+1.9)*.23,2.))*exp(-pow((vWorld.z-1.)*.045,2.));
      color+=vec3(.12,.15,.15)*reflected*(.35+.65*fres);
      float contact=0.;
      for(int i=0;i<4;i++){float z=8.75-float(i)*7.5;float px=(i%2==0?1.9:-1.9);vec2 d=abs(vWorld.xz-vec2(px,z))-vec2(1.25,.86);float sd=length(max(d,0.))+min(max(d.x,d.y),0.);contact+=.46*(1.-smoothstep(-.04,.7,sd));}
      contact+=.20*(1.-smoothstep(.02,.38,abs(abs(vWorld.x)-5.65)));
      contact+=.22*(1.-smoothstep(.15,1.25,abs(abs(vWorld.x)-7.05)));
      for(int i=0;i<5;i++){float z=14.1-float(i)*7.5;contact+=.12*(1.-smoothstep(.03,.5,abs(vWorld.z-z)))*(1.-smoothstep(3.5,5.5,abs(vWorld.x)));}
      float joint=min(abs(fract((vWorld.x+1.25)/2.5)-.5),abs(fract((vWorld.z+1.25)/2.5)-.5));
      color*=1.-min(contact,.58)-(.035*(1.-smoothstep(.003,.012,joint)));
      float sun=exp(-pow((vWorld.x+3.1+(vWorld.z-3.)*.17)*.38,2.))*exp(-pow((vWorld.z-1.)*.055,2.));
      color+=vec3(.095,.09,.07)*sun;
    }
    if(vMaterial==7)color+=base*.16;
    float dist=length(vWorld-uEye);float fog=1.-exp(-dist*dist*.00035);
    color=mix(color,vec3(.24,.25,.24),fog*.42);
    color=color/(color+vec3(.64));color=pow(color,vec3(1./2.12));
    outColor=vec4(color,1.);
  }`;
  const TEXT_VERT = `#version 300 es
  precision highp float;layout(location=0) in vec3 aPosition;layout(location=1) in vec2 aUV;
  uniform mat4 uViewProjection;out vec2 vUV;out vec3 vWorld;
  void main(){vUV=aUV;vWorld=aPosition;gl_Position=uViewProjection*vec4(aPosition,1.);}`;
  const TEXT_FRAG = `#version 300 es
  precision highp float;in vec2 vUV;in vec3 vWorld;uniform sampler2D uAtlas;uniform vec3 uEye;out vec4 outColor;
  void main(){vec4 ink=texture(uAtlas,vUV);float fog=1.-exp(-pow(length(vWorld-uEye),2.)*.00065);outColor=vec4(mix(ink.rgb,vec3(.25,.26,.25),fog*.4),ink.a);}`;
  const GLOW_VERT = `#version 300 es
  precision highp float;layout(location=0) in vec3 aPosition;layout(location=1) in vec2 aUV;uniform mat4 uViewProjection;out vec2 vUV;
  void main(){vUV=aUV;gl_Position=uViewProjection*vec4(aPosition,1.);}`;
  const GLOW_FRAG = `#version 300 es
  precision highp float;in vec2 vUV;out vec4 outColor;uniform float uStrength;
  void main(){float a=pow(1.-abs(vUV.x*2.-1.),2.4)*pow(1.-vUV.y,.48)*uStrength;outColor=vec4(.91,.83,.64,a);}`;
  const stations=[
    {eye:[0,2.35,21],look:[0,2.55,4.5]},
    {eye:[-.65,2.25,11.6],look:[-1.4,2.15,-1.]},
    {eye:[.65,2.25,4.0],look:[1.55,2.1,-7.7]},
    {eye:[-.6,2.25,-3.5],look:[-1.55,2.2,-15.]},
    {eye:[.2,2.3,-11.0],look:[.75,2.35,-23.5]}
  ];
  function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
  function mix(a,b,t){return a+(b-a)*t;}
  function perspective(fov,aspect,near,far){let f=1/Math.tan(fov/2),nf=1/(near-far);return new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+near)*nf,-1,0,0,2*far*near*nf,0]);}
  function lookAt(e,t){let z=norm(sub(e,t)),x=norm(cross([0,1,0],z)),y=cross(z,x);return new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,e),-dot(y,e),-dot(z,e),1]);}
  function mul(a,b){let o=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++)o[c*4+r]=a[r]*b[c*4]+a[4+r]*b[c*4+1]+a[8+r]*b[c*4+2]+a[12+r]*b[c*4+3];return o;}
  function sub(a,b){return [a[0]-b[0],a[1]-b[1],a[2]-b[2]];}function dot(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2];}function cross(a,b){return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];}function norm(a){let d=Math.hypot(...a)||1;return a.map(v=>v/d);}
  function program(gl,vs,fs){let shaders=[vs,fs].map((s,i)=>{let sh=gl.createShader(i?gl.FRAGMENT_SHADER:gl.VERTEX_SHADER);gl.shaderSource(sh,s);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(sh));return sh;});let p=gl.createProgram();shaders.forEach(s=>gl.attachShader(p,s));gl.linkProgram(p);shaders.forEach(s=>gl.deleteShader(s));if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));return p;}
  function builder(){let data=[];function face(c,u,v,n,mat){let corners=[[-1,-1],[1,-1],[1,1],[-1,-1],[1,1],[-1,1]];for(let q of corners){let p=[c[0]+u[0]*q[0]+v[0]*q[1],c[1]+u[1]*q[0]+v[1]*q[1],c[2]+u[2]*q[0]+v[2]*q[1]];data.push(...p,...n,(q[0]+1)/2,(q[1]+1)/2,mat);}}
    function box(x,y,z,w,h,d,mat){let X=w/2,Y=h/2,Z=d/2;face([x,y+Y,z],[-X,0,0],[0,0,Z],[0,1,0],mat);face([x,y-Y,z],[X,0,0],[0,0,Z],[0,-1,0],mat);face([x,y,z+Z],[X,0,0],[0,Y,0],[0,0,1],mat);face([x,y,z-Z],[-X,0,0],[0,Y,0],[0,0,-1],mat);face([x+X,y,z],[0,0,-Z],[0,Y,0],[1,0,0],mat);face([x-X,y,z],[0,0,Z],[0,Y,0],[-1,0,0],mat);}
    function arch(cx,base,z,r,t,depth,mat){
      function tri(a,b,c,n){for(let p of [a,b,c])data.push(...p,...n,0,0,mat);}
      function quad(a,b,c,d,n){tri(a,b,c,n);tri(a,c,d,n);}
      let count=32;for(let i=0;i<count;i++){
        let a=Math.PI*i/count,b=Math.PI*(i+1)/count;
        let P=(angle,rad,zz)=>[cx+Math.cos(angle)*rad,base+Math.sin(angle)*rad,zz];
        let o0=P(a,r+t/2,z+depth/2),o1=P(b,r+t/2,z+depth/2),j0=P(a,r-t/2,z+depth/2),j1=P(b,r-t/2,z+depth/2);
        let O0=P(a,r+t/2,z-depth/2),O1=P(b,r+t/2,z-depth/2),J0=P(a,r-t/2,z-depth/2),J1=P(b,r-t/2,z-depth/2);
        quad(j0,o0,o1,j1,[0,0,1]);quad(O0,J0,J1,O1,[0,0,-1]);
        let m=(a+b)/2,n=[Math.cos(m),Math.sin(m),0];quad(o0,O0,O1,o1,n);quad(J0,j0,j1,J1,n.map(q=>-q));
      }
    }
    return {data,box,face,arch};}
  function makeGeometry(){let g=builder(),b=g.box;
    // A continuous museum sequence: material depth comes from real recesses and layered thresholds.
    b(0,-.24,-2,15,.48,55,1);b(0,7.02,-2,15,.36,55,0);
    b(-7.35,3.52,-2,.48,7.04,55,0);b(7.35,3.52,-2,.48,7.04,55,0);
    b(0,3.55,-29.3,15,7.1,.55,0);
    for(let i=0;i<5;i++){let z=14.1-i*7.5;
      // Deep offset portal, asymmetric stone lintel, bronze reveal.
      b(-5.65,3.4,z,.88,6.8,1.45,0);b(5.15,3.4,z,1.1,6.8,1.45,0);b(-.35,6.5,z,11.4,.48,1.65,0);
      b(-5.08,3.4,z+.79,.055,6.65,.08,2);b(4.53,3.4,z+.79,.055,6.65,.08,2);b(-.3,6.19,z+.79,9.7,.055,.08,2);
      b(-5.6,3.3,z-.89,.19,6.6,.06,3);b(5.0,3.3,z-.89,.19,6.6,.06,3);
      b(-7.02,.23,z-3.65,.48,.46,7.2,3);b(7.02,.23,z-3.65,.48,.46,7.2,3);
      b(-6.97,.48,z-3.65,.04,.045,6.8,2);b(6.97,.48,z-3.65,.04,.045,6.8,2);
      // Ceiling coffers and light troughs.
      b(0,6.71,z-3.2,11.0,.15,4.5,8);b(-4.75,6.58,z-3.2,.06,.11,4.1,6);b(4.75,6.58,z-3.2,.06,.11,4.1,6);
    }
    // Staggered walls create occlusion and a gallery rhythm.
    for(let i=0;i<4;i++){let z=9.9-i*7.5,side=i%2?1:-1;
      b(side*5.42,2.54,z,.42,5.08,3.95,0);
      b(side*5.13,2.32,z+.22,.035,3.8,2.8,3);
      b(-side*3.1,1.8,z-1.75,1.85,3.6,.42,0);
      b(-side*3.1,3.56,z-1.75,1.9,.045,.52,2);
    }
    // Exhibition islands, each with carefully layered edge, dark display, and sculptural objects.
    for(let i=0;i<4;i++){let z=8.75-i*7.5,side=i%2?1:-1,x=-side*1.9;
      for(let sx of [-1,1])for(let sz of [-1,1])b(x+sx*1.02,.73,z+sz*.65,.11,1.46,.11,3);
      b(x,1.47,z,2.38,.075,1.56,1);b(x,1.515,z,2.42,.018,1.60,7);
      if(i===0){b(x,1.59,z,.82,.16,.67,8);g.arch(x,1.69,z,.75,.09,.19,4);b(x,2.48,z-.12,.1,.55,.11,4);}
      if(i===1){for(let j=0;j<4;j++){b(x-.76+j*.5,1.67,z,.36,.30,.84,j%2?8:3);b(x-.76+j*.5,1.84,z-.32,.33,.025,.04,2);}}
      if(i===2){b(x,1.61,z,1.35,.19,.68,8);b(x-.35,1.91,z,.16,.5,.16,4);b(x+.35,1.91,z,.16,.5,.16,4);b(x,2.18,z,.93,.07,.19,4);}
      if(i===3){b(x,1.74,z,.72,.48,.72,8);b(x,2.06,z,.43,.16,.43,6);}
      b(x-.97,1.54,z+.83,.035,.08,.04,2);
    }
    // A portrait display near the threshold gives the first room a real book image.
    b(3.55,3.25,12.15,2.81,3.95,.12,2);b(3.55,3.25,12.23,2.75,3.89,.055,8);
    // A recessed artwork bay faces the threshold without blocking the gallery axis.
    b(3.72,2.86,5.28,3.1,5.35,.48,0);
    b(3.72,3.36,5.55,2.84,1.74,.055,2);
    b(3.72,3.36,5.59,2.68,1.58,.045,8);
    b(3.72,1.72,5.59,2.68,.035,.065,2);
    b(3.72,1.47,11.49,1.9,.11,.08,3);
    // Tall sculptural fins, wall washes, and end chamber.
    for(let i=0;i<8;i++){let z=12.3-i*5.4;b(-6.78,3.25,z,.15,5.5,.32,3);b(6.78,3.25,z,.15,5.5,.32,3);}
    b(-4.5,3.18,-25.8,.9,5.95,.65,0);b(4.55,3.18,-25.8,.9,5.95,.65,0);
    b(0,5.98,-26,9.4,.3,.7,0);b(0,3.08,-26.16,8.1,5.6,.12,8);
    b(0,3.08,-25.94,4.32,4.88,.10,2);b(0,3.08,-25.87,4.22,4.78,.065,8);
    return new Float32Array(g.data);}
  function createAtlas(){let c=document.createElement('canvas');c.width=1024;c.height=1024;let x=c.getContext('2d');x.clearRect(0,0,1024,1024);
    let labels=[
      ['INNSIDEN','ET ROM FOR Å SE NÆRMERE','01 / 05'],
      ['MENNESKET','FORTELLINGER OM VERDIGHET','02 / 05'],
      ['GRUNNLAGET','ARKIV · TIDSLINJE · KILDER','03 / 05'],
      ['VEIEN VIDERE','DIALOG OM MULIGE ENDRINGER','04 / 05'],
      ['UTTRYKK','ORD · FORM · PERSPEKTIV','05 / 05'],
      ['2601–46','STEMMEN FRA INNSIDEN','EN ÅPEN INVITASJON']
    ];
    labels.forEach((lines,i)=>{let col=i%2,row=Math.floor(i/2),ox=col*512,oy=row*256;x.fillStyle='#c6b99c';x.font='500 44px Georgia,serif';x.fillText(lines[0],ox+28,oy+88);x.fillStyle='#adaba2';x.font='15px Arial,sans-serif';x.fillText(lines[1],ox+30,oy+127);x.fillStyle='#ae8e60';x.font='12px Arial,sans-serif';x.fillText(lines[2],ox+30,oy+162);x.fillRect(ox+28,oy+185,395,1);});
    let grad=x.createLinearGradient(24,780,488,1010);grad.addColorStop(0,'#62645d');grad.addColorStop(.52,'#a39276');grad.addColorStop(1,'#343d3e');x.fillStyle=grad;x.fillRect(24,780,464,228);x.strokeStyle='rgba(238,223,191,.35)';for(let i=0;i<12;i++){x.beginPath();x.moveTo(42+i*29,788);x.lineTo(87+i*30,1003);x.stroke();}return c;}
  function textGeometry(){let v=[];function panel(x,y,z,w,h,index,axis){let col=index%2,row=Math.floor(index/2),u0=col*.5,u1=(col+1)*.5,v0=1-row*.25,v1=1-(row+1)*.25;let P=axis==='side'?[[x,y+h/2,z-w/2],[x,y+h/2,z+w/2],[x,y-h/2,z+w/2],[x,y-h/2,z-w/2]]:[[x-w/2,y+h/2,z],[x+w/2,y+h/2,z],[x+w/2,y-h/2,z],[x-w/2,y-h/2,z]];if(axis==='side'&&x<0){let swap=u0;u0=u1;u1=swap;}let uv=[[u0,v0],[u1,v0],[u1,v1],[u0,v1]];for(let j of [0,1,2,0,2,3])v.push(...P[j],...uv[j]);}
    panel(0,6.41,14.98,4.6,.52,0);
    for(let i=0;i<4;i++){let z=9.9-i*7.5,side=i%2?1:-1;panel(side*5.087,2.9,z+.22,2.8,1.65,i+1,'side');}
    return new Float32Array(v);}
  function artworkGeometry(x,y,z,w,h){return new Float32Array([x-w/2,y+h/2,z,0,1,x+w/2,y+h/2,z,1,1,x+w/2,y-h/2,z,1,0,x-w/2,y+h/2,z,0,1,x+w/2,y-h/2,z,1,0,x-w/2,y-h/2,z,0,0]);}
  function glowGeometry(){let v=[];function quad(a,b,c,d){let uv=[[0,0],[1,0],[1,1],[0,1]],p=[a,b,c,d];for(let j of [0,1,2,0,2,3])v.push(...p[j],...uv[j]);}
    for(let i=0;i<5;i++){let z=13.2-i*7.5;quad([-4.55,6.7,z],[-3.95,6.7,z],[-1.9,.1,z-5.1],[-5.0,.1,z-5.1]);}
    return new Float32Array(v);}
  function mesh(gl,array,stride,layout){let vao=gl.createVertexArray(),buffer=gl.createBuffer();gl.bindVertexArray(vao);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,array,gl.STATIC_DRAW);layout.forEach(([loc,n,offset])=>{gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,n,gl.FLOAT,false,stride*4,offset*4);});gl.bindVertexArray(null);return {vao,buffer,count:array.length/stride};}
  function mount(canvas,options={}){
    let gl,geom,txt,artMesh,entryMesh,glow,mainProgram,textProgram,glowProgram,atlas,artTexture,entryTexture,observer,raf=0,destroyed=false,ready=false,lost=false;
    const artworks=Array.isArray(options.artworks)?options.artworks.filter(a=>a&&typeof a.src==='string'):[];
    let artworkIndex=clamp(Math.round(Number(options.initialArtwork)||0),0,Math.max(0,artworks.length-1)),artworkLoaded=false,artLoadToken=0;
    let quality='high',motion=!options.reducedMotion,exploration=false,station=clamp(Math.round(options.initialStation||0),0,4);
    let eye=stations[station].eye.slice(),look=stations[station].look.slice(),targetEye=eye.slice(),targetLook=look.slice();
    let yaw=0,pitch=0,dragging=false,lastPointer=null,framecount=0,drawcalls=0,lastFrame=0,dirty=true,settle=0;
    function report(){return {backend:gl&&!lost?'webgl2':'unavailable',station,artworkIndex,artworkCount:artworks.length,artworkLoaded,framecount,drawcalls,quality,motion,exploration,width:canvas.width,height:canvas.height,ready};}
    function fail(error){if(options.onFailure)options.onFailure(error instanceof Error?error:new Error(String(error)));}
    try{gl=canvas.getContext('webgl2',{antialias:true,alpha:false,depth:true,premultipliedAlpha:false,powerPreference:'high-performance'});if(!gl)throw Error('WebGL2 is unavailable');
      mainProgram=program(gl,VERT,FRAG);textProgram=program(gl,TEXT_VERT,TEXT_FRAG);glowProgram=program(gl,GLOW_VERT,GLOW_FRAG);
      geom=mesh(gl,makeGeometry(),9,[[0,3,0],[1,3,3],[2,2,6],[3,1,8]]);
      txt=mesh(gl,textGeometry(),5,[[0,3,0],[1,2,3]]);artMesh=mesh(gl,artworkGeometry(0,3.08,-25.785,4.1,4.66),5,[[0,3,0],[1,2,3]]);entryMesh=mesh(gl,artworkGeometry(3.55,3.25,12.33,2.72,3.86),5,[[0,3,0],[1,2,3]]);glow=mesh(gl,glowGeometry(),5,[[0,3,0],[1,2,3]]);
      atlas=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,atlas);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,1);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,createAtlas());gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.generateMipmap(gl.TEXTURE_2D);
      artTexture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,artTexture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      entryTexture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,entryTexture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      uploadArtworkSurface(null);
      gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.enable(gl.CULL_FACE);gl.cullFace(gl.BACK);
    }catch(e){fail(e);return {setStation(){},setArtwork(){},focusArtwork(){},setQuality(){},setMotion(){},setExploration(){},resetView(){},destroy(){},getState:report};}
    function uploadArtworkSurface(img){
      if(!gl||lost||destroyed)return;
      for(const [texture,width,height] of [[artTexture,900,1024],[entryTexture,722,1024]]){
        const c=document.createElement('canvas');c.width=width;c.height=height;const ctx=c.getContext('2d');
        ctx.fillStyle='#11191b';ctx.fillRect(0,0,width,height);
        if(img){const inset=Math.round(Math.min(width,height)*.025),fit=Math.min((width-inset*2)/img.naturalWidth,(height-inset*2)/img.naturalHeight);const w=img.naturalWidth*fit,h=img.naturalHeight*fit;ctx.drawImage(img,(width-w)/2,(height-h)/2,w,h);}
        gl.bindTexture(gl.TEXTURE_2D,texture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,1);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,c);
      }
      schedule();
    }
    function loadArtwork(){
      const token=++artLoadToken;artworkLoaded=false;
      if(!artworks.length)return;
      const img=new Image();img.decoding='async';
      img.onload=()=>{if(destroyed||token!==artLoadToken)return;try{uploadArtworkSurface(img);artworkLoaded=true;schedule();if(options.onArtwork)options.onArtwork(artworkIndex,report());}catch(e){fail(e);}};
      img.onerror=()=>{if(token===artLoadToken&&!destroyed)fail(Error('Artwork could not be loaded: '+artworks[artworkIndex].src));};
      img.src=artworks[artworkIndex].src;
    }
    function setArtwork(index,opt={}){if(!artworks.length)return;const next=clamp(Math.round(Number(index)||0),0,artworks.length-1);if(next!==artworkIndex||!artworkLoaded){artworkIndex=next;loadArtwork();}if(opt.focus)focusArtwork({immediate:opt.immediate});}
    function focusArtwork(indexOrOptions={},maybeOptions={}){let opt=typeof indexOrOptions==='number'?maybeOptions:indexOrOptions;if(typeof indexOrOptions==='number')setArtwork(indexOrOptions);station=4;targetEye=[0,2.95,-19.7];targetLook=[0,3.08,-25.8];yaw=0;pitch=0;if(opt.immediate||!motion){eye=targetEye.slice();look=targetLook.slice();}schedule();if(options.onStation)options.onStation(4,report());}
    function resize(){if(destroyed)return;let rect=canvas.getBoundingClientRect(),dpr=Math.min(global.devicePixelRatio||1,quality==='high'?(global.innerWidth<700?1.5:2):1);let w=Math.max(1,Math.round(rect.width*dpr)),h=Math.max(1,Math.round(rect.height*dpr));if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;dirty=true;}schedule();}
    function schedule(){if(!raf&&!destroyed&&!lost)raf=requestAnimationFrame(render);}
    function uniforms(p,vp,e){gl.useProgram(p);gl.uniformMatrix4fv(gl.getUniformLocation(p,'uViewProjection'),false,vp);let loc=gl.getUniformLocation(p,'uEye');if(loc)gl.uniform3fv(loc,e);}
    function render(t){raf=0;if(destroyed||lost)return;let dt=Math.min((t-lastFrame)||16,45);lastFrame=t;let moving=false;
      for(let i=0;i<3;i++){let ne=mix(eye[i],targetEye[i],motion?Math.min(.19,dt*.011):1),nl=mix(look[i],targetLook[i],motion?Math.min(.19,dt*.011):1);if(Math.abs(ne-targetEye[i])>.001||Math.abs(nl-targetLook[i])>.001)moving=true;eye[i]=ne;look[i]=nl;}
      let viewLook=[look[0]+Math.sin(yaw)*4,look[1]+Math.sin(pitch)*3,look[2]+(1-Math.cos(yaw))*3];
      gl.viewport(0,0,canvas.width,canvas.height);gl.clearColor(.085,.096,.102,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
      let vp=mul(perspective((canvas.width<canvas.height?.94:.79),canvas.width/canvas.height,.08,95),lookAt(eye,viewLook));drawcalls=0;
      uniforms(mainProgram,vp,eye);gl.uniform1f(gl.getUniformLocation(mainProgram,'uTime'),t*.001);gl.uniform1f(gl.getUniformLocation(mainProgram,'uQuality'),quality==='high'?1:0);gl.bindVertexArray(geom.vao);gl.drawArrays(gl.TRIANGLES,0,geom.count);drawcalls++;
      gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);gl.disable(gl.CULL_FACE);
      uniforms(textProgram,vp,eye);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,atlas);gl.uniform1i(gl.getUniformLocation(textProgram,'uAtlas'),0);gl.bindVertexArray(txt.vao);gl.drawArrays(gl.TRIANGLES,0,txt.count);drawcalls++;
      if(artworks.length){gl.bindTexture(gl.TEXTURE_2D,artTexture);gl.bindVertexArray(artMesh.vao);gl.drawArrays(gl.TRIANGLES,0,artMesh.count);drawcalls++;gl.bindTexture(gl.TEXTURE_2D,entryTexture);gl.bindVertexArray(entryMesh.vao);gl.drawArrays(gl.TRIANGLES,0,entryMesh.count);drawcalls++;}
      gl.blendFunc(gl.SRC_ALPHA,gl.ONE);uniforms(glowProgram,vp,eye);gl.uniform1f(gl.getUniformLocation(glowProgram,'uStrength'),quality==='high'?.18:.095);gl.bindVertexArray(glow.vao);gl.drawArrays(gl.TRIANGLES,0,glow.count);drawcalls++;
      gl.depthMask(true);gl.disable(gl.BLEND);gl.enable(gl.CULL_FACE);gl.bindVertexArray(null);framecount++;
      if(!ready){ready=true;if(options.onReady)options.onReady(report());}if(options.onStats&&framecount%30===1)options.onStats(report());
      dirty=false;if(moving||dragging){settle=0;schedule();}else if(settle++<2)schedule();
    }
    function setStation(i,opt={}){i=clamp(Math.round(Number(i)||0),0,4);station=i;targetEye=stations[i].eye.slice();targetLook=stations[i].look.slice();yaw=0;pitch=0;if(opt.immediate||!motion){eye=targetEye.slice();look=targetLook.slice();}dirty=true;schedule();if(options.onStation)options.onStation(i,report());}
    function setQuality(q){quality=q==='low'?'low':'high';resize();}
    function setMotion(v){motion=!!v;if(!motion){eye=targetEye.slice();look=targetLook.slice();}schedule();}
    function setExploration(v){exploration=!!v;canvas.style.cursor=exploration?'grab':'';}
    function resetView(){yaw=0;pitch=0;setStation(station);}
    function down(e){if(!exploration)return;dragging=true;lastPointer=[e.clientX,e.clientY];canvas.setPointerCapture(e.pointerId);canvas.style.cursor='grabbing';schedule();}
    function move(e){if(!dragging||!lastPointer)return;let dx=e.clientX-lastPointer[0],dy=e.clientY-lastPointer[1];lastPointer=[e.clientX,e.clientY];yaw=clamp(yaw-dx*.0035,-.75,.75);pitch=clamp(pitch+dy*.003,-.35,.35);schedule();}
    function up(){dragging=false;lastPointer=null;canvas.style.cursor=exploration?'grab':'';schedule();}
    function key(e){if(!exploration||document.activeElement!==canvas)return;if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();if(station===4&&artworks.length){setArtwork(artworkIndex+(e.key==='ArrowRight'?1:-1),{focus:true});}else setStation(station+(e.key==='ArrowRight'?1:-1));}if(e.key==='Escape')resetView();}
    function contextLost(e){e.preventDefault();lost=true;if(raf)cancelAnimationFrame(raf);raf=0;fail(Error('WebGL context lost'));}
    function contextRestored(){lost=false;fail(Error('WebGL context restored; remount the scene'));}
    canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);canvas.addEventListener('keydown',key);canvas.addEventListener('webglcontextlost',contextLost);canvas.addEventListener('webglcontextrestored',contextRestored);
    observer=new ResizeObserver(resize);observer.observe(canvas);resize();loadArtwork();schedule();
    return {setStation,setArtwork,focusArtwork,setQuality,setMotion,setExploration,resetView,getState:report,destroy(){if(destroyed)return;destroyed=true;if(raf)cancelAnimationFrame(raf);observer.disconnect();canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',up);canvas.removeEventListener('keydown',key);canvas.removeEventListener('webglcontextlost',contextLost);canvas.removeEventListener('webglcontextrestored',contextRestored);[geom,txt,artMesh,entryMesh,glow].forEach(m=>{gl.deleteVertexArray(m.vao);gl.deleteBuffer(m.buffer);});gl.deleteTexture(atlas);gl.deleteTexture(artTexture);gl.deleteTexture(entryTexture);[mainProgram,textProgram,glowProgram].forEach(p=>gl.deleteProgram(p));}};
  }
  global.InnsidenScene={mount,stations:stations.map((_,i)=>i)};
})(window);
