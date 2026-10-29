# Design critique

## Round 1

Seen in one second: the name `LUO XIN`, the portrait, and a paper-like personal portfolio.

Idea: Luo Xin's portfolio becomes a working paper dossier, with four creative directions
laid out as pasted contact prints and the experience recorded as a résumé sheet.

Live thing: videos can be played in a focused viewer, and every poster can be opened at full size.

Layout words by section:

- hero = centered name plate with portrait and handwritten notes
- directions = uneven four-part contact sheet
- AI video = editorial split with moving image
- posters = five-column work archive
- microfilm = dark olive chapter and project list
- experience = portrait-led résumé spread
- footer = dark postcard close

Scores: design 8.1 · usability 8.5 · creativity 8.0 · content 8.5 → overall 8.2

Caps applied: none.

Top three remaining refinements:

1. At 900px desktop height, the category pictures begin at the fold. This preserves the large
   name but shows less of the work than the reference composition.
2. The 15-poster archive is intentionally dense and carries most of the page's visual energy.
3. The site is a single-page résumé. If more projects arrive, deeper case-study pages should be
   added rather than stretching this page further.

## Round 2

Seen in one second: the oversized `LUO XIN` name, the portrait, and a warm paper dossier.

Idea: Luo Xin's portfolio becomes a working paper file: work is pinned like contact prints,
the résumé is laid out as an editorial spread, and the olive chapter becomes a certificate shelf.

Live thing: switch between three AI clips in the live player, let the 15 posters and 7 certificates
drift continuously in seamless loops, and open any poster or certificate in a focused viewer.

Layout words by section: hero=centered name plate / directions=uneven four-part contact sheet /
AI video=split player and method note / posters=filterable horizontal archive /
awards=olive certificate marquee / experience=portrait-led résumé spread / footer=dark postcard close.

Scores: design 8.4 · usability 8.7 · creativity 8.2 · content 8.8 → overall 8.5

Caps applied: none.

Top three remaining refinements:

1. The inspector reports one `empty-middle` warning in the poster section because off-screen
   carousel cards extend the DOM bounds. The rendered sheets show four continuous posters across
   the desktop frame and a deliberate partial next card on the phone, so this is defended as a
   carousel measurement rather than a visible gap.
2. The three clip labels use the subjects already visible in the supplied footage; confirm these
   names before public launch if the films have different official titles.
3. New work should be added as dedicated case-study pages once more project material is available,
   rather than continuing to extend this résumé page.
