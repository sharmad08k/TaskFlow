import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/login');
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <div className="app-layout">
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h1>TaskFlow</h1>
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/" end className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
            <LayoutDashboard size={18} /> Dashboard
          </NavLink>
          <NavLink to="/projects" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
            <FolderKanban size={18} /> Projects
          </NavLink>
        </nav>
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{initials}</div>
            <div className="user-details">
              <div className="name">{user?.name}</div>
              <div className="email">{user?.email}</div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={handleLogout} title="Logout">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
      <main className="main-content">
        <div style={{display:'none'}} className="mobile-header">
          <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X size={24}/> : <Menu size={24}/>}
          </button>
        </div>
        <Outlet />
      </main>
    </div>
  );
}
