// app/about/page.tsx
import Link from 'next/link';

export default function About() {
  return (
    <div className="page-container">
      <h1>About Page</h1>
      <p>This is the about page. Notice how the fixed layout box remains consistent.</p>
      <p>The 90% width and height container with a 2px black border maintains its position regardless of which route you navigate to.</p>
      
      {/* Navigation back to home */}
      <div className="nav-links">
        <Link href="/">Back to Home</Link>
      </div>
    </div>
  );
}