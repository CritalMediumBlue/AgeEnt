import RAPIER from 'rapier';

// Simulation variables
let world;
let initialized = false;
const rigidBodies = [];

// Constants
const particleRadius = 3; // micrometers

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
    const colliderDesc = RAPIER.ColliderDesc.ball(radius)
        .setRestitution(restitution)
        .setFriction(friction)
        .setDensity(density);
    
    const collider = world.createCollider(colliderDesc, rigidBody);
    
    // Apply initial velocity if provided
    if (options.velocity) {
        rigidBody.setLinvel(options.velocity, true);
    } else {
        // Default: apply random velocity using normal distribution
        const [vx, vy] = normalPolar(0, 1);
        rigidBody.setLinvel({ x: vx * 50, y: vy * 50 }, true);
    }
    
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
 * Create multiple particles
 * @param {number} count - Number of particles to create
 * @param {Object} options - Options for particle creation
 * @returns {Array} - Array of created particles
 */
export function createParticles(count, options = {}) {
    const width = options.width || 1000;
    const height = options.height || 1000;
    const particles = [];
    
    for (let i = 0; i < count; i++) {
        // Random position
        const position = {
            x: Math.random() * width,
            y: Math.random() * height
        };
        
        // Create particle
        const particle = createParticle({
            ...options,
            position
        });
        
        if (particle) {
            particles.push(particle);
        }
    }
    
    console.log(`Created ${particles.length} particles`);
    return particles;
}

/**
 * Update the physics simulation
 */
export function updateSimulation() {
    if (!initialized || !world) {
        return;
    }
    
    world.step();
}

/**
 * Apply Brownian motion to particles
 * @param {Object} options - Options for Brownian motion
 */
export function applyBrownianMotion(options = {}) {
    if (!initialized || !world) {
        return;
    }
    
    const temperature = options.temperature || 400; // K
    const viscosity = options.viscosity || 0.001; // Pa.s
    const boltzmann = 1.38064852e-23; // J/K
    const radius = (options.radius || 0.1 * particleRadius) / 1e6; // m
    const diffusionCoefficient = boltzmann * temperature / (6 * Math.PI * viscosity * radius); // m^2/s
    const sd = Math.sqrt(2 * diffusionCoefficient); // m
    const mean = 0;
    const width = options.width || 1000;
    const height = options.height || 1000;
    
    for (let i = 0; i < rigidBodies.length; i++) {
        const body = rigidBodies[i];
        const position = body.translation();
        const [offsetX, offsetY] = normalPolar(mean, sd);
        
        let newX = position.x + offsetX * 1e6;
        let newY = position.y + offsetY * 1e6;
        
        // Handle boundaries
        if (newX < 0) newX = width;
        else if (newX > width) newX = 0;
        
        if (newY < 0) newY = height;
        else if (newY > height) newY = 0;
        
        body.setTranslation({ x: newX, y: newY }, true);
        body.setLinvel({ x: 0, y: 0 }, true);
    }
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

/**
 * Apply external force to all particles
 * @param {Object} force - Force vector {x, y, z}
 */
export function applyExternalForce(force) {
    if (!initialized || !world) {
        return;
    }
    
    for (let i = 0; i < rigidBodies.length; i++) {
        const body = rigidBodies[i];
        const currentVel = body.linvel();
        
        body.setLinvel({
            x: currentVel.x + force.x,
            y: currentVel.y + force.y
        }, true);
    }
    
    console.log(`Applied force: x=${force.x}, y=${force.y}, z=${force.z || 0}`);
}

/**
 * Get all rigid bodies
 * @returns {Array} - Array of rigid bodies
 */
export function getRigidBodies() {
    return rigidBodies;
}

/**
 * Generate random values using normal distribution (Box-Muller transform)
 * @param {number} mean - Mean value
 * @param {number} sd - Standard deviation
 * @returns {Array} - Array of two normally distributed random values
 */
function normalPolar(mean, sd) {
    let u1, u2, s;
    do {
        u1 = Math.random() * 2 - 1;
        u2 = Math.random() * 2 - 1;
        s = u1 * u1 + u2 * u2;
    } while (s >= 1 || s === 0);
    
    const factor = Math.sqrt(-2.0 * Math.log(s) / s);
    return [mean + u1 * factor * sd, mean + u2 * factor * sd];
}
