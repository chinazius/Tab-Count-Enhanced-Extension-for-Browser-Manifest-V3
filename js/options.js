const i18n = {
  en: {
    lbl_appearance: "Appearance & Language",
    lbl_language: "Language:",
    lbl_theme: "Theme:",
    lbl_theme_light: "Light",
    lbl_theme_dark: "Dark",
    lbl_popupWindow: "Popup window",
    lbl_listCurrent: "List tabs from the current window only",
    lbl_listAll: "List tabs from all windows",
    lbl_detectDedupe: "Detect and prompt duplicate tab creation.",
    lbl_autoClose1: "Auto-close tabs unused for more than",
    lbl_autoClose2: "days.",
    lbl_currentStats: "Current Stats",
    lbl_totalWindows: "Total number of windows:",
    lbl_totalTabs: "Total number of tabs:",
    refreshButton: "Refresh Stats",
    statusSaved: "Selection Saved...",
    title: "TabCount Options"
  },
  ru: {
    lbl_appearance: "Внешний вид и язык",
    lbl_language: "Язык:",
    lbl_theme: "Тема:",
    lbl_theme_light: "Светлая",
    lbl_theme_dark: "Тёмная",
    lbl_popupWindow: "Всплывающее окно",
    lbl_listCurrent: "Показывать вкладки только текущего окна",
    lbl_listAll: "Показывать вкладки всех окон",
    lbl_detectDedupe: "Находить и закрывать дубликаты вкладок.",
    lbl_autoClose1: "Автоматически закрывать вкладки, неактивные более",
    lbl_autoClose2: "дней.",
    lbl_currentStats: "Текущая статистика",
    lbl_totalWindows: "Общее количество окон:",
    lbl_totalTabs: "Общее количество вкладок:",
    refreshButton: "Обновить статистику",
    statusSaved: "Настройки сохранены...",
    title: "Настройки TabCount"
  }
};

let currentLang = "en";

function applyLanguage(lang) {
  currentLang = lang;
  const dict = i18n[lang] || i18n["en"];
  for (const [id, text] of Object.entries(dict)) {
    const el = document.getElementById(id);
    if (el) {
      if (el.tagName === "INPUT" && el.type === "button") {
        el.value = text;
      } else {
        el.innerText = text;
      }
    }
  }
}

function applyTheme(theme) {
  if (theme === "dark") {
    document.body.classList.add("dark");
  } else {
    document.body.classList.remove("dark");
  }
}

//Save options to storage
function save_options(type, value) {
  console.log('type: ' + type + ', value: ' + value);
  var updates = {};
  if (type == "popupCount") {
    updates["popupDisplayOption"] = value;
  } else if (type == 'tabDedupe') {
    updates["tabDedupe"] = value;
  } else if (type == 'tabJanitor') {
    updates["tabJanitor"] = value;
  } else if (type == 'tabJanitorDays') {
    updates["tabJanitorDays"] = value;
  } else if (type == 'language') {
    updates["language"] = value;
    applyLanguage(value);
  } else if (type == 'theme') {
    updates["theme"] = value;
    applyTheme(value);
  } else {
    updates["badgeDisplayOption"] = value;
  }

  chrome.storage.local.set(updates, function() {
    if (type !== "popupCount" && type !== "tabDedupe" && type !== "tabJanitor" && type !== "tabJanitorDays" && type !== "language" && type !== "theme") {
      chrome.runtime.reload();
    }
    //Update selection status
    var status = document.getElementById("status");
    const dict = i18n[currentLang] || i18n["en"];
    status.innerHTML = dict.statusSaved;
    setTimeout(function() {
      status.innerHTML = "";
    }, 750);
  });
}

//Restore selection from storage
function restore_options() {
  chrome.storage.local.get(["popupDisplayOption", "tabDedupe", "tabJanitor", "tabJanitorDays", "language", "theme"], function(items) {
    // restore options for popupDisplay
    var selection = items["popupDisplayOption"];
    var radios = document.popupOptionsForm.tabCountRadios;
    if (!selection) {
      document.getElementById("defaultPopupSelection").checked = true;
    }
    for (var i = 0; i < radios.length; i++) {
      if (radios[i].value == selection) {
        radios[i].checked = true;
      }
    }
    
    // restore options for tabDedupe
    document.getElementById("tabDedupe").checked = (items["tabDedupe"] === true || items["tabDedupe"] === "true");
    
    // Restore tab janitor options.
    document.getElementById("tabJanitor").checked = (items["tabJanitor"] === true || items["tabJanitor"] === "true");
    document.getElementById("tabJanitorDays").value = items["tabJanitorDays"] || 5;

    // Restore language and theme
    const lang = items["language"] || "en";
    const theme = items["theme"] || "light";
    document.getElementById("languageSelect").value = lang;
    document.getElementById("themeSelect").value = theme;
    
    applyLanguage(lang);
    applyTheme(theme);
  });
}

document.addEventListener("DOMContentLoaded", restore_options);

//Add eventlisteners to the radio buttons
var radios = document.popupOptionsForm.tabCountRadios;
for (var i = 0; i < radios.length; i++) {
  radios[i].addEventListener("click", (function(value) {
    return function() {
      save_options("popupCount", value);
    }
  })(radios[i].value));
}

// Add event listener for tabDedupe checkbox.
var checkbox = document.getElementById("tabDedupe");
checkbox.addEventListener("click", (function(value) {
    return function() {
      save_options("tabDedupe", value);
    }
  })(checkbox.checked));
  
// Add event listener for tabJanitor checkbox.
var janitorCheckbox = document.getElementById("tabJanitor");
janitorCheckbox.addEventListener("click", (function(value) {
    return function() {
      save_options("tabJanitor", value);
    }
  })(janitorCheckbox.checked));

// Add event listener for tabJanitor checkbox.
document.getElementById("tabJanitorDays").oninput = function() {
  save_options("tabJanitorDays", document.getElementById("tabJanitorDays").valueAsNumber);
};

// Add event listeners for language and theme
document.getElementById("languageSelect").addEventListener("change", function(e) {
  save_options("language", e.target.value);
});
document.getElementById("themeSelect").addEventListener("change", function(e) {
  save_options("theme", e.target.value);
});

document.getElementById("refreshButton").addEventListener("click", function() {
  location.reload();
});

chrome.storage.local.get(["windowsCount", "allWindowsTabsCount"], function(items) {
  document.getElementById("windowsCount").innerHTML = items["windowsCount"] || 0;
  document.getElementById("tabsCount").innerHTML = items["allWindowsTabsCount"] || 0;
});
