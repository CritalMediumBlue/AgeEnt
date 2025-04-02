import RAPIER from 'rapier';
import { normalPolar } from '../performance/normalPolar.js';

// Simulation variables
let world;
let initialized = false;
let isPaused = true;
// Use a Map to store the rigid bodies along with their metadata
const rigidBodies = new Map();
// Keep track of IDs
let nextBodyId = 0;

export async function initSimulation() {
    try {
        // Wait for Rapier to initialize
        await RAPIER.init();
        
        // Set up gravity (default to zero)
        const gravity = { x: 0.0, y: 0.0 };
        
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

        // Remove all rigid bodies stored in the Map
        for (const [id, { rigidBody }] of rigidBodies.entries()) {
            try {
                world.removeRigidBody(rigidBody);
                rigidBodiesDestroyed++;
            } catch (error) {
                console.error(`Error removing rigid body id ${id}: ${error}`);
            }
        }

        console.log(`Destroyed ${rigidBodiesDestroyed} rigid bodies`);
        console.log(`Destroyed ${collidersDestroyed} colliders`);

        // Clear the Map of rigid bodies
        rigidBodies.clear();

        // Destroy the world
        world.free(); // Free memory allocated by Rapier
        world = null;

        // Reset all simulation-related variables
        initialized = false;
        isPaused = true;
        nextBodyId = 0;
        console.log("Simulation destroyed and all resources freed");
    } catch (error) {
        console.error("Error during simulation destruction:", error);
    }
}

/**
 * Create a bacterium in the physics world
 * @param {Object} options - Bacterium options
 * @returns {Object} - The created bacterium
 */
export function createBacterium(options = {}) {
    if (!initialized || !world) {
        console.error("Cannot create bacterium: simulation not initialized");
        return null;
    }
    
    const position = options.position;
    const radius = options.radius;
    const restitution = 0.5;
    const friction = 0.0;
    const density = 1.0;
    
    // Create rigid body
    const bodyDesc = RAPIER.RigidBodyDesc.dynamic().setTranslation(position.x, position.y);
    const rigidBody = world.createRigidBody(bodyDesc);
    
    // Create collider
    const halfHeight = radius * 2;
    const colliderDesc = RAPIER.ColliderDesc.capsule(halfHeight, radius)
        .setRestitution(restitution)
        .setFriction(friction)
        .setDensity(density);
    
    const collider = world.createCollider(colliderDesc, rigidBody);

    const [vx, vy] = normalPolar(0, 1);
    rigidBody.setLinvel({ x: vx * 5, y: vy * 5 }, true);
    
    // Assign an ID and store the rigid body with its metadata in the Map
    const bacteriumId = nextBodyId++;
    rigidBodies.set(bacteriumId, {
        rigidBody,
        collider,
        length: halfHeight,
    });
    
    return {
        id: bacteriumId,
        rigidBody,
        collider,
        length: halfHeight,
    };
}

/**
 * Update the physics simulation
 */
export function updateSimulation() {
    if (!initialized || !world || isPaused) {
        return;
    }

    growBacteria();

    world.step();
}

function growBacteria() {
    for (const [, bodyData] of rigidBodies.entries()) {
        const newLength = bodyData.length * 1.001;
        bodyData.collider.setHalfHeight(newLength);
        bodyData.length = newLength;
        //set velocity to zero
        bodyData.rigidBody.setLinvel({ x: 0, y: 0 }, true);
    }
}
// ...existing code...
export function handleBoundaries(options = {}) {
    if (!initialized || !world) {
        return;
    }
    
    const width = options.width;
    const height = options.height;

    // Use Array.from so we can safely remove entries while iterating
    for (const [id, bodyData] of Array.from(rigidBodies.entries())) {
        const position = bodyData.rigidBody.translation();
        
        // If the bacterium is outside the boundaries, delete it
        if (position.x < 0 || position.x > width || position.y < 0 || position.y > height) {
            try {
                // Remove the collider first to avoid dangling references
                world.removeCollider(bodyData.collider);
                // Then remove the rigid body
                world.removeRigidBody(bodyData.rigidBody);
                // Remove from the Map
                rigidBodies.delete(id);
                console.log(`Deleted bacterium id ${id} for leaving boundary`);
            } catch (error) {
                console.error(`Error deleting bacterium id ${id}: ${error}`);
            }
        }
    }
}
// ...existing code...

/**
 * Handle boundary conditions for bacteria
 * @param {Object} options - Boundary options
 */
export function handleBoundaries2(options = {}) {
    if (!initialized || !world) {
        return;
    }
    
    const width = options.width ;
    const height = options.height ;


    // Iterate over Map values to update each rigid body's position
    for (const { rigidBody } of rigidBodies.values()) {
        const position = rigidBody.translation();
        let newX = position.x;
        let newY = position.y;

        
        if (newX < 0) newX = width;
        else if (newX > width) newX = 0;
        
        if (newY < 0) newY = height;
        else if (newY > height) newY = 0;
        
        rigidBody.setTranslation({ x: newX, y: newY }, true);
    }
}

export function pause() {
    isPaused = !isPaused;
}

/**
 * Get all rigid bodies
 * @returns {Map} - Map of rigid bodies and their metadata
 */
export function getRigidBodies() {
    return rigidBodies;
}