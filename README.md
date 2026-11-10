# Hublead Video

Un plugin Claude Code pour faire, en quelques minutes, une vidéo produit Hublead (16:9, 30 à 50 s) qui présente
une feature avec la vraie UI : le vrai dashboard rendu depuis ses propres composants, les vraies captures de
l'extension sur LinkedIn, la DA Hublead (dégradé violet, grain, Inter, wordmark), une musique libre de droits et
des effets sonores. Sortie : un MP4 1080p prêt à poster.

Pour tout le monde chez Hublead (marketing, sales, CS) : pas besoin de savoir utiliser un terminal, Claude
installe et lance tout.

## Installer (une fois)

Dans Claude Code :

```
/plugin marketplace add hublead-io/hublead-video
/plugin install hublead-video@hublead
```

Il faut Node.js 20+ sur le Mac (https://nodejs.org, bouton LTS). Claude vérifie et le dit s'il manque.

## Faire une vidéo

Demander simplement, par exemple :

> Fais-moi une vidéo de 45 s pour présenter les Job changes, pour LinkedIn.

Claude pose 4 ou 5 questions (le message à retenir, les étapes à montrer, le CRM, la durée, l'ambiance), crée le
projet dans `~/Hublead Videos/<nom>/`, choisit une musique, monte le film, vérifie les images puis rend le MP4.
Ensuite on itère : « plus lent sur le tableau », « remplace Slack par l'email », etc.

## Ce qu'il y a dedans

```
skills/hublead-video/
  SKILL.md               le déroulé que suit Claude
  references/            film.json, dashboard live, captures, règles de texte
  scripts/               doctor, new-film, sfx, render, music (cinetic)
  template/              le projet Remotion copié pour chaque film
    src/Film.tsx         le moteur : scènes, caméra 3D, curseur, popups, canaux, sons
    src/hublead-app/     le vrai dashboard compilé (composants admin-ui + ui-kit)
    public/captures/     captures prêtes (extension LinkedIn, dialogue Watch, HubSpot, Slack, email, Salesforce)
studio/                  pour les devs : recompiler le dashboard live (voir studio/README.md)
```

## Licences

Code sous MIT. Une partie (musique, approche du moteur) vient de [cinetic](https://github.com/Leonxlnx/cinetic)
(MIT, Leonxlnx), voir `LICENSE`. Les assets de marque Hublead, le bundle du dashboard et les captures restent la
propriété de Hublead. Les sons Mixkit sont téléchargés par chaque film (leur licence interdit de les
redistribuer seuls), les musiques aussi.
