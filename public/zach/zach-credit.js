/**
 * Website by Zachary Hutton — inject or upgrade footer credit.
 */
(function () {
  var PORTFOLIO = "https://zacharyhutton.online/";
  var script = document.currentScript;
  var accent = (script && script.getAttribute("data-accent")) || "#c4a574";
  var dark = script && script.getAttribute("data-dark") === "true";

  function buildCredit() {
    var a = document.createElement("a");
    a.className = "zach-credit" + (dark ? " zach-credit--dark" : "");
    a.href = PORTFOLIO;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.setAttribute("aria-label", "Website by Zachary Hutton");
    a.innerHTML =
      '<span class="zach-credit__prefix">Website by </span>' +
      '<span class="zach-credit__name" style="color:' +
      accent +
      '">Zachary Hutton</span>';
    return a;
  }

  function replaceLegacy(node) {
    if (!node) return;
    var parent = node.parentElement;
    var credit = buildCredit();
    if (parent && parent.tagName === "A") parent.replaceWith(credit);
    else if (node.tagName === "A") node.replaceWith(credit);
    else {
      node.textContent = "";
      node.appendChild(credit);
    }
  }

  function run() {
    document.querySelectorAll("a, p, span, div, li, small").forEach(function (el) {
      var t = (el.textContent || "").replace(/\s+/g, " ").trim();
      if (
        /Website by /i.test(t) ||
        /^Website by Zachary Hutton$/i.test(t) ||
        /^Designed\s*&\s*Built By ZACH$/i.test(t) ||
        /^Designed and Built By ZACH$/i.test(t) ||
        /^Website by Zachary Hutton$/i.test(t) ||
        t === "ZACH"
      ) {
        if (el.children.length <= 3) replaceLegacy(el);
      }
    });
    document
      .querySelectorAll('a.zach-credit, a[href*="zacharyhutton.online"]')
      .forEach(function (a) {
        if (/Website by Zachary Hutton/i.test(a.textContent || "")) return;
        replaceLegacy(a);
      });
    if (!document.querySelector("a.zach-credit")) {
      var foot = document.querySelector("footer") || document.body;
      var wrap = document.createElement("div");
      wrap.style.cssText = "display:flex;justify-content:center;padding:12px 16px;";
      wrap.appendChild(buildCredit());
      foot.appendChild(wrap);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else run();
})();
