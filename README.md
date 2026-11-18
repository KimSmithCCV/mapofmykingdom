# mapofmykingdom.com

One-page static site for *Map of My Kingdom*, Mary Swander's one-woman play about farm succession. Presented by Peoples Company, commissioned by Practical Farmers of Iowa.

Plain HTML, CSS, and a little JavaScript. No build step, no frameworks.

## Folder structure

```
index.html          The whole page (content, meta tags, schema)
css/styles.css      All styles (colors and fonts are variables at the top)
js/main.js          Mobile menu, background clips, trailer sound, clip carousel
assets/fonts/       Self-hosted Barlow Condensed and Figtree (OFL licenses included)
assets/video/       hero, play-book (silent loops), trailer (with sound), clips/ (six scenes)
assets/captions/    Closed captions (WebVTT) for the trailer and each clip
assets/img/         Photos, posters, clip stills, OG image, grain texture
assets/logos/       Partner logos and site icons
robots.txt          Allows search and AI crawlers
sitemap.xml         Single-page sitemap
site.webmanifest    Icons and theme color
favicon.ico
```

## Run it locally

Open the folder in VS Code and use the Live Server extension, or from a terminal:

```
python -m http.server 8000
```

Then visit http://localhost:8000. (Opening index.html directly works too, but the fonts and videos behave best through a local server. Captions only load through a server.)

## Captions

Every video with speech has a caption file in `assets/captions/` with the same name (`trailer.vtt`, `clip-1.vtt` and so on). They are plain text: a time range, then one or two lines of words. To fix a word, open the file and edit the text; leave the time lines alone.

- Trailer: the page draws these itself, above the controls, with a CC button to turn them off (on by default). They're hidden during the opening narration, which already shows the same words large on screen.
- Clips: the clip player loads the matching file and shows captions by default; viewers can turn them off from the player's menu.
- Speaker names (MARY SWANDER, TERESA OPHEIM, ANGELA) are in the trailer captions because the on-screen name titles are cropped off on the site.

The captions were transcribed on this computer with whisper.cpp and checked against the transcripts in `_reference/transcripts/`. A new clip needs its own `.vtt` file with a matching name.

## Design tokens

| Use | Color |
| --- | --- |
| Background | `#0E141C` |
| Bands | `#162130` |
| Cards | `#213145` |
| Steel (buttons, lines) | `#2C4562` |
| Spotlight (underlines, borders) | `#6E8DB3` |
| Mist (labels) | `#A9BCD4` |
| Ivory (text) | `#F2EEE6` |

Headings: Barlow Condensed ExtraBold Italic. Body: Figtree 400, 500, 600.

## Placeholders to fill before launch

Search the code for `TODO` and `[` to find each one.

- Show time, venue address, ticket price, and ticket link (show band)
- Captions for the six clips (optional, recommended for accessibility)
- Social profile URLs (footer)
- Copyright line (footer)
- Stoner Theater address in the TheaterEvent schema, plus `offers` once ticket info is set
- GA4 / Google Tag Manager snippet (head)
- Confirm Cora Vanderbroek spelling if her name gets used in any quote credit

## Launch checklist

1. Point mapofmykingdom.com DNS at the host and confirm HTTPS.
2. Add the GA4 / GTM snippet.
3. Add the site to Google Search Console and submit sitemap.xml.
4. Test the schema at https://search.google.com/test/rich-results.
5. Check the share preview (OG image) on Facebook and LinkedIn.
6. Test on phones, check contrast, and click every link.
7. Re-check every placeholder above.
8. Decide on the redirect or link from peoplescompany.com/map-of-my-kingdom.

## Licenses

Barlow Condensed and Figtree are under the SIL Open Font License (see `assets/fonts/`). Play footage, photos, and text belong to the play's owners.
