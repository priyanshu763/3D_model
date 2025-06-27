import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

const fileInput = document.getElementById('file-input');
const fileLabel = document.getElementById('file-label');
const container = document.getElementById('viewer-container');

let renderer, scene, camera, model, controls;

function setContainerFullScreen() {
  container.style.width = '100vw';
  container.style.height = '100vh';
}
setContainerFullScreen();
window.addEventListener('resize', () => {
  setContainerFullScreen();
  if (renderer && camera) {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  }
});

function clearViewer() {
  if (renderer) {
    renderer.dispose && renderer.dispose();
    renderer.forceContextLoss && renderer.forceContextLoss();
    renderer.domElement && renderer.domElement.remove();
  }
  renderer = null;
  scene = null;
  camera = null;
  model = null;
  controls = null;
  container.innerHTML = '';
}

function initThree() {
  clearViewer();
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xeeeeee);
  camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
  camera.position.set(2, 2, 2);
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputEncoding = THREE.sRGBEncoding;
  container.appendChild(renderer.domElement);

  // Lighting
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.2);
  hemiLight.position.set(0, 20, 0);
  scene.add(hemiLight);
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(5, 10, 7.5);
  scene.add(dirLight);

  // Grid
  const grid = new THREE.GridHelper(10, 20);
  scene.add(grid);

  // Controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;

  animate();
}

function setHdriEnvironment(scene, renderer, url) {
  return new Promise((resolve, reject) => {
    new RGBELoader().setDataType(THREE.FloatType).load(url, (texture) => {
      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      pmremGenerator.compileEquirectangularShader();
      const envMap = pmremGenerator.fromEquirectangular(texture).texture;
      scene.environment = envMap;
      scene.background = envMap;
      texture.dispose();
      pmremGenerator.dispose();
      resolve();
    }, undefined, reject);
  });
}

fileInput.addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (file) {
    fileLabel.textContent = file.name;
    initThree();
    // Example HDRI from Polyhaven (public domain): https://polyhaven.com/hdris
    const hdriUrl = 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/studio_small_08_1k.hdr';
    await setHdriEnvironment(scene, renderer, hdriUrl);
    const url = URL.createObjectURL(file);
    const loader = new GLTFLoader();
    loader.load(url, (gltf) => {
      model = gltf.scene;
      scene.add(model);
      fitCameraToObject(camera, model, controls, 2);
    }, undefined, (error) => {
      alert('Error loading GLB/GLTF file: ' + error.message);
    });
  }
});

function animate() {
  requestAnimationFrame(animate);
  if (controls) controls.update();
  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
}

function fitCameraToObject(camera, object, controls, offset = 1.25) {
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  const fov = camera.fov * (Math.PI / 180);
  let cameraZ = Math.abs(maxDim / 2 * Math.tan(fov * 2)) * offset;
  camera.position.set(center.x, center.y, cameraZ + center.z + maxDim);
  camera.lookAt(center);
  camera.near = maxDim / 100;
  camera.far = maxDim * 100;
  camera.updateProjectionMatrix();
  if (controls) {
    controls.target.copy(center);
    controls.update();
  }
} 