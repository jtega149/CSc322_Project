import { useState } from 'react';
import { ArrowLeft, DollarSign, UserX, AlertTriangle, Crown, Ban, CheckCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { formatCurrency } from '../../lib/utils';
import { updateUser } from '../../userService';
import { db } from '../../lib/firebase';
import { getDoc, doc } from 'firebase/firestore';

interface ManageCustomerPageProps {
  customer: {
    id: string;
    name: string;
    email: string;
    isVip?: boolean;
    accountBalance: number;
    orders: number;
    warnings: number;
    isBlacklisted?: boolean;
    totalSpent?: number;
    orderCount?: number;
  };
  managerId: string;
  onBack: () => void;
  onUpdate: () => void;
}

export function ManageCustomerPage({
  customer,
  managerId,
  onBack,
  onUpdate
}: ManageCustomerPageProps) {
  const [balanceAdjustment, setBalanceAdjustment] = useState('');
  const [isAdjustingBalance, setIsAdjustingBalance] = useState(false);
  const [warningReason, setWarningReason] = useState('');
  const [isAddingWarning, setIsAddingWarning] = useState(false);
  const [isTogglingVIP, setIsTogglingVIP] = useState(false);
  const [isTogglingBlacklist, setIsTogglingBlacklist] = useState(false);
  const [isClosingAccount, setIsClosingAccount] = useState(false);
  const [error, setError] = useState('');

  const handleAdjustBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const amount = parseFloat(balanceAdjustment);
    if (isNaN(amount) || amount === 0) {
      setError('Please enter a valid non-zero amount');
      return;
    }

    setIsAdjustingBalance(true);
    try {
      // Get current balance
      const userRef = doc(db, 'users', customer.id);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        throw new Error('Customer not found');
      }

      const userData = userSnap.data();
      const currentBalance = userData.accountBalance || 0;
      const newBalance = currentBalance + amount;

      if (newBalance < 0) {
        throw new Error('Balance cannot be negative');
      }

      await updateUser(customer.id, {
        accountBalance: newBalance
      });

      alert(`Balance ${amount >= 0 ? 'increased' : 'decreased'} by ${formatCurrency(Math.abs(amount))}. New balance: ${formatCurrency(newBalance)}`);
      setBalanceAdjustment('');
      onUpdate();
    } catch (error: any) {
      setError(error.message || 'Failed to adjust balance');
    } finally {
      setIsAdjustingBalance(false);
    }
  };

  const handleAddWarning = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!warningReason.trim()) {
      setError('Please provide a reason for the warning');
      return;
    }

    setIsAddingWarning(true);
    try {
      const userRef = doc(db, 'users', customer.id);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        throw new Error('Customer not found');
      }

      const userData = userSnap.data();
      const currentWarnings = userData.warnings || [];
      const isVIP = userData.isVIP || false;

      const newWarning = {
        id: `warning_${Date.now()}`,
        userId: customer.id,
        reason: warningReason.trim(),
        issuedAt: new Date(),
        issuedBy: managerId
      };

      const updatedWarnings = [...currentWarnings, newWarning];

      // Check consequences
      if (isVIP && updatedWarnings.length >= 2) {
        // Downgrade VIP to regular customer and clear warnings
        await updateUser(customer.id, {
          isVIP: false,
          warnings: []
        });
        alert(`Warning added. Customer downgraded from VIP to regular customer due to 2 warnings.`);
      } else if (!isVIP && updatedWarnings.length >= 3) {
        // Deregister customer
        await updateUser(customer.id, {
          isBlacklisted: true,
          warnings: updatedWarnings
        });
        alert(`Warning added. Customer deregistered (blacklisted) due to 3 warnings.`);
      } else {
        // Just add warning
        await updateUser(customer.id, {
          warnings: updatedWarnings
        });
        alert(`Warning added successfully.`);
      }

      setWarningReason('');
      onUpdate();
    } catch (error: any) {
      setError(error.message || 'Failed to add warning');
    } finally {
      setIsAddingWarning(false);
    }
  };

  const handleToggleVIP = async () => {
    if (!confirm(`Are you sure you want to ${customer.isVip ? 'remove VIP status from' : 'grant VIP status to'} ${customer.name}?`)) {
      return;
    }

    setIsTogglingVIP(true);
    setError('');
    try {
      await updateUser(customer.id, {
        isVIP: !customer.isVip
      });
      alert(`VIP status ${customer.isVip ? 'removed' : 'granted'} successfully.`);
      onUpdate();
    } catch (error: any) {
      setError(error.message || 'Failed to update VIP status');
    } finally {
      setIsTogglingVIP(false);
    }
  };

  const handleToggleBlacklist = async () => {
    const action = customer.isBlacklisted ? 'remove from blacklist' : 'add to blacklist';
    if (!confirm(`Are you sure you want to ${action} ${customer.name}?`)) {
      return;
    }

    setIsTogglingBlacklist(true);
    setError('');
    try {
      await updateUser(customer.id, {
        isBlacklisted: !customer.isBlacklisted
      });
      alert(`Customer ${customer.isBlacklisted ? 'removed from' : 'added to'} blacklist successfully.`);
      onUpdate();
    } catch (error: any) {
      setError(error.message || 'Failed to update blacklist status');
    } finally {
      setIsTogglingBlacklist(false);
    }
  };

  const handleCloseAccount = async () => {
    if (!confirm(`Are you sure you want to close ${customer.name}'s account? This will clear their balance and cannot be undone.`)) {
      return;
    }

    setIsClosingAccount(true);
    setError('');
    try {
      await updateUser(customer.id, {
        accountBalance: 0,
        isBlacklisted: true
      });
      alert(`Account closed successfully. Balance cleared and customer blacklisted.`);
      onUpdate();
    } catch (error: any) {
      setError(error.message || 'Failed to close account');
    } finally {
      setIsClosingAccount(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Button variant="ghost" onClick={onBack} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Customers
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Manage Customer: {customer.name}
          </CardTitle>
          <CardDescription>
            Customer Account Management
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Customer Information */}
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Email</div>
                <div className="text-sm">{customer.email}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Status</div>
                <div className="flex gap-2">
                  {customer.isVip && (
                    <Badge className="bg-amber-100 text-amber-800">
                      <Crown className="w-3 h-3 mr-1" />
                      VIP
                    </Badge>
                  )}
                  {customer.isBlacklisted && (
                    <Badge variant="destructive">
                      <Ban className="w-3 h-3 mr-1" />
                      Blacklisted
                    </Badge>
                  )}
                  {!customer.isVip && !customer.isBlacklisted && (
                    <Badge variant="secondary">Regular</Badge>
                  )}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Account Balance</div>
                <div className="text-sm font-semibold">{formatCurrency(customer.accountBalance)}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Total Orders</div>
                <div className="text-sm">{customer.orders || customer.orderCount || 0}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Total Spent</div>
                <div className="text-sm">{formatCurrency(customer.totalSpent || 0)}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Warnings</div>
                <div className="text-sm">
                  <Badge variant={customer.warnings > 0 ? 'destructive' : 'secondary'}>
                    {customer.warnings || 0}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Adjust Balance Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <DollarSign className="w-5 h-5" />
                Adjust Account Balance
              </CardTitle>
              <CardDescription>
                Current balance: {formatCurrency(customer.accountBalance)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAdjustBalance} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="adjustment">Adjustment Amount</Label>
                  <div className="flex gap-2">
                    <Input
                      id="adjustment"
                      type="number"
                      step="0.01"
                      value={balanceAdjustment}
                      onChange={(e) => setBalanceAdjustment(e.target.value)}
                      placeholder="Enter positive to add, negative to subtract"
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enter positive amount to add funds, negative amount to subtract funds
                  </p>
                </div>
                <Button
                  type="submit"
                  disabled={isAdjustingBalance || !balanceAdjustment || parseFloat(balanceAdjustment) === 0}
                >
                  {isAdjustingBalance ? 'Processing...' : 'Adjust Balance'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Add Warning Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                Add Warning
              </CardTitle>
              <CardDescription>
                Current warnings: {customer.warnings || 0}
                {customer.isVip && customer.warnings >= 1 && (
                  <span className="block text-red-600 mt-1">
                    ⚠️ One more warning will downgrade from VIP
                  </span>
                )}
                {!customer.isVip && customer.warnings >= 2 && (
                  <span className="block text-red-600 mt-1">
                    ⚠️ One more warning will result in deregistration
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddWarning} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="warningReason">Warning Reason</Label>
                  <Textarea
                    id="warningReason"
                    value={warningReason}
                    onChange={(e) => setWarningReason(e.target.value)}
                    placeholder="Enter reason for warning..."
                    rows={3}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  variant="outline"
                  disabled={isAddingWarning || !warningReason.trim()}
                >
                  {isAddingWarning ? 'Adding...' : 'Add Warning'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* VIP Status Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Crown className="w-5 h-5 text-amber-600" />
                VIP Status
              </CardTitle>
              <CardDescription>
                {customer.isVip 
                  ? 'Customer has VIP status with 5% discount and free delivery benefits'
                  : 'Grant VIP status to this customer'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleToggleVIP}
                disabled={isTogglingVIP}
                variant={customer.isVip ? 'outline' : 'default'}
                className="w-full"
              >
                {isTogglingVIP 
                  ? 'Processing...' 
                  : customer.isVip 
                    ? 'Remove VIP Status' 
                    : 'Grant VIP Status'}
              </Button>
            </CardContent>
          </Card>

          {/* Blacklist Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-red-600">
                <Ban className="w-5 h-5" />
                Blacklist Management
              </CardTitle>
              <CardDescription>
                {customer.isBlacklisted 
                  ? 'Customer is blacklisted and cannot register again'
                  : 'Add customer to blacklist to prevent future registration'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleToggleBlacklist}
                disabled={isTogglingBlacklist}
                variant={customer.isBlacklisted ? 'outline' : 'destructive'}
                className="w-full"
              >
                {isTogglingBlacklist 
                  ? 'Processing...' 
                  : customer.isBlacklisted 
                    ? 'Remove from Blacklist' 
                    : 'Add to Blacklist'}
              </Button>
            </CardContent>
          </Card>

          {/* Close Account Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-red-600">
                <UserX className="w-5 h-5" />
                Close Account
              </CardTitle>
              <CardDescription>
                Close this customer's account, clear their balance, and blacklist them
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Warning:</strong> Closing an account will:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Clear the account balance</li>
                    <li>Add customer to blacklist</li>
                    <li>This action cannot be undone</li>
                  </ul>
                </AlertDescription>
              </Alert>
              <Button
                onClick={handleCloseAccount}
                disabled={isClosingAccount}
                variant="destructive"
                className="w-full mt-4"
              >
                {isClosingAccount ? 'Closing...' : 'Close Account'}
              </Button>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}

