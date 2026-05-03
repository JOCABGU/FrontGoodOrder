import '../styless/layouts/sidebar.css'; 

export default function Sidebar({ items }) {
  return (
    <aside className="sidebar">
      <div className="logo">
        <div className="logo-box">R</div>
        <h2>Rosie</h2>
      </div>

      <p className="recent-title">RECENTS</p>

      <nav className="sidebar-nav">
        {items.map((item, index) => (
          <div
            key={index}
            className={`nav-item ${item.active ? "active" : ""}`}
          >
            {item.label}
          </div>
        ))}
      </nav>
    </aside>
  );
}