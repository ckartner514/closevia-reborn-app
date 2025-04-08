
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Bell, Settings, LogOut, Menu, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "@/hooks/useNotifications";

interface HeaderProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export function Header({ collapsed, setCollapsed }: HeaderProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { notifications, markAsViewed, deleteNotification, unviewedCount } = useNotifications();

  // Get the user's initials from their email or name
  const getInitials = () => {
    if (!user) return "?";
    
    if (user.user_metadata?.name) {
      return user.user_metadata.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase();
    }
    
    // Fallback to the first character of the email
    return user.email?.[0].toUpperCase() || "?";
  };

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  const handleNotificationClick = (notification: any) => {
    // Mark the notification as viewed
    markAsViewed(notification.id);
    
    if (notification.type === 'proposal') {
      // Navigate to proposals page with a query parameter to open the specific proposal
      navigate(`/proposals?openProposal=${notification.id}`);
    } else {
      // Navigate to invoices page with a query parameter to highlight the specific invoice
      navigate(`/invoices?highlightInvoice=${notification.id}`);
    }
  };

  const handleDeleteNotification = (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation(); // Prevent triggering the parent click handler
    deleteNotification(notificationId);
  };

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="md:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground md:text-xl">
            {user?.user_metadata?.company_name || "Closevia Dashboard"}
          </h1>
        </div>
        
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unviewedCount > 0 && (
                  <span className="absolute right-1 top-1 h-4 w-4 rounded-full bg-red-500 flex items-center justify-center text-[10px] text-white font-medium">
                    {unviewedCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="px-3 py-2 font-medium border-b">
                Notifications
              </div>
              {notifications.length > 0 ? (
                <div className="max-h-[300px] overflow-y-auto">
                  {notifications.map((notification, index) => (
                    <DropdownMenuItem 
                      key={index}
                      className={`py-3 px-3 cursor-pointer flex flex-col items-start ${notification.viewed ? 'opacity-70' : ''}`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="w-full flex justify-between items-start">
                        <div className="font-medium">{notification.title}</div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 ml-2 -mr-1 hover:bg-destructive/10" 
                          onClick={(e) => handleDeleteNotification(e, notification.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {notification.type === 'proposal' ? 'Follow-up' : 'Payment'} due: {notification.due_date}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Client: {notification.contact.name}
                      </div>
                    </DropdownMenuItem>
                  ))}
                </div>
              ) : (
                <div className="py-4 text-center text-muted-foreground">
                  No new notifications
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 px-2">
                <Avatar className="h-8 w-8 bg-slate-400 text-slate-100 border border-slate-300">
                  <AvatarFallback>{getInitials()}</AvatarFallback>
                </Avatar>
                <span className="hidden font-medium text-sm md:inline-block">
                  {user?.email}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <div className="px-2 py-1.5 text-sm font-medium">My Account</div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/settings")}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  signOut();
                  navigate("/login");
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
