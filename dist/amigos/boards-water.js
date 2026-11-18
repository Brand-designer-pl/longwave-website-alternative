/* Original pale-water reflection study. Low-resolution decorative canvas; no third-party renderer. */
export function createWater(canvas) {
 const gl=canvas.getContext('webgl',{alpha:false,antialias:false,depth:false,powerPreference:'low-power'});
 if(!gl)return null;
 let disposed=false,lost=false,playing=false,raf=0,time=0,last=0,rendered=0;
 const vertex='attribute vec2 p; varying vec2 uv; void main(){uv=p*.5+.5;gl_Position=vec4(p,0.,1.);}';
 const fragment=`precision mediump float;
 varying vec2 uv; uniform float t; uniform vec2 size;
 // Summed travelling swells. Lighting follows the surface normal, not height contours.
 vec3 wave(vec2 p,float frequency,float angle,float speed,float amplitude){
  vec2 d=vec2(cos(angle),sin(angle));float phase=dot(p,d)*frequency+t*speed;
  return vec3(sin(phase)*amplitude,d*cos(phase)*frequency*amplitude);
 }
 void main(){
 vec2 p=(uv-.5)*vec2(size.x/size.y,1.)*5.;
 p=mat2(.94,-.34,.34,.94)*p;p.y*=1.8;
 vec3 w=wave(p,2.7,.45,.34,.18)+wave(p,4.1,1.15,-.29,.11)
  +wave(p,6.9,-.6,.43,.045)+wave(p,11.3,.8,-.51,.023)
  +wave(p,17.7,1.7,.61,.01)+wave(p,26.1,-.3,-.72,.004);
 vec3 n=normalize(vec3(-w.yz,1.));
 vec3 v=normalize(vec3(.12,.25,1.));vec3 r=reflect(-v,n);
 // Broad reflected sky and soft windows create liquid, continuous highlights.
 float sky=smoothstep(-.65,.9,r.y);
 float softbox=pow(max(0.,dot(r,normalize(vec3(-.45,.6,1.)))),12.);
 float sheen=pow(max(0.,dot(n,normalize(vec3(.6,-.45,1.)))),32.);
 float fresnel=pow(1.-max(0.,dot(n,v)),3.);
 vec3 water=vec3(.908,.922,.916)+n.y*.045+n.x*.018;
 water+=pow(softbox,3.)*.065+sheen*.025+fresnel*.025;
 water+=sky*.018;
 gl_FragColor=vec4(water,1.);
 }`;
 const compile=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){gl.deleteShader(s);throw Error('Water shader unavailable');}return s;};
 let vs,fs,program,buffer;
 try{vs=compile(gl.VERTEX_SHADER,vertex);fs=compile(gl.FRAGMENT_SHADER,fragment);program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('Water unavailable');buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);gl.useProgram(program);const p=gl.getAttribLocation(program,'p');gl.enableVertexAttribArray(p);gl.vertexAttribPointer(p,2,gl.FLOAT,false,0,0);}catch(_){if(buffer)gl.deleteBuffer(buffer);if(program)gl.deleteProgram(program);if(vs)gl.deleteShader(vs);if(fs)gl.deleteShader(fs);return null;}
 const t=gl.getUniformLocation(program,'t'),size=gl.getUniformLocation(program,'size');
 function draw(){if(disposed||lost)return;gl.uniform1f(t,time);gl.drawArrays(gl.TRIANGLES,0,6);}
 function resize(){if(disposed||lost)return;const rect=canvas.getBoundingClientRect(),scale=Math.min(1,900/Math.max(rect.width,rect.height));canvas.width=Math.max(1,Math.round(rect.width*scale));canvas.height=Math.max(1,Math.round(rect.height*scale));gl.viewport(0,0,canvas.width,canvas.height);gl.uniform2f(size,canvas.width,canvas.height);draw();}
 function frame(now){if(!playing||disposed||lost)return;time+=Math.min((now-last)/1000,.05);last=now;if(now-rendered>=32){draw();rendered=now;}raf=requestAnimationFrame(frame);}
 function setPlaying(value){playing=value&&!disposed&&!lost;cancelAnimationFrame(raf);if(playing){last=performance.now();raf=requestAnimationFrame(frame);}}
 const observer=new ResizeObserver(resize);observer.observe(canvas);resize();canvas.parentElement.classList.add('is-rendered');
 const contextLost=event=>{event.preventDefault();lost=true;setPlaying(false);canvas.parentElement.classList.remove('is-rendered');};
 canvas.addEventListener('webglcontextlost',contextLost);
 return {setPlaying,dispose(){disposed=true;setPlaying(false);observer.disconnect();canvas.removeEventListener('webglcontextlost',contextLost);canvas.parentElement.classList.remove('is-rendered');gl.deleteBuffer(buffer);gl.deleteProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);}};
}
