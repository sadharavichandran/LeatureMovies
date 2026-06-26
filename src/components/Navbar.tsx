import { Film, Shield, LogOut, User, Menu, X, Landmark } from "lucide-react";
import { useState } from "react";
import { UserProfile } from "../types";

interface NavbarProps {
  currentUser: UserProfile | null;
  onLogout: () => void;
  onOpenAuth: (role: "user" | "admin", isRegister: boolean) => void;
  onNavigate: (view: "home" | "admin" | "user" | "theatres" | "user-lostfound" | "watch-room") => void;
  currentView: string;
}

export default function Navbar({
  currentUser,
  onLogout,
  onOpenAuth,
  onNavigate,
  currentView,
}: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-[#050505]/95 border-b border-white/5 backdrop-blur-md h-20 flex items-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex justify-between h-16 items-center">
          {/* Logo insignia */}
          <div
            onClick={() => {
              onNavigate("home");
              setMobileOpen(false);
            }}
            className="flex items-center gap-3 cursor-pointer select-none group"
          >
            <img src="/logo.png" alt="Leature Logo" className="h-8 md:h-10 object-contain group-hover:brightness-110 transition-all" />
          </div>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            {!(currentUser && currentUser.role === 'admin') && (
              <>
                <button
                  onClick={() => onNavigate("home")}
                  className={`text-xs font-semibold uppercase tracking-widest transition-all ${currentView === "home"
                      ? "gold-text opacity-100 font-bold"
                      : "text-stone-300 opacity-60 hover:opacity-100"
                    }`}
                >
                  {!currentUser && currentView === 'home' ? 'Home Page' : 'Movies'}
                </button>
                {(currentUser || currentView !== 'home') && (
                  <>
                    <button
                      onClick={() => onNavigate("theatres")}
                      className={`text-xs font-semibold uppercase tracking-widest transition-all ${currentView === "theatres"
                          ? "gold-text opacity-100 font-bold"
                          : "text-stone-300 opacity-60 hover:opacity-100"
                        }`}
                    >
                      Theatres
                    </button>
                  </>
                )}
              </>
            )}

            {currentUser && currentUser.role === "admin" && (
              <button
                onClick={() => onNavigate("admin")}
                className={`text-xs font-semibold uppercase tracking-widest transition-all flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-[#C5A059]/40 text-amber-400 rounded-full animate-pulse ${currentView === "admin" ? "bg-amber-500/20" : ""
                  }`}
              >
                <Shield className="w-3.5 h-3.5 text-[#C5A059]" />
                Admin Dashboard
              </button>
            )}

            {currentUser && currentUser.role === "user" && (
              <button
                onClick={() => onNavigate("user")}
                className={`text-xs font-semibold uppercase tracking-widest transition-all flex items-center gap-1.5 ${currentView === "user"
                    ? "gold-text opacity-100 font-bold"
                    : "text-stone-300 opacity-60 hover:opacity-100"
                  }`}
              >
                <User className="w-4 h-4 text-[#C5A059]" />
                My Bookings
              </button>
            )}
          </div>

          {/* User Signin / Action buttons */}
          <div className="hidden md:flex items-center gap-4">
            {currentUser ? (
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-[9px] text-[#C5A059] uppercase tracking-widest font-mono font-bold">
                    Logged in as
                  </p>
                  <p className="text-xs font-semibold text-stone-100 max-w-[140px] truncate">
                    {currentUser.fullName}
                  </p>
                </div>
                <button
                  onClick={onLogout}
                  className="flex items-center gap-2 px-4 py-2 border border-white/10 hover:border-[#C5A059]/40 bg-white/5 rounded-full text-stone-300 hover:text-stone-100 text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5 text-stone-400" />
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                {/* User Auth */}
                <button
                  onClick={() => onOpenAuth("user", false)}
                  className="px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest border border-white/20 rounded-full hover:bg-white hover:text-black transition-colors cursor-pointer"
                >
                  User Sign In
                </button>
                {/* Admin Auth */}
                <button
                  onClick={() => onOpenAuth("admin", false)}
                  className="px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest gold-gradient text-black rounded-full shadow-[0_0_15px_rgba(197,160,89,0.3)] hover:opacity-90 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Shield className="w-3.5 h-3.5 shrink-0" />
                  Admin Access
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu and bars trigger */}
          <div className="flex md:hidden items-center gap-3">
            {currentUser && (
              <div className="text-right pr-1">
                <span className="block text-[10px] text-stone-500 uppercase font-mono tracking-wider">
                  {currentUser.role}
                </span>
                <span className="block text-xs font-semibold text-amber-500 truncate max-w-[80px]">
                  {currentUser.fullName}
                </span>
              </div>
            )}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 text-stone-400 hover:text-stone-100 bg-stone-900/50 border border-stone-800/80 rounded-lg cursor-pointer transition-colors"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile panel menu */}
      {mobileOpen && (
        <div className="md:hidden bg-stone-950 border-b border-stone-800 px-4 py-5 flex flex-col gap-4 animate-fadeIn">
          {!(currentUser && currentUser.role === 'admin') && (
            <>
              <button
                onClick={() => {
                  onNavigate("home");
                  setMobileOpen(false);
                }}
                className={`text-left text-base font-semibold py-2 border-b border-stone-900 ${currentView === "home" ? "text-amber-400" : "text-stone-300"
                  }`}
              >
                {!currentUser && currentView === 'home' ? 'Home Page' : 'Browse Movies'}
              </button>
              {(currentUser || currentView !== 'home') && (
                <>
                  <button
                    onClick={() => {
                      onNavigate("theatres");
                      setMobileOpen(false);
                    }}
                    className={`text-left text-base font-semibold py-2 border-b border-stone-900 ${currentView === "theatres" ? "text-amber-400" : "text-stone-300"
                      }`}
                  >
                    Theatres Locations
                  </button>
                </>
              )}

            </>
          )}

          {currentUser && currentUser.role === "admin" && (
            <button
              onClick={() => {
                onNavigate("admin");
                setMobileOpen(false);
              }}
              className={`text-left text-base font-bold py-2 border-b border-stone-900 text-amber-400 flex items-center gap-2`}
            >
              <Shield className="w-4 h-4" />
              Admin Terminal
            </button>
          )}

          {currentUser && currentUser.role === "user" && (
            <button
              onClick={() => {
                onNavigate("user");
                setMobileOpen(false);
              }}
              className={`text-left text-base font-semibold py-2 border-b border-stone-900 text-stone-200 flex items-center gap-2`}
            >
              <User className="w-4 h-4 text-stone-400" />
              My History Bookings
            </button>
          )}

          {currentUser ? (
            <button
              onClick={() => {
                onLogout();
                setMobileOpen(false);
              }}
              className="mt-2 w-full text-center flex justify-center items-center gap-2 bg-stone-900 border border-stone-800 hover:bg-stone-800 text-red-400 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Sign Out Session
            </button>
          ) : (
            <div className="flex flex-col gap-2 mt-2">
              <button
                onClick={() => {
                  onOpenAuth("user", false);
                  setMobileOpen(false);
                }}
                className="w-full text-center bg-stone-900 border border-stone-800 hover:bg-stone-800 text-stone-200 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer"
              >
                User Login
              </button>
              <button
                onClick={() => {
                  onOpenAuth("admin", false);
                  setMobileOpen(false);
                }}
                className="w-full text-center bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-950 py-2.5 rounded-xl text-sm font-bold shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Shield className="w-4 h-4" />
                Admin Dashboard Login
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
