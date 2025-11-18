import { useState } from 'react';
import { Wallet } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { formatCurrency } from '../../lib/utils';

interface DepositDialogProps {
  open: boolean;
  onClose: () => void;
  onDeposit: (amount: number) => void;
  currentBalance: number;
}

export function DepositDialog({ open, onClose, onDeposit, currentBalance }: DepositDialogProps) {
  const [amount, setAmount] = useState('');

  const handleSubmit = () => {
    const depositAmount = parseFloat(amount);
    
    if (isNaN(depositAmount) || depositAmount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (depositAmount > 1000) {
      alert('Maximum deposit amount is $1000 per transaction');
      return;
    }

    onDeposit(depositAmount);
    setAmount('');
    onClose();
  };

  const quickAmounts = [25, 50, 100, 200];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Deposit Funds
          </DialogTitle>
          <DialogDescription>
            Add money to your account to place orders
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-muted p-4 rounded-lg">
            <div className="text-sm text-muted-foreground">Current Balance</div>
            <div className="text-2xl">{formatCurrency(currentBalance)}</div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Deposit Amount</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              max="1000"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Quick Select</Label>
            <div className="grid grid-cols-4 gap-2">
              {quickAmounts.map(amt => (
                <Button
                  key={amt}
                  variant="outline"
                  onClick={() => setAmount(amt.toString())}
                  type="button"
                >
                  ${amt}
                </Button>
              ))}
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            Note: This is a demo. In production, this would integrate with a payment processor.
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Deposit {amount && !isNaN(parseFloat(amount)) ? formatCurrency(parseFloat(amount)) : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
