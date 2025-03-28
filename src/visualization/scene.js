import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as SimulationManager from '../simulation/simulationManager.js';
import * as UIControls from '../ui/controls.js';

// Scene variables
let scene, camera, renderer, controls;
let bacteria = []; // Array to store bacteria entities
let simulationInitialized = false;

// Constants
const BACTERIA_COUNT = 3;
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
        
        // Create boundary walls with explicit number value
        console.log(`Creating boundaries with world size: ${WORLD_SIZE}`);
        if (typeof WORLD_SIZE !== 'number') {
            console.error("WORLD_SIZE is not a number:", WORLD_SIZE);
            // Ensure we pass a valid number
            SimulationManager.createBoundaries(100);
        } else {
            SimulationManager.createBoundaries(WORLD_SIZE);
        }
        
        // Create bacteria
        createBacteria();
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

// Create bacteria representations
function createBacteria() {
    if (!simulationInitialized) {
        console.error("Cannot create bacteria: simulation not initialized");
        return;
    }
    
    // Material for bacteria
    const bacteriaMaterial = new THREE.MeshStandardMaterial({
        color: 0x4fc3f7,
        roughness: 0.5,
        metalness: 0.2
    });

    // Geometry for rod-shaped bacteria (cylinder)
    const bacteriaGeometry = new THREE.CylinderGeometry(
        BACTERIA_RADIUS, 
        BACTERIA_RADIUS, 
        BACTERIA_LENGTH, 
        16, // radial segments
        1,  // height segments
        false // open-ended
    );
    
    // Rotate the geometry to make it horizontal (along the x-axis)
    bacteriaGeometry.rotateZ(Math.PI / 2);

    // Create multiple bacteria
    for (let i = 0; i < BACTERIA_COUNT; i++) {
        const bacterium = new THREE.Mesh(bacteriaGeometry, bacteriaMaterial);
        
        // Random position within world bounds
        bacterium.position.x = (Math.random() - 0.5) * WORLD_SIZE * 0.8; // Keep away from edges
        bacterium.position.z = 0;
        bacterium.position.y = BACTERIA_RADIUS; // Just above the grid
        
        // Random rotation around Y axis (horizontal plane)
        bacterium.rotation.y = Math.random() * Math.PI * 2;
        
        // Add to scene
        scene.add(bacterium);
        
        // Create physics entity for the bacterium
        const entity = SimulationManager.createBacterium({
            mesh: bacterium,
            length: BACTERIA_LENGTH,
            radius: BACTERIA_RADIUS
        });
        
        if (entity) {
            bacteria.push(entity);
        }
    }
    
    console.log(`Created ${bacteria.length} bacteria with physics bodies`);
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
        // Update physics simulation
        SimulationManager.updateSimulation();

        // Update visual representation based on physics
        bacteria.forEach(bacterium => {
            if (bacterium && bacterium.physicsEntity && bacterium.mesh) {
                // Get position from physics
                const position = bacterium.physicsEntity.rigidBody.translation();

                console.log(bacterium.physicsEntity.rigidBody.translation()); // Here I am getting Object { x: NaN, y: NaN }
                

                
                // Update mesh position
                bacterium.mesh.position.x = position.x;
                bacterium.mesh.position.y = position.y;

                
                
                // Get rotation from physics
                const rotation = bacterium.physicsEntity.rigidBody.rotation();
                
             
                // Update mesh rotation
                bacterium.mesh.rotation.y = rotation;
              
            }
        });
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
