/**
 * Simulation Manager for AgeEnt
 * 
 * This module manages the bacterial simulation, coordinating between
 * the physics engine and the visualization components.
 */

import * as Physics from './physics.js';

// Simulation state
let simulationInitialized = false;
let bacteriaEntities = [];
let boundaryWalls = [];
let externalForce = { x: 0, y: 0, z: 0 };

// Simulation parameters
const DEFAULT_MOTILITY = 0.3;
const DEFAULT_TUMBLE_RATE = 0.05;
let motilityStrength = DEFAULT_MOTILITY;
let tumbleRate = DEFAULT_TUMBLE_RATE;

/**
 * Initialize the simulation
 * @returns {Promise} Promise that resolves when simulation is initialized
 */
export async function initSimulation() {
    try {
        // Initialize the physics engine
        await Physics.initPhysics();
        
        simulationInitialized = true;
        console.log("Simulation initialized successfully");
        return true;
    } catch (error) {
        console.error("Failed to initialize simulation:", error);
        throw error;
    }
}




/**
 * Update the simulation for one frame
 */
export function updateSimulation() {
    if (!simulationInitialized) return;
    
    // Apply motility forces to each bacterium
    bacteriaEntities.forEach(bacterium => {
        const rigidBody = bacterium.physicsEntity.rigidBody;
        
        // Apply random motility forces
        Physics.applyMotilityForces(
            rigidBody, 
            bacterium.motility * motilityStrength,
            bacterium.tumbleRate * tumbleRate
        );
        
        // Apply external forces (from UI controls)
        if (externalForce.x !== 0 || externalForce.y !== 0) {
            Physics.applyForce(rigidBody, {
                x: externalForce.x,
                y: externalForce.y
            });
        }
        
        // Get updated transform from physics
        const transform = Physics.getBodyTransform(rigidBody);
        if (transform) {
            // Update the mesh position and rotation
            bacterium.mesh.position.x = transform.position.x;
            bacterium.mesh.position.y = transform.position.y;
            bacterium.mesh.rotation.y = transform.rotation;
        }
    });
    
    // Step the physics simulation
    Physics.stepPhysics();
}

/**
 * Apply an external force to all bacteria
 * @param {Object} force - Force vector {x, y, z}
 */
export function applyExternalForce(force) {
    externalForce = force;
    console.log(`Applied external force: (${force.x}, ${force.y}, ${force.z})`);
}

/**
 * Set the global motility strength
 * @param {number} strength - Motility strength (0-1)
 */
export function setMotilityStrength(strength) {
    motilityStrength = Math.max(0, Math.min(1, strength));
}

/**
 * Set the global tumble rate
 * @param {number} rate - Tumble rate (0-1)
 */
export function setTumbleRate(rate) {
    tumbleRate = Math.max(0, Math.min(1, rate));
}

/**
 * Reset the simulation
 */
export function resetSimulation() {
    // Reset all bacteria to random positions
    bacteriaEntities.forEach(bacterium => {
        const worldSize = 100; // Should match the world size in scene.js
        const halfSize = worldSize / 2 * 0.8; // Keep away from edges
        
        // Random position
        const newPosition = {
            x: (Math.random() - 0.5) * halfSize * 2,
            y: bacterium.radius // Just above the grid
        };
        
        // Random rotation
        const newRotation = Math.random() * Math.PI * 2;
        
        // Update physics body
        const rigidBody = bacterium.physicsEntity.rigidBody;
        
        // Ensure position components are valid numbers
        const posX = typeof newPosition.x === 'number' ? newPosition.x : 0;
        const posY = typeof newPosition.y === 'number' ? newPosition.y : 0;
        
        // Set new position - ensure we're passing primitive number values, not objects
        rigidBody.setTranslation(Number(posX), Number(posY), true);
        
        // Apply a random impulse to rotate
        Physics.applyTorque(rigidBody, newRotation, true);
        
        // Reset velocities
        rigidBody.setLinvel({ x: 0, y: 0 }, true);
        rigidBody.setAngvel({ x: 0, y: 0, z: 0 }, true);
    });
    
    // Reset external forces
    externalForce = { x: 0, y: 0, z: 0 };
    
    // Reset simulation parameters
    motilityStrength = DEFAULT_MOTILITY;
    tumbleRate = DEFAULT_TUMBLE_RATE;
}

/**
 * Clean up simulation resources
 */
export function cleanupSimulation() {
    if (simulationInitialized) {
        Physics.cleanupPhysics();
        bacteriaEntities = [];
        boundaryWalls = [];
        simulationInitialized = false;
    }
}
