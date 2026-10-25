import * as THREE from "three";
import { projects } from "./projects.js";
let active = 0, paused = matchMedia("(prefers-reduced-motion: reduce)").matches, theater = false;
let engine = null, videoURL = null, videoTexture = null, videoRevision = 0, videoLoading = false;
const video = document.createElement("video");
video.playsInline = true;
video.loop = true;
video.muted = true;
video.hidden = true;
video.preload = "metadata";
video.setAttribute("aria-hidden", "true");
document.body.append(video);
let returnFocus = null;
let fillVideo = true;
let resumeVideoWhenVisible = false;
const dialog = document.querySelector(".stage-wrap");
document.querySelector("#expand-console").setAttribute("aria-expanded", "false");
const feedback = (text) => { document.querySelector("#console-feedback").textContent = text; };
const backgroundState = new Map();
function setDialogBackground(inert) {
  if (!inert) {
    for (const [element, wasInert] of backgroundState) element.inert = wasInert;
    backgroundState.clear();
    return;
  }
  // Isolate the dialog without hiding its ancestors or assuming a particular page layout.
  for (let branch = dialog; branch.parentElement && branch !== document.body; branch = branch.parentElement) {
    for (const sibling of branch.parentElement.children) {
      if (sibling === branch || ["SCRIPT", "STYLE", "LINK"].includes(sibling.tagName)) continue;
      backgroundState.set(sibling, sibling.inert);
      sibling.inert = true;
    }
  }
}
function toggleTheater(open) {
  if (theater === open) return;
  theater = open;
  document.body.classList.toggle("theater", open);
  document.querySelector("#theater-header").hidden = !open;
  document.querySelector("#expand-console").setAttribute("aria-expanded", String(open));
  if (open) {
    returnFocus = document.activeElement;
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("aria-label", "Lettore PSP interattivo");
    setDialogBackground(true);
    document.querySelector("#close-theater").focus({ preventScroll: true });
  } else {
    setDialogBackground(false);
    dialog.removeAttribute("role");
    dialog.removeAttribute("aria-modal");
    dialog.removeAttribute("aria-label");
    if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
  }
  engine?.reset();
}
function changeProject(delta) {
  selectProject((active + delta + projects.length) % projects.length);
}
async function playPause() {
  if (videoLoading) return;
  if (!videoURL && projects[active].trailer) {
    await loadVideo(projects[active].trailer);
    return;
  }
  if (!videoURL) {
    document.querySelector("#console-feedback").textContent = "Nessun trailer disponibile · Premi LOAD sulla PSP per provare un video.";
    return;
  }
  try {
    if (video.paused) await video.play();
    else video.pause();
  } catch {
    feedback("Il browser non riesce a riprodurre questo video.");
    return;
  }
  syncPlayback();
}
function seek(seconds) {
  if (!Number.isFinite(video.duration)) return;
  video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + seconds));
  const time = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  feedback(`${time(video.currentTime)} / ${time(video.duration)} · × play/pausa · ← → ±10s`);
}
function syncPlayback() {
  if (videoURL) feedback(video.paused ? "Video in pausa · × per riprendere" : "In riproduzione · × pausa · ← → ±10s · VOL audio");
}
video.addEventListener("play", syncPlayback);
video.addEventListener("pause", syncPlayback);
document.querySelector("#expand-console").addEventListener("click", () => toggleTheater(true));
document.querySelector("#close-theater").addEventListener("click", () => toggleTheater(false));
function performAction(action) {
  if (action === "fit") {
    if (videoTexture) { fillVideo = !fillVideo; engine?.fitVideo(); feedback(fillVideo ? "Video a schermo pieno · tocca lo schermo per mostrarlo intero" : "Video intero · tocca lo schermo per riempirlo"); }
    else playPause();
  }
  if (action === "play") playPause();
  if (action === "previous") changeProject(-1);
  if (action === "next") changeProject(1);
  if (action === "back") seek(-10);
  if (action === "forward") seek(10);
  if (action === "close") { if (theater) toggleTheater(false); else { stopVideo(); engine?.updateScreen(); } }
  if (action === "mute") { video.muted = !video.muted; feedback(video.muted ? "Audio disattivato" : "Audio attivo"); }
  if (action === "load") document.querySelector("#video-file").click();
  if (action === "reset") engine?.reset();
  if (action === "expand") toggleTheater(!theater);
  if (action === "motion") { paused = !paused; updateMotion(); feedback(paused ? "Animazioni in pausa" : "Animazioni attive"); }
}
document.addEventListener("keydown", (e) => {
  if (!theater && !dialog.contains(document.activeElement)) return;
  if (e.key === "Escape") {
    e.preventDefault();
    toggleTheater(false);
    return;
  }
  if (e.key === "Tab" && theater) {
    const controls = [...dialog.querySelectorAll("button:not(:disabled),input:not(:disabled),a[href]")].filter((element) => element.getClientRects().length && !element.closest("[hidden]"));
    const at = controls.indexOf(document.activeElement);
    if (!controls.length) {
      e.preventDefault();
      return;
    }
    if (e.shiftKey && at <= 0 || !e.shiftKey && (at < 0 || at === controls.length - 1)) {
      e.preventDefault();
      controls[e.shiftKey ? controls.length - 1 : 0].focus();
    }
    return;
  }
  if (e.target.matches('input,textarea,select,[contenteditable="true"]')) return;
  // Space activates a focused HTML button natively; do not fire a second player action.
  if (e.key === " " && e.target.closest("button,a")) return;
  if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " "].includes(e.key)) e.preventDefault();
  if (e.key === "ArrowLeft") seek(-10);
  if (e.key === "ArrowRight") seek(10);
  if (e.key === "ArrowUp") changeProject(-1);
  if (e.key === "ArrowDown") changeProject(1);
  if (e.key === " ") playPause();
});
function selectProject(i) {
  active = i;
  stopVideo();
  document.querySelector("#player-title").textContent = projects[i].name;
  feedback(projects[i].name + (projects[i].trailer ? " · × guarda il trailer" : " · □ / ○ cambia progetto"));
  engine?.updateScreen();
}
function stopVideo() {
  resumeVideoWhenVisible = false;
  videoRevision++;
  videoLoading = false;
  video.pause();
  video.removeAttribute("src");
  video.load();
  if (videoURL?.startsWith("blob:")) URL.revokeObjectURL(videoURL);
  videoURL = null;
  videoTexture?.dispose();
  videoTexture = null;
  feedback(projects[active].name + (projects[active].trailer ? " · × guarda il trailer" : " · □ / ○ cambia progetto"));
}
selectProject(0);
window.addEventListener("xm-select-project", (e) => {
  if (Number.isInteger(e.detail) && e.detail >= 0 && e.detail < projects.length) {
    selectProject(e.detail);
    if (projects[e.detail].trailer) playPause();
    document.querySelector("#stage").scrollIntoView({ behavior: paused ? "instant" : "smooth", block: "center" });
  }
});
function labelTexture(text, { size = 64, color = "#e4e7e6", bg = null, width = 512, height = 128 } = {}) {
  const c = document.createElement("canvas");
  c.width = width;
  c.height = height;
  const ctx = c.getContext("2d");
  if (bg) {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);
  }
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `500 ${size}px Geist, sans-serif`;
  ctx.fillText(text, width / 2, height / 2);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function roundGeometry(w, h, r, depth) {
  const s = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.045, bevelThickness: 0.045, curveSegments: 10 });
  g.translate(0, 0, -depth / 2);
  return g;
}
function screenTexture(p) {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 580;
  const ctx = c.getContext("2d");
  ctx.fillStyle = p.color;
  ctx.fillRect(0, 0, 1024, 580);
  ctx.fillStyle = "#ffffff";
  ctx.font = '18px "JetBrains Mono", monospace';
  ctx.fillText("XMARCO / PROJECT PLAYER", 40, 43);
  ctx.textAlign = "right";
  ctx.fillText(`0${active + 1} — 05`, 984, 43);
  ctx.textAlign = "left";
  ctx.strokeStyle = "rgba(255,255,255,.28)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(40, 65);
  ctx.lineTo(984, 65);
  ctx.stroke();
  if (p.id === "meridiano") {
    ctx.save();
    ctx.translate(735, 282);
    ctx.strokeStyle = "rgba(255,255,255,.65)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.ellipse(0, 0, 176, 30 + i * 36, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.ellipse(0, 0, 30 + i * 48, 176, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = "#e7f0af";
    ctx.beginPath();
    ctx.arc(75, -65, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (p.id === "tapdeck") {
    for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) {
      ctx.fillStyle = (x + y) % 3 === 0 ? "#f4f0e7" : "#242a29";
      ctx.beginPath();
      ctx.roundRect(650 + x * 100, 130 + y * 100, 82, 82, 14);
      ctx.fill();
      ctx.fillStyle = (x + y) % 3 === 0 ? "#242a29" : "#f4f0e7";
      ctx.font = "30px Geist, sans-serif";
      ctx.fillText(["↗", "♪", "×", "▶", "⊞", "✳", "◎", "＋", "⌘"][x + y * 3], 675 + x * 100, 183 + y * 100);
    }
  } else if (p.id === "padel") {
    ctx.strokeStyle = "#283d30";
    ctx.lineWidth = 4;
    ctx.strokeRect(640, 115, 280, 340);
    ctx.beginPath();
    ctx.moveTo(640, 285);
    ctx.lineTo(920, 285);
    ctx.moveTo(780, 115);
    ctx.lineTo(780, 455);
    ctx.moveTo(640, 205);
    ctx.lineTo(920, 205);
    ctx.moveTo(640, 365);
    ctx.lineTo(920, 365);
    ctx.stroke();
  } else if (p.id === "n8n") {
    ctx.strokeStyle = "#33243e";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(650, 220);
    ctx.lineTo(750, 220);
    ctx.lineTo(750, 350);
    ctx.lineTo(940, 350);
    ctx.stroke();
    for (const [x, y] of [[630, 220], [770, 350], [940, 350]]) {
      ctx.fillStyle = "#f2edf6";
      ctx.beginPath();
      ctx.roundRect(x - 35, y - 35, 70, 70, 15);
      ctx.fill();
      ctx.fillStyle = "#33243e";
      ctx.font = "35px Geist, sans-serif";
      ctx.fillText("✳", x - 16, y + 13);
    }
  } else {
    ctx.fillStyle = "#26373c";
    ctx.beginPath();
    ctx.roundRect(670, 100, 230, 360, 20);
    ctx.fill();
    for (const y of [195, 345]) {
      ctx.strokeStyle = "#91b9be";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(785, y, 55, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(785, y, 25, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.fillStyle = active === 2 || active === 3 || active === 4 ? "#22352c" : "#ffffff";
  ctx.font = "700 74px Geist, sans-serif";
  ctx.fillText(p.name, 40, 290, 580);
  ctx.font = "25px Geist, sans-serif";
  ctx.fillText(p.type, 43, 337, 545);
  ctx.font = '18px "JetBrains Mono", monospace';
  ctx.fillText(p.category, 43, 510);
  ctx.font = '16px "JetBrains Mono", monospace';
  ctx.fillText("XMARCO / PROGETTI ED ESPERIMENTI", 43, 549);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
function startScene() {
  const host = document.querySelector("#stage");
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.25));
  renderer.setClearColor(0, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.9;
  host.append(renderer.domElement);
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0, 12.8);
  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color("#171923");
  const room = new THREE.Mesh(new THREE.BoxGeometry(20, 20, 20), new THREE.MeshBasicMaterial({ color: 1447970, side: THREE.BackSide }));
  envScene.add(room);
  [[-6, 4, 1, 5, 9], [5, 2, 0, 3, 12], [0, 8, -3, 12, 4]].forEach(([x, y, z, w, h]) => {
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: 16777215 }));
    panel.position.set(x, y, z);
    panel.lookAt(0, 0, 0);
    envScene.add(panel);
  });
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(envScene, 0.03);
  scene.environment = env.texture;
  pmrem.dispose();
  scene.add(new THREE.HemisphereLight(11451865, 1118489, 1.5));
  const key = new THREE.DirectionalLight(15331327, 5);
  key.position.set(-4, 8, 9);
  scene.add(key);
  const fill = new THREE.DirectionalLight(11650268, 1.4);
  fill.position.set(6, -1, -2);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(7910874, 3);
  rim.position.set(-5, -2, 1);
  scene.add(rim);
  const model = new THREE.Group();
  scene.add(model);
  const silver = new THREE.MeshStandardMaterial({ color: 8752017, metalness: 0.78, roughness: 0.3 });
  const black = new THREE.MeshStandardMaterial({ color: 1119513, metalness: 0.35, roughness: 0.25 });
  const graphite = new THREE.MeshStandardMaterial({ color: 2501676, metalness: 0.55, roughness: 0.34 });
  const lightMetal = new THREE.MeshStandardMaterial({ color: 14738400, metalness: 0.8, roughness: 0.21 });
  const shape = (w, h, r, d, mat, x, y, z) => {
    const m = new THREE.Mesh(roundGeometry(w, h, r, d), mat);
    m.position.set(x, y, z);
    model.add(m);
    return m;
  };
  shape(7.9, 3.5, 0.85, 0.4, silver, 0, 0, 0);
  shape(7.8, 3.4, 0.8, 0.08, graphite, 0, 0, 0.21);
  shape(7.67, 3.3, 0.77, 0.06, silver, 0, 0, 0.29);
  shape(5.2, 2.92, 0.15, 0.07, black, 0, 0, 0.35);
  shape(4.62, 2.6, 0.05, 0.025, graphite, 0, 0.02, 0.413);
  const displayMaterial = new THREE.MeshBasicMaterial({ map: screenTexture(projects[active]), toneMapped: false });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(4.42, 2.49), displayMaterial);
  screen.position.set(0, 0.02, 0.49);
  model.add(screen);
  function textLabel(text, x, y, w, h, size, color) {
    const map = labelTexture(text, { size, color, width: text.length === 1 ? 128 : text.length <= 5 ? 256 : 512 });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map, transparent: true, depthWrite: false }));
    m.position.set(x, y, 0.52);
    model.add(m);
  }
  // Four individually raised controls, analogue stick, speaker perforations and edge switches.
  const hitTargets = [];
  const accessibleKeys = [];
  const keyNames = { fit: "Alterna video pieno o intero", previous: "Progetto precedente", next: "Progetto successivo", play: "Riproduci o metti in pausa", close: "Torna al progetto o chiudi vista espansa", back: "Indietro di 10 secondi", forward: "Avanti di 10 secondi", reset: "Ripristina vista", mute: "Attiva o disattiva audio", load: "Apri un video locale", expand: "Ingrandisci o riduci PSP", motion: "Ferma o riprendi animazioni" };
  function control(mesh, action) {
    mesh.userData.action = action;
    mesh.userData.baseZ = mesh.position.z;
    hitTargets.push(mesh);
    if (action !== "dpad") {
      const key = document.createElement("button");
      key.className = "console-key";
      key.type = "button";
      key.dataset.consoleAction = action;
      if (action === "fit") key.setAttribute("aria-pressed", String(fillVideo));
      key.setAttribute("aria-label", keyNames[action]);
      key.addEventListener("click", () => { mesh.userData.pressedUntil = performance.now() + 140; performAction(action); poseDirty = true; invalidate(); });
      key.addEventListener("focus", () => feedback(keyNames[action]));
      host.append(key);
      accessibleKeys.push({ mesh, key });
    }
    return mesh;
  }
  control(screen, "fit");
  control(shape(0.23, 0.85, 0.06, 0.11, graphite, -3.1, 0.1, 0.42), "dpad");
  control(shape(0.85, 0.23, 0.06, 0.11, graphite, -3.1, 0.1, 0.43), "dpad");
  const disc = (r, depth, mat, x, y, z) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, depth, 24), mat);
    m.rotation.x = Math.PI / 2;
    m.position.set(x, y, z);
    model.add(m);
    return m;
  };
  disc(0.27, 0.11, black, -3.1, -0.94, 0.43);
  disc(0.205, 0.03, graphite, -3.1, -0.94, 0.5);
  for (let j = 0; j < 4; j++) {
    let a = j * Math.PI / 2;
    let x = 3.1 + Math.sin(a) * 0.38, y = 0.1 + Math.cos(a) * 0.38;
    control(disc(0.18, 0.11, graphite, x, y, 0.43), ["close", "next", "play", "previous"][j]);
    textLabel(["△", "○", "×", "□"][j], x, y, 0.23, 0.23, 80, ["#8bcab0", "#e7a2a0", "#9dbadf", "#ccb1d7"][j]);
  }
  for (let j = 0; j < 5; j++) {
    const x = -1.55 + j * .78;
    control(shape(.42, .13, .04, .05, graphite, x, -1.49, .42), ["reset", "mute", "load", "expand", "motion"][j]);
    textLabel(["HOME", "VOL", "LOAD", "VIEW", "FX"][j], x, -1.49, .4, .12, 64, "#bdc5d0");
  }
  textLabel("X M A R C O", 0, -1.27, 1.1, 0.15, 32, "#aeb8b1");
  textLabel("PORTABLE", -3.1, 1.04, 0.72, 0.16, 35, "#333e39");
  textLabel("PLAYGROUND", 3.05, -1.04, 0.9, 0.13, 29, "#39433f");
  for (let side of [-1, 1]) for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) disc(0.017, 0.015, black, side * (2.8 + x * 0.1), -0.52 - y * 0.09, 0.36);
  control(shape(1.2, 0.12, 0.04, 0.15, lightMetal, -2.6, 1.68, -0.03), "previous");
  control(shape(1.2, 0.12, 0.04, 0.15, lightMetal, 2.6, 1.68, -0.03), "next");
  disc(0.035, 0.02, new THREE.MeshBasicMaterial({ color: 11134062 }), 3.5, -1.15, 0.41);
  let yaw = 0, pitch = 0, targetZoom = 9.8, drag = null, visible = true, last = 0, startAt = null, introComplete = false;
  let frame = 0, poseDirty = true, viewWidth = 0, viewHeight = 0;
  const profiling = new URLSearchParams(location.search).has("profile");
  let renderedFrames = 0;
  function invalidate() {
    if (!frame && !document.hidden && (visible || theater)) frame = requestAnimationFrame(renderFrame);
  }
  function syncVisibility() {
    const activeView = !document.hidden && (visible || theater);
    if (!activeView) {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      if (!video.paused) { resumeVideoWhenVisible = true; video.pause(); }
    } else {
      last = 0;
      if (resumeVideoWhenVisible && videoURL) { resumeVideoWhenVisible = false; video.play().catch(() => {}); }
      invalidate();
    }
  }
  const pointer = new THREE.Vector2(), raycaster = new THREE.Raycaster();
  function resize() {
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    viewWidth = w; viewHeight = h;
    poseDirty = true;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    targetZoom = Math.max(theater ? 7.3 : 9.8, (theater ? 8.7 : 8.8) / (2 * Math.tan(16 * Math.PI / 180) * camera.aspect));
    invalidate();
  }
  new ResizeObserver(resize).observe(host);
  resize();
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    syncVisibility();
  }).observe(host);
  document.addEventListener("visibilitychange", syncVisibility);
  function pick(e) {
    const rect = host.getBoundingClientRect();
    pointer.set((e.clientX - rect.left) / rect.width * 2 - 1, -(e.clientY - rect.top) / rect.height * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    return raycaster.intersectObjects(hitTargets)[0];
  }
  renderer.domElement.style.touchAction = "pan-y";
  host.addEventListener("pointerdown", (e) => {
    if (!e.isPrimary || e.button !== 0) return;
    const hit = pick(e);
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY, yaw, pitch, hit, moved: false };
    if (hit) e.preventDefault();
    host.setPointerCapture(e.pointerId);
  });
  host.addEventListener("pointermove", (e) => {
    const hit = pick(e);
    host.style.cursor = hit ? "pointer" : theater ? "default" : "grab";
    host.title = hit ? keyNames[hit.object.userData.action] || "Croce direzionale: cambia progetto o scorri il video" : "Trascina per ruotare";
    if (!drag || drag.id !== e.pointerId) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (Math.hypot(dx, dy) < 6 && !drag.moved) return;
    drag.moved = true;
    // A press that begins on a physical control never rotates the console.
    if (theater || drag.hit) return;
    introComplete = true;
    yaw = Math.max(-0.65, Math.min(0.65, drag.yaw + dx * 5e-3));
    pitch = Math.max(-0.35, Math.min(0.35, drag.pitch + dy * 4e-3));
    poseDirty = true;
    invalidate();
  });
  host.addEventListener("pointerup", (e) => {
    if (!drag || drag.id !== e.pointerId) return;
    const press = drag;
    drag = null;
    if (host.hasPointerCapture(e.pointerId)) host.releasePointerCapture(e.pointerId);
    if (press.moved || Math.hypot(e.clientX - press.x, e.clientY - press.y) >= 6 || !press.hit) return;
    const hit = pick(e);
    if (!hit || hit.object !== press.hit.object) return;
    let action = hit.object.userData.action;
    hit.object.userData.pressedUntil = performance.now() + 140;
    if (action === "dpad") {
      const pt = model.worldToLocal(hit.point.clone());
      const x = pt.x + 3.1, y = pt.y - 0.1;
      action = Math.abs(x) > Math.abs(y) ? x > 0 ? "forward" : "back" : y > 0 ? "previous" : "next";
    }
    performAction(action);
    poseDirty = true;
    invalidate();
  });
  const cancelDrag = () => {
    drag = null;
  };
  host.addEventListener("pointercancel", cancelDrag);
  host.addEventListener("lostpointercapture", cancelDrag);
  const reset = () => {
    yaw = 0;
    pitch = 0;
    drag = null;
    if (theater) introComplete = true;
    resize();
  };
  const projected = new THREE.Vector3();
  function renderFrame(t) {
    frame = 0;
    if (!visible && !theater || document.hidden) return;
    if (startAt === null) startAt = t;
    const dt = last ? Math.min((t - last) / 1e3, 0.05) : 1 / 60;
    last = t;
    const intro = paused || introComplete || theater ? 1 : Math.min(1, (t - startAt) / 1100);
    if (intro === 1) introComplete = true;
    const ease = 1 - Math.pow(1 - intro, 3);
    // Only the entrance and an intentional drag change the pose. Project/video controls
    // update the screen; they never move, tilt or recenter the object being pressed.
    model.rotation.set(theater ? 0 : pitch, theater ? 0 : yaw, 0);
    model.position.y = -(1 - ease) * 0.35;
    model.scale.setScalar(0.96 + ease * 0.04);
    camera.position.z = paused || Math.abs(camera.position.z - targetZoom) < 1e-3 ? targetZoom : THREE.MathUtils.damp(camera.position.z, targetZoom, 7, dt);
    let buttonsMoving = false;
    for (const m of hitTargets) {
      const target = m.userData.baseZ - (m.userData.pressedUntil > t && m.userData.action !== "fit" ? 0.025 : 0);
      m.position.z = Math.abs(m.position.z - target) < .0001 ? target : THREE.MathUtils.damp(m.position.z, target, 25, dt);
      if (m.position.z !== target || m.userData.pressedUntil > t) buttonsMoving = true;
    }
    const poseMoving = !introComplete || Math.abs(camera.position.z - targetZoom) > .001 || buttonsMoving;
    const updateKeys = poseDirty || poseMoving;
    poseDirty = poseMoving;
    renderer.render(scene, camera);
    if (profiling) renderer.domElement.dataset.renderedFrames = String(++renderedFrames);
    if (updateKeys) for (const { mesh, key } of accessibleKeys) {
      mesh.getWorldPosition(projected).project(camera);
      key.style.left = `${(projected.x + 1) * viewWidth / 2}px`;
      key.style.top = `${(1 - projected.y) * viewHeight / 2}px`;
    }
    if (poseMoving || (!video.paused && !video.requestVideoFrameCallback)) invalidate();
  }
  if (video.requestVideoFrameCallback) {
    const onVideoFrame = () => { invalidate(); video.requestVideoFrameCallback(onVideoFrame); };
    video.requestVideoFrameCallback(onVideoFrame);
  }
  for (const event of ["loadeddata", "seeked", "pause", "playing"]) video.addEventListener(event, invalidate);
  video.addEventListener("play", syncVisibility);
  renderer.domElement.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    document.querySelector("#fallback").hidden = false;
    document.querySelector("#scene-status").textContent = "Vista 3D non disponibile. L’archivio resta accessibile.";
  });
  engine = {
    reset,
    invalidate,
    updateScreen() {
      displayMaterial.map?.dispose();
      screen.scale.set(1, 1, 1);
      displayMaterial.map = screenTexture(projects[active]);
      displayMaterial.needsUpdate = true;
      invalidate();
    },
    setVideo() {
      displayMaterial.map?.dispose();
      videoTexture = new THREE.VideoTexture(video);
      videoTexture.colorSpace = THREE.SRGBColorSpace;

      displayMaterial.map = videoTexture;
      displayMaterial.needsUpdate = true;
      this.fitVideo();
    },
    fitVideo() {
      if (!videoTexture) return;
      const videoAspect = video.videoWidth / video.videoHeight;
      const displayAspect = 4.42 / 2.49;
      const x = Math.min(1, displayAspect / videoAspect);
      const y = Math.min(1, videoAspect / displayAspect);
      screen.scale.set(fillVideo ? 1 : Math.min(1, videoAspect / displayAspect), fillVideo ? 1 : Math.min(1, displayAspect / videoAspect), 1);
      videoTexture.repeat.set(fillVideo ? x : 1, fillVideo ? y : 1);
      videoTexture.offset.set(fillVideo ? (1 - x) / 2 : 0, fillVideo ? (1 - y) / 2 : 0);
      document.querySelector('[data-console-action="fit"]').setAttribute("aria-pressed", String(fillVideo));
      poseDirty = true;
      invalidate();
    }
  };
  document.body.classList.add("scene-loaded");
  document.querySelector("#scene-status").textContent = "Trascina per esplorare l’oggetto ↔";
}
// Canvas textures use the same local font families as the surrounding page.
await Promise.allSettled([document.fonts.load("500 32px Geist"), document.fonts.load("700 74px Geist"), document.fonts.load('400 18px "JetBrains Mono"')]);
try {
  startScene();
} catch (error) {
  document.querySelector("#fallback").hidden = false;
  document.querySelector("#scene-status").textContent = "Vista 3D non disponibile su questo dispositivo.";
  console.warn("3D non disponibile:", error.message);
}
function updateMotion() {
  window.dispatchEvent(new CustomEvent("xm-motion", { detail: paused }));
}
updateMotion();
matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", (e) => {
  paused = e.matches;
  updateMotion();
});
async function loadVideo(source) {
  if (!engine) { feedback("Per il video serve una vista 3D compatibile."); return; }
  stopVideo();
  engine.updateScreen();
  const revision = videoRevision;
  videoLoading = true;
  videoURL = source;
  video.src = source;
  feedback("Caricamento del trailer…");
  try {
    await video.play();
    if (revision !== videoRevision) return;
    engine.setVideo();
    syncPlayback();
  } catch {
    if (revision !== videoRevision) return;
    stopVideo();
    engine.updateScreen();
    feedback("Video non disponibile. Premi × per riprovare.");
  } finally {
    if (revision === videoRevision) videoLoading = false;
  }
}

document.querySelector("#video-file").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  if (engine) await loadVideo(URL.createObjectURL(file));
  else feedback("Per il video serve una vista 3D compatibile.");
  e.target.value = "";
});

// The address matches the public contact on the original portfolio.
document.querySelector("#copy-email").addEventListener("click", async () => {
  const status = document.querySelector("#contact-status");
  try { await navigator.clipboard.writeText("marco.aprea910@gmail.com"); status.textContent = "Indirizzo copiato."; }
  catch { status.textContent = "Puoi selezionare e copiare l’indirizzo qui sopra."; }
});
