/* Original pale-water caustics. Low-resolution decorative canvas; no third-party renderer. */
export function createWater(canvas) {
 const gl=canvas.getContext('webgl',{alpha:false,antialias:false,depth:false,powerPreference:'low-power'});
 if(!gl)return null;
 let disposed=false,lost=false,playing=false,raf=0,time=0,last=0,rendered=0;
 const vertex='attribute vec2 p; varying vec2 uv; void main(){uv=p*.5+.5;gl_Position=vec4(p,0.,1.);}';
 const fragment=`precision mediump float;
 varying vec2 uv; uniform float t; uniform vec2 size;
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
 float surface(vec2 p){return .55*noise(p)+.3*noise(p*2.03)+.15*noise(p*4.01);}
 void main(){
 vec2 p=uv*vec2(size.x/size.y,1.)*3.6;
 vec2 drift=vec2(t*.045,-t*.035);
 vec2 warp=vec2(surface(p*.9+drift),surface(p*.9-drift+4.));
 float a=surface(p+warp*1.8+drift);
 float b=surface(p*1.27+warp*1.3-drift+8.);
 float flow=p.x*.65+p.y*1.45+warp.x*2.8+warp.y*.9;
 float fold=sin(flow*3.8+t*.16)+.2*sin(p.x*3.2-p.y*2.1-t*.12);
 float ridge=pow(max(0.,1.-abs(fold)*3.4),4.);
 float broad=surface(p*.65+drift*.7);
 float light=.917+.035*broad+.04*ridge-.014*fold;
 float edge=smoothstep(.8,.05,length(uv-.5));
 vec3 color=vec3(light,light+.004,light-.003)+edge*.012;
 gl_FragColor=vec4(color,1.);
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
