(() => {
  "use strict";
  const words = JSON.parse(document.querySelector("#site-i18n").textContent);
  const motion = document.querySelector("#motion");
  const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
  let paused = preference.matches;
  const syncMotion = () => {
    document.body.classList.toggle("motion-paused", paused);
    document.documentElement.classList.toggle("motion-paused", paused);
    motion.setAttribute("aria-pressed", String(paused));
    const icon = document.createElement("span");
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = paused ? "▷" : "Ⅱ";
    motion.replaceChildren(icon, document.createTextNode(paused ? words.animate : words.pause));
    motion.setAttribute("aria-label", paused ? words.animateLabel : words.pauseLabel);
  };
  motion.addEventListener("click", () => { paused = !paused; syncMotion(); });
  preference.addEventListener("change", e => { paused = e.matches; syncMotion(); });
  syncMotion();

  const places = words.places;
  const sceneLabel = name => words.scene.replace("{name}", name);
  const image = document.querySelector("#place-image");
  const full = document.querySelector("#place-full");
  const description = document.querySelector("#place-description");
  const pondOptions = document.querySelector("#pond-options");
  const setScene = (file, alt) => {
    image.src = "assets/images/" + file + ".webp";
    image.alt = alt;
    full.href = image.src;
  };
  document.querySelectorAll("[data-place]").forEach(button => button.addEventListener("click", () => {
    document.querySelectorAll("[data-place]").forEach(b => b.setAttribute("aria-pressed", String(b === button)));
    const key = button.dataset.place;
    setScene(key, sceneLabel(places[key][0]));
    description.textContent = places[key][1];
    pondOptions.hidden = key !== "pond";
    document.querySelectorAll("[data-pond]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.pond === "pond")));
  }));
  document.querySelectorAll("[data-pond]").forEach(button => button.addEventListener("click", () => {
    document.querySelectorAll("[data-pond]").forEach(b => b.setAttribute("aria-pressed", String(b === button)));
    setScene(button.dataset.pond, sceneLabel(places.pond[0] + " · " + button.textContent.trim()));
  }));

  const cache = new Map();
  async function loadOutfit(id) {
    if (!cache.has(id)) cache.set(id, Promise.all([
      fetch("assets/sprites/" + id + ".json").then(r => { if(!r.ok) throw new Error("Missing sprite map"); return r.json(); }),
      new Promise((resolve, reject) => { const img = new Image(); img.onload = () => resolve(img); img.onerror = reject; img.src = "assets/sprites/" + id + ".webp"; })
    ]));
    return cache.get(id);
  }
  let outfit = "tomesi", elapsed = 0, happyUntil = 0;
  const actors = [...document.querySelectorAll("[data-mascot]")].map(canvas => ({
    canvas, context: canvas.getContext("2d"), asset: null, id: "", visible: true
  }));
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    const actor = actors.find(a => a.canvas === entry.target); if(actor) actor.visible = entry.isIntersecting;
  }), {rootMargin:"100px"});
  actors.forEach(a => observer.observe(a.canvas));
  async function dress(actor, id) {
    actor.id = id;
    const loaded = await loadOutfit(id);
    if(actor.id === id) actor.asset = loaded;
    draw(actor, 0);
  }
  function draw(actor, frame) {
    if (!actor.asset || !actor.context) return;
    const [spec, img] = actor.asset, f = spec.frames[frame], c = actor.canvas, ctx = actor.context;
    const scale = c.height * .87 / spec.referenceHeight;
    ctx.clearRect(0,0,c.width,c.height);
    ctx.drawImage(img,f.x,spec.height-f.y-f.h,f.w,f.h,c.width/2-f.pivotX*f.w*scale,c.height*.94-(1-f.pivotY)*f.h*scale,f.w*scale,f.h*scale);
  }
  actors.forEach(a => dress(a, "tomesi").catch(() => a.canvas.setAttribute("aria-label",words.mascot)));
  document.querySelectorAll("[data-outfit]").forEach(button => button.addEventListener("click", () => {
    outfit = button.dataset.outfit;
    document.querySelectorAll("[data-outfit]").forEach(b => b.setAttribute("aria-pressed", String(b === button)));
    actors.filter(a => a.canvas.dataset.mascot === "wardrobe").forEach(a => dress(a,outfit).catch(() => {}));
    happyUntil = elapsed + 1.8;
  }));
  document.querySelectorAll("[data-greet]").forEach(button => button.addEventListener("click", () => {
    happyUntil = elapsed + 2.6;
    const actor = actors.find(a => a.canvas === button.querySelector("canvas"));
    if(actor) draw(actor,2);
    document.querySelector("#greeting").textContent = words.greeting;
  }));
  let previous = 0, lastDraw = 0;
  function tick(now) {
    const dt = Math.min((now-previous)/1000,.08); previous=now;
    if (!paused && !document.hidden) elapsed += dt;
    if(now-lastDraw>80 && !document.hidden) {
      lastDraw=now;
      const cycle = elapsed % 15;
      const frame = elapsed < happyUntil ? 2 : cycle > 6 && cycle < 6.2 ? 1 : cycle > 10.5 && cycle < 11.4 ? 3 : 0;
      actors.filter(a=>a.visible).forEach(a=>draw(a,frame));
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  const url = window.TOMESI_SITE && window.TOMESI_SITE.appStoreUrl;
  if (typeof url === "string" && /^https:\/\/apps\.apple\.com\//.test(url)) {
    document.querySelectorAll("[data-release]").forEach(node => {
      const link = document.createElement("a"); link.className="text-link"; link.href=url; link.textContent=words.download;
      node.replaceChildren(link);
    });
  }
})();
