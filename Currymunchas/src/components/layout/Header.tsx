import { Store, LogOut, Crown, User } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useAuthContext } from '../../contexts/AuthContext';
import { Customer } from '../../types';

export function Header() {
  const { currentUser, logout } = useAuthContext();

  const getRoleDisplay = () => {
    if (!currentUser) return null;

    switch (currentUser.role) {
      case 'manager':
        return <Badge variant="default">Manager</Badge>;
      case 'chef':
        return <Badge variant="default">Chef</Badge>;
      case 'delivery':
        return <Badge variant="default">Delivery</Badge>;
      case 'vip':
        return (
          <Badge className="bg-amber-500">
            <Crown className="w-3 h-3 mr-1" />
            VIP Customer
          </Badge>
        );
      case 'customer':
        return <Badge variant="secondary">Customer</Badge>;
      default:
        return null;
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Store className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-xl">AI Restaurant</h1>
              <p className="text-xs text-muted-foreground">Smart Ordering System</p>
            </div>
          </div>

          {/* User Info */}
          <div className="flex items-center gap-4">
            {currentUser ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>{currentUser.name}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {currentUser.email}
                    </div>
                  </div>
                  {getRoleDisplay()}
                </div>
                <Button variant="outline" onClick={logout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <Badge variant="secondary">Visitor</Badge>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
