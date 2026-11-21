# Vitam's — Eau minérale naturelle

Site vitrine statique (HTML/CSS/JS, sans framework ni build), animé avec GSAP + ScrollTrigger + Lenis (fichiers locaux dans `assets/vendor/`).

Déploiement : Cloudflare Pages, sans commande de build, dossier de sortie `/`.

## Modifier le site
- **Numéro WhatsApp** : `WA_NUMBER` en haut de `assets/js/vitams.js`.
- **Composition minérale** : bloc `id="mineral"` dans `index.html` (remplir les valeurs, retirer `hidden`).
- **Autres formats** (pack, bonbonne…) : dupliquer un bloc `<article class="format">`.
- **Points de vente** : ajouter des `<li>` dans `id="pos-list"` ; la liste s'affiche toute seule.

Réalisé par ROUGATECH.
