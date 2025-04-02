import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as SimulationManager from '../simulation/simulationManager.js';

// Scene variables
let scene, camera, renderer, controls;
let bacteria = []; // Array to store bacterium meshes
let simulationInitialized = false;
let physicsBacteria = []; // Array to store physics bacteria
let animationFrameId;



let defaultParams = {};

    

/**
 * Initialize the Three.js scene
 */
export async function initScene(parameters) {
    // Check if simulation is already initialized
    if (simulationInitialized) {
        deleteAll();
        console.log("Simulation already initialized, deleting existing elements");
    }
    console.log("Initializing scene with parameters:", parameters);
    defaultParams.WIDTH = parameters.width;
    defaultParams.HEIGHT = parameters.height;
    defaultParams.EXIT = parameters.exit;
    defaultParams.BACTERIA_RADIUS = parameters.bacteriaRadius;
    defaultParams.DOUBLING_TIME = parameters.DOUBLING_TIME;
    defaultParams.NUMBER_OF_BACTERIA = parameters.numberOfBacteria;
      

    // Cache DOM elements and constants
    const canvasWidth = window.innerWidth;
    const canvasHeight = window.innerHeight;
    
    // Initialize Three.js scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    
    // Create the camera
    camera = new THREE.PerspectiveCamera(75, canvasWidth / canvasHeight, 0.1, 3000);
    camera.position.z = 100;
    
    // Create the renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(canvasWidth, canvasHeight);
    
    // Append to scene container if it exists, otherwise to body
    const container = document.getElementById('scene-container') || document.body;
    container.appendChild(renderer.domElement);
    
    // Add OrbitControls for camera interaction
    controls = new OrbitControls(camera, renderer.domElement);

    controls.minDistance = 20;
    controls.maxDistance = 1500;
    controls.maxPolarAngle = Math.PI;
    
    // Add grid for reference
    addGrid();
    
    // Initialize physics simulation
    try {
        await SimulationManager.initSimulation();
        simulationInitialized = true;
        console.log("Simulation initialized successfully");
        
        // Create bacteria
        createBacteria();
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
    const gridSize = Math.max(defaultParams.WIDTH, defaultParams.HEIGHT);
    const gridHelper = new THREE.GridHelper(gridSize, gridSize / 10);
    gridHelper.name = 'gridHelper';
    scene.add(gridHelper);
    
    // Add X, Y, Z axes
    const axesHelper = new THREE.AxesHelper(gridSize / 2);
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

    // Remove all bacteria from the scene
    for (let bacterium of bacteria) {
        scene.remove(bacterium);
        // Dispose of geometry and material to free memory
        bacterium.geometry.dispose();
        bacterium.material.dispose();
    }
    bacteria = [];

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
    physicsBacteria = [];
    simulationInitialized = false;

    console.log("All scene elements deleted");
}

// In createBacteria(), after creating the physics bacterium, add the unique ID to the mesh:
function createBacteria() {
    if (!simulationInitialized) {
        console.error("Cannot create bacteria: simulation not initialized");
        return;
    }
    
    // Create bacterium meshes
    for (let i = 0; i < defaultParams.NUMBER_OF_BACTERIA; i++) {
        const bacteriumMaterial1 = new THREE.MeshBasicMaterial({ 
            color: 0xff00ff,
            transparent: true, opacity: 0.5 
        });
      
        // Create capsule mesh
        const capsule = new THREE.Mesh(
            new THREE.CapsuleGeometry(defaultParams.BACTERIA_RADIUS,  4*defaultParams.BACTERIA_RADIUS, 4, 8),
            bacteriumMaterial1
        );
        
        // Set initial position
        capsule.position.set(
            Math.random() * defaultParams.WIDTH,
            Math.random() * defaultParams.HEIGHT,
            0
        );
        
        // Add to scene and store reference
        scene.add(capsule);
        bacteria.push(capsule);
        
        // Create physics bacterium at corresponding position
        const physicsBacterium = SimulationManager.createBacterium({
            position: {
                x: capsule.position.x, 
                y: capsule.position.y 
            },
            radius: defaultParams.BACTERIA_RADIUS,
        });
        
        if (physicsBacterium) {
            // Save the unique id on the mesh
            capsule.userData.id = physicsBacterium.id;
            physicsBacteria.push(physicsBacterium);
        }
    }
    
    console.log(`Created ${bacteria.length} bacteria with physics bodies`);
}

// Updated updateBacteriumPositions() function
function updateBacteriumPositions() {
    if (!simulationInitialized) return;
    
    SimulationManager.handleBoundaries({
        width: defaultParams.WIDTH,
        height: defaultParams.HEIGHT,
        exit: defaultParams.EXIT
    });
    
    // Update physics simulation
    SimulationManager.updateSimulation();
    const rigidBodies = SimulationManager.getRigidBodies();
    
    // Remove meshes for bacteria that have been deleted in the physics simulation.
    // Loop backward to avoid indexing issues during splice.
    for (let i = bacteria.length - 1; i >= 0; i--) {
        const mesh = bacteria[i];
        const id = mesh.userData.id;
        if (!rigidBodies.has(id)) {
            scene.remove(mesh);
            mesh.geometry.dispose();
            if (Array.isArray(mesh.material)) {
                mesh.material.forEach(mat => mat.dispose());
            } else {
                mesh.material.dispose();
            }
            bacteria.splice(i, 1);
            console.log(`Deleted mesh for bacterium id ${id}`);
        }
    }
    
    // Update visual representation for remaining bacteria based on physics simulation.
    for (const [id, bodyData] of rigidBodies.entries()) {
        // Find the corresponding mesh by matching userData.id
        const mesh = bacteria.find(m => m.userData.id === id);
        if (!mesh) continue;
        
        const body = bodyData.rigidBody;
        const position = body.translation();
        const orientation = body.rotation();
        const newLength = bodyData.length;
        
        mesh.geometry.dispose();
        mesh.geometry = new THREE.CapsuleGeometry(
            defaultParams.BACTERIA_RADIUS,
            2 * newLength,
            4,
            8
        );
        mesh.updateMatrixWorld();
        
        // Update mesh position (convert from physics space to Three.js space)
        mesh.position.set(
            position.x - defaultParams.WIDTH / 2,
            position.y - defaultParams.HEIGHT / 2,
            0
        );
        
        mesh.rotation.set(0, 0, orientation);
    }
}
/**
 * Animation loop
 */
function animate() {
    animationFrameId = requestAnimationFrame(animate);

    
    // Update bacterium positions from physics
    updateBacteriumPositions();
    
    // Render the scene
    renderer.render(scene, camera);
}



export function stop() {
    SimulationManager.pause();
}
