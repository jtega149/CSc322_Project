import { AuthProvider, useAuthContext } from './contexts/AuthContext';
import { Header } from './components/layout/Header';
import { VisitorView } from './components/visitor/VisitorView';
import { CustomerDashboard } from './components/customer/CustomerDashboard';
import { ChefDashboard } from './components/employee/ChefDashboard';
import { DeliveryDashboard } from './components/employee/DeliveryDashboard';
import { ManagerDashboard } from './components/employee/ManagerDashboard';
import { Customer, Chef, DeliveryPerson, Manager } from './types';

function AppContent() {
  const { currentUser, isLoading } = useAuthContext();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const renderDashboard = () => {
    if (!currentUser) {
      return <VisitorView />;
    }

    switch (currentUser.role) {
      case 'customer':
      case 'vip':
        return <CustomerDashboard customer={currentUser as Customer} />;
      case 'chef':
        return <ChefDashboard chef={currentUser as Chef} />;
      case 'delivery':
        return <DeliveryDashboard deliveryPerson={currentUser as DeliveryPerson} />;
      case 'manager':
        return <ManagerDashboard manager={currentUser as Manager} />;
      default:
        return <VisitorView />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {renderDashboard()}
      </main>
      <footer className="border-t mt-12 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>AI Restaurant - Smart Ordering & Delivery System</p>
          <p className="mt-2">
            Built with React + TypeScript | Ready for Firebase Integration
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
