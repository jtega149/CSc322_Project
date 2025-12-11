import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Badge } from '../ui/badge';
import { ChefHat, Truck } from 'lucide-react';
import { useAuthContext } from '../../contexts/AuthContext';
import { signUpEmployee } from '../../userService';

export function RegistrationForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isEmployeeApplication, setIsEmployeeApplication] = useState(false);
  const [employeeRole, setEmployeeRole] = useState<'chef' | 'delivery'>('chef');
  const [specialties, setSpecialties] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuthContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    // Validate specialties for chef applications
    if (isEmployeeApplication && employeeRole === 'chef' && !specialties.trim()) {
      setError('Please enter at least one specialty for chef applications');
      return;
    }

    setIsLoading(true);

    try {
      if (isEmployeeApplication === true) {
        signUpEmployee(email, password, name, employeeRole, specialties)
        setSuccess(true);
        setName('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setSpecialties('');
        setIsEmployeeApplication(false);
        console.log("Succesfully applied for a career opportunity")
      }
      else {
        const result = await register(email, password, name);
        if (result) {
          setSuccess(true);
          setName('');
          setEmail('');
          setPassword('');
          setConfirmPassword('');
          setSpecialties('');
          setIsEmployeeApplication(false);
        } else {
          setError('Registration failed. Email may already be in use.');
        }
      }
    } catch (err) {
      setError('An error occurred during registration');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>
          {isEmployeeApplication ? 'Apply for Employment' : 'Apply for Registration'}
        </CardTitle>
        <CardDescription>
          {isEmployeeApplication 
            ? `Submit your application to become a ${employeeRole}. The manager will review and approve your request.`
            : 'Submit your application to become a registered customer. The manager will review and approve your request.'
          }
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert>
              <AlertDescription>
                {isEmployeeApplication 
                  ? `${employeeRole === 'chef' ? 'Chef' : 'Delivery person'} application submitted! Please wait for manager approval.`
                  : 'Registration application submitted! Please wait for manager approval.'
                }
              </AlertDescription>
            </Alert>
          )}

          {/* Employee Application Toggle */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="employee-toggle" className="cursor-pointer">
                Want to become an employee?
              </Label>
              <p className="text-sm text-muted-foreground">
                Apply as a chef or delivery person
              </p>
            </div>
            <button
              type="button"
              id="employee-toggle"
              role="switch"
              aria-checked={isEmployeeApplication}
              onClick={() => setIsEmployeeApplication(!isEmployeeApplication)}
              style={{
                position: 'relative',
                display: 'inline-flex',
                height: '24px',
                width: '44px',
                flexShrink: 0,
                cursor: 'pointer',
                borderRadius: '9999px',
                border: '2px solid transparent',
                backgroundColor: isEmployeeApplication ? '#030213' : '#d1d5db',
                transition: 'background-color 0.2s',
                outline: 'none',
              }}
              onFocus={(e) => {
                e.currentTarget.style.boxShadow = '0 0 0 2px rgba(3, 2, 19, 0.2)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <span
                style={{
                  pointerEvents: 'none',
                  display: 'block',
                  height: '20px',
                  width: '20px',
                  borderRadius: '9999px',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                  transform: isEmployeeApplication ? 'translateX(20px)' : 'translateX(2px)',
                  transition: 'transform 0.2s',
                }}
              />
            </button>
          </div>

          {/* Employee Role Selection */}
          {isEmployeeApplication && (
            <div className="space-y-3">
              <Label className="mb-4">Select Role</Label>
              <RadioGroup 
                value={employeeRole} 
                onValueChange={(value) => setEmployeeRole(value as 'chef' | 'delivery')}
                className="grid grid-cols-2 gap-4"
              >
                <div>
                  <RadioGroupItem 
                    value="chef" 
                    id="chef" 
                    className="peer sr-only absolute opacity-0 pointer-events-none" 
                  />
                  <Label
                    htmlFor="chef"
                    className={`flex flex-col items-center justify-between rounded-md border-2 border-muted p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors ${
                      employeeRole === 'chef' 
                        ? 'bg-muted' 
                        : 'bg-popover'
                    }`}
                  >
                    <ChefHat className="mb-3 h-6 w-6" />
                    <span>Chef</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem 
                    value="delivery" 
                    id="delivery" 
                    className="peer sr-only absolute opacity-0 pointer-events-none" 
                  />
                  <Label
                    htmlFor="delivery"
                    className={`flex flex-col items-center justify-between rounded-md border-2 border-muted p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors ${
                      employeeRole === 'delivery' 
                        ? 'bg-muted' 
                        : 'bg-popover'
                    }`}
                  >
                    <Truck className="mb-3 h-6 w-6" />
                    <span>Delivery</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reg-email">Email</Label>
            <Input
              id="reg-email"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reg-password">Password</Label>
            <Input
              id="reg-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <Input
              id="confirm-password"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          {/* Chef-specific fields */}
          {isEmployeeApplication && employeeRole === 'chef' && (
            <div className="space-y-2">
              <Label htmlFor="specialties">
                Specialties <Badge variant="secondary" className="ml-2">Required for Chef</Badge>
              </Label>
              <Input
                id="specialties"
                type="text"
                placeholder="e.g., Italian, Chinese, French"
                value={specialties}
                onChange={(e) => setSpecialties(e.target.value)}
                required
              />
              <p className="text-sm text-muted-foreground">
                Enter your cooking specialties separated by commas
              </p>
            </div>
          )}

          {/* Delivery-specific note */}
          {isEmployeeApplication && employeeRole === 'delivery' && (
            <Alert>
              <Truck className="h-4 w-4" />
              <AlertDescription>
                As a delivery person, you'll be able to bid on delivery orders and earn based on your performance.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>

        <CardFooter>
          <Button type="submit" className="w-full mt-4" disabled={isLoading}>
            {isLoading ? 'Submitting...' : 'Submit Application'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}