# Personal Portfolio — Jekyll + GitHub Pages

A modern dark-mode portfolio for an ML researcher, built with Jekyll.

---

## ⚡ Quick Deploy (5 minutes)

### 1. Create the repo

On GitHub, create a **new public repo** named exactly:

```
yourusername.github.io
```

Replace `yourusername` with your actual GitHub username. The repo name matters — GitHub Pages serves it automatically at `https://yourusername.github.io`.

### 2. Push this folder to that repo

```bash
cd portfolio
git init
git add .
git commit -m "initial site"
git branch -M main
git remote add origin https://github.com/yourusername/yourusername.github.io.git
git push -u origin main
```

### 3. Enable GitHub Pages

In the repo on GitHub → **Settings → Pages**:
- Source: **Deploy from a branch**
- Branch: **main** / folder: **/ (root)**
- Save

Wait ~1 minute. Your site is live at `https://yourusername.github.io`.

---

## 🛠 Local Development

If you want to preview locally before pushing:

```bash
# Install Ruby + Jekyll (macOS)
brew install ruby
gem install bundler jekyll

cd portfolio
bundle install
bundle exec jekyll serve

# → visit http://localhost:4000
```

---

## ✏️ What to Edit

### Before deploying, edit these:

**`_config.yml`** — your name, email, social handles, site URL

```yaml
title: "Your Name"
author: "Your Name"
email: "you@nyu.edu"
url: "https://yourusername.github.io"
github_username: "yourusername"
linkedin_username: "yourusername"
```

**`index.html`** — the hero copy, about section, bio paragraphs

Search for `[your prior work` and other placeholder text and replace.

**`projects/*.md`** — replace the three example projects with your real ones

Each project file has this structure:

```markdown
---
title: "Project Title"
tagline: "One-line description that shows on the homepage."
date: 2025-11-15
status: "in progress"   # or "completed"
order: 1                # controls homepage order (lower = higher)
tags: ["interpretability", "LLMs"]
github: "https://github.com/you/repo"
paper: ""               # optional
demo: ""                # optional
---

## Motivation

Markdown content here...
```

Add new projects by creating new `.md` files in `projects/`.

---

## 🎨 Customizing the Look

**Colors** live in `assets/css/main.scss` under `:root` — the accent is currently a mint green (`#7bff9f`). Change `--accent` and `--accent-glow` to shift the entire palette.

**Fonts** are loaded from Google Fonts at the top of `main.scss`. Current pairing:
- **Inter Tight** — body/UI
- **Instrument Serif** — italic accents and large serif headings
- **JetBrains Mono** — code, labels, metadata

**Animations** are in `assets/js/main.js` — scroll-triggered reveals and staggered project cards.

---

## 📁 File Structure

```
portfolio/
├── _config.yml              ← site metadata (EDIT THIS)
├── Gemfile                  ← Ruby dependencies
├── index.html               ← homepage
├── _layouts/
│   ├── default.html         ← base HTML wrapper
│   └── project.html         ← project page template
├── projects/                ← individual project writeups (EDIT THESE)
│   ├── attention-dilution.md
│   ├── cot-faithfulness.md
│   └── jailbreak-benchmark.md
├── assets/
│   ├── css/main.scss        ← all styles
│   └── js/main.js           ← scroll animations
└── README.md                ← this file
```

---

## 💡 Tips

- **Writeup quality matters more than project count.** Three strong projects beat ten shallow ones. Each writeup should answer: *what question*, *what approach*, *what found*, *what next*.
- **Link your GitHub repos.** Recruiters and researchers actually click these.
- **Keep the hero copy honest.** "Working on X" reads better than "expert in X" for a student.
- **Add new projects as you ship them** — the site scales automatically.

Good luck on the research grind. 🚀
