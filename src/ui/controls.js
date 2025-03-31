
// UI state
let controlsContainer;
let isControlsVisible = true;
let isRunning = false;

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
    addSection('Microfluidics device', [
        //here the user will choose one simulation out of the 3
        {
            type: 'slider',
            label: 'width [μm]',
            min: 0,
            max: 100,
            step: 1,
            defaultValue: 100,
            onChange: (value) => {
                // This would be implemented in the simulation manager
                console.log(`Width of microfluidics device set to ${Math.round(value)}μm`);
            }
        },

        {
            type: 'slider',
            label: 'height [μm]',
            min: 0,
            max: 100,
            step: 1,
            defaultValue: 60,
            onChange: (value) => {
                // This would be implemented in the simulation manager
                console.log(`Height of microfluidics device set to ${Math.round(value)}μm`);
            }
        },
        {
            type: 'select',
            label: 'Exit of the chamber',
            //oprions are top, bottom, left or right
            options: [
                { value: 'top', label: 'Top' },
                { value: 'bottom', label: 'Bottom' },
                { value: 'left', label: 'Left' },
                { value: 'right', label: 'Right' },
                { value: 'left and right', label: 'Left and Right' },
                { value: 'top and bottom', label: 'Top and Bottom' },
                {value: 'all', label: 'All'}
            ],
            defaultValue: 'top',
            onChange: (value) => {
                console.log(`Exit of the chamber set to ${value}`);
            }
        }

    ]);



    // Add section for bacteria parameters

    addSection('Bacteria Parameters', [
        {
            type: 'slider',
            label: 'Doubling time',
            min: 20,
            max: 120,
            step: 1,
            defaultValue: 30,
            onChange: (value) => {
                // Apply to all bacteria
              
            }
        },
        {
            type: 'sliderFine',
            label: 'Diameter',
            min: 0.25,
            max: 1.25,
            step: 0.05,
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
            type: 'checkbox',
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
            label: 'Run',
            onClick: (event) => {
                stopSimulation();
                isRunning = !isRunning;
                event.target.textContent = isRunning ? 'Pause' : 'Start';
                return isRunning;
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
                valueDisplay.textContent = value.toFixed(0);
                config.onChange(value);
            });
            
            controlContainer.appendChild(input);
            controlContainer.appendChild(valueDisplay);
            break;

        case 'sliderFine':
            input = document.createElement('input');
            input.type = 'range';
            input.min = config.min;
            input.max = config.max;
            input.step = config.step;
            input.value = config.defaultValue;
            
            const valueDisplayFine = document.createElement('span');
            valueDisplayFine.textContent = config.defaultValue;
            valueDisplayFine.className = 'value-display';
            
            input.addEventListener('input', () => {
                const value = parseFloat(input.value);
                valueDisplayFine.textContent = value.toFixed(2);
                config.onChange(value);
            });
            
            controlContainer.appendChild(input);
            controlContainer.appendChild(valueDisplayFine);
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
        case 'select':
            input = document.createElement('select');
            config.options.forEach(option => {
                const optionElement = document.createElement('option');
                optionElement.value = option.value;
                optionElement.textContent = option.label;
                if (option.value === config.defaultValue) {
                    optionElement.selected = true;
                }
                input.appendChild(optionElement);
            });
            
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

