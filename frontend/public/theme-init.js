/* Applies the saved theme before first paint (no flash). Kept as a separate file so the site works under a strict script-src CSP. */
(function () {
  var t = "dark";
  try { if (localStorage.getItem("cm-theme") === "light") t = "light"; } catch (e) { /* storage unavailable */ }
  document.documentElement.setAttribute("data-theme", t);
  if (t === "light") { var m = document.querySelector("meta[name=theme-color]"); if (m) m.setAttribute("content", "#FFFFFF"); }
})();
