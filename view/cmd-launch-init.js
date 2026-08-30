/**
 * Command launch button initialization
 * Sets up the command palette launch button event listener
 */
document.addEventListener('DOMContentLoaded', function() {
  const cmdLaunchButton = document.getElementById('cmd-launch');
  if (cmdLaunchButton) {
    cmdLaunchButton.addEventListener('click', function () {
      if (typeof toggleCmdPalette === 'function') {
        toggleCmdPalette();
      }
    });
  }
});