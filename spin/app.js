const COLORS = ["#FF4D8D", "#FFE14A", "#5EE8A4", "#5B8CFF", "#FF7A2F", "#C9A7FF", "#7EE0F2", "#FF8FB3"];
const STORAGE = "jiunile-v1";

const PRESETS = {
  people: {
    party: ["阿信", "阿满", "阿北", "阿南", "小周", "小陈"],
    class: ["一号", "二号", "三号", "四号", "五号", "六号"],
  },
  question: {
    party: [
      "最近为啥熬夜？",
      "明天放假做什么？",
      "讲一个尴尬瞬间",
      "你的隐藏技能？",
      "三个词形容今天",
      "最近循环哪首歌？",
      "最想删的朋友圈",
      "介绍你的锁屏",
      "想变成谁一天？",
      "最近反复在做的小事",
    ],
    class: [
      "一句话总结重点",
      "举一个生活里的例子",
      "还有什么没听懂？",
      "如果让你出一道题？",
      "今天最有用的观点",
      "讲给旁边的同学听",
      "和上次学的有何不同",
      "还能怎么改进？",
      "三个关键词记这部分",
      "举一个实际使用场景",
    ],
  },
  punish: {
    party: [
      "喝一口饮料",
      "学一种动物叫",
      "即兴表演十秒",
      "给左边的人一句夸夸",
      "用方言说一句台词",
      "唱副歌十秒",
      "保持一个动作到下一轮",
      "给全场比一个小心心",
    ],
    class: [
      "站起来回答下一题",
      "用三句话复述刚才所讲",
      "给全班讲一个知识点",
      "在黑板上画一个简笔画",
      "领读一段内容",
      "做十个深蹲",
      "分享一个记忆口诀",
      "给同桌讲解刚才的内容",
    ],
  },
};

const TITLES = { people: "抽人", question: "抽题", punish: "抽惩罚" };
const HINTS = {
  people: { empty: "先在名单里加上名字，再按下面的按钮。", ready: "名单转起来，转到谁就是谁。" },
  question: { empty: "先加几道题，再转。", ready: "转到哪道就是哪道，适合破冰或提问。" },
  punish: { empty: "先加几条惩罚，再转。", ready: "轻松小惩罚，别太为难人。" },
};
const NOTES = {
  people: "把名字加上就能抽。也可以改成学号、外号。",
  question: "默认题库可以直接用，也可以改成你们自己的题。",
  punish: "默认都是轻度的，不合适的删掉，再写你们能接受的。",
};

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const state = {
  scene: "party",
  mode: "people",
  lists: structuredClone(PRESETS),
  spinning: false,
  angle: 0,
  lastIndex: -1,
};

try {
  const saved = JSON.parse(localStorage.getItem(STORAGE) || "null");
  if (saved?.lists) {
    state.lists = saved.lists;
    if (saved.scene) state.scene = saved.scene;
    if (saved.mode) state.mode = saved.mode;
  }
} catch {}

function save() {
  localStorage.setItem(STORAGE, JSON.stringify({
    lists: state.lists,
    scene: state.scene,
    mode: state.mode,
  }));
}

function items() {
  return state.lists[state.mode][state.scene];
}

function setItems(next) {
  state.lists[state.mode][state.scene] = next;
  save();
}

const canvas = $("#wheel");
const ctx = canvas.getContext("2d");

function draw(highlight = -1) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const size = 640;
  if (canvas.width !== size * dpr) {
    canvas.width = size * dpr;
    canvas.height = size * dpr;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const r = size / 2;
  ctx.clearRect(0, 0, size, size);
  ctx.save();
  ctx.translate(r, r);
  ctx.rotate(state.angle);

  const list = items();
  const n = Math.max(list.length, 1);
  const slice = (Math.PI * 2) / n;

  if (!list.length) {
    ctx.beginPath();
    ctx.arc(0, 0, r - 6, 0, Math.PI * 2);
    ctx.fillStyle = "#fff8ea";
    ctx.fill();
    ctx.lineWidth = 10;
    ctx.strokeStyle = "#17120C";
    ctx.stroke();
    ctx.rotate(-state.angle);
    ctx.fillStyle = "#17120C";
    ctx.font = "28px Smiley, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("先加名单", 0, 0);
    ctx.restore();
    return;
  }

  for (let i = 0; i < n; i++) {
    const a0 = i * slice - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, r - 6, a0, a0 + slice);
    ctx.closePath();
    ctx.fillStyle = COLORS[i % COLORS.length];
    ctx.fill();
    if (i === highlight) {
      ctx.fillStyle = "rgba(255,255,255,0.22)";
      ctx.fill();
    }
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#17120C";
    ctx.stroke();

    ctx.save();
    ctx.rotate(a0 + slice / 2);
    const flipped = Math.cos(state.angle + a0 + slice / 2) < 0;
    if (flipped) ctx.rotate(Math.PI);
    ctx.textAlign = flipped ? "left" : "right";
    ctx.textBaseline = "middle";
    const fill = COLORS[i % COLORS.length];
    ctx.fillStyle = (fill === "#FFE14A" || fill === "#5EE8A4") ? "#17120C" : "#fff";
    const text = list[i];
    const maxW = r - 58;
    let fontSize = text.length > 10 ? 18 : text.length > 6 ? 22 : 26;
    ctx.font = `700 ${fontSize}px "PingFang SC", "Hiragino Sans GB", sans-serif`;
    let label = text;
    if (ctx.measureText(label).width > maxW) {
      while (label.length > 1 && ctx.measureText(label + "…").width > maxW) {
        label = label.slice(0, -1);
      }
      label += "…";
    }
    ctx.fillText(label, flipped ? -(r - 22) : (r - 22), 0);
    ctx.restore();
  }

  ctx.beginPath();
  ctx.arc(0, 0, r - 6, 0, Math.PI * 2);
  ctx.lineWidth = 10;
  ctx.strokeStyle = "#17120C";
  ctx.stroke();
  ctx.restore();
}

function currentIndex() {
  const list = items();
  if (!list.length) return -1;
  const n = list.length;
  const slice = (Math.PI * 2) / n;
  let a = state.angle % (Math.PI * 2);
  if (a < 0) a += Math.PI * 2;
  // Pointer is at the top (-90deg). Segment i starts at i*slice - 90deg in unrotated space.
  // After rotation by `angle`, the segment under the pointer is...
  const pointer = (Math.PI * 2 - a) % (Math.PI * 2);
  return Math.floor(pointer / slice) % n;
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function prefersReduce() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function setHint() {
  const list = items();
  const pack = HINTS[state.mode];
  $("#hint").textContent = list.length >= 2 ? pack.ready : (list.length ? "至少再加一项，才能转起来。" : pack.empty);
}

function syncTabs() {
  $$(".scene button").forEach((b) => {
    const on = b.dataset.scene === state.scene;
    b.classList.toggle("is-on", on);
    b.setAttribute("aria-selected", on);
  });
  $$(".modes button").forEach((b) => {
    const on = b.dataset.mode === state.mode;
    b.classList.toggle("is-on", on);
    b.setAttribute("aria-selected", on);
  });
  const btn = $("#spin");
  btn.disabled = items().length < 2 || state.spinning;
}

function renderList() {
  const list = items();
  $("#sheet-title").textContent = "编辑" + TITLES[state.mode];
  $("#sheet-note").textContent = NOTES[state.mode];
  $("#add-input").placeholder = state.mode === "people" ? "输入名字，回车添加" : "输入内容，回车添加";
  const ul = $("#item-list");
  ul.innerHTML = "";
  list.forEach((text, i) => {
    const li = document.createElement("li");
    const b = document.createElement("b");
    b.textContent = text;
    const del = document.createElement("button");
    del.type = "button";
    del.setAttribute("aria-label", "删除");
    del.textContent = "×";
    del.addEventListener("click", () => {
      const next = items().filter((_, j) => j !== i);
      setItems(next);
      renderList();
      draw();
      setHint();
      syncTabs();
    });
    li.append(b, del);
    ul.append(li);
  });
}

function openSheet() {
  $("#sheet").hidden = false;
  renderList();
  setTimeout(() => $("#add-input").focus(), 200);
}
function closeSheet() {
  $("#sheet").hidden = true;
}

function showResult(text) {
  $("#result-kicker").textContent = TITLES[state.mode] + "结果";
  $("#result-label").textContent = text;
  $("#result").hidden = false;
}
function closeResult() {
  $("#result").hidden = true;
}

function spin() {
  const list = items();
  if (list.length < 2 || state.spinning) return;
  closeResult();
  const n = list.length;
  const pick = Math.floor(Math.random() * n);
  const slice = (Math.PI * 2) / n;
  // Want segment `pick` centered under the top pointer when done.
  const targetMod = (Math.PI * 2 - (pick + 0.5) * slice);
  const turns = 5 + Math.floor(Math.random() * 3);
  let current = state.angle % (Math.PI * 2);
  if (current < 0) current += Math.PI * 2;
  let delta = (targetMod - current + Math.PI * 2) % (Math.PI * 2);
  const target = state.angle + turns * Math.PI * 2 + delta;

  if (prefersReduce()) {
    state.angle = target;
    state.lastIndex = pick;
    draw(pick);
    showResult(list[pick]);
    return;
  }

  state.spinning = true;
  syncTabs();
  const start = state.angle;
  const dur = 3800 + Math.random() * 400;
  const t0 = performance.now();

  function frame(now) {
    const t = Math.min(1, (now - t0) / dur);
    state.angle = start + (target - start) * easeOutCubic(t);
    draw(t > 0.92 ? pick : -1);
    if (t < 1) {
      requestAnimationFrame(frame);
    } else {
      state.angle = target;
      state.lastIndex = pick;
      state.spinning = false;
      draw(pick);
      syncTabs();
      showResult(list[pick]);
    }
  }
  requestAnimationFrame(frame);
}

$$(".scene button").forEach((b) => {
  b.addEventListener("click", () => {
    if (state.spinning) return;
    state.scene = b.dataset.scene;
    save();
    syncTabs();
    setHint();
    draw();
    if (!$("#sheet").hidden) renderList();
  });
});

$$(".modes button").forEach((b) => {
  b.addEventListener("click", () => {
    if (state.spinning) return;
    state.mode = b.dataset.mode;
    save();
    syncTabs();
    setHint();
    draw();
    if (!$("#sheet").hidden) renderList();
  });
});

$("#spin").addEventListener("click", spin);
$("#spin-again").addEventListener("click", spin);
$("#open-edit").addEventListener("click", openSheet);
$$("[data-close]").forEach((b) => b.addEventListener("click", closeSheet));
$$("[data-close-result]").forEach((b) => b.addEventListener("click", closeResult));

$("#add-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const input = $("#add-input");
  const text = input.value.trim();
  if (!text) return;
  if (items().includes(text)) {
    input.value = "";
    return;
  }
  setItems([...items(), text]);
  input.value = "";
  renderList();
  draw();
  setHint();
  syncTabs();
});

$("#reset-list").addEventListener("click", () => {
  setItems([...PRESETS[state.mode][state.scene]]);
  renderList();
  draw();
  setHint();
  syncTabs();
});

$("#clear-list").addEventListener("click", () => {
  setItems([]);
  renderList();
  draw();
  setHint();
  syncTabs();
});

window.addEventListener("resize", () => draw(state.lastIndex));

syncTabs();
setHint();
draw();
