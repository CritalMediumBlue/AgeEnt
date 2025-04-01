// UI state
let controlsContainer;
let isControlsVisible = true;
let isRunning = false;
let simulationStartCallback = null;

let width = 100;
let height = 60;
let exit = 'top';
let bacteriaDiameter = 0.05;
let doublingTime = 30;
let gravity = 0;

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
    title.textContent = 'Simulation Parameters';
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

export function getParameters() {
    // This function will return the parameters set by the user
    return {width, height, exit, bacteriaDiameter, doublingTime, gravity};
}

export function setSimulationStartCallback(callback) {
    simulationStartCallback = callback;
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
        {
            type: 'slider',
            label: 'width [μm]',
            min: 0,
            max: 100,
            step: 1,
            defaultValue: 100,
            onChange: (value) => {
                width = value;
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
                height = value;
                console.log(`Height of microfluidics device set to ${Math.round(value)}μm`);
            }
        },
        {
            type: 'select',
            label: 'Exit of the chamber',
            options: [
                { value: 'top', label: 'Top' },
                { value: 'bottom', label: 'Bottom' },
                { value: 'left', label: 'Left' },
                { value: 'right', label: 'Right' },
                { value: 'left and right', label: 'Left and Right' },
                { value: 'top and bottom', label: 'Top and Bottom' },
                { value: 'all', label: 'All'}
            ],
            defaultValue: 'top',
            onChange: (value) => {
                exit = value;
                console.log(`Exit of the chamber set to ${value}`);
            }
        },
        {
            type: 'slider',
            label: 'Initial number of bacteria',
            min: 1,
            max: 1000,
            step: 1,
            defaultValue: 3,
            onChange: (value) => {
                
                console.log(`Bacteria diameter set to ${value} μm`);
            }
        }
    ]);

    addSection('Bacteria Doubling time', [
        {
            type: 'slider',
            label: 'Mean',
            min: 20,
            max: 120,
            step: 1,
            defaultValue: 30,
            onChange: (value) => {
                doublingTime = value;
                console.log(`Doubling time set to ${value} min`);
            }
        },
        {
            type: 'slider',
            label: 'Standard Deviation',
            min: 20,
            max: 120,
            step: 1,
            defaultValue: 30,
            onChange: (value) => {
                doublingTime = value;
                console.log(`Doubling time set to ${value} min`);
            }
        }
    ]);
    addSection('Bacteria Diameter', [
        {
            type: 'fineSlider',
            label: 'Mean',
            min: 0.25,
            max: 1.25,
            step: 0.05,
            defaultValue: 0.05,
            onChange: (value) => {
                bacteriaDiameter = value;
                console.log(`Bacteria diameter set to ${value} μm`);
            }
        },
        {
            type: 'fineSlider',
            label: 'Standard Deviation',
            min: 0.25,
            max: 1.25,
            step: 0.05,
            defaultValue: 0.05,
            onChange: (value) => {
                bacteriaDiameter = value;
                console.log(`Bacteria diameter set to ${value} μm`);
            }
        }
    ]);
   
        
    addSection('Bacteria Duplication length [μm]', [
        {
            type: 'slider',
            label: 'Mean',
            min: 0.5,
            max: 10,
            step: 0.5,
            defaultValue: 3,
            onChange: (value) => {
                
                console.log(`Bacteria diameter set to ${value} μm`);
            }
        },
        {
            type: 'slider',
            label: 'Standard Deviation',
            min: 1,
            max: 1000,
            step: 1,
            defaultValue: 3,
            onChange: (value) => {
                
                console.log(`Bacteria diameter set to ${value} μm`);
            }
        },

    ]);

    addSection('Bacteria duplication time [min]', [
        {
            type: 'slider',
            label: 'Mean',
            min: 1,
            max: 1000,
            step: 1,
            defaultValue: 3,
            onChange: (value) => {
                
                console.log(`Bacteria diameter set to ${value} μm`);
            }
        },
        {
            type: 'slider',
            label: 'Standard Deviation',
            min: 1,
            max: 1000,
            step: 1,
            defaultValue: 3,
            onChange: (value) => {
                
                console.log(`Bacteria diameter set to ${value} μm`);
            }
        }
        
    ]);
    
    
    
    addActionButtons([
      
        {
            label: 'Start Simulation',
            onClick: (event) => {
                if (simulationStartCallback) {
                    simulationStartCallback();
                    event.target.disabled = true;
                }
            }
        },
        {
            label: 'Run',
            onClick: (event) => {
                stopSimulation();
                isRunning = !isRunning;
                event.target.textContent = isRunning ? 'Pause' : 'Run';
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

        case 'fineSlider':
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
