import * as THREE from "three";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/controls/OrbitControls.js";

export function initDesigner(container) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#0c1424");
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(3.4, 2.6, 4.2);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  container.innerHTML = "";
  container.appendChild(renderer.domElement);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x26304a, 2));
  const light = new THREE.DirectionalLight(0xffffff, 2.2);
  light.position.set(4, 5, 3);
  scene.add(light);

  const grid = new THREE.GridHelper(8, 16, 0x34415d, 0x202b40);
  grid.position.y = -1.15;
  scene.add(grid);

  let mesh;
  const material = new THREE.MeshStandardMaterial({ color: "#7c5cff", metalness: 0.28, roughness: 0.35 });
  function setShape(shape, color) {
    if (mesh) { scene.remove(mesh); mesh.geometry.dispose(); }
    material.color.set(color);
    let geometry;
    if (shape === "sphere") geometry = new THREE.SphereGeometry(0.9, 48, 32);
    else if (shape === "cylinder") geometry = new THREE.CylinderGeometry(0.65, 0.65, 1.5, 48);
    else if (shape === "torus") geometry = new THREE.TorusGeometry(0.72, 0.25, 20, 64);
    else geometry = new THREE.BoxGeometry(1.35, 1.35, 1.35);
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = 0;
    scene.add(mesh);
  }
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.target.set(0, 0, 0);

  function resize() {
    const w = Math.max(container.clientWidth, 1);
    const h = Math.max(container.clientHeight, 1);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }
  const observer = new ResizeObserver(resize);
  observer.observe(container);
  resize();
  setShape("box", "#7c5cff");

  let frame;
  function animate() {
    frame = requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  return {
    setShape,
    reset() {
      camera.position.set(3.4, 2.6, 4.2);
      controls.target.set(0, 0, 0);
      controls.update();
    },
    destroy() {
      cancelAnimationFrame(frame);
      observer.disconnect();
      controls.dispose();
      renderer.dispose();
      if (mesh) mesh.geometry.dispose();
    }
  };
}
