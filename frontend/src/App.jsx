import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from "react-router-dom";
import { LayoutDashboard, FileText, Bell, LogOut } from "lucide-react";
import DashboardPage from "./pages/DashboardPage";
import LogsPage from "./pages/LogsPage";
import AlertsPage from "./pages/AlertsPage";
import LoginPage from "./pages/LoginPage";
import { AuthProvider, useAuth } from "./context/AuthContext";

// New NavLink component
function NavLink({ to, icon }) {
  const Icon = icon;
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={`flex items-center justify-center w-full aspect-square rounded-xl transition-all duration-300 relative group ${isActive
        ? "bg-neon-blue/10 text-neon-blue shadow-[0_0_15px_rgba(0,242,255,0.3)]"
        : "text-slate-500 hover:text-white hover:bg-white/5"
        }`}
    >
      <Icon size={22} className={`transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`} />

      {/* Active Indicator Line */}
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-neon-blue rounded-r-full shadow-[0_0_10px_#00f2ff]"></div>
      )}
    </Link>
  );
}

// PrivateRoute Wrapper
function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

// Modified Layout component (Internal Routes)
function Layout() {
  const { logout, user } = useAuth();
  const location = useLocation();

  // Map paths to titles
  const getPageTitle = () => {
    switch (location.pathname) {
      case "/": return "Dashboard";
      case "/logs": return "Event Logs";
      case "/alerts": return "System Alerts";
      default: return "";
    }
  };

  return (
    <div className="flex h-screen bg-dark-bg text-slate-200 font-sans selection:bg-neon-blue selection:text-black overflow-hidden">
      {/* Slim Sidebar (Desktop) */}
      <div className="hidden md:flex flex-col items-center w-20 bg-card-bg border-r border-white/5 py-6 gap-6 z-20 shadow-2xl">
        {/* Logo */}
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-blue to-blue-600 flex items-center justify-center shadow-lg shadow-neon-blue/20 mb-4">
          <span className="font-bold text-white text-lg">N</span>
        </div>

        {/* Nav Items */}
        <div className="flex flex-col gap-4 w-full px-2">
          <NavLink to="/" icon={LayoutDashboard} />
          <NavLink to="/logs" icon={FileText} />
          <NavLink to="/alerts" icon={Bell} />
        </div>

        <div className="mt-auto">
          <button
            onClick={logout}
            className="w-10 h-10 rounded-lg flex items-center justify-center text-slate-500 hover:text-neon-pink hover:bg-white/5 transition-all"
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full relative">
        {/* Topbar */}
        <div className="h-16 flex items-center justify-between px-8 border-b border-white/5 bg-dark-bg/50 backdrop-blur-sm z-10">
          {/* Breadcrumb / Title */}
          <div className="flex items-center gap-3">
            <span className="text-slate-500 text-sm font-medium">Network Monitor</span>
            <span className="text-slate-700">/</span>
            <h2 className="text-white font-bold tracking-wide text-glow-blue">{getPageTitle()}</h2>
          </div>

          {/* User Profile / Server Status */}
          <div className="flex items-center gap-6">
            {/* Server Status Indicator */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-xs text-green-500 font-bold uppercase">System Online</span>
            </div>

            <div className="flex items-center gap-3 pl-6 border-l border-white/5">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-white leading-none">{user?.username}</p>
                <p className="text-slate-500 mt-1 uppercase text-[10px] tracking-wider">Administrator</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-500 to-neon-pink p-[1px]">
                <div className="w-full h-full rounded-full bg-card-bg flex items-center justify-center overflow-hidden">
                  <span className="font-bold text-xs">AD</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto p-8 relative">
          {/* Ambient Background Glows */}
          <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-neon-blue/5 to-transparent pointer-events-none" />

          <Routes>
            <Route path="/" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
            <Route path="/logs" element={<PrivateRoute><LogsPage /></PrivateRoute>} />
            <Route path="/alerts" element={<PrivateRoute><AlertsPage /></PrivateRoute>} />
            {/* Catch all redirect to dashboard */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>

      {/* Mobile Nav (Bottom) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card-bg/90 backdrop-blur-md border-t border-white/10 flex justify-around p-4 z-50 pb-safe">
        <Link to="/" className="p-2 text-slate-400 hover:text-white"><LayoutDashboard /></Link>
        <Link to="/logs" className="p-2 text-slate-400 hover:text-white"><FileText /></Link>
        <Link to="/alerts" className="p-2 text-slate-400 hover:text-white"><Bell /></Link>
        <button onClick={logout} className="p-2 text-slate-400 hover:text-neon-pink"><LogOut /></button>
      </div>
    </div>
  );
}

// Main App Component with Top-Level Routing
export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Login Route (No Layout) */}
          <Route path="/login" element={<LoginPage />} />

          {/* All other routes (Wrapped in Layout) */}
          <Route path="/*" element={<Layout />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
