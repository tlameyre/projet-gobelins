precision highp float;

vec2 fade(vec2 t) {return t*t*t*(t*(t*6.0-15.0)+10.0);}
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}

float cnoise(vec2 P){
  vec4 Pi = floor(P.xyxy) + vec4(0.0, 0.0, 1.0, 1.0);
  vec4 Pf = fract(P.xyxy) - vec4(0.0, 0.0, 1.0, 1.0);
  Pi = mod(Pi, 289.0); // To avoid truncation effects in permutation
  vec4 ix = Pi.xzxz;
  vec4 iy = Pi.yyww;
  vec4 fx = Pf.xzxz;
  vec4 fy = Pf.yyww;
  vec4 i = permute(permute(ix) + iy);
  vec4 gx = 2.0 * fract(i * 0.0243902439) - 1.0; // 1/41 = 0.024...
  vec4 gy = abs(gx) - 0.5;
  vec4 tx = floor(gx + 0.5);
  gx = gx - tx;
  vec2 g00 = vec2(gx.x,gy.x);
  vec2 g10 = vec2(gx.y,gy.y);
  vec2 g01 = vec2(gx.z,gy.z);
  vec2 g11 = vec2(gx.w,gy.w);
  vec4 norm = 1.79284291400159 - 0.85373472095314 *
    vec4(dot(g00, g00), dot(g01, g01), dot(g10, g10), dot(g11, g11));
  g00 *= norm.x;
  g01 *= norm.y;
  g10 *= norm.z;
  g11 *= norm.w;
  float n00 = dot(g00, vec2(fx.x, fy.x));
  float n10 = dot(g10, vec2(fx.y, fy.y));
  float n01 = dot(g01, vec2(fx.z, fy.z));
  float n11 = dot(g11, vec2(fx.w, fy.w));
  vec2 fade_xy = fade(Pf.xy);
  vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);
  float n_xy = mix(n_x.x, n_x.y, fade_xy.y);
  return 2.3 * n_xy;
}

uniform vec3 uBaseColor;
uniform vec3 uEdgeColor;
uniform sampler2D uMap;
uniform float uTime;
uniform float uPattern;
uniform float uTransitionAlpha;

varying vec3 vColor;
varying vec3 vPosition;

void main() {
  vec4 texture = texture2D(uMap, gl_PointCoord);

  float newAlpha = 1.;

  if(uPattern == 1.) {
    // CROIX ANIMEES
    float barX = step(0.8, mod(vPosition.x / 8. + mod(uTime * 2., 1.), 1.));
    barX *= step(0.4, mod(vPosition.z / 8. - 0.2, 1.));

    float barY = step(0.4, mod(vPosition.x / 8., 1.));
    barY *= step(0.8, mod(vPosition.z / 8. - mod(uTime * 2., 1.), 1.));

    newAlpha = barX + barY;
  } else if(uPattern == 2.) {
    // CERCLE ANIME
    vec3 wavedUv = vec3(
      vPosition.x + sin(vPosition.z * sin(uTime)),
      vPosition.y,
      vPosition.z + sin(vPosition.x * sin(uTime))
    );
    newAlpha = 1. - step(0.1, abs(distance(wavedUv, vec3(15., 0 , 15.)) / 15. - 0.5));
  } else if(uPattern == 3.) {
    // BARRES VERTICALES
    newAlpha = step(0.8, mod(vPosition.x / 8. + mod(uTime, 1.), 1.));
    newAlpha += step(0.8, mod(vPosition.z / 8. + mod(uTime * 3., 1.), 1.));
  } else if(uPattern == 4.) {
    //PERLIN NOISE
    newAlpha = step(0.1, cnoise(vec2(vPosition.x, vPosition.z) / (sin(uTime * 4.) * .8 + 4.))) ;
  } else {
    float newAlpha = 1.;
  }

  newAlpha *= (1. - uTransitionAlpha);

  gl_FragColor = vec4(texture.rgb, texture.r) * texture.r;
  gl_FragColor *= vec4(vColor, newAlpha);
}
