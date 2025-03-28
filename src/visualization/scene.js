import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as SimulationManager from '../simulation/simulationManager.js';
import * as UIControls from '../ui/controls.js';

// Scene variables
let scene, camera, renderer, controls;
let particles = []; // Array to store particle meshes
let simulationInitialized = false;
let physicsParticles = []; // Array to store physics particles

// Constants
const WORLD_SIZE = 1000;
const PARTICLE_COUNT = 2000;
const PARTICLE_RADIUS = 3; // micrometers

/**
 * Initialize the Three.js scene
 */
export async function initScene() {
    // Cache DOM elements and constants
    const canvasWidth = window.innerWidth;
    const canvasHeight = window.innerHeight;
    
    // Initialize Three.js scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    
    // Create the camera
    camera = new THREE.PerspectiveCamera(75, canvasWidth / canvasHeight, 0.1, 3000);
    camera.position.z = 500;
    
    // Create the renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(canvasWidth, canvasHeight);
    
    // Append to scene container if it exists, otherwise to body
    const container = document.getElementById('scene-container') || document.body;
    container.appendChild(renderer.domElement);
    
    // Add OrbitControls for camera interaction
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 100;
    controls.maxDistance = 1500;
    controls.maxPolarAngle = Math.PI;
    
    // Add grid for reference
    addGrid();
    
    // Initialize physics simulation
    try {
        await SimulationManager.initSimulation();
        simulationInitialized = true;
        console.log("Simulation initialized successfully");
        
        // Create particles
        createParticles();
    } catch (error) {
        console.error("Failed to initialize simulation:", error);
    }
    
    // Add window resize handler
    window.addEventListener('resize', onWindowResize);
    
    // Start the animation loop
    animate();
    
    return {
        scene,
        camera,
        renderer
    };
}

/**
 * Add a grid to the scene for reference
 */
function addGrid() {
    const gridHelper = new THREE.GridHelper(WORLD_SIZE, WORLD_SIZE / 10);
    scene.add(gridHelper);
    
    // Add X, Y, Z axes
    const axesHelper = new THREE.AxesHelper(WORLD_SIZE / 2);
    scene.add(axesHelper);
    
    // Rotate grid to make it horizontal (XZ plane)
    gridHelper.rotation.x = Math.PI / 2;
}

/**
 * Create particle representations
 */
function createParticles() {
    if (!simulationInitialized) {
        console.error("Cannot create particles: simulation not initialized");
        return;
    }
    
    // Create particle meshes
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        // Create different materials for different particle types
        const particleMaterial1 = new THREE.MeshBasicMaterial({ color: 0xff00ff });
        const particleMaterial2 = new THREE.MeshBasicMaterial({ color: 0x00ffff });
        const particleMaterial3 = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        
        // Alternate materials based on index
        const material = i % 3 == 0 ? particleMaterial1 : 
                         i % 3 == 1 ? particleMaterial2 : 
                         particleMaterial3;
        
        // Create sphere mesh
        const sphere = new THREE.Mesh(
            new THREE.SphereGeometry(PARTICLE_RADIUS, 16, 16),
            material
        );
        
        // Set initial position
        sphere.position.set(
            Math.random() * WORLD_SIZE - WORLD_SIZE / 2,
            Math.random() * WORLD_SIZE - WORLD_SIZE / 2,
            0
        );
        
        // Add to scene and store reference
        particles.push(sphere);
        scene.add(sphere);
        
        // Create physics particle at corresponding position
        const physicsParticle = SimulationManager.createParticle({
            position: {
                x: sphere.position.x + WORLD_SIZE / 2,
                y: sphere.position.y + WORLD_SIZE / 2
            },
            radius: PARTICLE_RADIUS
        });
        
        if (physicsParticle) {
            physicsParticles.push(physicsParticle);
        }
    }
    
    console.log(`Created ${particles.length} particles with physics bodies`);
}

/**
 * Handle window resizing
 */
function onWindowResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}

/**
 * Update particle positions from physics simulation
 */
function updateParticlePositions() {
    if (!simulationInitialized) return;
    
    // Apply Brownian motion and handle boundaries
    SimulationManager.applyBrownianMotion({
        width: WORLD_SIZE,
        height: WORLD_SIZE
    });
    
    SimulationManager.handleBoundaries({
        width: WORLD_SIZE,
        height: WORLD_SIZE
    });
    
    // Update physics simulation
    SimulationManager.updateSimulation();
    
    // Get all rigid bodies
    const rigidBodies = SimulationManager.getRigidBodies();
    
    // Update visual representation based on physics
    for (let i = 0; i < particles.length && i < rigidBodies.length; i++) {
        const position = rigidBodies[i].translation();
        
        // Update mesh position (convert from physics space to Three.js space)
        particles[i].position.set(
            position.x - WORLD_SIZE / 2,
            position.y - WORLD_SIZE / 2,
            0
        );
    }
}

/**
 * Animation loop
 */
function animate() {
    requestAnimationFrame(animate);
    
    // Update controls - ensure they're properly updated for interaction
    if (controls) {
        controls.update();
    }
    
    // Update particle positions from physics
    updateParticlePositions();
    
    // Render the scene
    renderer.render(scene, camera);
}

/**
 * Apply external force to all particles
 * @param {Object} force - Force vector {x, y, z}
 */
export function applyForce(force) {
    SimulationManager.applyExternalForce(force);
}
