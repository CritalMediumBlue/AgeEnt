import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as SimulationManager from '../simulation/simulationManager.js';
import * as UIControls from '../ui/controls.js';

// Scene variables
let scene, camera, renderer, controls;
let bacteria = []; // Array to store bacteria entities
let simulationInitialized = false;

// Constants
const BACTERIA_COUNT = 50;
const WORLD_SIZE = 100;
const BACTERIA_LENGTH = 4;
const BACTERIA_RADIUS = 0.5;

// Initialize the scene
async function init() {
    // Create the scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111);

    // Create the camera
    const aspect = window.innerWidth / window.innerHeight;
    camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
    camera.position.set(0, 30, 50);
    camera.lookAt(0, 0, 0);

    // Create the renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.getElementById('scene-container').appendChild(renderer.domElement);

    // Add orbit controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Add lighting
    addLights();

    // Add a grid for reference
    addGrid();

    // Initialize the physics simulation
    try {
        console.log("Initializing simulation...");
        await SimulationManager.initSimulation();
        simulationInitialized = true;
        console.log("Simulation initialized successfully");
       
        
       
    } catch (error) {
        console.error("Failed to initialize simulation:", error);
        console.error("Error details:", error.stack);
    }

    // Add window resize handler
    window.addEventListener('resize', onWindowResize);

    // Initialize UI controls
    UIControls.initControls();
    
    // Start the animation loop
    animate();
}

// Add lights to the scene
function addLights() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 1);
    scene.add(ambientLight);

    // Directional light (sun-like)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1).normalize();
    scene.add(directionalLight);

    // Hemisphere light (sky and ground)
    const hemisphereLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 0.5);
    scene.add(hemisphereLight);
}

// Add a grid to the scene for reference
function addGrid() {
    const gridHelper = new THREE.GridHelper(WORLD_SIZE, WORLD_SIZE / 10);
    scene.add(gridHelper);

    // Add X, Y, Z axes
    const axesHelper = new THREE.AxesHelper(WORLD_SIZE / 2);
    scene.add(axesHelper);
}



// Handle window resizing
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Update bacteria using physics simulation
function updateBacteria() {
    if (simulationInitialized) {
        SimulationManager.updateSimulation();
    }
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    // Update controls
    controls.update();
    
    // Update bacteria positions and rotations using physics
    updateBacteria();
    
    // Render the scene
    renderer.render(scene, camera);
}

// Initialize the scene when the page loads
window.addEventListener('DOMContentLoaded', init);
