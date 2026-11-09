import { initDesigner } from "./designer.js";

const $ = (id) => document.getElementById(id);
const views = ["dashboard", "create", "saved", "designer", "research"];
let saved = JSON.parse(localStorage.getItem("ideaGenesisSaved") || "[]");
let designer = null;

function toast(message) {
  const el = $("toast");
  el.textContent = message;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 2400);
}
function showView(name) {
  views.forEach(v => {
    $(`${v}View`).classList.toggle("active", v === name);
    document.querySelector(`[data-view="${v}"]`)?.classList.toggle("active", v === name);
  });
  const titles = { dashboard: "Invention Dashboard", create: "Create an Invention", saved: "My Inventions", designer: "3D Designer", research: "Patent Research" };
  $("pageTitle").textContent = titles[name];
  if (name === "saved") renderSaved();
  if (name === "designer" && !designer) {
    designer = initDesigner($("threeCanvas"));
    $("shapeSelect").addEventListener("change", updateShape);
    $("shapeColor").addEventListener("input", updateShape);
  }
}
function updateShape() {
  designer?.setShape($("shapeSelect").value, $("shapeColor").value);
}
function persist() {
  localStorage.setItem("ideaGenesisSaved", JSON.stringify(saved));
  $("savedCount").textContent = saved.length;
}
function renderCards(items, target, allowSave) {
  target.innerHTML = "";
  if (!items.length) {
    target.innerHTML = '<div class="empty">No inventions here yet. Create your first concept to get started.</div>';
    return;
  }
  items.forEach(item => {
    const card = document.createElement("article");
    card.className = "concept-card";
    const title = document.createElement("h3");
    title.textContent = item.title || "Untitled concept";
    const desc = document.createElement("p");
    desc.textContent = item.description || "";
    const actions = document.createElement("div");
    actions.className = "card-actions";
    const saveBtn = document.createElement("button");
    saveBtn.className = "secondary";
    saveBtn.textContent = allowSave ? "Save invention" : "Remove";
    saveBtn.addEventListener("click", () => {
      if (allowSave) {
        if (!saved.some(x => x.id === item.id)) {
          saved.unshift({ ...item, savedAt: new Date().toISOString() });
          persist(); toast("Invention saved.");
        } else toast("Already saved.");
      } else {
        saved = saved.filter(x => x.id !== item.id);
        persist(); renderSaved(); toast("Removed from saved inventions.");
      }
    });
    const patentBtn = document.createElement("button");
    patentBtn.className = "secondary";
    patentBtn.textContent = "Research similar";
    patentBtn.addEventListener("click", () => {
      $("patentQuery").value = item.title;
      showView("research");
    });
    actions.append(saveBtn, patentBtn);
    card.append(title, desc, actions);
    target.appendChild(card);
  });
}
function renderSaved() {
  renderCards(saved, $("savedList"), false);
}
async function checkStatus() {
  try {
    const response = await fetch("/api/status");
    const data = await response.json();
    $("apiStatus").textContent = data.aiConfigured ? "AI key configured" : "AI key not added yet";
  } catch {
    $("apiStatus").textContent = "Backend not connected";
  }
}

document.querySelectorAll("[data-view]").forEach(btn => btn.addEventListener("click", () => showView(btn.dataset.view)));
document.querySelectorAll("[data-go]").forEach(btn => btn.addEventListener("click", () => showView(btn.dataset.go)));
$("topCreate").addEventListener("click", () => showView("create"));
$("heroCreate").addEventListener("click", () => showView("create"));
$("generateBtn").addEventListener("click", async () => {
  const idea = $("ideaInput").value.trim();
  if (idea.length < 8) return toast("Please describe your idea in at least 8 characters.");
  const btn = $("generateBtn");
  btn.disabled = true; btn.textContent = "Generating concepts…";
  $("results").innerHTML = '<div class="empty">AI is thinking. Please wait…</div>';
  try {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        idea,
        category: $("category").value,
        complexity: $("complexity").value,
        language: $("language").value
      })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not generate ideas.");
    renderCards(data.inventions || [], $("results"), true);
  } catch (error) {
    $("results").innerHTML = "";
    const message = document.createElement("div");
    message.className = "empty";
    message.textContent = error.message + " Make sure the backend is deployed and the API key is set in its private environment variables.";
    $("results").appendChild(message);
  } finally {
    btn.disabled = false; btn.textContent = "✦ Generate with AI";
  }
});
$("patentBtn").addEventListener("click", async () => {
  const q = $("patentQuery").value.trim();
  if (!q) return toast("Enter an invention name or keywords.");
  try {
    const response = await fetch(`/api/patents?q=${encodeURIComponent(q)}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Search could not be prepared.");
    $("patentResult").innerHTML = "";
    const p = document.createElement("p");
    p.textContent = data.note;
    const a = document.createElement("a");
    a.href = data.searchUrl; a.target = "_blank"; a.rel = "noopener noreferrer";
    a.textContent = "Open Google Patents results ↗";
    $("patentResult").append(p, a);
  } catch (error) {
    $("patentResult").textContent = error.message;
  }
});
$("reset3d").addEventListener("click", () => designer?.reset());

persist();
checkStatus();
