/* Interactive silver-water reflection study, matching the owner-supplied reference. Low-resolution decorative canvas; no third-party renderer. */
export function createWater(canvas,onRestore) {
 const gl=canvas.getContext('webgl',{alpha:false,antialias:false,depth:false,powerPreference:'low-power'});
 if(!gl)return null;
 let disposed=false,lost=false,playing=false,raf=0,time=0,last=0,rendered=0;
 const vertex='attribute vec2 p; varying vec2 uv; void main(){uv=p*.5+.5;gl_Position=vec4(p,0.,1.);}';
 const fragment=`precision mediump float;
 varying vec2 uv; uniform float t; uniform vec2 size; uniform vec4 ripples[16];
 // Analytic surface slopes: overlapping swells, not drawn contour lines.
 vec2 swell(vec2 p,float frequency,float angle,float speed,float amplitude){
  vec2 d=vec2(cos(angle),sin(angle));
  vec2 cross=vec2(-d.y,d.x);
  float bend=dot(p,cross)*1.3+t*.12;
  float phase=dot(p,d)*frequency+sin(bend)*.48+t*speed;
  return (d*frequency+cross*cos(bend)*.624)*cos(phase)*amplitude;
 }
 void main(){
 vec2 aspect=vec2(size.x/size.y,1.);vec2 p=(uv-.5)*aspect*6.;
 vec2 slope=swell(p,1.7,.45,.24,.055)+swell(p,2.9,.85,-.19,.028)
  +swell(p,4.7,-.4,.31,.009)+swell(p,7.9,.6,-.36,.004)
  +swell(p,12.1,1.6,.42,.0017)+swell(p,18.3,-.2,-.47,.0006);
 for(int i=0;i<16;i++){
  vec4 ripple=ripples[i];float age=t-ripple.z;
  if(ripple.w>0. && age>=0. && age<1.5){
   vec2 delta=(uv-ripple.xy)*aspect*6.;float distance=length(delta);
   float front=distance-age*1.15;
   float envelope=exp(-front*front*3.2-age*.85)*(1.-smoothstep(.8,1.5,age))*ripple.w;
   float phase=front*11.;
   float gradient=envelope*(11.*cos(phase)-6.4*front*sin(phase));
   slope+=delta/max(distance,.06)*gradient;
  }
 }
 vec3 n=normalize(vec3(-slope,1.));vec3 reflection=reflect(vec3(0.,0.,-1.),n);
 // A neutral studio sky reflected in the surface: broad shadows and soft silver highlights.
 float sky=smoothstep(-.65,.85,reflection.y);
 float light=pow(max(0.,dot(reflection,normalize(vec3(-.35,.5,1.)))),40.);
 float silver=pow(max(0.,dot(reflection,normalize(vec3(.55,-.3,1.)))),42.);
 float shade=pow(max(0.,dot(reflection,normalize(vec3(.15,-.65,1.)))),7.);
 float luminance=.965+sky*.012+light*.07+silver*.035-shade*.075;
 // Keep the copy calm while the central surface retains its depth.
 float edge=smoothstep(.14,.48,abs(uv.x-.47));
 luminance=mix(luminance,.96,edge*.65);
 gl_FragColor=vec4(vec3(luminance),1.);
 }`;
 const compile=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){gl.deleteShader(s);throw Error('Water shader unavailable');}return s;};
 let vs,fs,program,buffer;
 try{vs=compile(gl.VERTEX_SHADER,vertex);fs=compile(gl.FRAGMENT_SHADER,fragment);program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('Water unavailable');buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);gl.useProgram(program);const p=gl.getAttribLocation(program,'p');gl.enableVertexAttribArray(p);gl.vertexAttribPointer(p,2,gl.FLOAT,false,0,0);}catch(_){if(buffer)gl.deleteBuffer(buffer);if(program)gl.deleteProgram(program);if(vs)gl.deleteShader(vs);if(fs)gl.deleteShader(fs);return null;}
 const t=gl.getUniformLocation(program,'t'),size=gl.getUniformLocation(program,'size');
 const rippleUniform=gl.getUniformLocation(program,'ripples[0]'),ripples=new Float32Array(16*4);let nextRipple=0,lastStir=-1,lastImpulse=-1;
 function disturb(x,y,strength=.5){
  if(!playing||disposed||lost||![x,y,strength].every(Number.isFinite))return;
  // Bound all wake sources together; a wave fades before its slot is reused.
  // A click can strengthen the just-created cursor wave without adding another slot.
  let offset;
  if(time-lastImpulse<.1){
   if(strength<.8||nextRipple===0)return;
   offset=((nextRipple-1)%16)*4;
   if(ripples[offset+3]>=.8*.065)return;
  }else{offset=(nextRipple++%16)*4;lastImpulse=time;}
  ripples.set([Math.max(0,Math.min(1,x)),1-Math.max(0,Math.min(1,y)),time,Math.max(0,Math.min(1,strength))*.065],offset);
 }
 function stir(x,y,angle,progress){
  if(!playing||time-lastStir<.075)return;lastStir=time;
  // An elliptical wake follows the rotating deck; all waves share the same lighting.
  const aspect=canvas.width/canvas.height;
  disturb(x+Math.cos(angle)*.11/aspect,y+Math.sin(angle)*.19,.35+Math.sin(Math.PI*progress)*.55);
 }
 function draw(){if(disposed||lost)return;gl.uniform1f(t,time);gl.uniform4fv(rippleUniform,ripples);gl.drawArrays(gl.TRIANGLES,0,6);}
 function resize(){if(disposed||lost)return;const rect=canvas.getBoundingClientRect(),scale=Math.min(1,900/Math.max(rect.width,rect.height));canvas.width=Math.max(1,Math.round(rect.width*scale));canvas.height=Math.max(1,Math.round(rect.height*scale));gl.viewport(0,0,canvas.width,canvas.height);gl.uniform2f(size,canvas.width,canvas.height);draw();}
 function frame(now){if(!playing||disposed||lost)return;time+=Math.min((now-last)/1000,.05);last=now;if(now-rendered>=32){draw();rendered=now;}raf=requestAnimationFrame(frame);}
 function setPlaying(value){playing=value&&!disposed&&!lost;cancelAnimationFrame(raf);if(playing){last=performance.now();raf=requestAnimationFrame(frame);}}
 const observer=new ResizeObserver(resize);observer.observe(canvas);resize();canvas.parentElement.classList.add('is-rendered');
 const contextLost=event=>{event.preventDefault();lost=true;setPlaying(false);canvas.parentElement.classList.remove('is-rendered');};
 const contextRestored=()=>{if(!disposed)onRestore?.();};
 canvas.addEventListener('webglcontextlost',contextLost);canvas.addEventListener('webglcontextrestored',contextRestored);
 return {setPlaying,disturb,stir,dispose(){disposed=true;setPlaying(false);observer.disconnect();canvas.removeEventListener('webglcontextlost',contextLost);canvas.removeEventListener('webglcontextrestored',contextRestored);canvas.parentElement.classList.remove('is-rendered');if(!lost){gl.deleteBuffer(buffer);gl.deleteProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);}}};
}
