import { useState, useEffect } from 'react';
import { ArrowLeft, DollarSign, UserX, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { formatCurrency } from '../../lib/utils';
import { updateEmployeeSalary, fireEmployee, getActiveEmployeeCount } from '../../userService';

interface ManageEmployeePageProps {
  employee: {
    id: string;
    name: string;
    email: string;
    role: 'chef' | 'delivery';
    salary: number;
    status: string;
    averageRating: number;
    deliveryCount?: number;
  };
  managerId: string;
  onBack: () => void;
  onUpdate: () => void;
}

export function ManageEmployeePage({
  employee,
  managerId,
  onBack,
  onUpdate
}: ManageEmployeePageProps) {
  const [newSalary, setNewSalary] = useState(employee.salary.toString());
  const [isUpdatingSalary, setIsUpdatingSalary] = useState(false);
  const [isFiring, setIsFiring] = useState(false);
  const [error, setError] = useState('');
  const [activeCount, setActiveCount] = useState<number | null>(null);
  const [loadingCount, setLoadingCount] = useState(true);

  useEffect(() => {
    const loadActiveCount = async () => {
      try {
        setLoadingCount(true);
        const count = await getActiveEmployeeCount(employee.role);
        setActiveCount(count);
      } catch (error: any) {
        console.error('Error loading active employee count:', error);
        setActiveCount(null);
      } finally {
        setLoadingCount(false);
      }
    };

    loadActiveCount();
  }, [employee.role]);

  const handleUpdateSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const salaryValue = parseFloat(newSalary);
    if (isNaN(salaryValue) || salaryValue < 0) {
      setError('Please enter a valid salary amount');
      return;
    }

    if (salaryValue === employee.salary) {
      setError('New salary must be different from current salary');
      return;
    }

    setIsUpdatingSalary(true);
    try {
      await updateEmployeeSalary(employee.id, salaryValue, managerId);
      alert(`Salary updated successfully to ${formatCurrency(salaryValue)}`);
      onUpdate();
    } catch (error: any) {
      setError(error.message || 'Failed to update salary');
    } finally {
      setIsUpdatingSalary(false);
    }
  };

  const handleFireEmployee = async () => {
    if (!confirm(`Are you sure you want to fire ${employee.name}? This action cannot be undone.`)) {
      return;
    }

    // Check if firing would result in less than 2 active employees
    if (activeCount !== null && activeCount <= 2 && employee.status === 'active') {
      setError(`Cannot fire ${employee.name}. There must be at least 2 active ${employee.role === 'chef' ? 'chefs' : 'delivery drivers'}.`);
      return;
    }

    setIsFiring(true);
    setError('');
    try {
      await fireEmployee(employee.id, managerId);
      alert(`${employee.name} has been fired and their status set to inactive.`);
      onUpdate();
    } catch (error: any) {
      setError(error.message || 'Failed to fire employee');
    } finally {
      setIsFiring(false);
    }
  };

  const canFire = activeCount !== null && activeCount > 2 && employee.status === 'active';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Button variant="ghost" onClick={onBack} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Employees
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Manage Employee: {employee.name}
          </CardTitle>
          <CardDescription>
            {employee.role === 'chef' ? 'Chef' : 'Delivery Driver'} Management
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Employee Information */}
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Email</div>
                <div className="text-sm">{employee.email}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Role</div>
                <Badge>{employee.role === 'chef' ? 'Chef' : 'Delivery Driver'}</Badge>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Status</div>
                <Badge variant={employee.status === 'active' ? 'default' : 'destructive'}>
                  {employee.status}
                </Badge>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Rating</div>
                <div className="text-sm">⭐ {employee.averageRating.toFixed(1)}</div>
              </div>
              {employee.role === 'delivery' && employee.deliveryCount !== undefined && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Total Deliveries</div>
                  <div className="text-sm">{employee.deliveryCount}</div>
                </div>
              )}
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Update Salary Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <DollarSign className="w-5 h-5" />
                Update Salary
              </CardTitle>
              <CardDescription>
                Current salary: {formatCurrency(employee.salary)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateSalary} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="salary">New Salary</Label>
                  <Input
                    id="salary"
                    type="number"
                    min="0"
                    step="0.01"
                    value={newSalary}
                    onChange={(e) => setNewSalary(e.target.value)}
                    placeholder="Enter new salary"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isUpdatingSalary || parseFloat(newSalary) === employee.salary}
                >
                  {isUpdatingSalary ? 'Updating...' : 'Update Salary'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Fire Employee Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-red-600">
                <UserX className="w-5 h-5" />
                Fire Employee
              </CardTitle>
              <CardDescription>
                Fire this employee and set their status to inactive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingCount ? (
                <div className="text-sm text-muted-foreground">Checking employee count...</div>
              ) : activeCount !== null && (
                <div className="text-sm text-muted-foreground">
                  Currently {activeCount} active {employee.role === 'chef' ? 'chef(s)' : 'delivery driver(s)'}
                </div>
              )}

              {employee.status === 'inactive' ? (
                <Alert>
                  <AlertDescription>
                    This employee is already inactive (fired).
                  </AlertDescription>
                </Alert>
              ) : !canFire ? (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Cannot fire this employee. There must be at least 2 active {employee.role === 'chef' ? 'chefs' : 'delivery drivers'} at all times.
                    {activeCount !== null && (
                      <span className="block mt-1">
                        Currently: {activeCount} active {employee.role === 'chef' ? 'chef(s)' : 'delivery driver(s)'}
                      </span>
                    )}
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Warning:</strong> Firing this employee will:
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Set their status to inactive</li>
                      {employee.role === 'chef' && <li>Delete all dishes created by this chef</li>}
                      <li>This action cannot be undone</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              <Button
                variant="destructive"
                onClick={handleFireEmployee}
                disabled={isFiring || employee.status === 'inactive' || !canFire}
                className="w-full"
              >
                {isFiring ? 'Firing...' : employee.status === 'inactive' ? 'Already Inactive' : 'Fire Employee'}
              </Button>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}

