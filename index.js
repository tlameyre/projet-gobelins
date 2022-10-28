import * as THREE from 'three'
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import * as dat from 'lil-gui';
import gsap, { random } from 'gsap'

import particlesFragmentShader from './shaders/particles.frag';
import particlesVertexShader from "./shaders/particles.vert";
import { Timeline } from 'gsap/gsap-core';
import { Vector3 } from 'three';

function hexToRgb(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16)/255,
        g: parseInt(result[2], 16)/255,
        b: parseInt(result[3], 16)/255,
      }
    : null;
}

export default class Sketch {
  constructor(options){
    this.scene = new THREE.Scene();

    this.container = options.dom;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(this.width, this.height)
    this.renderer.setClearColor(0x000000, 1)
    this.renderer.physicallyCorrectLights = true;
    this.renderer.outputEncoding = THREE.sRGBEncoding

    this.container.appendChild(this.renderer.domElement)
    // this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.time = 0

    // const axesHelper = new THREE.AxesHelper(20);
    // this.scene.add(axesHelper);

    this.played = false;
    this.soundPlaying = false;
    this.patternChanging = false;

    this.setupCamera();
    this.initListeners();
    // this.createGUI();
    this.addParticles();
    this.resize();
    this.render();
    this.setupResize();
  }

  setupResize(){
    window.addEventListener('resize', this.resize.bind(this))
  }

  setupCamera() {
    this._delta = 0;

    this._theta = Math.random() * Math.PI * 2;
    this._phi = Math.random() * Math.PI * 2;
    this._radius = 5;

    this.camera = new THREE.PerspectiveCamera(
      70,
      this.width / this.height,
      0.01,
      100
    );
    this.camera.position.x = Math.sin(this.time);
    this.camera.position.y = 40;
    this.camera.position.z = Math.cos(this.time);
    this.camera.lookAt(new Vector3(15, 0, 15));
  }

  resize(){
    this.width = this.container.offsetWidth
    this.height = this.container.offsetHeight
    this.renderer.setSize(this.width, this.height)
    this.camera.aspect = this.width/this.height

    this.camera.updateProjectionMatrix()
  }

  // createGUI() {
  //   this.gui = new dat.GUI();
  //   this.debugObject = {
  //     baseColor: "#ffffff",
  //     edgeColor: "#c8b965",
  //   };
  // }

  addParticles() {
    this.nbParticles = 10000;
    const vertices = [];
    this.colorPalettes = [
      ["#4ECDC4", "#FF5964", "#F7FFF7"],
      ["#ECA0FF", "#AAB2FF", "#84FFC9"],
      ["#ed6a5a", "#f4f1bb", "#9bc1bc"],
      ["#0d3b66", "#faf0ca", "#f4d35e"],
      ["#ddfff7", "#93e1d8", "#ffa69e"],
      ["#fe218b", "#fed700", "#21b0fe"],
    ];
    const colors = [];
    const randoms = [];

    let radius = 15;

    for (let i = 0; i < this.nbParticles; i++) {

      let theta = Math.random() * Math.PI * 2;
      let phi = Math.random() * Math.PI * 2;

      const x = Math.cos(theta) * Math.sin(phi) * radius + 15.;
      const y = 0;
      const z = Math.sin(theta) * Math.sin(phi) * radius + 15.;
      vertices.push(x, y, z);

      // const x = Math.random() * 30 ;
      // const z = Math.random() * 30 ;
      // const y = 0;
      // vertices.push(x, y, z);

      // const randomColor = colors[Math.floor(Math.random() * 3)];
      const randomColor = this.colorPalettes[0][Math.floor(Math.random() * 3)];
      const r = hexToRgb(randomColor).r;
      const g = hexToRgb(randomColor).g;
      const b = hexToRgb(randomColor).b;
      colors.push(r, g, b);

      randoms.push(Math.random());
    }

    // TEXTURE LOADING
    const textureLoader = new THREE.TextureLoader()
    const particlesTexture = textureLoader.load(require('./textures/1.png'))
    const displayTexture = textureLoader.load(require("./textures/10.png"));

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute("position",new THREE.Float32BufferAttribute(vertices, 3));
    this.geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    this.geometry.setAttribute("random",new THREE.Float32BufferAttribute(randoms, 1));

    // Material
    this.customParticlesMaterial = new THREE.RawShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uWaveSpeed: { value: 20 },
        uWavesNum: { value: 40 },
        uWaveAmp: { value: 0.5 },
        uBaseColor: { value: 0 },
        uEdgeColor: { value: 0 },
        uElevation: { value: 1 },
        uFloor: { value: 1 },
        uMap: { value: particlesTexture },
        uDisplayTexture: { value: displayTexture },
        uPattern: { value: 5 },
        uTransitionAlpha: { value: 0 },
      },
      vertexShader: particlesVertexShader,
      fragmentShader: particlesFragmentShader,
      transparent: true,
      depthWrite: false,
      // blending: THREE.AdditiveBlending,
    });
    const points = new THREE.Points(this.geometry, this.customParticlesMaterial);
    this.scene.add(points);

    // const fAnimation = this.gui.addFolder("Animation");
    // fAnimation.add(this.customParticlesMaterial.uniforms.uWaveSpeed, "value", 0, 10, 0.01).name("Speed");
    // fAnimation.add(this.customParticlesMaterial.uniforms.uWavesNum, "value", 1, 60, 1).name("Frequency");
    // fAnimation.add(this.customParticlesMaterial.uniforms.uElevation, "value", 0, 30, 0.01).name("Elevation");
    // fAnimation.open();
  }

  // addLights() {
  //   const ligth1 = new THREE.AmbientLight(0xffffff, 0.5)
  //   this.scene.add(ligth1);

  //   const ligth2 = new THREE.DirectionalLight(0xffffff, 0.5)
  //   ligth2.position.set(0.5, 0, 0.866)
  //   this.scene.add(ligth2);
  // }

  render() {
    if (this.audio) {
      this.audio.update();
      this.customParticlesMaterial.uniforms.uElevation.value = this.audio.volume * 0.6;
      if (this.audio.volume > 5.8) {
        this.changePattern();
        this.changeParticulesColor();
      }
    }
    if (this.played) {
      this.time += 0.01
      gsap.to(this.customParticlesMaterial.uniforms.uFloor, { value: 3, duration: 2 });
    } else {
      this.time += 0;
      gsap.to(this.customParticlesMaterial.uniforms.uFloor, { value: 0,  duration: 1 });
    }

    // console.log(this.time);
    if (this.time > 6. && this.time < 7.3) {
      let offset = (7.3 - this.time)/7.3;
      console.log(1 - offset);
      this.camera.position.x = Math.sin(6) * this._radius;
      this.camera.position.y = 40 - (this.time - 6) * 10;
      this.camera.position.z = Math.cos(6) * this._radius;
    } else if (this.time > 7.3 && this.time < 15.3) {
      this.camera.position.x = Math.sin(this.time) * this._radius;
      this.camera.position.y = 40;
      this.camera.position.z = Math.cos(this.time * 3) * this._radius;
    } else if (this.time > 15.3 && this.time < 24.6) {
      this.camera.position.x = Math.sin(this.time * 3) * 3 * this._radius;
      this.camera.position.y = 40;
      this.camera.position.z = Math.cos(this.time * 6) * this._radius;
    } else if (this.time > 24.6 && this.time < 33.8) {
      this.camera.position.x = Math.sin(this.time * 6) * this._radius + 15;
      this.camera.position.y = 40;
      this.camera.position.z = Math.cos(this.time * 2) * this._radius + 15;
    } else if (this.time > 33.8 && this.time < 40.5) {
      // this.camera.position.x = Math.sin(this.time) * this._radius;
      // this.camera.position.z = Math.cos(this.time) * this._radius;
      this.camera.position.x = Math.sin(this.time) * this._radius + 15;
      this.camera.position.z = Math.cos(this.time) * this._radius + 15;
      this.camera.position.y = 40 - (this.time - 34) * 10;
    } else if (this.time > 40.5 && this.time < 53.9) {
      this.camera.position.x = Math.sin(this.time * 3) * 10 * this._radius;
      this.camera.position.y = 40;
      this.camera.position.z = Math.cos(this.time * 6) * 5 * this._radius;
    } else if (this.time > 53.9) {
      this.camera.position.x = Math.sin(this.time) * this._radius + 15;
      if (40 - (this.time - 53.9) * 10 > 0) {
        this.camera.position.y = 40 - (this.time - 53.9) * 10;
      } else {
        this.camera.position.y = 0;
      }
      this.camera.position.y = 40 - (this.time - 53.9) * 10;
      this.camera.position.z = Math.cos(this.time) * this._radius + 15;

    } else {
      this.camera.position.x = Math.sin(this.time) * this._radius;
      this.camera.position.y = 40;
      this.camera.position.z = Math.cos(this.time) * this._radius;
    }
    this.camera.lookAt(new Vector3(15, 0, 15));
    console.log(this.time);
    this.customParticlesMaterial.uniforms.uTime.value = this.time;
    requestAnimationFrame(this.render.bind(this))
    this.renderer.render(this.scene, this.camera)
  }

  changePattern() {

    if (this.patternChanging) {
      return
    } else {
      this.patternChanging = true;
      let patternNumber = Math.floor(Math.random() * 5);
      let tl = new Timeline({
        onComplete: () => {
          this.patternChanging = false;
        },
      });
      tl.to(this.customParticlesMaterial.uniforms.uTransitionAlpha, {
        value: 1,
        duration: 0.2,
      })
      .to(this.customParticlesMaterial.uniforms.uPattern, {
        value: patternNumber,
        duration: 0,
        delay: 0.2,
      })
      .to(this.customParticlesMaterial.uniforms.uTransitionAlpha, {
        value: 0,
        duration: 0.2,
        delay: 0.2,
      });
    }
  }

  changeParticulesColor() {
    let newColors = []
    let nbPalette = Math.floor(Math.random() * 5)
     for (let i = 0; i < this.nbParticles; i++) {
       const randomColor =
         this.colorPalettes[nbPalette][Math.floor(Math.random() * 3)];
       const r = hexToRgb(randomColor).r;
       const g = hexToRgb(randomColor).g;
       const b = hexToRgb(randomColor).b;
       newColors.push(r, g, b);
     }
     this.geometry.setAttribute("color",new THREE.Float32BufferAttribute(newColors, 3));

  }

  initListeners() {
    window.addEventListener("click", (e) => {
      if (e.target.tagName == "CANVAS") {
        this.changePattern()
      }
    });

    document.querySelector(".playButton").addEventListener("click", () => {
      if (!this.soundPlaying) {
        this.setupAudio()
        this.soundPlaying = true;
      } else {
        this.soundPlaying = false;
      }
    });
  }
  async setupAudio() {
    this.audio = (await import('./audio')).default;
    this.audio.start({
      live: false,
      src: require("url:./audio/test.mp3"),
      onBeat: () => { console.log("beat");}

    });
    this.played = true
  }
}

new Sketch({
  dom: document.getElementById("container")
})
