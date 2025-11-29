import { useState } from 'react';
import { ArrowLeft, MapPin, CreditCard, DollarSign, Trash2, Minus, Plus } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Customer } from '../../types';
import { useCart } from '../../contexts/CartContext';
import { formatCurrency, calculateOrderTotal, calculateVIPDiscount } from '../../lib/utils';
import { createOrder } from '../../userService';
import { useAuthContext } from '../../contexts/AuthContext';

interface CheckoutPageProps {
  customer: Customer;
  onBack: () => void;
  onOrderComplete: () => void;
}

export function CheckoutPage({ customer, onBack, onOrderComplete }: CheckoutPageProps) {
  const { items, clearCart, getTotalPrice, removeFromCart, updateQuantity } = useCart();
  const { refreshUser } = useAuthContext();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Delivery information
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');

  // Tip
  const [tipAmount, setTipAmount] = useState(0);
  const [customTip, setCustomTip] = useState('');

  const isVIP = customer.isVIP || false;
  const deliveryFee = 5.00;
  const hasAvailableFreeDelivery = customer.freeDeliveriesEarned > customer.freeDeliveriesUsed;
  const [useFreeDelivery, setUseFreeDelivery] = useState(hasAvailableFreeDelivery);

  const orderItems = items.map(item => ({
    dishId: item.dish.id,
    quantity: item.quantity,
    price: item.dish.price
  }));

  const totals = calculateOrderTotal(orderItems, deliveryFee, isVIP, useFreeDelivery && hasAvailableFreeDelivery);
  const finalTotal = totals.total + tipAmount;
  const accountBalance = customer.accountBalance || 0;

  const tipOptions = [0, 5, 10, 15, 20];

  const handleTipChange = (amount: number) => {
    setTipAmount(amount);
    setCustomTip('');
  };

  const handleCustomTip = (value: string) => {
    setCustomTip(value);
    const amount = parseFloat(value) || 0;
    setTipAmount(amount);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate delivery information
    if (!streetAddress.trim() || !city.trim() || !state.trim() || !zipCode.trim() || !phoneNumber.trim()) {
      setError('Please fill in all required delivery information');
      return;
    }

    // Validate phone number format
    const phoneRegex = /^[\d\s\-\(\)]+$/;
    if (!phoneRegex.test(phoneNumber)) {
      setError('Please enter a valid phone number');
      return;
    }

    // Validate zip code
    const zipRegex = /^\d{5}(-\d{4})?$/;
    if (!zipRegex.test(zipCode)) {
      setError('Please enter a valid zip code (12345 or 12345-6789)');
      return;
    }

    // Check if user has sufficient balance
    if (accountBalance < finalTotal) {
      setError(`Insufficient balance. You need ${formatCurrency(finalTotal - accountBalance)} more. Please deposit funds.`);
      return;
    }

    setIsProcessing(true);
    try {
      const deliveryInfo = {
        streetAddress: streetAddress.trim(),
        city: city.trim(),
        state: state.trim(),
        zipCode: zipCode.trim(),
        phoneNumber: phoneNumber.trim(),
        deliveryInstructions: deliveryInstructions.trim()
      };

      await createOrder(
        customer.id,
        orderItems,
        totals.subtotal,
        useFreeDelivery ? 0 : deliveryFee,
        totals.discount,
        finalTotal,
        tipAmount,
        deliveryInfo
      );

      // Clear cart and show success
      clearCart();
      setSuccess(true);

      // Refresh user data
      await refreshUser();

      // Redirect after 2 seconds
      setTimeout(() => {
        onOrderComplete();
      }, 2000);
    } catch (error: any) {
      console.error('Checkout error:', error);
      setError(`Error processing order: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

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
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">Order Placed Successfully!</h2>
              <p className="text-muted-foreground mb-4">
                Your order has been confirmed and will be prepared soon.
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
    <div className="max-w-6xl mx-auto space-y-6">
      <Button variant="ghost" onClick={onBack} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.dish.id} className="flex items-center justify-between gap-2 p-2 rounded-lg border">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{item.dish.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatCurrency(item.dish.price)} each
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.dish.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className="h-7 w-7 p-0"
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-8 text-center text-sm">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.dish.id, item.quantity + 1)}
                        className="h-7 w-7 p-0"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="text-sm font-medium w-20 text-right">
                      {formatCurrency(item.dish.price * item.quantity)}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFromCart(item.dish.id)}
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
              
              <div className="border-t pt-2 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(totals.subtotal)}</span>
                </div>
                {totals.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>VIP Discount (5%)</span>
                    <span>-{formatCurrency(totals.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span>
                    {useFreeDelivery && hasAvailableFreeDelivery ? (
                      <span className="text-green-600">Free</span>
                    ) : (
                      formatCurrency(deliveryFee)
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Tip</span>
                  <span>{formatCurrency(tipAmount)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{formatCurrency(finalTotal)}</span>
                </div>
              </div>

              <div className="bg-muted p-3 rounded-lg space-y-2">
                <div>
                  <div className="text-sm text-muted-foreground">Current Account Balance</div>
                  <div className="text-lg font-semibold">{formatCurrency(accountBalance)}</div>
                </div>
                <div className="border-t pt-2">
                  <div className="text-sm text-muted-foreground">Account Balance After Transaction</div>
                  <div className={`text-lg font-semibold ${accountBalance < finalTotal ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(accountBalance - finalTotal)}
                  </div>
                </div>
                {accountBalance < finalTotal && (
                  <p className="text-xs text-red-600 mt-1">
                    Insufficient balance
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Checkout Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Checkout</CardTitle>
              <CardDescription>Enter your delivery information</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Delivery Address */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <h3 className="font-medium">Delivery Address</h3>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="streetAddress">Street Address *</Label>
                    <Input
                      id="streetAddress"
                      placeholder="123 Main St"
                      value={streetAddress}
                      onChange={(e) => setStreetAddress(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        placeholder="New York"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="state">State *</Label>
                      <Input
                        id="state"
                        placeholder="NY"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="zipCode">Zip Code *</Label>
                      <Input
                        id="zipCode"
                        placeholder="10001"
                        value={zipCode}
                        onChange={(e) => setZipCode(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phoneNumber">Phone Number *</Label>
                      <Input
                        id="phoneNumber"
                        placeholder="(555) 123-4567"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deliveryInstructions">Delivery Instructions (Optional)</Label>
                    <Input
                      id="deliveryInstructions"
                      placeholder="Leave at door, ring bell, etc."
                      value={deliveryInstructions}
                      onChange={(e) => setDeliveryInstructions(e.target.value)}
                    />
                  </div>
                </div>

                {/* Free Delivery Option for VIP */}
                {isVIP && hasAvailableFreeDelivery && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={useFreeDelivery}
                        onChange={(e) => setUseFreeDelivery(e.target.checked)}
                        className="rounded"
                      />
                      <span>Use free delivery (You have {customer.freeDeliveriesEarned - customer.freeDeliveriesUsed} available)</span>
                    </Label>
                  </div>
                )}

                {/* Tip Selection */}
                <div className="space-y-4 border-t pt-4">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    <h3 className="font-medium">Add Tip</h3>
                  </div>

                  <div className="grid grid-cols-5 gap-2">
                    {tipOptions.map((tip) => (
                      <Button
                        key={tip}
                        type="button"
                        variant={tipAmount === tip ? "default" : "outline"}
                        onClick={() => handleTipChange(tip)}
                      >
                        ${tip}
                      </Button>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customTip">Custom Tip Amount</Label>
                    <Input
                      id="customTip"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Enter custom amount"
                      value={customTip}
                      onChange={(e) => handleCustomTip(e.target.value)}
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex gap-4 pt-4">
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
                    disabled={isProcessing || accountBalance < finalTotal}
                  >
                    {isProcessing ? 'Processing...' : `Confirm Order - ${formatCurrency(finalTotal)}`}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

