import * as THREE from 'https://cdn.skypack.dev/three@0.152.2';
import { IfcViewerAPI } from 'https://cdn.skypack.dev/web-ifc-viewer';

const container = document.getElementById('viewer-container');
const ifcBtn = document.getElementById('ifc-btn');
const glbBtn = document.getElementById('glb-btn');
const fileInputIFC = document.getElementById('file-input');
const fileInputGLB = document.getElementById('file-input-glb');
const fileLabel = document.getElementById('file-label');

let viewer = null;

function showIFCViewer() {
  ifcBtn.classList.add('active');
  glbBtn.classList.remove('active');
  fileInputIFC.style.display = '';
  fileInputGLB.style.display = 'none';
  fileLabel.textContent = 'No file chosen';
  container.innerHTML = '';
  viewer = new IfcViewerAPI({ container, backgroundColor: new THREE.Color(0x8cc7de) });
  viewer.axes.setAxes();
  viewer.grid.setGrid();
}

function showGLBViewer() {
  ifcBtn.classList.remove('active');
  glbBtn.classList.add('active');
  fileInputIFC.style.display = 'none';
  fileInputGLB.style.display = '';
  fileLabel.textContent = 'No file chosen';
  container.innerHTML = '';
}

ifcBtn.addEventListener('click', showIFCViewer);
glbBtn.addEventListener('click', showGLBViewer);

fileInputIFC.addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (file && viewer) {
    fileLabel.textContent = file.name;
    const url = URL.createObjectURL(file);
    await viewer.IFC.loadIfcUrl(url);
  }
});

// Default to IFC viewer on load
showIFCViewer(); 