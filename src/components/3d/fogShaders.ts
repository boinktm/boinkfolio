export const fogVertex = /* glsl */ `
varying vec2 vUv;
uniform float uTime;
void main() {
  vUv = uv;
  vec3 p = position;
  p.z += sin(p.x * 0.34 + uTime * 0.18) * 0.24 + cos(p.y * 0.29 - uTime * 0.12) * 0.19;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}`;
export const fogFragment = /* glsl */ `
varying vec2 vUv;
uniform float uTime;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);
}
void main() {
  vec2 p = vUv * 9.0;
  float n = noise(p + vec2(uTime*.045, -uTime*.025)) * .60;
  n += noise(p*2.1 - uTime*.035) * .27;
  n += noise(p*4.3 + uTime*.025) * .13;
  float edge = smoothstep(0.0,.23,vUv.x)*smoothstep(0.0,.23,1.-vUv.x)
    *smoothstep(0.0,.25,vUv.y)*smoothstep(0.0,.25,1.-vUv.y);
  gl_FragColor = vec4(mix(vec3(.025,.08,.20),vec3(.16,.36,.56),n), n*edge*.42);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;
