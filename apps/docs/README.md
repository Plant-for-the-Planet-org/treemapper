# TreeMapper Documentation

User-facing documentation for TreeMapper mobile and web applications.

## Getting Started

### Installation

```bash
yarn install
```

### Development

```bash
yarn dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

### Build

```bash
yarn build
```

### Production

```bash
yarn start
```

## Features

- 🌍 **Multi-language support**: English, German, Spanish
- 🌓 **Dark/Light mode**: Theme toggle with system preference detection
- 🔍 **Search functionality**: Quick keyboard navigation (⌘K)
- 📱 **Responsive design**: Mobile-first, works on all devices
- 👍 **Feedback system**: User ratings stored locally
- 📸 **Placeholder images**: Ready for screenshot replacement

## Structure

```
apps/docs/
├── app/                    # Next.js app directory
│   ├── docs/              # Documentation pages
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Homepage
├── components/            # React components
│   ├── ui/               # UI primitives (Button, Input)
│   ├── header.tsx        # Site header
│   ├── sidebar.tsx       # Navigation sidebar
│   ├── search.tsx        # Search component
│   ├── feedback.tsx      # Feedback widget
│   └── ...
├── lib/                   # Utilities
│   ├── docs.ts           # Documentation structure
│   └── utils.ts          # Helper functions
├── messages/             # i18n translations
│   ├── en.json           # English
│   ├── de.json           # German
│   └── es.json           # Spanish
└── public/               # Static assets
```

## Adding Documentation

### Create a New Page

1. Create a file in `app/docs/[your-section]/page.tsx`
2. Use the `DocPage` component wrapper
3. Add the route to `lib/docs.ts` navigation config

Example:

```tsx
import { DocPage } from '@/components/doc-page';

export default function YourPage() {
  return (
    <DocPage
      title="Your Page Title"
      description="Page description"
      pageId="unique-page-id"
    >
      {/* Your content here */}
    </DocPage>
  );
}
```

### Add Placeholder Images

Use the `PlaceholderImage` component:

```tsx
import { PlaceholderImage } from '@/components/placeholder-image';

<PlaceholderImage
  title="Screenshot Title"
  description="What this screenshot should show"
  aspectRatio="video" // or "square" or "portrait"
/>
```

Replace placeholders with actual screenshots by adding images to `/public/images/`.

### Add Translations

Update the message files in `/messages/`:
- `en.json` for English
- `de.json` for German
- `es.json` for Spanish

## Technologies

- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **next-intl**: Internationalization
- **next-themes**: Dark mode support
- **Lucide Icons**: Icon library

## License

Part of the TreeMapper project by Plant-for-the-Planet.
