
import {
  Home,
  Users,
  FileText,
  FileCheck,
  CreditCard,
  Settings,
  BarChart3,
  PlusCircle,
  LogOut,
  ChevronLeft,
  Menu,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

const SidebarItem = ({
  icon: Icon,
  label,
  href,
  active,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  href: string;
  active: boolean;
  onClick?: () => void;
}) => {
  return (
    <Link
      to={href}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
      )}
      onClick={onClick}
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </Link>
  );
};

export function Sidebar({ collapsed, setCollapsed }: SidebarProps) {
  const location = useLocation();
  const { signOut } = useAuth();
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile sidebar when navigating
  useEffect(() => {
    if (isMobile) {
      setMobileOpen(false);
    }
  }, [location.pathname, isMobile]);

  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  const toggleMobileOpen = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <>
      {/* Mobile menu button */}
      {isMobile && (
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleMobileOpen}
          className="fixed left-4 top-4 z-50 md:hidden"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "bg-sidebar fixed inset-y-0 z-40 flex flex-col border-r border-sidebar-border transition-all duration-300",
          collapsed && !isMobile ? "w-16" : "w-64",
          isMobile
            ? mobileOpen
              ? "left-0 animate-slide-in-right"
              : "-left-full"
            : "left-0"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 font-semibold text-sidebar-foreground"
          >
            {!collapsed ? (
              <div className="flex items-center gap-2">
                <img src="/lovable-uploads/5a47ab5e-64c5-4cca-ba44-65797ec9ce47.png" alt="Closevia Logo" className="h-8 w-auto" />
                <span className="text-xl">Closevia</span>
              </div>
            ) : (
              <img src="/lovable-uploads/5a47ab5e-64c5-4cca-ba44-65797ec9ce47.png" alt="Closevia Logo" className="h-7 w-auto" />
            )}
          </Link>
          {!isMobile && (
            <Button
              variant="ghost"
              size="icon"
              className="text-sidebar-foreground"
              onClick={toggleCollapsed}
            >
              <ChevronLeft
                className={cn("h-5 w-5 transition-all", collapsed && "rotate-180")}
              />
              <span className="sr-only">Toggle sidebar</span>
            </Button>
          )}
        </div>
        <div className="flex-1 overflow-auto py-4">
          <nav className="grid gap-1 px-2">
            <SidebarItem
              icon={Home}
              label="Dashboard"
              href="/dashboard"
              active={location.pathname === "/dashboard"}
            />
            <SidebarItem
              icon={Users}
              label="Contacts"
              href="/contacts"
              active={location.pathname === "/contacts"}
            />
            <SidebarItem
              icon={PlusCircle}
              label="Create Proposal"
              href="/create"
              active={location.pathname === "/create"}
            />
            <SidebarItem
              icon={FileText}
              label="Proposals"
              href="/proposals"
              active={location.pathname === "/proposals"}
            />
            <SidebarItem
              icon={FileCheck}
              label="Invoices"
              href="/invoices"
              active={location.pathname === "/invoices"}
            />
            <SidebarItem
              icon={BarChart3}
              label="Payments"
              href="/payments"
              active={location.pathname === "/payments"}
            />
            <SidebarItem
              icon={Settings}
              label="Settings"
              href="/settings"
              active={location.pathname === "/settings"}
            />
          </nav>
        </div>
        <div className="border-t border-sidebar-border p-2">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
              collapsed && !isMobile ? "px-3" : "px-3"
            )}
            onClick={() => signOut()}
          >
            <LogOut className="mr-2 h-5 w-5" />
            {!collapsed && <span>Sign out</span>}
          </Button>
        </div>
      </aside>
    </>
  );
}
