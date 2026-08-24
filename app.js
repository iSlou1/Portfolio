(function () {
  var root = document.documentElement;
  var LANG_KEY = "portfolio-lang";
  var THEME_KEY = "portfolio-theme";

  function getStored(key, fallback) {
    try {
      return localStorage.getItem(key) || fallback;
    } catch (e) {
      return fallback;
    }
  }

  function setStored(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {}
  }

  function setLang(lang) {
    if (lang !== "ru" && lang !== "en") lang = "ru";
    root.setAttribute("data-lang", lang);
    root.setAttribute("lang", lang);
    setStored(LANG_KEY, lang);
    var sel = document.getElementById("lang-select");
    if (sel) sel.value = lang;
  }

  function setTheme(theme) {
    if (theme !== "dark" && theme !== "light") theme = "dark";
    root.setAttribute("data-theme", theme);
    setStored(THEME_KEY, theme);
  }

  document.getElementById("lang-select")?.addEventListener("change", function () {
    setLang(this.value);
    syncUrl();
  });

  document.querySelector(".js-download-pdf")?.addEventListener("click", function () {
    var lang = root.getAttribute("data-lang") || "ru";
    var filename = "Skriganiuk-Vitalii-CV-" + lang + ".pdf";
    var a = document.createElement("a");
    a.href = "exports/" + filename;
    a.download = filename;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
  });

  document.getElementById("theme-toggle")?.addEventListener("click", function () {
    var t = root.getAttribute("data-theme") === "light" ? "dark" : "light";
    setTheme(t);
  });

  function syncUrl() {
    var lang = root.getAttribute("data-lang") || "ru";
    var u = new URL(location.href);
    u.search = "";
    if (lang !== "ru") u.searchParams.set("lang", lang);
    var qs = u.searchParams.toString();
    history.replaceState(null, "", u.pathname + (qs ? "?" + qs : "") + u.hash);
  }

  var params = new URLSearchParams(location.search);
  var initialLang = params.get("lang");
  if (initialLang === "en" || initialLang === "ru") setLang(initialLang);
  else setLang(getStored(LANG_KEY, "ru"));
  var storedTheme = getStored(THEME_KEY, "dark");
  if (storedTheme === "light" || storedTheme === "dark") setTheme(storedTheme);
  else setTheme("dark");
  syncUrl();
})();
