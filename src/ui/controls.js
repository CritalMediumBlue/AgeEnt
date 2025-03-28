
// UI state
let controlsContainer;
let isControlsVisible = true;

/**
 * Initialize the UI controls
 */
export function initControls() {
    // Create controls container
    controlsContainer = document.createElement('div');
    controlsContainer.className = 'controls';
    document.body.appendChild(controlsContainer);
    
    // Add title
    const title = document.createElement('h2');
    title.textContent = 'Simulation Controls';
    controlsContainer.appendChild(title);
    
    // Add toggle button for controls visibility
    const toggleButton = document.createElement('button');
    toggleButton.textContent = 'Hide Controls';
    toggleButton.className = 'toggle-button';
    toggleButton.addEventListener('click', toggleControlsVisibility);
    document.body.appendChild(toggleButton);
    
    // Add simulation controls
    addSimulationControls();
    
    console.log("UI controls initialized");
}

/**
 * Toggle the visibility of the controls panel
 */
function toggleControlsVisibility() {
    isControlsVisible = !isControlsVisible;
    controlsContainer.style.display = isControlsVisible ? 'block' : 'none';
    
    // Update button text
    const toggleButton = document.querySelector('.toggle-button');
    if (toggleButton) {
        toggleButton.textContent = isControlsVisible ? 'Hide Controls' : 'Show Controls';
    }
}

/**
 * Add simulation control elements
 */
function addSimulationControls() {
    // Add section for bacteria parameters
    addSection('Bacteria Parameters', [
        {
            type: 'slider',
            label: 'Motility Speed',
            min: 0,
            max: 1,
            step: 0.05,
            defaultValue: 0.3,
            onChange: (value) => {
                // Apply to all bacteria
                applyExternalForce({
                    x: value * 2,
                    y: 0,
                    z: 0
                });
            }
        },
        {
            type: 'slider',
            label: 'Tumble Rate',
            min: 0,
            max: 0.2,
            step: 0.01,
            defaultValue: 0.05,
            onChange: (value) => {
                // This would be implemented in the simulation manager
                console.log(`Tumble rate set to ${value}`);
            }
        }
    ]);
    
    // Add section for environment parameters
    addSection('Environment', [
        {
            type: 'slider',
            label: 'Gravity',
            min: -1,
            max: 1,
            step: 0.1,
            defaultValue: 0,
            onChange: (value) => {
                // Apply gravity force to all bacteria
                applyExternalForce({
                    x: 0,
                    y: value,
                    z: 0
                });
            }
        },
        {
            type: 'slider',
            label: 'Flow Force',
            min: -0.5,
            max: 0.5,
            step: 0.05,
            defaultValue: 0,
            onChange: (value) => {
                // Apply flow force to all bacteria
                applyExternalForce({
                    x: 0,
                    y: 0,
                    z: value
                });
            }
        }
    ]);
    
    // Add section for visualization
    addSection('Visualization', [
        {
            type: 'checkbox',
            label: 'Show Forces',
            defaultValue: false,
            onChange: (value) => {
                // This would be implemented in the visualization
                console.log(`Show forces: ${value}`);
            }
        },
        {
            type: 'checkbox',
            label: 'Show Contacts',
            defaultValue: false,
            onChange: (value) => {
                // This would be implemented in the visualization
                console.log(`Show contacts: ${value}`);
            }
        },
        {
            type: 'color',
            label: 'Bacteria Color',
            defaultValue: '#4fc3f7',
            onChange: (value) => {
                // This would be implemented in the visualization
                console.log(`Bacteria color: ${value}`);
            }
        }
    ]);
    
    // Add action buttons
    addActionButtons([
        {
            label: 'Reset Simulation',
            onClick: () => {
                // This would reset the simulation
                console.log('Reset simulation');
            }
        },
        {
            label: 'Toggle Pause',
            onClick: () => {
                // This would pause/resume the simulation
                console.log('Toggle pause');
            }
        }
    ]);
}

/**
 * Add a section of controls
 * @param {string} title - Section title
 * @param {Array} controls - Array of control configurations
 */
function addSection(title, controls) {
    const section = document.createElement('div');
    section.className = 'control-section';
    
    const sectionTitle = document.createElement('h3');
    sectionTitle.textContent = title;
    section.appendChild(sectionTitle);
    
    controls.forEach(control => {
        const controlElement = createControl(control);
        section.appendChild(controlElement);
    });
    
    controlsContainer.appendChild(section);
}

/**
 * Create a control element based on configuration
 * @param {Object} config - Control configuration
 * @returns {HTMLElement} - The created control element
 */
function createControl(config) {
    const controlContainer = document.createElement('div');
    controlContainer.className = 'control-item';
    
    const label = document.createElement('label');
    label.textContent = config.label;
    controlContainer.appendChild(label);
    
    let input;
    
    switch (config.type) {
        case 'slider':
            input = document.createElement('input');
            input.type = 'range';
            input.min = config.min;
            input.max = config.max;
            input.step = config.step;
            input.value = config.defaultValue;
            
            const valueDisplay = document.createElement('span');
            valueDisplay.textContent = config.defaultValue;
            valueDisplay.className = 'value-display';
            
            input.addEventListener('input', () => {
                const value = parseFloat(input.value);
                valueDisplay.textContent = value.toFixed(2);
                config.onChange(value);
            });
            
            controlContainer.appendChild(input);
            controlContainer.appendChild(valueDisplay);
            break;
            
        case 'checkbox':
            input = document.createElement('input');
            input.type = 'checkbox';
            input.checked = config.defaultValue;
            
            input.addEventListener('change', () => {
                config.onChange(input.checked);
            });
            
            controlContainer.appendChild(input);
            break;
            
        case 'color':
            input = document.createElement('input');
            input.type = 'color';
            input.value = config.defaultValue;
            
            input.addEventListener('change', () => {
                config.onChange(input.value);
            });
            
            controlContainer.appendChild(input);
            break;
    }
    
    return controlContainer;
}

/**
 * Add action buttons
 * @param {Array} buttons - Array of button configurations
 */
function addActionButtons(buttons) {
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'button-container';
    
    buttons.forEach(button => {
        const buttonElement = document.createElement('button');
        buttonElement.textContent = button.label;
        buttonElement.addEventListener('click', button.onClick);
        buttonContainer.appendChild(buttonElement);
    });
    
    controlsContainer.appendChild(buttonContainer);
}

