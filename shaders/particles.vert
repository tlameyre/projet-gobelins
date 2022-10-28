precision highp float;

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;
uniform float uTime;
uniform float uWaveSpeed;
uniform float uWavesNum;
uniform float uElevation;
uniform float uFloor;
uniform float uPattern;

attribute vec3 position;
attribute vec3 color;
attribute float random;

varying vec3 vColor;
varying float vElevation;
varying vec3 vPosition;

void main() {
  vec3 newPos = position;
  if(uPattern == 0.) {
    newPos.y = abs(sin((pow(newPos.x - 15., 2.) + pow(newPos.z - 15., 2.)) / uWavesNum + uTime * uWaveSpeed)) + uElevation * random;
  } else {
    newPos.y = abs(sin(uTime * uWaveSpeed * random)) + uElevation * random ;
  }
  newPos.y *= clamp(uFloor, 0.0, 3.0);


  vec4 pos = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0);

  gl_Position = pos;
  gl_PointSize = clamp(newPos.y*10., 10., 20. );

  vColor = color;
  vPosition = position;
}
