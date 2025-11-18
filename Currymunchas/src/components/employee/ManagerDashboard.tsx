import { Users, AlertCircle, UserPlus, FileText, DollarSign } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Manager } from '../../types';
import { mockChefs, mockDeliveryPeople, mockCustomers } from '../../lib/mockData';
import { formatCurrency } from '../../lib/utils';
import { getAuth } from 'firebase/auth';
import { getAllCustomers, getRegistrations, updateUser, getAllChefs} from '../../userService';
import { useEffect, useState } from 'react';
import { get } from 'http';

interface ManagerDashboardProps {
  manager: Manager;
}

export function ManagerDashboard({ manager }: ManagerDashboardProps) {
  const pendingRegistrations = 3; // Mock data
  const pendingComplaints = 5; // Mock data
  const totalEmployees = mockChefs.length + mockDeliveryPeople.length;
  const totalCustomers = mockCustomers.length;
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [addingChef, setAddingChef] = useState<boolean>(false);
  const [newChefName, setNewChefName] = useState<string>('');
  const [newChefEmail, setNewChefEmail] = useState<string>('');
  const [chefs, setChefs] = useState<any[]>([]);
  const [deliveryPeople, setDeliveryPeople] = useState<any[]>([]);

  useEffect(() => {
    getAllRegistrations();
    getCustomers();
    getChefs();
  }, []);

  const getAllRegistrations = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      getRegistrations(user.uid).then((registrations) => {
        console.log('Registrations:', registrations);
        setRegistrations(registrations);
      }).catch((error) => {
        console.error('Error fetching registrations:', error);
      });
    }
  };

  const getCustomers = async () => {
    // Logic to get all customers
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      getAllCustomers(user.uid).then((customers) => {
        console.log('Customers:', customers);
        setCustomers(customers);
      }).catch((error) => {
        console.error('Error fetching customers:', error);
      });
    }
  };

  const getChefs = async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      console.log("testing current user:", user!.uid);
      if (user) {
        const chefs = await getAllChefs(user.uid);
        setChefs(chefs);
      }
    } catch (error) {
      console.error('Error fetching chefs:', error);
    }
  };

  const approveRegistration = async (regId: string) => {
    // Logic to approve registration
    try{
      await updateUser(regId, 
        { role: 'Customer', 
          isVIP: false,
          accountBalance: 0,
          orders: 0,
          warnings: 0
        });
      setRegistrations((prevRegistrations) =>
        prevRegistrations.filter((r) => r.id !== regId)
      );
    } catch (error) {
      console.error('Error approving registration:', error);
    }
  };
  const rejectRegistration = async (regId: string) => {
    // Logic to reject registration
    try{
      await updateUser(regId, { role: 'Rejected' });
      setRegistrations((prevRegistrations) =>
        prevRegistrations.filter((r) => r.id !== regId)
      );
    } catch (error) {
      console.error('Error approving registration:', error);
    }
  };

  const addChef = async (name: string, email: string) => {
    const tempPassword = "welcome123"; // In real app, generate secure temp password and email it
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No manager user found.'); // This shouldnt happen but fuck it, better to be safe
      }
      //await createEmployeeAccount(email, tempPassword, name, 'chef', user.uid);
      getChefs(); // To update upon adding a chef
    } catch (error) {
      console.error('Error adding chef:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Employees</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{totalEmployees}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {mockChefs.length} chefs, {mockDeliveryPeople.length} delivery
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Customers</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{totalCustomers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {mockCustomers.filter(c => c.role === 'vip').length} VIP members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Pending Registrations</CardTitle>
            <UserPlus className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{pendingRegistrations}</div>
            <Button size="sm" className="mt-2">Review Applications</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Pending Complaints</CardTitle>
            <AlertCircle className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{pendingComplaints}</div>
            <Button size="sm" className="mt-2">Review Complaints</Button>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="employees" className="space-y-6">
        <TabsList>
          <TabsTrigger value="employees">Employees</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="complaints">Complaints</TabsTrigger>
          <TabsTrigger value="registrations">Registrations</TabsTrigger>
          <TabsTrigger value="knowledge">Knowledge Base</TabsTrigger>
        </TabsList>

        <TabsContent value="employees">
          <div className="space-y-6">
            {/* Chefs */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Chefs ({mockChefs.length})</CardTitle>
                    <CardDescription>Manage chef employees</CardDescription>
                  </div>
                  <Button className="cursor-pointer" onClick={() => setAddingChef(true)}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Hire Chef
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {addingChef && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      addChef(newChefName, newChefEmail);
                      setAddingChef(false);
                      setNewChefName('');
                      setNewChefEmail('');
                    }}
                    className="mb-4 space-y-2"
                  >
                    <input
                      type="text"
                      placeholder="Name"
                      value={newChefName}
                      onChange={(e) => setNewChefName(e.target.value)}
                      className="border rounded px-2 py-1 w-full"
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={newChefEmail}
                      onChange={(e) => setNewChefEmail(e.target.value)}
                      className="border rounded px-2 py-1 w-full"
                    />
                    <div className="flex space-x-2 mt-2">
                      <Button type="submit" className="cursor-pointer">Submit</Button>
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => {
                          setAddingChef(false);
                          setNewChefName('');
                          setNewChefEmail('');
                        }}
                        className="cursor-pointer"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Salary</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {chefs.map((chef) => (
                      <TableRow key={chef.id}>
                        <TableCell>{chef.name}</TableCell>
                        <TableCell>{chef.email}</TableCell>
                        <TableCell>{chef.averageRating.toFixed(1)}</TableCell>
                        <TableCell>{formatCurrency(chef.salary)}</TableCell>
                        <TableCell>
                          <Badge variant={chef.status === 'active' ? 'default' : 'destructive'}>
                            {chef.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">Manage</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Delivery People */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Delivery People ({mockDeliveryPeople.length})</CardTitle>
                    <CardDescription>Manage delivery employees</CardDescription>
                  </div>
                  <Button>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Hire Delivery Person
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Deliveries</TableHead>
                      <TableHead>Salary</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockDeliveryPeople.map(person => (
                      <TableRow key={person.id}>
                        <TableCell>{person.name}</TableCell>
                        <TableCell>{person.email}</TableCell>
                        <TableCell>{person.averageRating.toFixed(1)}</TableCell>
                        <TableCell>{person.deliveryCount}</TableCell>
                        <TableCell>{formatCurrency(person.salary)}</TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">Manage</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="customers">
          <Card>
            <CardHeader>
              <CardTitle>Customer Management</CardTitle>
              <CardDescription>
                Manage customer accounts, warnings, and blacklist
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead>Warnings</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map(customer => (
                    <TableRow key={customer.id}>
                      <TableCell>{customer.name}</TableCell>
                      <TableCell>{customer.email}</TableCell>
                      <TableCell>
                        <Badge variant={customer.isVip === true ? 'default' : 'secondary'}>
                          {customer.isVip === true ? 'VIP' : 'Regular'}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(customer.accountBalance)}</TableCell>
                      <TableCell>{customer.orders}</TableCell>
                      <TableCell>
                        {customer.warnings > 0 ? (
                          <Badge variant="destructive">{customer.warnings}</Badge>
                        ) : (
                          <span className="text-muted-foreground">None</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" className="cursor-pointer">Manage</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="complaints">
          <Card>
            <CardHeader>
              <CardTitle>Complaint Management</CardTitle>
              <CardDescription>
                Review and resolve customer and employee complaints
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Complaint management interface will appear here</p>
                <Button className="mt-4">View All Complaints</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="registrations">
          <Card>
            <CardHeader>
              <CardTitle>Registration Applications</CardTitle>
              <CardDescription>
                Approve or reject customer registration requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/*<div className="text-center py-12 text-muted-foreground">*/}
                {registrations.length === 0 ? (
                  <>
                    <p>No pending registration applications</p> 
                    <UserPlus className="w-12 h-12 mx-auto mb-4 opacity-50" /> 
                  </>
                )
                : 
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Applied On</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {registrations.map((reg) => (
                        <TableRow key={reg.id}>
                          <TableCell>{reg.name}</TableCell>
                          <TableCell>{reg.email}</TableCell>
                          <TableCell>{reg.role}</TableCell>
                          <TableCell>{new Date(reg.createdAt.seconds * 1000).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm" className="mr-2 cursor-pointer" onClick={() => approveRegistration(reg.id) }>Approve</Button>
                            <Button variant="destructive" size="sm" className="cursor-pointer" onClick={() => rejectRegistration(reg.id) }>Reject</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                }
              {/*</div>*/}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="knowledge">
          <Card>
            <CardHeader>
              <CardTitle>Knowledge Base Management</CardTitle>
              <CardDescription>
                Review and moderate knowledge base entries
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Knowledge base moderation interface will appear here</p>
                <Button className="mt-4">View Flagged Entries</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
