import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as SimulationManager from '../simulation/simulationManager.js';

// Scene variables
let scene, camera, renderer, controls;
let particles = []; // Array to store particle meshes
let simulationInitialized = false;
let physicsParticles = []; // Array to store physics particles
let animationFrameId;

// Constants
const WORLD_SIZE = 1000;
const PARTICLE_COUNT = 2000;
const PARTICLE_RADIUS = 3; // micrometers

/**
 * Initialize the Three.js scene
 */
export async function initScene() {
    // Check if simulation is already initialized
    if (simulationInitialized) {
        deleteAll();
        console.log("Simulation already initialized, deleting existing elements");
    }


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
    gridHelper.name = 'gridHelper';
    scene.add(gridHelper);
    
    // Add X, Y, Z axes
    const axesHelper = new THREE.AxesHelper(WORLD_SIZE / 2);
    axesHelper.name = 'axesHelper';
    scene.add(axesHelper);
    
    // Rotate grid to make it horizontal (XZ plane)
    gridHelper.rotation.x = Math.PI / 2;
}

function deleteAll() {
    // Check if simulation is initialized
    if (!simulationInitialized) {
        console.warn("No simulation to delete");
        return;
    }

    // Remove all particles from the scene
    for (let particle of particles) {
        scene.remove(particle);
        // Dispose of geometry and material to free memory
        particle.geometry.dispose();
        particle.material.dispose();
    }
    particles = [];

    // Remove and dispose of grid and axes helpers
    const gridHelper = scene.getObjectByName('gridHelper');
    if (gridHelper) {
        scene.remove(gridHelper);
        gridHelper.geometry.dispose();
        gridHelper.material.dispose();
    }

    const axesHelper = scene.getObjectByName('axesHelper');
    if (axesHelper) {
        scene.remove(axesHelper);
        axesHelper.geometry.dispose();
        axesHelper.material.dispose();
    }

    // Dispose of all other scene children
    while (scene.children.length > 0) {
        const child = scene.children[0];
        scene.remove(child);

        if (child.geometry) child.geometry.dispose();
        if (child.material) {
            if (Array.isArray(child.material)) {
                child.material.forEach((mat) => mat.dispose());
            } else {
                child.material.dispose();
            }
        }
    }

    // Dispose of renderer
    if (renderer) {
        renderer.dispose();
        const container = document.getElementById('scene-container') || document.body;
        if (renderer.domElement.parentNode === container) {
            container.removeChild(renderer.domElement);
        }
    }

    // Dispose of controls
    if (controls) {
        controls.dispose();
    }

    // Stop the animation loop
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    // Call SimulationManager to delete simulation
    SimulationManager.destroySimulation();

    // Reset variables
    scene = null;
    camera = null;
    renderer = null;
    controls = null;
    physicsParticles = [];
    simulationInitialized = false;

    console.log("All scene elements deleted");
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
      
      
        // Create sphere mesh
        const sphere = new THREE.Mesh(
            new THREE.SphereGeometry(PARTICLE_RADIUS, 16, 16),
            particleMaterial1
        );
        
        // Set initial position
        sphere.position.set(
            Math.random()* WORLD_SIZE/10 ,
            Math.random()* WORLD_SIZE/10 ,
            0
        );
        
        // Add to scene and store reference
        particles.push(sphere);
        scene.add(sphere);
        
        // Create physics particle at corresponding position
        const physicsParticle = SimulationManager.createParticle({
            position: {
                x: sphere.position.x, 
                y: sphere.position.y 
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
 * Update particle positions from physics simulation
 */
function updateParticlePositions() {
    if (!simulationInitialized) return;
    
 
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
    animationFrameId = requestAnimationFrame(animate);
    
    // Update controls - ensure they're properly updated for interaction
    if (controls) {
        controls.update();
    }
    
    // Update particle positions from physics
    updateParticlePositions();
    
    // Render the scene
    renderer.render(scene, camera);
}



export function stop() {
    SimulationManager.pause();
}
