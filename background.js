chrome.runtime.onInstalled.addListener(() => {
  console.log('Twitter GM Bot installed.');
});

chrome.runtime.setUninstallURL("https://forms.gle/vtMUuCLzCKNkPxoD8", function() {
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError);
    }
  });

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'updateBadge') {
        chrome.action.setBadgeText({ text: request.text });
        chrome.action.setBadgeBackgroundColor({ color: '#EF2B7C' }); // Couleur du badge
        sendResponse({status: "Badge updated"});
    }
});


// Écouteur de messages pour obtenir l'ID de l'onglet en cours
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message === "getTabId") {
      sendResponse({ tabId: sender.tab.id });
  } else if (request.message === "stopAllScripts") {
      chrome.tabs.query({}, (tabs) => {
          const twitterRegex = /^https:\/\/(www\.)?(twitter|x)\.com/;
          tabs.forEach(tab => {
              if (twitterRegex.test(tab.url)) {
                  chrome.scripting.executeScript({
                      target: { tabId: tab.id },
                      func: () => {
                          // Arrêter le script en redémarrant la page
                          window.location.reload();
                      }
                  });
              }
          });
      });
      // Réinitialiser les indicateurs de script en cours d'exécution
      chrome.storage.local.set({ gmScriptRunning: false, gmTabId: null });
      sendResponse({ message: "All scripts stopped" });
  }
});

chrome.action.onClicked.addListener((tab) => {
  console.log("Icon clicked");

  // Vérifier l'état du commutateur Auto Open X
  chrome.storage.local.get('settingsData', function(result) {
      const data = result.settingsData;
      const autoOpenX = data ? data.autoOpenX : false;

      // Vérifier tous les onglets ouverts
      chrome.tabs.query({}, (tabs) => {
          const twitterRegex = /^https:\/\/(www\.)?(twitter|x)\.com/;
          const twitterTabs = tabs.filter(tab => twitterRegex.test(tab.url));
          const hasTwitterTab = twitterTabs.length > 0;

          // Fonction pour ouvrir le popup sur l'onglet donné
          function openPopup(tabId) {
              chrome.action.setPopup({ tabId: tabId, popup: "popup.html" }, () => {
                  chrome.action.openPopup();
              });
          }

          if (autoOpenX) {
              // Auto Open X est activé
              chrome.storage.local.get(['gmScriptRunning', 'gmTabId'], function(result) {
                  const gmScriptRunning = result.gmScriptRunning;
                  const gmTabId = result.gmTabId;

                  if (!hasTwitterTab) {
                      // Aucun onglet Twitter n'est trouvé, en ouvrir un nouveau
                      console.log("No Twitter tabs found, opening a new tab");
                      chrome.tabs.create({ url: "https://twitter.com" });
                  } else if (gmScriptRunning && gmTabId && !twitterRegex.test(tab.url)) {
                      // Le script de contenu est actif et l'onglet actuel n'est pas Twitter, rediriger vers l'onglet du script
                      console.log("Content script is active and current tab is not Twitter, switching to the tab where the script is running");
                      chrome.tabs.update(gmTabId, { active: true }, () => {
                          openPopup(gmTabId);
                      });
                  } else {
                      // L'onglet actif est un onglet Twitter ou X, ouvrir simplement le popup
                      console.log("The active tab is a Twitter tab, opening popup");
                      openPopup(tab.id);
                  }
              });
          } else {
              // Auto Open X est désactivé, ouvrir simplement le popup
              console.log("Auto Open X is disabled, opening popup on the active tab");
              openPopup(tab.id);
          }
      });
  });
});
