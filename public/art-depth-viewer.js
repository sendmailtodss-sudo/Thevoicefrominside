// Optional, single-instance presentation of an unchanged source image.
let active;
export async function openDepth({id, source, image, viewport, en, onStop}) {
  active?.();
  let stopped=false, gl, canvas, observer, raf=0, artUrl, mapUrl;
  const cleanups=[];
  const stop=()=>{if(stopped)return;stopped=true;cancelAnimationFrame(raf);observer?.disconnect();for(const f of cleanups)f();if(gl)gl.getExtension('WEBGL_lose_context')?.loseContext();canvas?.remove();if(artUrl)URL.revokeObjectURL(artUrl);if(mapUrl)URL.revokeObjectURL(mapUrl);if(active===stop)active=null;onStop?.()};
  active=stop;
  const bytes=async url=>{const r=await fetch(url);if(!r.ok)throw Error('fetch');return r.arrayBuffer()};
  const hash=async b=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',b)),x=>x.toString(16).padStart(2,'0')).join('');
  const load=src=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=src});
  try {
    const response=await fetch('/design-assets/art-depth/manifest.json');if(!response.ok)throw Error('manifest');
    const manifest=await response.json(), entry=manifest.version===1&&manifest.items[id];
    if(!entry||new URL(source,location.href).pathname!==entry.source||!crypto.subtle)throw Error('unavailable');
    const [original,depth]=await Promise.all([bytes(entry.source),bytes(entry.depth)]);
    if(await hash(original)!==entry.sourceSha256||await hash(depth)!==entry.depthSha256)throw Error('hash');
    if(stopped)return stop;
    artUrl=URL.createObjectURL(new Blob([original]));mapUrl=URL.createObjectURL(new Blob([depth]));
    const [art,map]=await Promise.all([load(artUrl),load(mapUrl)]);if(stopped)return stop;
    if(art.naturalWidth!==map.naturalWidth||art.naturalHeight!==map.naturalHeight)throw Error('dimensions');
    canvas=document.createElement('canvas');canvas.className='art-depth-canvas';canvas.setAttribute('aria-hidden','true');viewport.append(canvas);
    gl=canvas.getContext('webgl',{alpha:false,antialias:false,preserveDrawingBuffer:false});if(!gl)throw Error('webgl');
    const shader=(type,src)=>{const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error('shader');return s};
    const program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,'attribute vec2 p; varying vec2 uv; void main(){uv=(p+1.0)*0.5;gl_Position=vec4(p,0.,1.);}'));
    gl.attachShader(program,shader(gl.FRAGMENT_SHADER,'precision mediump float; varying vec2 uv; uniform sampler2D art; uniform sampler2D depth; uniform vec2 shift; void main(){float d=texture2D(depth,uv).r; float edge=smoothstep(0.0,0.07,min(min(uv.x,1.0-uv.x),min(uv.y,1.0-uv.y))); vec2 q=uv+shift*(d-0.5)*edge; gl_FragColor=texture2D(art,q);}'));
    gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('program');gl.useProgram(program);
    const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);const loc=gl.getAttribLocation(program,'p');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
    function texture(img,unit,name){gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,gl.createTexture());gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);gl.uniform1i(gl.getUniformLocation(program,name),unit)}
    texture(art,0,'art');texture(map,1,'depth');const shift=gl.getUniformLocation(program,'shift');
    function draw(x=0,y=0){if(stopped||document.hidden)return;gl.uniform2f(shift,x,y);gl.drawArrays(gl.TRIANGLE_STRIP,0,4)}
    function resize(){const w=image.clientWidth,h=image.clientHeight, scale=Math.min(w/art.naturalWidth,h/art.naturalHeight), width=art.naturalWidth*scale,height=art.naturalHeight*scale;canvas.style.left=(image.offsetLeft+(w-width)/2)+'px';canvas.style.top=(image.offsetTop+(h-height)/2)+'px';canvas.style.width=width+'px';canvas.style.height=height+'px';const dpr=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.max(1,Math.round(width*dpr));canvas.height=Math.max(1,Math.round(height*dpr));gl.viewport(0,0,canvas.width,canvas.height);draw()}
    const on=(el,event,fn,options)=>{el.addEventListener(event,fn,options);cleanups.push(()=>el.removeEventListener(event,fn,options))};
    on(canvas,'webglcontextlost',e=>{e.preventDefault();stop()});
    on(canvas,'pointermove',e=>{const r=canvas.getBoundingClientRect();cancelAnimationFrame(raf);raf=requestAnimationFrame(()=>draw(((e.clientX-r.left)/r.width-.5)*.012,-((e.clientY-r.top)/r.height-.5)*.012))},{passive:true});
    on(canvas,'pointerleave',()=>draw());on(canvas,'pointercancel',()=>draw());on(document,'visibilitychange',()=>{if(!document.hidden)draw()});
    if('ResizeObserver' in window){observer=new ResizeObserver(resize);observer.observe(viewport)}else on(window,'resize',resize);
    resize();return stop;
  } catch(error){stop();throw error}
}
