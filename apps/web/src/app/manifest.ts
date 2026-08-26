import type { MetadataRoute } from 'next';

// Served by Next at /manifest.webmanifest and linked automatically from the
// root layout. Keeping it here (instead of a static public/manifest.json)
// means the name and description stay typed and in one place.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'TreeMapper Dashboard',
    short_name: 'TreeMapper',
    description: 'Manage and monitor your TreeMapper data',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#007A49',
    icons: [
      {
        src: '/playstore.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
