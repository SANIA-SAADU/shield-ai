import { useState, type ReactNode } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, PhoneCall, Banknote, Network, Map, Bot, Siren,
  Bell, LogOut, User as UserIcon, Menu, X, ShieldCheck, Activity,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { Brand } from "@/components/Brand";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/scam-detection", label: "Scam Detection", icon: PhoneCall },
  { to: "/currency", label: "Fake Currency", icon: Banknote },
  { to: "/network", label: "Fraud Network", icon: Network },
  { to: "/heatmap", label: "Crime Heatmap", icon: Map },
  { to: "/chatbot", label: "AI Assistant", icon: Bot },
  { to: "/emergency", label: "Emergency Agent", icon: Siren },
];

export function AppLayout({ children }: { children?: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { fullName, signOut, user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const initials = fullName.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase() || "U";

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out");
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* ── Topbar ── */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-[hsl(222_47%_7%/0.92)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-4 px-4 sm:px-6">
          {/* Logo */}
          <Brand size="sm" />

          {/* Desktop nav */}
          <nav className="ml-4 hidden items-center gap-1 lg:flex">
            {NAV.map((item) => {
              const active = location.pathname === item.to;
              return (
                <NavLink key={item.to} to={item.to} className={cn("nav-pill", active && "active")}>
                  <item.icon size={15} strokeWidth={2.1} />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="ml-auto flex items-center gap-2">
            {/* System status */}
            <div className="hidden items-center gap-2 rounded-lg border border-border/60 bg-secondary/60 px-3 py-1.5 sm:flex">
              <Activity size={13} className="text-primary" />
              <span className="text-xs font-medium text-muted-foreground">System Online</span>
            </div>

            {/* Bell */}
            <button className="relative grid h-9 w-9 place-items-center rounded-lg border border-border/60 bg-secondary/40 text-muted-foreground transition-colors hover:text-foreground">
              <Bell size={16} />
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-destructive" />
            </button>

            {/* Profile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-lg border border-border/60 bg-secondary/40 px-2.5 py-1.5 transition-colors hover:border-primary/40">
                  <div className="grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br from-primary to-accent text-[11px] font-bold text-primary-foreground">
                    {initials}
                  </div>
                  <span className="hidden text-xs font-medium sm:block">{fullName}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel className="flex items-center gap-2">
                  <UserIcon size={13} className="text-muted-foreground" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{fullName}</span>
                    <span className="text-[10px] font-normal text-muted-foreground">{user?.email}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="gap-2 text-xs">
                  <ShieldCheck size={13} className="text-success" />
                  <span className="text-success">Protected workspace</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="gap-2 text-destructive focus:text-destructive">
                  <LogOut size={13} />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile hamburger */}
            <button
              className="grid h-9 w-9 place-items-center rounded-lg border border-border/60 bg-secondary/40 lg:hidden"
              onClick={() => setMobileOpen((v) => !v)}
            >
              {mobileOpen ? <X size={17} /> : <Menu size={17} />}
            </button>
          </div>
        </div>

        {/* Mobile nav drawer */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-t border-border/60 lg:hidden"
            >
              <nav className="flex flex-col gap-1 p-3">
                {NAV.map((item) => {
                  const active = location.pathname === item.to;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileOpen(false)}
                      className={cn("nav-pill", active && "active")}
                    >
                      <item.icon size={15} strokeWidth={2.1} />
                      {item.label}
                    </NavLink>
                  );
                })}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── Page content ── */}
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {children ?? <Outlet />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
