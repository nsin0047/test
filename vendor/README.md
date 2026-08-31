# SIXHOLD — product showcase site

A single-page, Three.js–powered product site in the style of oryzo.ai, built
around your `6_Holder_Total_Assembly.STL`. No build step — plain HTML/CSS/JS
modules loaded from a CDN, so it deploys straight to GitHub Pages or Netlify.

## What's in here

```
index.html          the whole page (hero, features, tiers, reviews, model card)
style.css            design system (dark, "signal green" + copper accents)
js/main.js            three.js scene: loads + displays the model, HUD, reveals
js/protect.js         casual anti-ripping deterrents (see below)
assets/holder.dat     your model — decimated + byte-obfuscated (NOT a plain .glb)
netlify.toml          headers/caching config for Netlify
.nojekyll              stops GitHub Pages mangling the /assets folder
CNAME.example          rename to CNAME and put your domain in it, for GitHub Pages
```

## About the model protection — read this first

You asked that people not be able to just rip the STL off the site. Being
upfront about what's actually achievable:

**Nothing rendered in a browser can be made 100% uncopyable.** WebGL has to
hand real geometry to the GPU, so anyone determined enough (devtools memory
snapshot, GPU capture tools, or just very patient screen measuring) can
eventually reconstruct *something*. Anyone offering a "can't be copied"
Three.js viewer isn't being straight with you.

What this template does instead — raising the bar well past a casual grab:

1. **The source STL is never uploaded anywhere.** Only a processed derivative
   ships to the browser.
2. **The mesh is decimated** (~65k → ~18k faces here) before export. It's
   visually faithful at showcase distance but isn't your print-precision
   file — an extracted copy won't slice/print identically to the original.
3. **It's not served as a `.glb`/`.stl`/`.obj`.** It's stored as
   `assets/holder.dat`, every byte XOR-obfuscated with a key baked into
   `main.js`. There's no file on the server that opens in a slicer, a 3D
   viewer, or Blender by double-clicking it. It only becomes a valid mesh
   after being fetched and decoded in memory at runtime.
4. **Right-click, F12, Ctrl/Cmd+Shift+I/J/C, and Ctrl/Cmd+U are blocked**
   (`js/protect.js`) to stop the one-click paths. This is a speed bump for
   casual visitors, not a barrier to anyone who opens devtools a different
   way (which is trivial) — treat it as etiquette enforcement, not security.
5. **No download link, "view source model," or file listing exists anywhere
   on the page.**

If you need materially stronger protection later (e.g. this becomes a real
commercial product people are trying hard to clone), the next steps up are:
watermarking geometry with a hidden identifying mark, server-side rendering
to a video/image stream instead of shipping geometry to the client at all,
or licensing/legal deterrents (a visible © notice + terms of use). Those are
bigger changes than a static site can do — happy to help build any of them
if it becomes relevant.

## Regenerating `holder.dat` from a new STL

If you swap in an updated STL later:

```bash
pip install trimesh fast-simplification --break-system-packages

python3 - <<'PY'
import trimesh

m = trimesh.load('your_new_file.STL')
m.apply_translation(-m.bounding_box.centroid)

target_faces = int(len(m.faces) * 0.28)   # tune the 0.28 for more/less detail
simplified = m.simplify_quadric_decimation(face_count=target_faces)
simplified.export('model_simplified.glb')
PY

python3 - <<'PY'
key = bytes([0x4B, 0x9E, 0x2A, 0x77, 0x1D, 0x63, 0xF0, 0x8C])
with open('model_simplified.glb', 'rb') as f:
    data = f.read()
out = bytes(b ^ key[i % len(key)] for i, b in enumerate(data))
with open('assets/holder.dat', 'wb') as f:
    f.write(out)
PY
```

If you ever change `key` here, update the matching `XOR_KEY` array at the top
of `js/main.js` to the same values.

## Deploying

### Option A — GitHub Pages (free, works with your own domain)

1. Create a new repo on GitHub and push this folder:
   ```bash
   cd sixhold
   git init
   git add .
   git commit -m "Initial site"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```
2. On GitHub: **Settings → Pages → Build and deployment → Source: Deploy from
   a branch → Branch: `main`, folder: `/ (root)`**. Save.
3. Your site is live at `https://YOUR_USERNAME.github.io/YOUR_REPO/` within a
   minute or two.
4. **To use your own domain:**
   - Rename `CNAME.example` to `CNAME` and put just your domain inside it,
     e.g. `sixhold.com` (no `https://`, no trailing slash). Commit and push.
   - At your domain registrar, add DNS records pointing at GitHub Pages:
     - For an apex domain (`sixhold.com`): four `A` records pointing to
       `185.199.108.153`, `185.199.109.153`, `185.199.110.153`,
       `185.199.111.153`.
     - For a subdomain (`www.sixhold.com`): a `CNAME` record pointing to
       `YOUR_USERNAME.github.io`.
   - Back in **Settings → Pages**, enter the domain under "Custom domain" and
     wait for the DNS check to go green, then tick **Enforce HTTPS**.
   - DNS can take anywhere from a few minutes to ~24 hours to propagate.

### Option B — Netlify (free, arguably the easier custom-domain flow)

1. Push the same repo to GitHub as above (Netlify deploys from git).
2. Go to [app.netlify.com](https://app.netlify.com) → **Add new site → Import
   an existing project** → pick your GitHub repo.
3. Build settings: leave **Build command** empty and **Publish directory** as
   `.` (this is a static site, nothing to build) — `netlify.toml` in this repo
   already encodes that, so Netlify should pick it up automatically.
4. Deploy. You'll get a `random-name-123.netlify.app` URL immediately.
5. **To use your own domain:** Site settings → **Domain management → Add a
   domain** → enter your domain. Netlify will show you either:
   - DNS records to add at your existing registrar, or
   - the option to point your domain's nameservers at Netlify DNS (simplest —
     Netlify then manages everything, including automatic HTTPS).
6. HTTPS certificates are provisioned automatically once DNS resolves.

Either option works fine for a static Three.js site like this one — GitHub
Pages is marginally simpler if you're already comfortable with GitHub;
Netlify's domain UI and preview-deploy-per-branch workflow is a little nicer
if you'll be iterating on the site often.

## Local preview

Browsers block `fetch()` on `file://` pages, so you need a tiny local server:

```bash
cd sixhold
python3 -m http.server 8080
# open http://localhost:8080
```

## Customizing

- **Copy/branding**: all text lives directly in `index.html` — product name,
  tagline, tier names/slot counts, reviews, model-card copy are all plain
  HTML, no CMS.
- **Colors**: edit the CSS custom properties at the top of `style.css`
  (`--signal`, `--copper`, `--ink`, etc).
- **Camera framing / lighting**: `js/main.js`, top of the file — `camera`,
  `key`/`rim`/`fill` lights, and the `controls.min/maxPolarAngle` clamp how
  far people can orbit.
