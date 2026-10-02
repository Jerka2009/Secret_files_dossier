const d = document.getElementsByClassName("panel-btn");
const filesList = document.getElementById('files_list');
const entity_name = document.getElementById("e_name");
const entity_desc = document.getElementById("e_desc");
const entity_icon = document.getElementById("e_ico");
const tag_class = document.getElementById("class");
const tag_date = document.getElementById("date");
const tag_size = document.getElementById("size");
const tag_other = document.getElementById("other");
const color1 = document.getElementById("color_set1");
const color2 = document.getElementById("color_set2");

const Colors = {
  // SCP classes
  "safe": "#00FF00",
  "euclid": "#FFFF00",
  "keter": "#FF0000",
  "white": "#FFFFFF",
  "blue": "#0000FF",
  "green": "#00FF00",
  "yellow": "#FFFF00",
  "orange": "#FFA500",
  "red": "#FF0000",
  "black": "#000000",
  // Backrooms classes
  "class 0": "#4CAF50",
  "class 1": "#8BC34A",
  "class 2": "#FFC107",
  "class 3": "#FF9800",
  "class 4": "#F44336",
  "class 5": "#B71C1C",
  "class variable": "#9E9E9E",
  "class undetermined": "#607D8B",
};

for (i = 0; i < d.length; i++) {
  d[i].addEventListener('click', (e) => {
    const parent = e.currentTarget.parentElement;
    parent.classList.toggle('open');
  });
}

function getClassColor(cls) {
  const f = cls.toLowerCase();
  return Colors[f] ?? "wheat";
}

const enc = s => encodeURIComponent(s);

async function listDir(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`listDir ${r.status}: ${url}`);
  const doc = new DOMParser().parseFromString(await r.text(), 'text/html');
  return [...doc.querySelectorAll('a')]
    .map(a => a.getAttribute('href'))
    .filter(h => h && !h.startsWith('?') && h !== '../')
    .map(h => decodeURIComponent(h.replace(/\/$/, '').split('/').pop()))
    .filter(Boolean);
}

async function readText(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`readText ${r.status}: ${url}`);
  return (await r.text()).trim();
}

async function loadEntity(dirName) {
  const base = `assets/entities/${enc(dirName)}/`;

  const [name, description] = await Promise.all([
    readText(base + 'name.txt').catch(() => dirName),
    readText(base + 'description.txt').catch(() => ''),
  ]);

  const text = await fetch(base + 'tags.txt').then(r => r.text());
  const tags = text
    .split(/\r?\n/)
    .map(s => s.trim())
    .filter(Boolean);

  let screenshots = [];
  try {
    const files = await listDir(base + 'screenshots/');
    screenshots = files
      .filter(f => /\.(jpe?g|png|webp|gif)$/i.test(f))
      .sort((a, b) => {
        const na = parseInt(a, 10), nb = parseInt(b, 10);
        return (!isNaN(na) && !isNaN(nb)) ? na - nb : a.localeCompare(b);
      })
      .map(f => base + 'screenshots/' + enc(f));
  } catch {}

  return {
    dirName,
    name,
    description,
    icon: base + 'icon.jpg',
    screenshots,
    tags,
  };
}

async function loadCategories() {
  const res = await fetch('assets/categories/index.json');
  const categories = await res.json();

  for (const cat of categories) {
    const txtRes = await fetch(`./assets/categories/${cat.file}`);
    if (!txtRes.ok) {
      console.warn(`Не найден ${cat.file}`);
      continue;
    }
    const text = await txtRes.text();
    console.log(text);

    const items = text
      .split(/\r?\n/)
      .map(s => s.trim())
      .filter(Boolean);
    console.log(items);

    const group = document.createElement('div');
    group.className = 'panel-group open';
    group.id = cat.id;

    const btn = document.createElement('button');
    btn.className = 'panel-btn';
    btn.textContent = `${cat.title} ▾`;
    btn.addEventListener('click', (e) => {
      e.currentTarget.closest('.panel-group').classList.toggle('open');
    });

    const sub = document.createElement('div');
    sub.className = 'sub-buttons';

    for (const name of items) {
      const b = document.createElement('button');
      b.className = 'sub-btn';
      b.textContent = name;
      b.dataset.entity = name;
      sub.appendChild(b);
    }

    group.append(btn, sub);
    filesList.appendChild(group);
  }
}

function showEntity(ent) {
  entity_name.textContent = ent.name;

  entity_icon.src = ent.icon;
  entity_desc.textContent = ent.description;

  tag_class.textContent = 'Class: ' + ent.tags[0].charAt(0).toUpperCase() + ent.tags[0].slice(1);
  tag_date.textContent = 'Last seen: ' + ent.tags[1];
  tag_size.textContent = 'Size: ' + ent.tags[2];
  tag_other.textContent = 'Signs: ' + ent.tags[3];

  const color = getClassColor(ent.tags[0]);
  color1.style = "border-bottom: 2px solid " + color + ";";
  color2.style = "border: 2px solid " + color + ";";


  const gallery = document.getElementById("gallery");
  gallery.replaceChildren();
  if (ent.screenshots.length > 0) {
    for (const src of ent.screenshots) {
       const img = document.createElement('img');
       img.src = src;
       img.loading = 'lazy';
       img.width = "100";
       img.height = "100"
       img.classList.add("img_item");
       gallery.appendChild(img);
    }
  }
}

filesList.addEventListener('click', async (e) => {
  const btn = e.target.closest('.sub-btn');
  if (!btn) return;
  const entity = await loadEntity(btn.dataset.entity);
  showEntity(entity);
});

loadCategories();
