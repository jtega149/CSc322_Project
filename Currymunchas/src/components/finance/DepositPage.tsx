import { useState } from 'react';
import { Wallet, CreditCard, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { formatCurrency } from '../../lib/utils';
import { depositFunds } from '../../userService';
import { useAuthContext } from '../../contexts/AuthContext';
import { Alert, AlertDescription } from '../ui/alert';

interface DepositPageProps {
  currentBalance: number;
  onBack: () => void;
  onDepositComplete: () => void;
}

interface PaymentInfo {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  nameOnCard: string;
}

export function DepositPage({ currentBalance, onBack, onDepositComplete }: DepositPageProps) {
  const [amount, setAmount] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [nameOnCard, setNameOnCard] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { currentUser, refreshUser } = useAuthContext();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    const depositAmount = parseFloat(amount);
    
    if (isNaN(depositAmount) || depositAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (depositAmount > 1000) {
      setError('Maximum deposit amount is $1000 per transaction');
      return;
    }

    // Validate payment info
    if (!cardNumber.trim() || !expiryDate.trim() || !cvv.trim() || !nameOnCard.trim()) {
      setError('Please fill in all payment information');
      return;
    }

    // Basic validation for card number (should be 16 digits)
    const cleanedCardNumber = cardNumber.replace(/\s/g, '');
    if (cleanedCardNumber.length !== 16 || !/^\d+$/.test(cleanedCardNumber)) {
      setError('Please enter a valid 16-digit card number');
      return;
    }

    // Basic validation for expiry date (MM/YY format)
    if (!/^\d{2}\/\d{2}$/.test(expiryDate)) {
      setError('Please enter expiry date in MM/YY format');
      return;
    }

    // Basic validation for CVV (3-4 digits)
    if (!/^\d{3,4}$/.test(cvv)) {
      setError('Please enter a valid CVV (3-4 digits)');
      return;
    }

    if (!currentUser?.id) {
      setError('Error: User not found');
      return;
    }

    setIsProcessing(true);
    try {
      // Simulate payment processing (in real app, this would call a payment API)
      console.log('Processing payment:', {
        amount,
        cardNumber: cleanedCardNumber.replace(/\d(?=\d{4})/g, '*'), // Mask card number
        expiryDate,
        nameOnCard: nameOnCard.trim()
      });

      // Small delay to simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update account balance in Firebase
      await depositFunds(currentUser.id, depositAmount);
      
      // Refresh user data to get updated balance
      await refreshUser();

      setSuccess(true);
      
      // Clear form
      setAmount('');
      setCardNumber('');
      setExpiryDate('');
      setCvv('');
      setNameOnCard('');

      // Show success message and redirect after a delay
      setTimeout(() => {
        onDepositComplete();
      }, 2000);
    } catch (error: any) {
      console.error('Deposit error:', error);
      setError(`Error processing deposit: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const quickAmounts = [25, 50, 100, 200];

  if (success) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">Deposit Successful!</h2>
              <p className="text-muted-foreground mb-4">
                Your funds have been added to your account.
              </p>
              <p className="text-sm text-muted-foreground">
                Redirecting to dashboard...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Button variant="ghost" onClick={onBack} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Deposit Funds
          </CardTitle>
          <CardDescription>
            Add money to your account to place orders
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="bg-muted p-4 rounded-lg">
              <div className="text-sm text-muted-foreground">Current Balance</div>
              <div className="text-2xl font-semibold">{formatCurrency(currentBalance)}</div>
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
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Quick Select</Label>
              <div className="grid grid-cols-4 gap-2">
                {quickAmounts.map(amt => (
                  <Button
                    key={amt}
                    type="button"
                    variant="outline"
                    onClick={() => setAmount(amt.toString())}
                  >
                    ${amt}
                  </Button>
                ))}
              </div>
            </div>

            <div className="border-t pt-6 space-y-4">
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
                  required
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
                  required
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
                    required
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
                    required
                  />
                </div>
              </div>
            </div>

            <div className="bg-muted p-3 rounded-lg text-sm text-muted-foreground">
              <p className="font-medium mb-1">🔒 Secure Payment (Demo Mode)</p>
              <p>This is a simulation. No real payment will be processed. Card information is not stored.</p>
            </div>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                className="flex-1"
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : `Deposit ${amount && !isNaN(parseFloat(amount)) ? formatCurrency(parseFloat(amount)) : ''}`}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

