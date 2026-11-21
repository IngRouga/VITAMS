# Vitam's — Eau minérale naturelle

Site vitrine statique (HTML/CSS/JS, sans framework ni build).
Version 3D (branche `refonte-3d`) : bouteilles Vitam's en temps réel avec Three.js (fichier local `assets/vendor/three.module.min.js`), carrousel 0,5 L / 1,5 L, histoire de l'étiquette pilotée par le défilement, manifeste « Le plein de vie ! » et gamme finale. Design inspiré de MotionSites « Soda Bottles ».

Déploiement : Cloudflare Pages, sans commande de build, dossier de sortie `/`.

## Fichiers
- `index.html` — contenu de la page.
- `assets/js/scene.js` — scène 3D (bouteilles, étiquettes, défilement).
- `assets/js/site.js` — WhatsApp, formats, demande revendeur, menu.
- `assets/css/v3d.css` — styles.

## Modifier le site
- **Numéro WhatsApp** : `WA_NUMBER` en haut de `assets/js/site.js`.
- **Textes de l'histoire (La source, Composition, Traçable)** : tableaux `STEPS` et `ROWS` en haut de `assets/js/scene.js`.
- **Autres formats** : dupliquer un bloc `<article class="format">` dans `index.html`.

Réalisé par ROUGATECH.
