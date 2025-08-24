# DotDashDot

Translate and learn Morse in a fun retro way.

## Quick Usage Note
- Translator: Type either plain English or Morse (.-). Direction auto-detects. Output panels show English words and Morse groups.
- Play: Adjust WPM (speed) and Hz (pitch). Change Tone for waveform character (Pure, Square, Chime, etc.). Playback restarts when you tweak while playing.
- Key Input (Keyer): Hold the “Hold” button (or space bar) – short press = dot, long press = dash. Letter Space inserts a gap, Word Space inserts " / ". Press “To Input” to append to the main translator.
- Key Sounds: Set “Key:” style; choose “Mute” to silence key press clicks.
- Tone: Select waveform timbre for Morse playback beeps independently of key click sounds.
- History: Last 10 translations stored locally; expand an entry to replay or save. Export All downloads a text file; Clear wipes history.
- Lessons: Click a character tile to insert it. Good for learning mapping.
- Tips: Small FAQ for reminders.
- Theme & Font: Top-right A buttons change global font size. Hue sliders recolor background and accent. Reset arrow restores defaults.
- Accessibility: High contrast and larger font still readable; interaction controls have minimum touch sizes.

## Features (v1)
- Text ↔ Morse (auto-detect)
- On-screen keyer + space-bar keying
- Playback with adjustable WPM + pitch
- WAV download
- Mic recording (decode stub for future)
- Audio file upload (decode stub)
- History (10 entries, export)
- Lessons (A–Z, 0–9, punctuation)
- Accessibility: dark/light, high contrast, large font, flash, vibration

## Run (React / Vite)
```bash
npm install
npm run dev      # start dev server
npm run build    # production build (dist/)
npm run preview  # preview built output
```

### IMPORTANT: Start the Dev Server
Do NOT open index.html directly (you will see raw JSX errors).  
Run:
```bash
npm install
npm run dev
```
Then open the URL Vite prints (e.g. http://localhost:5173). This applies JSX transforms for .js files.

### Production Preview
npm run preview now auto-builds (prepreview hook).  
Manual sequence (older behavior):
```bash
npm run build
npm run preview
```
If you see "The directory 'dist' does not exist", run the build first or just use npm run preview after this update.

## Plain (No Vite) Option
If you prefer without bundler, you can:
1. Remove vite + @vitejs/plugin-react devDependencies.
2. Replace index.html body with CDN React:
```html
<script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
<script type="module" src="./src/main.js"></script>
```
(Keep modern browsers; ES module import works.)

## Removed Legacy
Legacy vanilla files (app.js, lessons.js) are deprecated and now empty. All functionality lives in /src React components.

### React File Extensions
Components now use .jsx for reliability in production builds (still plain JavaScript, no TypeScript).

### JS Only
No TypeScript. All logic remains JavaScript (.js/.jsx).

## Git Repo Location
Run all git commands inside this folder:
C:\Users\kasar\Projects for GIT\Morse_Code
(That folder contains package.json, src/, index.html.)
Do NOT run git init in the parent "Projects for GIT" if you keep multiple projects there.

### Quick Start

```bash
cd "C:\Users\kasar\Projects for GIT\Morse_Code"
git init
git add .
git commit -m "chore: init"
git branch -M main
git remote add origin https://github.com/USERNAME/dotdashdot.git
git push -u origin main
```

## Git: Initialize & Push

```bash
# 1. Init (inside project folder)
git init

# 2. (Optional) main branch rename
git branch -M main

# 3. Create a .gitignore (if you have build output)
echo "dist/
node_modules/
*.log
.vite
.DS_Store" > .gitignore

# 4. Stage & first commit
git add .
git commit -m "chore: initial project import"

# 5. Create empty repo on GitHub (no README) then add remote
git remote add origin https://github.com/USERNAME/dotdashdot.git

# 6. Push
git push -u origin main
```

### Clean Up After Adding .gitignore (Recommended)
If node_modules or other generated files were committed earlier:
```bash
# add the new ignore file
git add .gitignore
# untrack everything (keeps working copy)
git rm -r --cached .
# re-stage only what is now tracked (respects .gitignore)
git add .
git commit -m "chore: apply .gitignore and untrack ignored files"
git push
```

### Full Re-init (Lose Old History)
Only if you want a brand new history:
```bash
# from project root
rmdir /s /q .git        # or: rm -rf .git (on bash)
git init
git add .
git commit -m "chore: fresh init"
git branch -M main
git remote add origin https://github.com/USERNAME/dotdashdot.git
git push -u origin main --force
```

### Repo Cleanup
Only .jsx React files are used now. You can delete the duplicate legacy .js component files and root app.js / lessons.js:
```
git rm src/main.js src/App.js src/components/*.js app.js lessons.js README_STRUCTURE.md
```
They are also listed in .gitignore to avoid re-adding.

### Line Ending Warnings (Windows)
If you saw many warnings like "LF will be replaced by CRLF": they appeared because node_modules was tracked. After adding .gitignore and removing node_modules from Git (git rm -r --cached node_modules) the warnings stop. A .gitattributes file (text=auto eol=lf) keeps consistent LF endings in the repo.

### Line Ending Normalization (LF)
If you see warnings "CRLF will be replaced by LF":
```
git add --renormalize .
git commit -m "chore: normalize line endings"
```
If node_modules was previously tracked:
```
git rm -r --cached node_modules
git commit -m "chore: remove tracked node_modules"
```

### Later updates

```bash
git add -u
git commit -m "feat: describe change"
git push
```

### Pull changes (if collaborating)

```bash
git pull --rebase origin main
```

### Tag a release

```bash
git tag -a v1.0.0 -m "First release"
git push --tags
```

### Build before deploying (optional)

```bash
npm run build
# dist/ now contains production assets
```

## Troubleshooting
1. Install deps: npm install (re-run if you pulled changes).
2. Start dev: npm run dev then open the shown http://localhost:5173 (default Vite port).
3. Blank page? Open DevTools (F12) Console. Look for [DDD] logs or errors.
4. If root element missing: ensure index.html has <div id="root"></div>.
5. React plugin missing error: verify @vitejs/plugin-react is in devDependencies and vite.config.js includes react().
6. Syntax errors: ensure all component files end with .js and contain valid JSX (plugin handles it).
7. Audio not playing: first user interaction may be required (click page); see console for any [DDD] AudioContext errors.
8. Cache issues: stop dev server, delete node_modules + package-lock.json (or pnpm-lock.yaml/yarn.lock), run npm install again.
9. Node version: use Node 18+ (node -v).
10. Hard refresh: Ctrl+Shift+R (clears cached module graph).

Still failing? Copy the first red error line from DevTools and investigate its file + line.

## Roadmap
- Audio decode (signal processing)
- Multi-language (Telugu/Hindi/Spanish)
- Progressive Web App
- Cloud sync (MongoDB)

## License
MIT
