var allWindowsTabCount = 0;
var windowCount = 0;

// set icon's tooltip
function updateBadgeTitle(count) {
  chrome.storage.local.get(["language"], function(items) {
    const lang = items["language"] || "en";
    var iconTitle = 'You have ' + count + ' open tab(s).';
    if (lang === 'ru') {
      iconTitle = 'У вас открыто ' + count + ' вкладки(ок).';
    }
    chrome.action.setTitle({title: iconTitle});
  });
}

// set icon's text
function updateBadgeText() {
  chrome.action.setBadgeText({text: String(allWindowsTabCount)});
  updateBadgeTitle(allWindowsTabCount);
}

//count all tabs in all windows 
function getAllStats(callback) {
  chrome.windows.getAll({populate: true}, function (window_list) {
    callback(window_list);
  });
}

function displayResults(window_list) {
  allWindowsTabCount = 0;
  windowCount = 0;
  for(var i=0; i<window_list.length; i++) { 
    allWindowsTabCount += window_list[i].tabs.length;
  } 
  chrome.storage.local.set({
    "windowsCount": window_list.length,
    "allWindowsTabsCount": allWindowsTabCount
  });
  updateBadgeText();
}

function registerTabDedupeHandler() {
  chrome.tabs.onUpdated.addListener(
    function(tabId, changeInfo, tab) {
      if (changeInfo.url) {
        // check if any other tabs with different Ids exist with same URL
        chrome.tabs.query({'url': changeInfo.url}, function(tabs) {
          if(tabs.length == 2) {
            var oldTab = tabs[0].id == tabId ? tabs[1] : tabs[0];
            // This is a new duplicate
            var dedupe = true; // confirm() is unsupported in MV3 service worker, auto-dedupe
            if (dedupe) {
              // Switch to existing tab and make it active.
              chrome.tabs.update(oldTab.id, {'active': true}, function() {
                // Make sure the window of that tab is also made active
                chrome.windows.update(oldTab.windowId, {'focused': true}, function() {
                  // And kill the newly opened tab.
                  chrome.tabs.remove(tabId);
                });
              });
            }
          }
        });
      }
    });
};

function registerTabJanitor(days) {
  chrome.alarms.create("tabJanitorAlarm", { periodInMinutes: 60 });
  chrome.alarms.onAlarm.addListener(function(alarm) {
    if (alarm.name === "tabJanitorAlarm") {
      chrome.storage.local.get({tab_activation_history: {}}, function(data) {
        var history = data.tab_activation_history;
        var keys = Object.keys(history);
        var now = Date.now();
        keys.forEach(function(tabId) {
          var ts = history[tabId];
          if (ts - now > (1000 * 60 * 60 * 24 * days)) {
            chrome.tabs.remove(parseInt(tabId));
            delete history[tabId];
          }
        });
        chrome.storage.local.set({tab_activation_history: history});
      });
    }
  });
};

/* Keeps track of the last timestamp each tab was activated */
chrome.tabs.onActivated.addListener(function(activeInfo) {
  chrome.storage.local.get({tab_activation_history: {}}, function(data) {
    var history = data.tab_activation_history;
    history[activeInfo.tabId] = Date.now();
    chrome.storage.local.set({tab_activation_history: history});
  });
});

function init() {
  // Action taken when a new tab is opened.
  chrome.tabs.onCreated.addListener(function(tab) {
    getAllStats(displayResults);
  });
  
  // Action taken when a tab is closed.
  chrome.tabs.onRemoved.addListener(function(tab) {
    getAllStats(displayResults);
  });
  
  // Action taken when a new window is opened
  chrome.windows.onCreated.addListener(function(tab) {
    getAllStats(displayResults);
  });
  
  // Action taken when a windows is closed.
  chrome.windows.onRemoved.addListener(function(tab) {
    getAllStats(displayResults);
  });
  
  // Initialize the stats to start off with.
  getAllStats(displayResults);
  
  // Load settings from storage
  chrome.storage.local.get(["tabDedupe", "tabJanitor", "tabJanitorDays"], function(items) {
    if (items.tabDedupe === "true" || items.tabDedupe === true) {
      registerTabDedupeHandler();
    }
    
    if (items.tabJanitor === "true" || items.tabJanitor === true) {
      var days = items.tabJanitorDays ? parseInt(items.tabJanitorDays) : 5;
      registerTabJanitor(days);
    }
  });
}

// Initialize the extension.
init();
