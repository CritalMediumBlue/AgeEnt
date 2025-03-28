/**
 * Physics module for AgeEnt using Rapier.js
 * 
 * This module handles the physics simulation for bacterial interactions,
 * particularly focusing on collision detection and response between bacteria.
 */

import * as RAPIER from 'rapier';

// Physics world and objects
let world;
let physicsBodies = [];
let physicsInitialized = false;

// Constants
const PHYSICS_STEP = 1/60; // 60 fps physics update
const VELOCITY_DAMPING = 0.98; // Slight damping to prevent perpetual motion
const ANGULAR_DAMPING = 0.95; // Damping for angular velocity

/**
 * Initialize the physics world
 * @returns {Promise} Promise that resolves when physics is initialized
 */
export async function initPhysics() {
    // Initialize RAPIER
    await RAPIER.init();
    
    // Create a 2D physics world with gravity set to zero (for bacteria in a fluid)
    const gravity = { x: 0.0, y: 0.0 };
    world = new RAPIER.World(gravity);
    
    physicsInitialized = true;
    console.log("Rapier physics initialized");
    
    return world;
}



/**
 * Create a static boundary wall
 * @param {Object} params - Parameters for the wall
 * @param {Object} params.position - Position {x, y}
 * @param {Object} params.size - Size {width, height}
 * @returns {Object} Physics entity for the wall
 */
export function createBoundaryWall(params) {
    if (!physicsInitialized) {
        console.error("Physics not initialized");
        return null;
    }
    
    try {
        // Log the input parameters for debugging
        console.log("Creating boundary wall with params:", JSON.stringify(params));
        
        // Validate position object
        if (!params.position) {
            console.error("Missing position object in wall parameters");
            return null;
        }
        
        // Ensure position components are valid numbers
        const posX = typeof params.position.x === 'number' ? params.position.x : 0;
        const posY = typeof params.position.y === 'number' ? params.position.y : 0;
        
        // Log the processed position values
        console.log(`Using position values: x=${posX}, y=${posY}`);
        
        // Create a static rigid body
        const bodyDesc = RAPIER.RigidBodyDesc.fixed();
        
        // Set translation with explicit number values
        // Ensure we're passing primitive number values, not objects
        const numPosX = Number(posX);
        const numPosY = Number(posY);
        
        // Additional validation to ensure we have valid numbers
        if (isNaN(numPosX) || isNaN(numPosY)) {
            console.error(`Invalid position values: x=${posX}, y=${posY}`);
            return null;
        }

        console.log(`Setting translation to: (${numPosX}, ${numPosY})`);
        
        bodyDesc.setTranslation(numPosX, numPosY);
        
        const rigidBody = world.createRigidBody(bodyDesc);
        
        // Validate size object
        if (!params.size) {
            console.error("Missing size object in wall parameters");
            return null;
        }
        
        // Ensure size components are valid numbers
        const width = typeof params.size.width === 'number' ? params.size.width : 1;
        const height = typeof params.size.height === 'number' ? params.size.height : 1;
        
        // Log the processed size values
        console.log(`Using size values: width=${width}, height=${height}`);
        
        // Create a cuboid collider
        const colliderDesc = RAPIER.ColliderDesc.cuboid(
            width / 2,
            height / 2
        );
        
        // Set restitution and friction
        colliderDesc.setRestitution(0.3);
        colliderDesc.setFriction(0.1);
        
        const collider = world.createCollider(colliderDesc, rigidBody);
        
        // Add to our list of physics bodies
        const physicsEntity = {
            rigidBody,
            collider,
            isStatic: true
        };
        
        physicsBodies.push(physicsEntity);
        console.log("Successfully created boundary wall");
        
        return physicsEntity;
    } catch (error) {
        console.error("Error creating boundary wall:", error);
        return null;
    }
}

/**
 * Apply a force to a rigid body
 * @param {Object} rigidBody - The rigid body to apply force to
 * @param {Object} force - Force vector {x, y}
 * @param {boolean} isImpulse - Whether to apply as impulse (true) or force (false)
 */
export function applyForce(rigidBody, force, isImpulse = false) {
    if (!rigidBody || !physicsInitialized) return;
    
    if (isImpulse) {
        rigidBody.applyImpulse({ x: force.x, y: force.y }, true);
    } else {
        rigidBody.applyForce({ x: force.x, y: force.y }, true);
    }
}

/**
 * Apply a torque to a rigid body to rotate it
 * @param {Object} rigidBody - The rigid body to apply torque to
 * @param {number} torque - Torque amount (positive or negative)
 * @param {boolean} isImpulse - Whether to apply as impulse (true) or force (false)
 */
export function applyTorque(rigidBody, torque, isImpulse = false) {
    if (!rigidBody || !physicsInitialized) return;
    
    if (isImpulse) {
        // For 2D, we only apply torque around the z-axis
        rigidBody.applyTorqueImpulse({ x: 0, y: 0, z: torque }, true);
    } else {
        rigidBody.applyTorque({ x: 0, y: 0, z: torque }, true);
    }
}

/**
 * Apply random forces to simulate bacterial motility
 * @param {Object} rigidBody - The rigid body to apply forces to
 * @param {number} motilityStrength - Strength of the motility
 * @param {number} tumbleRate - Probability of changing direction (0-1)
 */
export function applyMotilityForces(rigidBody, motilityStrength, tumbleRate) {
    if (!rigidBody || !physicsInitialized) return;
    
    // Get the current rotation of the bacterium
    const rotation = rigidBody.rotation();
    
    // Convert quaternion to direction vector (in 2D)
    // For a 2D rotation around z-axis, we can extract the angle
    const angle = 2 * Math.atan2(rotation.im.z, rotation.re);
    
    // Direction vector based on current rotation
    const direction = {
        x: Math.cos(angle),
        y: Math.sin(angle)
    };
    
    // Apply force in the direction the bacterium is facing
    applyForce(rigidBody, {
        x: direction.x * motilityStrength,
        y: direction.y * motilityStrength
    });
    
    // Random tumbling (change direction)
    if (Math.random() < tumbleRate) {
        // Apply a random torque to change direction
        const randomTorque = (Math.random() - 0.5) * motilityStrength * 2;
        applyTorque(rigidBody, randomTorque, true);
    }
}

/**
 * Step the physics simulation forward
 */
export function stepPhysics() {
    if (!physicsInitialized) return;
    
    // Step the simulation
    world.step();
    
    // Apply damping to all dynamic bodies
    for (const entity of physicsBodies) {
        if (entity.isStatic) continue;
        
        const rigidBody = entity.rigidBody;
        
        // Get current velocities
        const linVel = rigidBody.linvel();
        const angVel = rigidBody.angvel();
        
        // Apply damping
        rigidBody.setLinvel(
            { x: linVel.x * VELOCITY_DAMPING, y: linVel.y * VELOCITY_DAMPING },
            true
        );
        
        rigidBody.setAngvel(
            { x: angVel.x * ANGULAR_DAMPING, y: angVel.y * ANGULAR_DAMPING, z: angVel.z * ANGULAR_DAMPING },
            true
        );
    }
}

/**
 * Get the position and rotation of a rigid body
 * @param {Object} rigidBody - The rigid body
 * @returns {Object} Position and rotation {position: {x, y}, rotation: number}
 */
export function getBodyTransform(rigidBody) {
    if (!rigidBody) return null;
    
    const position = rigidBody.translation();
    const rotation = rigidBody.rotation();
    
    // Convert quaternion to Euler angle (for 2D we only need the z-rotation)
    const angle = 2 * Math.atan2(rotation.im.z, rotation.re);
    
    return {
        position: { x: position.x, y: position.y },
        rotation: angle
    };
}

/**
 * Clean up physics resources
 */
export function cleanupPhysics() {
    if (physicsInitialized && world) {
        // Remove all bodies
        physicsBodies = [];
        world = null;
        physicsInitialized = false;
    }
}
