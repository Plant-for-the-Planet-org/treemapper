export default function Home() {
    return (
      <div className="page-container">
        <h1>Welcome to My App</h1>
        <p>This content is contained within the fixed layout box.</p>
        <p>The layout container will remain consistent as you navigate through the app.</p>
        
        {/* Example navigation */}
        <div className="nav-links">
          <a href="/about">About</a>
          <a href="/profile">Profile</a>
          <a href="/settings">Settings</a>
        </div>
      </div>
    );
  }