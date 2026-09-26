/* Applies the saved theme before first paint (no flash). Kept as a separate file so the site works under a strict script-src CSP. */
(function () {
  var t = "light";
  try { if (localStorage.getItem("cm-theme") === "dark") t = "dark"; } catch (e) { /* storage unavailable */ }
  document.documentElement.setAttribute("data-theme", t);
  if (t === "dark") { var m = document.querySelector("meta[name=theme-color]"); if (m) m.setAttribute("content", "#0A0C11"); }
})();
