import { useState, useEffect } from 'react';
import { Wallet, CreditCard } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { formatCurrency } from '../../lib/utils';

interface DepositDialogProps {
  open: boolean;
  onClose: () => void;
  onDeposit: (amount: number, paymentInfo: PaymentInfo) => Promise<void>;
  currentBalance: number;
}

interface PaymentInfo {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  nameOnCard: string;
}

export function DepositDialog({ open, onClose, onDeposit, currentBalance }: DepositDialogProps) {
  useEffect(() => {
    console.log('DepositDialog open state:', open);
  }, [open]);
  const [amount, setAmount] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [nameOnCard, setNameOnCard] = useState('');

  const handleSubmit = async () => {
    const depositAmount = parseFloat(amount);
    
    if (isNaN(depositAmount) || depositAmount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (depositAmount > 1000) {
      alert('Maximum deposit amount is $1000 per transaction');
      return;
    }

    // Validate payment info
    if (!cardNumber.trim() || !expiryDate.trim() || !cvv.trim() || !nameOnCard.trim()) {
      alert('Please fill in all payment information');
      return;
    }

    // Basic validation for card number (should be 16 digits)
    const cleanedCardNumber = cardNumber.replace(/\s/g, '');
    if (cleanedCardNumber.length !== 16 || !/^\d+$/.test(cleanedCardNumber)) {
      alert('Please enter a valid 16-digit card number');
      return;
    }

    // Basic validation for expiry date (MM/YY format)
    if (!/^\d{2}\/\d{2}$/.test(expiryDate)) {
      alert('Please enter expiry date in MM/YY format');
      return;
    }

    // Basic validation for CVV (3-4 digits)
    if (!/^\d{3,4}$/.test(cvv)) {
      alert('Please enter a valid CVV (3-4 digits)');
      return;
    }

    const paymentInfo: PaymentInfo = {
      cardNumber: cleanedCardNumber,
      expiryDate,
      cvv,
      nameOnCard: nameOnCard.trim()
    };

    try {
      await onDeposit(depositAmount, paymentInfo);
      // Clear form and close dialog only after successful deposit
      setAmount('');
      setCardNumber('');
      setExpiryDate('');
      setCvv('');
      setNameOnCard('');
      onClose();
    } catch (error) {
      // Error is handled in the parent component
      // Don't close dialog on error
    }
  };

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, '');
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    return formatted.slice(0, 19); // Max 16 digits + 3 spaces
  };

  const formatExpiryDate = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
    }
    return cleaned;
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

          <div className="border-t pt-4 space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <CreditCard className="w-4 h-4" />
              Payment Information
            </div>

            <div className="space-y-2">
              <Label htmlFor="nameOnCard">Name on Card</Label>
              <Input
                id="nameOnCard"
                type="text"
                placeholder="John Doe"
                value={nameOnCard}
                onChange={(e) => setNameOnCard(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cardNumber">Card Number</Label>
              <Input
                id="cardNumber"
                type="text"
                placeholder="1234 5678 9012 3456"
                maxLength={19}
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <Input
                  id="expiryDate"
                  type="text"
                  placeholder="MM/YY"
                  maxLength={5}
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(formatExpiryDate(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cvv">CVV</Label>
                <Input
                  id="cvv"
                  type="text"
                  placeholder="123"
                  maxLength={4}
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                />
              </div>
            </div>
          </div>

          <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
            <p className="font-medium mb-1">🔒 Secure Payment (Demo Mode)</p>
            <p>This is a simulation. No real payment will be processed. Card information is not stored.</p>
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
