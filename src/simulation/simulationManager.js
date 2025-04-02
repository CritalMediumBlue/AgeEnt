import RAPIER from 'rapier';
import { normalPolar } from '../performance/normalPolar.js';

// Simulation variables
let world;
let initialized = false;
let isPaused = true;
const rigidBodies = [];

// Constants
const particleRadius = 3; // micrometers
const defaultParameters = {}

/**
 * Initialize the physics simulation
 */
export async function initSimulation(options = {}) {
    try {
        // Wait for Rapier to initialize
        await RAPIER.init();
        
        // Set up gravity (default to zero)
        const gravity = options.gravity || { x: 0.0, y: 0.0 };
        
        // Create the physics world
        world = new RAPIER.World(gravity);
        
        initialized = true;
        console.log("Physics simulation initialized");
        
        return true;
    } catch (error) {
        console.error("Failed to initialize physics simulation:", error);
        return false;
    }
}

export function destroySimulation() {
    if (!initialized || !world) {
        console.warn("Simulation not initialized or already destroyed");
        return;
    }
    
    try {
        // Pause the simulation to prevent any ongoing steps
        isPaused = true;

        let rigidBodiesDestroyed = 0;
        let collidersDestroyed = 0;

        // Remove all colliders first to prevent dangling references
        world.forEachCollider((collider) => {
            try {
                world.removeCollider(collider);
                
                collidersDestroyed++;
            } catch (error) {
                console.error(`Error removing collider: ${error}`);
            }
        });

        // Remove all rigid bodies
        while (rigidBodies.length > 0) {
            const body = rigidBodies.pop();
            try {
                world.removeRigidBody(body);
               
                rigidBodiesDestroyed++;
            } catch (error) {
                console.error(`Error removing rigid body: ${error}`);
            }
        }

        console.log(`Destroyed ${rigidBodiesDestroyed} rigid bodies`);
        console.log(`Destroyed ${collidersDestroyed} colliders`);

        // Explicitly clear the rigidBodies array
        rigidBodies.length = 0;

        // Destroy the world
        world.free(); // Free memory allocated by Rapier
        world = null;

        // Reset all simulation-related variables
        initialized = false;
        isPaused = true;

        console.log("Simulation destroyed and all resources freed");
    } catch (error) {
        console.error("Error during simulation destruction:", error);
    }
}

/**
 * Create a particle in the physics world
 * @param {Object} options - Particle options
 * @returns {Object} - The created particle
 */
export function createParticle(options = {}) {
    if (!initialized || !world) {
        console.error("Cannot create particle: simulation not initialized");
        return null;
    }
    
    const position = options.position || { x: 0, y: 0 };
    const radius = options.radius || particleRadius;
    const restitution = options.restitution || 1.0;
    const friction = options.friction || 0.0;
    const density = options.density || 1.0;
    
    // Create rigid body
    const bodyDesc = RAPIER.RigidBodyDesc.dynamic().setTranslation(position.x, position.y);
    const rigidBody = world.createRigidBody(bodyDesc);
    
    // Create collider
    const colliderDesc = RAPIER.ColliderDesc.capsule(radius, radius)
        .setRestitution(restitution)
        .setFriction(friction)
        .setDensity(density);
    
    const collider = world.createCollider(colliderDesc, rigidBody);
    
  
    const [vx, vy] = normalPolar(0, 1);
    rigidBody.setLinvel({ x: vx * 50, y: vy * 50 }, true);
    
    
    // Store the rigid body
    const particleIndex = rigidBodies.length;
    rigidBodies.push(rigidBody);
    
    return {
        index: particleIndex,
        rigidBody,
        collider
    };
}



/**
 * Update the physics simulation
 */
export function updateSimulation() {
    if (!initialized || !world || isPaused){
        return;
    }
    
    world.step();
}



/**
 * Handle boundary conditions for particles
 * @param {Object} options - Boundary options
 */
export function handleBoundaries(options = {}) {
    if (!initialized || !world) {
        return;
    }
    
    const width = options.width || 1000;
    const height = options.height || 1000;
    
    for (let i = 0; i < rigidBodies.length; i++) {
        const body = rigidBodies[i];
        const position = body.translation();
        let newX = position.x;
        let newY = position.y;
        
        if (newX < 0) newX = width;
        else if (newX > width) newX = 0;
        
        if (newY < 0) newY = height;
        else if (newY > height) newY = 0;
        
        body.setTranslation({ x: newX, y: newY }, true);
    }
}



export function pause(){
    isPaused = !isPaused;
}

/**
 * Get all rigid bodies
 * @returns {Array} - Array of rigid bodies
 */
export function getRigidBodies() {
    return rigidBodies;
}
