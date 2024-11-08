//code fonctionnel 
$(document).ready(function() {
    const maxItems = 1000;

    function loadFromLocalStorage() {
        chrome.storage.local.get('settingsData', function(result) {
            if (result.settingsData) {
                const data = result.settingsData;
                console.log('Loading data from localStorage:', data); // Log for debugging
                console.log('GN Name Replacements:', data.gnNameReplacements); // Vérifiez ici que `gnNameReplacements` est correctement récupéré
    
                const gmStartOptions = data.gmStartOptions || [];
                const gmEndOptions = data.gmEndOptions || [];
                const nameReplacements = data.nameReplacements || [];
                const gnStartOptions = data.gnStartOptions || [];
                const gnEndOptions = data.gnEndOptions || [];
                const gnNameReplacements = data.gnNameReplacements || [];
                const ignoreUsers = data.ignoreUsers || [];
                const considerUsers = data.considerUsers || [];
    
                gmStartOptions.forEach(text => addItem(text, '#gm-start-options', false));
                gmEndOptions.forEach(text => addItem(text, '#gm-end-options', false));
                nameReplacements.forEach(text => addItem(text, '#name-replacements', false));
                gnStartOptions.forEach(text => addItem(text, '#gn-start-options', false));
                gnEndOptions.forEach(text => addItem(text, '#gn-end-options', false));
                gnNameReplacements.forEach(text => addItem(text, '#gn-name-replacements', false));
                ignoreUsers.forEach(text => addItem(text, '#ignore-users-list', false));
                considerUsers.forEach(text => addItem(text, '#consider-users-list', false));
                $('#like-tweet').prop('checked', data.likeTweet);
                $('#display-gmgn').prop('checked', data.displayGmgn || true); // Ensure Display on popup is checked by default if not specified
                $('#respond-gm').prop('checked', data.respondGm);
                $('#respond-gn').prop('checked', data.respondGn);
                $('#auto-open-x-switch').prop('checked', data.autoOpenX || true); // Ensure Auto Open X is checked by default if not specified
                $('#ignore-users').prop('checked', data.ignoreUsersEnabled || false);
                $('#consider-users').prop('checked', data.considerUsersEnabled || false); // Ensure Consider Users is handled
                $('#single-reply-per-user').prop('checked', data.singleReplyPerUser || false); // Ensure Single Reply per User is handled

                checkMaxItems('#gm-start-options');
                checkMaxItems('#gm-end-options');
                checkMaxItems('#name-replacements');
                checkMaxItems('#gn-start-options');
                checkMaxItems('#gn-end-options');
                checkMaxItems('#gn-name-replacements');
                checkMaxItems('#ignore-users-list');
                checkMaxItems('#consider-users-list');
            } else {
                initializeDefaults();
            }
        });
    }
    
    
      

    function addItem(value, listSelector, save = true) {
        if (!value) {
            alert("Vous ne pouvez pas ajouter un champ vide.");
            return;
        }
        if ($(listSelector).children().length < maxItems) {
            const div = $('<div class="input-group mb-2">')
                .append(`<div class="form-control non-modifiable">${value}</div>`)
                .append('<button class="btn btn-primary" type="button"><i class="fas fa-trash-alt"></i></button>');
            $(listSelector).append(div);
            attachDeleteEvent(div.find('button'));
            checkMaxItems(listSelector);
            if (save) saveToLocalStorage();
        } else {
            alert("Vous ne pouvez pas ajouter plus de 1000 éléments.");
        }
    }

    function initializeDefaults() {
        chrome.storage.local.get('defaultsLoaded', function(result) {
            if (!result.defaultsLoaded) {
                const gmStartDefaults = [
                    "Great point! 💡",
                    "I completely agree! 👍",
                    "Well said! 👏"
                ];   

                const gmEndDefaults = ["‎ ", "‎ ", "‎ "];
                const nameReplacementsDefaults = ["fam", "homie", "OG", "boss", "legend", "degen", "fren"];
                const gnStartDefaults = ["GN {name}", "Good night {name}", "Sleep tight {name}", "Sweet dreams {name}", "Nighty night {name}"];
                const gnEndDefaults = ["🌙", "🌌", "🌠", "🛏️", "💤"];
                const gnNameReplacementsDefaults = ["fam", "homie", "OG", "boss", "legend", "degen", "fren"];
                const ignoreUsersDefaults = ["@spammer", "@botaccount", "@randomuser", "@advertisement", "@trollaccount"];
                const considerUsersDefaults = ["@elonmusk", "@ethereum", "@bitcoin", "@VitalikButerin", "@cz_binance"];
    
                const settingsData = {
                    gmStartOptions: gmStartDefaults,
                    gmEndOptions: gmEndDefaults,
                    nameReplacements: nameReplacementsDefaults,
                    gnStartOptions: gnStartDefaults,
                    gnEndOptions: gnEndDefaults,
                    gnNameReplacements: gnNameReplacementsDefaults,
                    ignoreUsers: ignoreUsersDefaults,
                    considerUsers: considerUsersDefaults,
                    likeTweet: true,
                    displayGmgn: true,
                    respondGm: true,
                    respondGn: true,
                    autoOpenX: true, // Default state for Auto Open X
                    considerUsersEnabled: false, // Default state for Consider 
                    singleReplyPerUser: false // Default state for Single Reply per User
                };
    
                gmStartDefaults.forEach(text => addItem(text, '#gm-start-options', false));
                gmEndDefaults.forEach(text => addItem(text, '#gm-end-options', false));
                nameReplacementsDefaults.forEach(text => addItem(text, '#name-replacements', false));
                gnStartDefaults.forEach(text => addItem(text, '#gn-start-options', false));
                gnEndDefaults.forEach(text => addItem(text, '#gn-end-options', false));
                gnNameReplacementsDefaults.forEach(text => addItem(text, '#gn-name-replacements', false));
                ignoreUsersDefaults.forEach(text => addItem(text, '#ignore-users-list', false));
                considerUsersDefaults.forEach(text => addItem(text, '#consider-users-list', false));
    
                $('#auto-open-x-switch').prop('checked', true);  // Default state for Auto Open X
                $('#respond-gm').prop('checked', true); // Default state for Respond GM
                $('#respond-gn').prop('checked', true); // Default state for Respond GN
    
                chrome.storage.local.set({ 
                    defaultsLoaded: true,
                    settingsData: settingsData
                }, function() {
                    console.log('Defaults initialized.');
                });
            }
        });
    
        saveToLocalStorage();
    }
    
    
    

    function checkMaxItems(listSelector) {
        const list = $(listSelector);
        const addButton = list.siblings('.input-group').find('.btn-primary');
        const inputField = list.siblings('.input-group').find('input');

        if (list.children().length >= maxItems) {
            addButton.prop('disabled', true);
            inputField.prop('disabled', true);
        } else {
            addButton.prop('disabled', false);
            inputField.prop('disabled', false);
        }
    }

    function attachDeleteEvent(button) {
        button.on('click', function() {
            const listSelector = $(this).closest('.input-group').parent();
            $(this).closest('.input-group').remove();
            checkMaxItems(listSelector);
            saveToLocalStorage();
        });
    }
    
    function saveToLocalStorage() {
        const data = {
            gmStartOptions: [],
            gmEndOptions: [],
            nameReplacements: [],
            gnStartOptions: [],
            gnEndOptions: [],
            gnNameReplacements: [],
            ignoreUsers: [],
            considerUsers: [],
            likeTweet: $('#like-tweet').is(':checked'),
            displayGmgn: $('#display-gmgn').is(':checked'),
            respondGm: $('#respond-gm').is(':checked'),
            respondGn: $('#respond-gn').is(':checked'),
            autoOpenX: $('#auto-open-x-switch').is(':checked'), // Save state of Auto Open X
            ignoreUsersEnabled: $('#ignore-users').is(':checked'),
            considerUsersEnabled: $('#consider-users').is(':checked'), // Save state of Consider Users
            singleReplyPerUser: $('#single-reply-per-user').is(':checked') // Save state of Single Reply per User
        };
    
        $('#gm-start-options .form-control').each(function() {
            data.gmStartOptions.push($(this).text());
        });
        $('#gm-end-options .form-control').each(function() {
            data.gmEndOptions.push($(this).text());
        });
        $('#name-replacements .form-control').each(function() {
            data.nameReplacements.push($(this).text());
        });
        $('#gn-start-options .form-control').each(function() {
            data.gnStartOptions.push($(this).text());
        });
        $('#gn-end-options .form-control').each(function() {
            data.gnEndOptions.push($(this).text());
        });
        $('#gn-name-replacements .form-control').each(function() {
            data.gnNameReplacements.push($(this).text());
        });
        $('#ignore-users-list .form-control').each(function() {
            data.ignoreUsers.push($(this).text());
        });
        $('#consider-users-list .form-control').each(function() {
            data.considerUsers.push($(this).text());
        });
        
    
        console.log('Saving data to localStorage:', data); // Log for debugging
        chrome.storage.local.set({ settingsData: data }, function() {
            if (chrome.runtime.lastError) {
                console.error('Error saving data to localStorage:', chrome.runtime.lastError);
            } else {
                console.log('Data successfully saved to localStorage.');
            }
        });
    }
    
    

    function bindEvents() {
        $('#add-gm-start').on('click', function() {
            addItem($(this).siblings('input').val().trim(), '#gm-start-options');
            $(this).siblings('input').val('');
        });

        $('#add-gm-end').on('click', function() {
            addItem($(this).siblings('input').val().trim(), '#gm-end-options');
            $(this).siblings('input').val('');
        });

        $('#add-name-replacement').on('click', function() {
            addItem($(this).siblings('input').val().trim(), '#name-replacements');
            $(this).siblings('input').val('');
        });

        $('#add-gn-start').on('click', function() {
            addItem($(this).siblings('input').val().trim(), '#gn-start-options');
            $(this).siblings('input').val('');
        });

        $('#add-gn-end').on('click', function() {
            addItem($(this).siblings('input').val().trim(), '#gn-end-options');
            $(this).siblings('input').val('');
        });

        $('#add-gn-name-replacement').on('click', function() {
            addItem($(this).siblings('input').val().trim(), '#gn-name-replacements');
            $(this).siblings('input').val('');
        });

        $('#add-ignore-user').on('click', function() {
            addItem($(this).siblings('input').val().trim(), '#ignore-users-list');
            $(this).siblings('input').val('');
        });
        
        $('#add-consider-user').on('click', function() {
            addItem($(this).siblings('input').val().trim(), '#consider-users-list');
            $(this).siblings('input').val('');
        });
        

        $('#like-tweet').on('change', function() {
            saveToLocalStorage();
        });

        $('#respond-gm').on('change', function() {
            saveToLocalStorage();
        });

        $('#respond-gn').on('change', function() {
            saveToLocalStorage();
        });

        $('#respond-gm').on('change', function() {
            const isChecked = $(this).is(':checked');
            chrome.storage.local.set({ respondGm: isChecked }, function() {
                console.log('Respond GM setting saved:', isChecked);
            });
            saveToLocalStorage();
        });

        $('#auto-open-x-switch').on('change', function() {
            saveToLocalStorage();
        });
        
        $('#ignore-users').on('change', function() {
            saveToLocalStorage();
        });    
        
        $('#consider-users').on('change', function() {
            saveToLocalStorage();
        });

        $('#single-reply-per-user').on('change', function() {
            saveToLocalStorage();
        });
        

    }

    function loadHTML(target, file, callback) {
        $.get(file, function(data) {
            $(target).html(data);
            console.log(`Loaded ${file} into ${target}`);
            if (target === '#modals') {
                var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
                var tooltipList = tooltipTriggerList.map(function(tooltipTriggerEl) {
                    return new bootstrap.Tooltip(tooltipTriggerEl);
                });
            }
            if (callback) callback();
        }).fail(function() {
            console.error(`Failed to load ${file} into ${target}`);
        });
    }

    function loadAllHTML() {
        loadHTML('#general', 'settings/general.html', function() {
                loadHTML('#auto-gm', 'settings/auto-gm.html', function() {
                                                loadFromLocalStorage();
                                                bindEvents();  // Call bindEvents after loading HTML and data
                                            });
                                        });
                                    
    }
    
    $('#myTab a').on('click', function(e) {
        e.preventDefault();
        $(this).tab('show');
    });
    
    $('#myTab a:first').tab('show');
    
    loadAllHTML();  // Load HTML files into corresponding divs and then load settings from local storage
    
});

document.addEventListener('DOMContentLoaded', function() {
    const reportButton = document.getElementById('report-button');
    const communicateButton = document.getElementById('communicate-button');
    const reportUrl = 'https://forms.gle/DuuJVAHYoyZFdpZS9';
    const contactDeveloperUrl = 'https://x.com/crybercorp';

    reportButton.addEventListener('click', function() {
        chrome.tabs.create({ url: reportUrl });
    });

    communicateButton.addEventListener('click', function() {
        chrome.tabs.create({ url: contactDeveloperUrl });
    });
});


































