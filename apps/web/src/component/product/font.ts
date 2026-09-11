import { Open_Sans } from 'next/font/google';

/**
 * Open Sans, scoped to the product page.
 *
 * The root layout has its own `--font-open-sans` variable, but it is never
 * attached to an element, so nothing in the app actually gets Open Sans today.
 * Rather than change typography app-wide from here, the product page loads its
 * own copy and applies it to its own wrapper.
 */
export const productFont = Open_Sans({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  display: 'swap',
});
