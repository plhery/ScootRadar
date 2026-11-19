import { Geist, Red_Hat_Display, Red_Hat_Text } from 'next/font/google';

// The faces of the map and the website, declared once: the stylesheets of both layouts reach both kinds of page,
// and two declarations of one family with other options (a preload changes the file's name) made the landing
// page fetch Red Hat Display twice, and use whichever came last.

// Last of the map's stack, after the systems' own faces: not preloaded, so it never takes the slow link from
// the page's code.
export const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  preload: false,
});

// One family in two cuts: Display for the headlines and the figures, Text for everything that is read, on the
// map's own names as well. Both are variable, so every weight is one file. Display is optional: on a first visit
// over a slow link the landing page's hero is drawn once, in the size-matched fallback, not redrawn when the face
// arrives (it was the LCP, at 2.75 s against 1.1 s FCP), and the face is kept for the next visit. The map's
// figures come with the scooters, long after it has arrived.
export const display = Red_Hat_Display({
  variable: '--font-display',
  subsets: ['latin'],
  display: 'optional',
});

export const text = Red_Hat_Text({
  variable: '--font-text',
  subsets: ['latin'],
  display: 'swap',
});
