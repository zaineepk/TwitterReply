let scriptRunning = false;
let currentMode = 'security'; // Mode par défaut

function loadScript(url, callback) {
  const script = document.createElement('script');
  script.type = 'text/javascript';
  script.src = url;
  script.onload = callback;
  document.head.appendChild(script);
}

function toggleButtons(disable) {
  const actionButtons = document.querySelectorAll('.actions-section .btn');
  actionButtons.forEach(button => {
    if (!button.classList.contains('stop-button')) {
      if (disable) {
        button.classList.add('disabled');
        button.style.backgroundColor = 'var(--bs-tertiary-bg)';
        button.style.opacity = '0.5';
      } else {
        button.classList.remove('disabled');
        button.style.backgroundColor = '';
        button.style.opacity = '1';
      }
    }
  });
}

function updateButtonState() {
  const gmGnButton = document.querySelector('button i.fa-sun').parentElement;
  if (scriptRunning) {
    gmGnButton.innerHTML = '<i class="fas fa-sun me-2"></i>Stop';
    gmGnButton.classList.add('stop-button');
    toggleButtons(true);
  } else {
    gmGnButton.innerHTML = '<i class="fas fa-sun me-2"></i>GM/GN';
    gmGnButton.classList.remove('stop-button');
    toggleButtons(false);
  }
}

function updateModeSelection() {
  document.querySelectorAll('.nav-link').forEach(button => {
    if (button.dataset.mode === currentMode) {
      button.classList.add('active');
      button.setAttribute('aria-selected', 'true');
      document.querySelector(button.getAttribute('data-bs-target')).classList.add('show', 'active');
    } else {
      button.classList.remove('active');
      button.setAttribute('aria-selected', 'false');
      document.querySelector(button.getAttribute('data-bs-target')).classList.remove('show', 'active');
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get(['scriptRunning', 'selectedMode', 'settingsData'], (result) => {
    scriptRunning = result.scriptRunning || false;
    currentMode = result.selectedMode || 'security';
    updateButtonState();
    updateModeSelection();

    // Afficher ou masquer le bouton GM/GN en fonction du paramètre
    if (result.settingsData && result.settingsData.displayGmgn) {
      document.getElementById('gm-button').style.display = 'block';
    } else {
      document.getElementById('gm-button').style.display = 'none';
    }
  });

  document.querySelectorAll('.nav-link').forEach(button => {
    button.addEventListener('click', (event) => {
      const mode = event.currentTarget.dataset.mode;
      chrome.storage.local.set({ selectedMode: mode }, () => {
        currentMode = mode;
        updateModeSelection();
        console.log(`Mode changed to ${mode}`);
      });
    });
  });

  const gmGnButton = document.querySelector('button i.fa-sun').parentElement;
  if (gmGnButton) {
      gmGnButton.addEventListener('click', () => {
          if (!scriptRunning) {
              chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                  chrome.scripting.executeScript({
                      target: { tabId: tabs[0].id },
                      files: ['content.js']
                  }, () => {
                      scriptRunning = true;
                      chrome.storage.local.set({ scriptRunning: true }, () => {
                          updateButtonState();
                      });
                  });
              });
          } else {
              // Envoyer un message à background.js pour arrêter tous les scripts
              chrome.runtime.sendMessage({ message: "stopAllScripts" }, (response) => {
                  if (response.message === "All scripts stopped") {
                      scriptRunning = false;
                      chrome.storage.local.set({ scriptRunning: false }, () => {
                          updateButtonState();
                      });
                  }
              });
          }
      });
  }

  document.getElementById('settings-button').addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('settings.html') });
  });
});
