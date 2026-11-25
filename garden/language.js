(() => {
  "use strict";
  const picker = document.querySelector("#site-language");
  if (!picker) return;
  picker.addEventListener("change", () => {
    const next = new URL(picker.value, window.location.href);
    next.hash = window.location.hash;
    window.location.assign(next.href);
  });
})();
