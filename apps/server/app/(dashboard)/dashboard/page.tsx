export default function Dashboard() {
    return (
      <div className="page-container" style={{ width: '90px', height: '90px', border: '2px solid black', margin: 'auto', padding: '20px', backgroundColor:"red" }}>
        <h1>Welcome to Dashboard</h1>
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