//code fonctionnel 
console.log('Twitter GM Bot script started');

(function() {
    // Vérifier si modeConfig est déjà défini
    if (typeof modeConfig === 'undefined') {
        // Structure de configuration pour les différents modes
        var modeConfig = {
            security: {
                clickBaseDelay: 3000,
                clickVariability: 1900,
                typingSlowCPS: 2.0,
                typingMultiplier: 3,
                Probability: 0.6
            },
            performance: {
                clickBaseDelay: 2000,
                clickVariability: 1000,
                typingSlowCPS: 4.0,
                typingMultiplier: 2,
                Probability: 0.8
            },
            boost: {
                clickBaseDelay: 1200,
                clickVariability: 500,
                typingSlowCPS: 8.0,
                typingMultiplier: 1,
                Probability: 1.0
            }
        };
    }

    if (typeof currentMode === 'undefined') {
        var currentMode = 'security'; // Mode par défaut
    }

    // Indicateur de script en cours d'exécution
    let gmRunning = false;

    // Fonction pour générer un nombre aléatoire selon une distribution normale
    function gaussianRandom(mean = 0, stdev = 1) {
        let u = 1 - Math.random(); // Subtraction to avoid taking the log of zero
        let v = Math.random();
        let z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
        // Transform to the desired mean and standard deviation
        return z * stdev + mean;
    }

    // Fonction pour introduire un délai aléatoire avec du bruit pour les clics pour un utilisateur âgé
    function clickDelay() {
        const baseDelay = modeConfig[currentMode].clickBaseDelay;
        const variability = modeConfig[currentMode].clickVariability;

        // Délai principal variant entre baseDelay - variability et baseDelay + variability
        let delay = Math.random() * (2 * variability) + (baseDelay - variability);

        // Ajouter un bruit supplémentaire basé sur une distribution normale (moyenne = 0, écart-type = 4000ms)
        const noise = gaussianRandom(0, 4000); // Écart-type augmenté à 4000ms pour plus de bruit
        delay += noise;

        // Ajouter ou soustraire quelques millisecondes pour éviter une valeur pile
        delay += (Math.random() * 10 - 5); // Variation entre -5 et +5 millisecondes

        console.log(`Click delay of ${Math.round(delay)} milliseconds chosen (Mode: ${currentMode})`);
        return delay;
    }

    // Fonction pour introduire un délai aléatoire basé sur le nombre de caractères à taper
    function typingDelay(message) {
        const slowCPS = modeConfig[currentMode].typingSlowCPS;
        const messageLength = message.length;
        const baseDelay = (messageLength / slowCPS) * 1000 * modeConfig[currentMode].typingMultiplier; // Convertir en millisecondes et multiplier

        // Ajouter un bruit supplémentaire basé sur une distribution normale (moyenne = 0, écart-type = baseDelay * 0.6)
        const noise = gaussianRandom(0, baseDelay * 0.6); // Écart-type augmenté pour plus de bruit
        const totalDelay = baseDelay + noise;

        console.log(`Typing delay for message of length ${messageLength} is ${Math.round(totalDelay)} milliseconds (Mode: ${currentMode})`);
        return totalDelay;
    }

    // Fonction pour générer un message "Good Morning" personnalisé
    function getRandomElement(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    function generateGmMessage(username, userhandle, gmStartOptions, gmEndOptions, nameReplacements) {
        const start = getRandomElement(gmStartOptions);
        const end = getRandomElement(gmEndOptions);
        const nameReplacement = getRandomElement(nameReplacements);

        let message = start.replace("{username}", username)
                           .replace("{userhandle}", userhandle)
                           .replace("{name}", nameReplacement);
        message += " " + end;
        return message;
    }

    function generateGnMessage(username, userhandle, gnStartOptions, gnEndOptions, gnNameReplacements) {
        console.log('gnStartOptions:', gnStartOptions);
        console.log('gnEndOptions:', gnEndOptions);
        console.log('gnNameReplacements:', gnNameReplacements);
    
        const start = getRandomElement(gnStartOptions);
        const end = getRandomElement(gnEndOptions);
        const nameReplacement = getRandomElement(gnNameReplacements);
    
        console.log('Selected start:', start);
        console.log('Selected end:', end);
        console.log('Selected nameReplacement:', nameReplacement);
    
        let message = start.replace(/{username}/g, username)
                           .replace(/{userhandle}/g, userhandle)
                           .replace(/{name}/g, nameReplacement);
        message += " " + end.replace(/{name}/g, nameReplacement);
    
        console.log('Generated GN message:', message);
        return message;
    }

    function closeReplyModal(callback) {
        setTimeout(() => {
            const closeButton = document.querySelector('button[data-testid="app-bar-close"]');
            if (closeButton) {
                console.log('Close button found, attempting to click.');
                closeButton.click();
                setTimeout(callback, clickDelay()); // Utiliser clickDelay pour un délai variable
            } else {
                console.log('Close button not found.');
                callback();
            }
        }, 200); // Attendre 200ms avant d'essayer de cliquer sur le bouton
    }

    function likeTweet(tweet, callback) {
        const Probability = modeConfig[currentMode].Probability || 0.8; // Par défaut à 80% si non défini

        if (Math.random() < Probability) {
            const likeButton = tweet.querySelector('[data-testid="like"]');
            if (likeButton) {
                likeButton.click();
                console.log('Liked tweet from:', getUsernameFromTweet(tweet));
                setTimeout(callback, clickDelay()); // Attendre un délai avant d'appeler le callback
            } else {
                callback();
            }
        } else {
            callback();
        }
    }

    // Fonction pour obtenir le nom d'utilisateur (le prénom) d'un tweet
    function getUsernameFromTweet(tweet) {
        try {
            // Sélecteur pour le nom d'utilisateur
            const usernameElement = tweet.querySelector('div[data-testid="User-Name"] span span');
            if (usernameElement) {
                return usernameElement.innerText;
            }
        } catch (error) {
            console.error('Error getting username from tweet:', error);
        }
        return null;
    }

    // Fonction pour obtenir le handle d'utilisateur d'un tweet
    function getUserhandleFromTweet(tweet) {
        try {
            const userhandleElement = tweet.querySelector('a[href^="/"] > div > span');
            if (userhandleElement) {
                return userhandleElement.innerText;
            }
        } catch (error) {
            console.error('Error getting userhandle from tweet:', error);
        }
        return null;
    }

    // Fonction pour obtenir l'ID d'un tweet
    function getTweetId(tweet) {
        try {
            const tweetLink = tweet.querySelector('a[href*="/status/"]');
            if (tweetLink) {
                const urlParts = tweetLink.href.split('/');
                return urlParts[urlParts.length - 1];
            }
        } catch (error) {
            console.error('Error getting tweet ID:', error);
        }
        return null;
    }
    

// Fonction principale pour répondre aux tweets "Good Morning" et "Good Night"
function replyToGmGnTweets() {
    console.log('Function replyToGmGnTweets started');

    chrome.runtime.sendMessage({ message: "getTabId" }, function(response) {
        if (response && response.tabId) {
            chrome.storage.local.set({ gmTabId: response.tabId, gmScriptRunning: true });
        }
    });

    const ignoredUserhandles = [];
    const consideredUserhandles = [];
    const repliedTweetIds = new Set();

    // Fonction pour ajouter un handle à la liste des utilisateurs ignorés
    function addIgnoredUserhandle(userhandle) {
        if (!ignoredUserhandles.includes(userhandle)) {
            ignoredUserhandles.push(userhandle);
            console.log(`Added ${userhandle} to the list of ignored users.`);
        } else {
            console.log(`${userhandle} is already in the list of ignored users.`);
        }
    }

    // Fonction pour ajouter un handle à la liste des utilisateurs considérés
    function addConsideredUserhandle(userhandle) {
        if (!consideredUserhandles.includes(userhandle)) {
            consideredUserhandles.push(userhandle);
            console.log(`Added ${userhandle} to the list of considered users.`);
        } else {
            console.log(`${userhandle} is already in the list of considered users.`);
        }
    }

    function isSingleReplyPerUserEnabled(callback) {
        chrome.storage.local.get('settingsData', function(result) {
            const settingsData = result.settingsData || {};
            const singleReplyPerUser = settingsData.singleReplyPerUser || false;
            callback(singleReplyPerUser);
        });
    }
    

    // Récupérer les données depuis le stockage local
    chrome.storage.local.get('settingsData', function(result) {
        const settingsData = result.settingsData || {};
        const ignoreUsers = settingsData.ignoreUsers || [];
        const considerUsers = settingsData.considerUsers || [];
        const considerUsersEnabled = settingsData.considerUsersEnabled || false;
        const ignoreUsersEnabled = settingsData.ignoreUsersEnabled || false;

        // Si l'option "Consider Users" est activée, ajouter les utilisateurs considérés à la liste
        if (considerUsersEnabled) {
            considerUsers.forEach(userhandle => {
                addConsideredUserhandle(userhandle);
            });
        }

        // Si l'option "Ignore Users" est activée, ajouter les utilisateurs ignorés à la liste
        if (ignoreUsersEnabled) {
            ignoreUsers.forEach(userhandle => {
                addIgnoredUserhandle(userhandle);
            });
        }

        // Afficher la liste des utilisateurs ignorés et considérés
        console.log('Initial list of ignored users:', ignoredUserhandles);
        console.log('Initial list of considered users:', consideredUserhandles);
    });


    function getActiveAccountUsername(callback) {
        try {
            const accountButton = document.querySelector('[data-testid="SideNav_AccountSwitcher_Button"]');
            if (accountButton) {
                accountButton.click();
                setTimeout(() => {
                    try {
                        const userCells = document.querySelectorAll('li[data-testid="UserCell"] span.css-1jxf684');
                        userCells.forEach(userCell => {
                            const userhandle = userCell.innerText.trim();
                            if (userhandle.startsWith('@')) {
                                addIgnoredUserhandle(userhandle);
                            }
                        });

                        if (ignoredUserhandles.length > 0) {
                            console.log('List of ignored users:', ignoredUserhandles);
                            accountButton.click();
                            callback(ignoredUserhandles[0]);
                        } else {
                            console.log("Could not get the @userhandle with the current method. Trying with the logout button...");
                            accountButton.click();
                            setTimeout(() => {
                                accountButton.click();
                                setTimeout(() => getUserhandleFromLogout(callback), 3000);
                            }, 10);
                        }
                    } catch (error) {
                        console.error('Error getting active account userhandle:', error);
                    }
                }, 10);
            }
        } catch (error) {
            console.error('Error clicking account button:', error);
        }
    }

    function getUserhandleFromLogout(callback) {
        try {
            const logoutButton = document.querySelector('a[href="/logout"][role="menuitem"] span.css-1jxf684');
            if (logoutButton) {
                const userhandleText = logoutButton.innerText.trim();
                const userhandle = userhandleText.match(/@[^ ]+/);
                if (userhandle && userhandle[0]) {
                    addIgnoredUserhandle(userhandle[0]);
                    console.log('Active userhandle obtained from logout button:', userhandle[0]);
                    const accountButton = document.querySelector('[data-testid="SideNav_AccountSwitcher_Button"]');
                    if (accountButton) {
                        accountButton.click();
                    }
                    callback(userhandle[0]);
                } else {
                    console.log("Could not get the @userhandle. Retrying...");
                    setTimeout(() => {
                        const accountButton = document.querySelector('[data-testid="SideNav_AccountSwitcher_Button"]');
                        if (accountButton) {
                            accountButton.click();
                        }
                        setTimeout(() => getUserhandleFromLogout(callback), 10);
                    }, 10);
                }
            }
        } catch (error) {
            console.error('Error getting userhandle from logout button:', error);
        }
    }

    function isElementInViewport(el) {
        const rect = el.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }

    function isTextInsertedCorrectly(replyBox, message) {
        return replyBox.innerText === message;
    }

    function processTweet(tweet, gmStartOptions, gmEndOptions, gnStartOptions, gnEndOptions, nameReplacements, gnNameReplacements, respondGmEnabled, respondGnEnabled, likeTweetEnabled, considerUsersEnabled, considerUsers, callback) {
        const tweetText = tweet.querySelector('[data-testid="tweetText"]');
        const username = getUsernameFromTweet(tweet);
        const userhandle = getUserhandleFromTweet(tweet);
        const tweetId = getTweetId(tweet);
        const emojiRegex = /([\u2700-\u27BF]|[\uE000-\uF8FF]|[\uD83C-\uDBFF][\uDC00-\uDFFF])/;

        let message = null;
        let isGmMessage = false;
        let isGnMessage = false;
    
        if (considerUsersEnabled && !considerUsers.includes(userhandle)) {
            console.log('User not in consider list, skipping:', userhandle);
            callback();
            return;
        }
        if (!tweet.getAttribute('data-replied') && !repliedTweetIds.has(tweetId)) {
            message = generateGmMessage(username, userhandle, gmStartOptions, gmEndOptions, nameReplacements);
            isGmMessage = true;
        }

       
    
        if ((isGmMessage || isGnMessage) && 
            !tweet.getAttribute('data-replied') && 
            !ignoredUserhandles.includes(userhandle) && 
            !repliedTweetIds.has(tweetId)) {
    
            function proceedToNextTweet() {
                const interval = setInterval(() => {
                    const modal = document.querySelector('div[aria-modal="true"][role="dialog"]');
                    if (!modal) {
                        clearInterval(interval);
    
                        const intermediateDelay = gaussianRandom(1000, 500);
                        const finalDelay = Math.max(0, Math.min(2000, intermediateDelay));
    
                        setTimeout(callback, finalDelay);
                    }
                }, 500);
            }
    
            function replyToTweet() {
                const replyButton = tweet.querySelector('[data-testid="reply"]');
            
                if (!replyButton) {
                    proceedToNextTweet();
                    return;
                }
            
                replyButton.click();
            
                setTimeout(() => {
                    // Nouvelle vérification de la présence de la boîte de dialogue
                    function checkDialogPresence(attempt = 0) {
                        const maxAttempts = 5; // Nombre maximal de tentatives
                        const replyBoxContainer = document.querySelector('div[data-testid="tweetTextarea_0"] div.public-DraftStyleDefault-block');
                        const replyBox = document.querySelector('span[data-offset-key]');
                        const replyBoxParent = replyBox ? replyBox.closest('div[role="textbox"]') : null;
                        const parentDialog = replyBox ? replyBox.closest('div[aria-modal="true"][role="dialog"]') : null;
                        const isReplyBox = replyBoxParent && parentDialog;
    
                        if (isReplyBox || attempt >= maxAttempts) {
                            if (!isReplyBox) {
                                console.log('Incorrect text box detected, skipping...');
                                closeReplyModal(proceedToNextTweet);
                            } else {
                                insertMessageAndSend(replyBoxContainer, replyBox);
                            }
                        } else {
                            console.log('Dialog not ready, retrying...');
                            setTimeout(() => checkDialogPresence(attempt + 1), 500); // Réessayer après 500 ms
                        }
                    }
    
                    function insertMessageAndSend(replyBoxContainer, replyBox, attempt = 0) {
                        try {
                            console.log(`Attempting to insert message (attempt ${attempt}):`, message);
                            replyBoxContainer.click();
                            replyBox.innerText = message;
    
                            const inputEvent = new Event('input', { bubbles: true });
                            replyBox.dispatchEvent(inputEvent);
    
                            console.log('Message after insertion:', replyBox.innerText);
    
                            if (!isTextInsertedCorrectly(replyBox, message) && attempt < 3) {
                                console.log('Message not inserted correctly, retrying...');
                                setTimeout(() => insertMessageAndSend(replyBoxContainer, replyBox, attempt + 1), 1000);
                                return;
                            }
    
                            setTimeout(() => {
                                const sendButton = document.querySelector('[data-testid="tweetButton"]');
    
                                if (!sendButton) {
                                    console.log('Send button not found, skipping tweet.');
                                    proceedToNextTweet();
                                    return;
                                }
    
                                try {
                                    sendButton.click();
    
                                    const interval = setInterval(() => {
                                        const errorMessageContainer = document.querySelector('div[role="status"][aria-live="assertive"]');
                                        const modal = document.querySelector('div[aria-modal="true"][role="dialog"]');
    
                                        if (errorMessageContainer) {
                                            console.log('Error message detected, skipping tweet:', tweetId);
                                            tweet.setAttribute('data-replied', 'true');
                                            repliedTweetIds.add(tweetId);
                                            clearInterval(interval);
                                            closeReplyModal(callback);
                                        } else if (!modal) {
                                            clearInterval(interval);
                                            tweet.setAttribute('data-replied', 'true');
                                            repliedTweetIds.add(tweetId);

                                            // Incrémentez le compteur de réponses ici
                                            replyCount++;
                                            console.log('Total replies:', replyCount);
                        
                                            // Mettre à jour le badge de l'extension
                                            updateBadge(replyCount);

                                            // Ajout de la condition pour singleReplyPerUser
                                            chrome.storage.local.get('settingsData', function(result) {
                                                const settingsData = result.settingsData || {};
                                                const singleReplyPerUser = settingsData.singleReplyPerUser || false;
    
                                                if (singleReplyPerUser) {
                                                    addIgnoredUserhandle(userhandle);
                                                }
    
                                                console.log(`Replied ${isGmMessage ? 'GM' : 'GN'} to the tweet from:`, username);
                                                console.log('Updated list of ignored users:', ignoredUserhandles);
                                                console.log('Updated list of processed tweet IDs:', Array.from(repliedTweetIds));
    
                                                proceedToNextTweet();
                                            });
                                        }
                                    }, 500);
                                } catch (error) {
                                    console.error('Error sending reply:', error);
                                    proceedToNextTweet();
                                }
                            }, typingDelay(replyBox.innerText) + 200);
                        } catch (error) {
                            console.error('Error writing reply:', error);
                            proceedToNextTweet();
                        }
                    }
    
                    checkDialogPresence();
                }, 200);
            }
    
            if (isElementInViewport(tweet)) {
                if (likeTweetEnabled) {
                    likeTweet(tweet, replyToTweet);
                } else {
                    replyToTweet();
                }
            } else {
                tweet.scrollIntoView({ behavior: 'smooth', block: 'center' });
                setTimeout(() => {
                    if (isElementInViewport(tweet)) {
                        if (likeTweetEnabled) {
                            likeTweet(tweet, replyToTweet);
                        } else {
                            replyToTweet();
                        }
                    } else {
                        console.log('Tweet not visible after scrolling, skipping:', tweetId);
                        tweet.setAttribute('data-replied', 'true');
                        repliedTweetIds.add(tweetId);
                        callback();
                    }
                }, 1000);
            }
        } else {
            console.log('Ignored tweet from:', userhandle, 'or tweet already processed or not relevant.');
            callback();
        }
    }
    
    function processTweets(gmStartOptions, gmEndOptions, gnStartOptions, gnEndOptions, nameReplacements, gnNameReplacements, respondGmEnabled, respondGnEnabled, likeTweetEnabled, considerUsersEnabled, considerUsers, callback) {
        const tweets = Array.from(document.querySelectorAll('[data-testid="tweet"]'));
        let index = 0;
    
        function processNextTweet() {
            if (index < tweets.length) {
                processTweet(tweets[index], gmStartOptions, gmEndOptions, gnStartOptions, gnEndOptions, nameReplacements, gnNameReplacements, respondGmEnabled, respondGnEnabled, likeTweetEnabled, considerUsersEnabled, considerUsers, () => {
                    index++;
                    processNextTweet();
                });
            } else {
                callback();
            }
        }
    
        processNextTweet();
    }

    function humanScroll(callback, speedFactor = 1) {
        const meanDistance = 1500;
        const stdevDistance = 1200;
        let distance = gaussianRandom(meanDistance, stdevDistance);
        const maxSteps = 12;
        const minSteps = 1;
        const totalSteps = Math.floor(Math.random() * (maxSteps - minSteps + 1)) + minSteps;
        const stepDistance = distance / totalSteps;
        let currentStep = 0;
        const scrollUpChance = 0.1;

        function getScrollSpeed(step) {
            const middle = totalSteps / 3;
            const acceleration = Math.random() * 0.2 + 0.1;
            const deceleration = Math.random() * 0.2 + 0.7;
            if (step < middle) {
                return Math.floor((100 + (step * acceleration * 100)) * speedFactor);
            } else {
                const decelFactor = Math.max(0.1, (totalSteps - step) / (totalSteps - middle));
                return Math.floor((100 + ((totalSteps - step) * deceleration * 100)) * speedFactor * decelFactor);
            }
        }

        function scrollStep() {
            if (currentStep < totalSteps) {
                let direction = Math.random() < scrollUpChance ? -1 : 1;
                window.scrollBy({
                    top: stepDistance * direction,
                    left: 0,
                    behavior: 'smooth'
                });
                const speed = getScrollSpeed(currentStep);
                currentStep++;
                setTimeout(scrollStep, speed);
            } else {
                callback();
            }
        }

        scrollStep();
    }

    function scrollAndProcess(gmStartOptions, gmEndOptions, gnStartOptions, gnEndOptions, nameReplacements, gnNameReplacements, respondGmEnabled, respondGnEnabled, likeTweetEnabled, considerUsersEnabled, considerUsers) {
        processTweets(gmStartOptions, gmEndOptions, gnStartOptions, gnEndOptions, nameReplacements, gnNameReplacements, respondGmEnabled, respondGnEnabled, likeTweetEnabled, considerUsersEnabled, considerUsers, () => {
            humanScroll(() => {
                scrollAndProcess(gmStartOptions, gmEndOptions, gnStartOptions, gnEndOptions, nameReplacements, gnNameReplacements, respondGmEnabled, respondGnEnabled, likeTweetEnabled, considerUsersEnabled, considerUsers);
            });
        });
    }
    

    chrome.storage.local.get(['settingsData', 'selectedMode'], (result) => {
        const settingsData = result.settingsData || {};
        const gmStartOptions = settingsData.gmStartOptions || ["GM {username}", "Good morning {userhandle}", "Morning {name}!", "Rise and shine {name}", "Top of the morning {name}"];
        const gmEndOptions = settingsData.gmEndOptions || ["🌞", "🌟", "✨", "🌈", "🔥"];
        const gnStartOptions = settingsData.gnStartOptions || ["GN {username}", "Good night {userhandle}", "Night {name}!", "Sleep tight {name}", "Sweet dreams {name}"];
        const gnEndOptions = settingsData.gnEndOptions || ["🌙", "⭐", "✨", "🌌", "🌠"];
        const nameReplacements = settingsData.nameReplacements || ["fam", "homie", "OG", "boss", "legend", "degen", "fren"];
        const gnNameReplacements = settingsData.gnNameReplacements || ["fam", "homie", "OG", "boss", "legend", "degen", "fren"];
        const respondGmEnabled = settingsData.respondGm; // Récupérer l'état de répondre aux GM
        const respondGnEnabled = settingsData.respondGn; // Récupérer l'état de répondre aux GN
        const likeTweetEnabled = settingsData.likeTweet; // Récupérer l'état de liker les tweets
        const considerUsersEnabled = settingsData.considerUsersEnabled || false;
        const considerUsers = settingsData.considerUsers || [];
        currentMode = result.selectedMode || 'security';
        console.log('Current mode:', currentMode);
        console.log('Using GN Name Replacements:', gnNameReplacements); // Vérifiez ici que `gnNameReplacements` est correctement utilisé
    
        getActiveAccountUsername((activeUserhandle) => {
            console.log('Active userhandle:', activeUserhandle);
            console.log('List of ignored users:', ignoredUserhandles);
    
            setTimeout(() => {
                scrollAndProcess(gmStartOptions, gmEndOptions, gnStartOptions, gnEndOptions, nameReplacements, gnNameReplacements, respondGmEnabled, respondGnEnabled, likeTweetEnabled, considerUsersEnabled, considerUsers);
            }, 3000);
        });
    
        chrome.storage.local.set({ gmScriptRunning: false, gmTabId: null });
    });
    
}

// Exécuter la fonction
replyToGmGnTweets();

// Sauvegarder l'état de l'action GM en cours d'exécution
chrome.storage.local.set({ gmRunning: gmRunning });
})();



// Vérifiez si replyCount est déjà défini
if (typeof replyCount === 'undefined') {
    var replyCount = 0;
}

// Ajoutez cette fonction pour envoyer un message pour mettre à jour le badge
function updateBadge(count) {
    if (count > 0) {
        chrome.runtime.sendMessage({
            type: 'updateBadge',
            text: count.toString()
        });
    } else {
        chrome.runtime.sendMessage({
            type: 'updateBadge',
            text: ''
        });
    }
}

// Initialiser le badge lorsque le script est chargé
updateBadge(replyCount);