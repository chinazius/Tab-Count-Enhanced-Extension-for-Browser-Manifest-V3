//get count of tabs in current window. Required for the popoup display box.
function getCurrentWindowTabCount(lang) {
  chrome.tabs.query({currentWindow:true}, function(tabs) {
    let text = 'Number of tabs on this window: ';
    if (lang === 'ru') {
      text = 'Количество вкладок в этом окне: ';
    }
    var lenText = text + '<strong> ' + tabs.length + '</strong>';
    document.getElementById('windowTabs').innerHTML = lenText;
  });
}

//get tabs in current window
function getCurrentWindowTabs(callback) {
  chrome.tabs.query({currentWindow:true}, function(tabs) {
    callback(tabs);
  });
}

//get all tabs
function getAllTabs(callback) {
  chrome.tabs.query({}, function(tabs) {
    callback(tabs);
  });
}

function displayResults(tabs, lang){
  getCurrentWindowTabCount(lang);
  var numTabs = tabs.length;
  var table = document.getElementById('tabsTable');
  for (var i=0; i<numTabs; i++) {
    var row = table.insertRow(i);
    var cell1 = row.insertCell(0);
    var cell2 = row.insertCell(1);
    var cell3 = row.insertCell(2);
    
    cell1.innerHTML = "<img src=" + tabs[i].favIconUrl + " width='16' height='16'>";
    cell2.innerHTML = "<span style=cursor:pointer><font color=red>X</font></span>";
    cell3.innerHTML = "<span style=cursor:pointer title='" + tabs[i].url + "'>" +  tabs[i].title + "</span>";

    cell2.addEventListener("click", (function(tabID) {
      return function() {
        closeTab(tabID);
      }
    })(tabs[i].id));
    
    cell3.addEventListener("click", (function(tabID, windowID) {
      return function() {
        openTab(tabID, windowID);
      }
    })(tabs[i].id, tabs[i].windowId));
  }
}

// function to display the selected tab
function openTab(tabID, windowID) {
  chrome.windows.update(windowID, {focused:true});
  chrome.tabs.update(tabID, {active:true});
}

// function to close the selected tab
function closeTab(tabID) {
  chrome.tabs.remove(tabID);
  // reload popup to refresh the count and links
  window.location.reload();
}

chrome.storage.local.get(["language", "theme"], function(items) {
  const lang = items["language"] || "en";
  const theme = items["theme"] || "light";
  
  if (theme === "dark") {
    document.body.classList.add("dark");
  }
  
  // Force displaying all tabs across all windows as requested
  getAllTabs(function(tabs) {
    displayResults(tabs, lang);
  });
});