//Added to utilityFunctions.js // Utility function: Enable or disable a button
function toggleButtonState(buttonId, enable) {
    const button = document.getElementById(buttonId);
    if (button) {
      const stateClass = enable ? 'enabled' : 'disabled';
      button.classList.remove(enable ? 'disabled' : 'enabled');
      button.classList.add(stateClass);
      button.disabled = !enable;
  
      if (enable) {
        button.style.backgroundColor = 'green'; // Set the button color when enabled
        console.log(`Button with ID: ${buttonId} enabled.`); // Log when the button is enabled
      } else {
        button.style.backgroundColor = ''; // Reset to default color when disabled
        console.log(`Button with ID: ${buttonId} disabled.`); // Log when the button is disabled
      }
    } else {
      console.log(`Button with ID: ${buttonId} not found.`); // Log if the button is not found
    }
  }