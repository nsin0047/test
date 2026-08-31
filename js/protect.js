/**
 * protect.js — casual-deterrent layer only.
 *
 * IMPORTANT (read this before relying on it): nothing that renders in a
 * browser can be made 100% un-extractable — a sufficiently motivated person
 * can always read GPU memory or re-derive geometry from what's on screen.
 * What this file (plus the XOR-obfuscated, decimated asset in main.js) does
 * is raise the bar past "right click → Save As" and "open the Network tab
 * and grab a .glb": there is no plain 3D file sitting on the server, the
 * bytes on the wire are not a valid mesh until decoded in memory, and casual
 * shortcuts are disabled. Treat this as a deterrent, not a lock.
 */

document.addEventListener('contextmenu', (e) => e.preventDefault());

document.addEventListener('keydown', (e) => {
  const k = e.key?.toLowerCase();
  const blocked =
    e.key === 'F12' ||
    (e.ctrlKey && e.shiftKey && (k === 'i' || k === 'j' || k === 'c')) ||
    (e.metaKey && e.altKey && (k === 'i' || k === 'j' || k === 'c')) ||
    (e.ctrlKey && k === 'u') ||
    (e.metaKey && k === 'u');
  if (blocked) e.preventDefault();
});

document.addEventListener('dragstart', (e) => {
  if (e.target.tagName === 'CANVAS' || e.target.tagName === 'IMG') e.preventDefault();
});

console.log(
  '%cSIXHOLD-1',
  'font-family:monospace;font-size:14px;color:#CBFF4D;',
  '\nThis showroom renders a decimated, obfuscated preview mesh in memory.\nThe source model is not served as a downloadable file.'
);
