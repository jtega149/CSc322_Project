import React, { useEffect, useState } from 'react';
import { Users, AlertCircle, UserPlus, FileText, DollarSign, Package, Truck, Star, Gavel, BookOpen, Trash2, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Manager, Order } from '../../types';
import { mockChefs, mockDeliveryPeople, mockCustomers } from '../../lib/mockData';
import { formatCurrency, formatDate } from '../../lib/utils';
import { getAuth } from 'firebase/auth';
import { 
  getAllCustomers, 
  getRegistrations, 
  updateUser, 
  getAllChefs, 
  getAllDeliveryEmployees, 
  getEmployeeApplications, 
  hireEmployee, 
  rejectEmployee,
  getOrdersWithBids,
  acceptDeliveryBid,
  getAllComplaints,
  getAllDisputes,
  resolveDispute,
  getAllKnowledgeBaseEntries,
  getFlaggedKnowledgeBaseEntries,
  deleteKnowledgeBaseEntry,
  banAuthorFromKnowledgeBase
} from '../../userService';
import { useAuthContext } from '../../contexts/AuthContext';
import { ManageEmployeePage } from './ManageEmployeePage';
import { ManageCustomerPage } from './ManageCustomerPage';

interface ManagerDashboardProps {
  manager: Manager;
}

export function ManagerDashboard({ manager }: ManagerDashboardProps) {
  const pendingRegistrations = 3; // Mock data
  const totalEmployees = mockChefs.length + mockDeliveryPeople.length;
  const totalCustomers = mockCustomers.length;
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [chefs, setChefs] = useState<any[]>([]);
  const [deliveryPeople, setDeliveryPeople] = useState<any[]>([]);
  const [orderBids, setOrderBids] = useState<any[]>([]);
  const [orderBidsLoading, setOrderBidsLoading] = useState(true);
  const [selectedOrderBid, setSelectedOrderBid] = useState<any | null>(null);
  const [selectedBid, setSelectedBid] = useState<any | null>(null);
  const [overrideReason, setOverrideReason] = useState('');
  const [showOverridePage, setShowOverridePage] = useState(false);
  const [isAcceptingBid, setIsAcceptingBid] = useState(false);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [complaintsLoading, setComplaintsLoading] = useState(true);
  const [disputesLoading, setDisputesLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState<any | null>(null);
  const [disputeDecision, setDisputeDecision] = useState<'dismissed' | 'upheld' | ''>('');
  const [disputeDecisionReason, setDisputeDecisionReason] = useState('');
  const [isResolvingDispute, setIsResolvingDispute] = useState(false);
  const [knowledgeBaseEntries, setKnowledgeBaseEntries] = useState<any[]>([]);
  const [flaggedEntries, setFlaggedEntries] = useState<any[]>([]);
  const [knowledgeBaseLoading, setKnowledgeBaseLoading] = useState(true);
  const [flaggedEntriesLoading, setFlaggedEntriesLoading] = useState(true);
  const [managingEmployee, setManagingEmployee] = useState<any | null>(null);
  const [managingCustomer, setManagingCustomer] = useState<any | null>(null);

  // Calculate pending counts after state is declared
  const pendingComplaints = complaints.filter((c: any) => !c.managerDecision).length;
  const pendingDisputes = disputes.length;

  useEffect(() => {
    getAllRegistrations();
    getCustomers();
    getChefs();
    getEmployeeApps();
    getDeliveryEmployees();
    loadOrderBids();
    loadComplaints();
    loadDisputes();
    loadKnowledgeBase();
    loadFlaggedEntries();
  }, []);

  const loadComplaints = async () => {
    try {
      setComplaintsLoading(true);
      const allComplaints = await getAllComplaints();
      setComplaints(allComplaints);
    } catch (error: any) {
      console.error('Error loading complaints:', error);
    } finally {
      setComplaintsLoading(false);
    }
  };

  const loadDisputes = async () => {
    try {
      setDisputesLoading(true);
      const allDisputes = await getAllDisputes();
      setDisputes(allDisputes);
    } catch (error: any) {
      console.error('Error loading disputes:', error);
    } finally {
      setDisputesLoading(false);
    }
  };

  const loadKnowledgeBase = async () => {
    try {
      setKnowledgeBaseLoading(true);
      const entries = await getAllKnowledgeBaseEntries();
      setKnowledgeBaseEntries(entries);
    } catch (error: any) {
      console.error('Error loading knowledge base:', error);
    } finally {
      setKnowledgeBaseLoading(false);
    }
  };

  const loadFlaggedEntries = async () => {
    try {
      setFlaggedEntriesLoading(true);
      const flagged = await getFlaggedKnowledgeBaseEntries();
      setFlaggedEntries(flagged);
    } catch (error: any) {
      console.error('Error loading flagged entries:', error);
    } finally {
      setFlaggedEntriesLoading(false);
    }
  };

  const handleDeleteKnowledgeBaseEntry = async (entryId: string, authorId: string) => {
    if (!confirm('Are you sure you want to delete this knowledge base entry? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteKnowledgeBaseEntry(entryId);
      // Ban the author from providing future answers
      await banAuthorFromKnowledgeBase(authorId);
      // Reload both lists
      await loadKnowledgeBase();
      await loadFlaggedEntries();
      alert('Entry deleted and author banned from providing future answers.');
    } catch (error: any) {
      console.error('Error deleting knowledge base entry:', error);
      alert('Error deleting entry: ' + error.message);
    }
  };

  const handleResolveDispute = async () => {
    if (!selectedDispute || !disputeDecision || !disputeDecisionReason.trim() || !manager) {
      alert('Please select a decision and provide a reason');
      return;
    }

    setIsResolvingDispute(true);
    try {
      await resolveDispute(selectedDispute.id, manager.id, disputeDecision as 'dismissed' | 'upheld', disputeDecisionReason);
      await loadDisputes();
      await loadComplaints();
      setSelectedDispute(null);
      setDisputeDecision('');
      setDisputeDecisionReason('');
      alert('Dispute resolved successfully');
    } catch (error: any) {
      alert('Error resolving dispute: ' + error.message);
    } finally {
      setIsResolvingDispute(false);
    }
  };

  const loadOrderBids = async () => {
    try {
      setOrderBidsLoading(true);
      const bids = await getOrdersWithBids();
      setOrderBids(bids as any[]);
    } catch (error: any) {
      console.error('Error loading orders with bids:', error);
    } finally {
      setOrderBidsLoading(false);
    }
  };

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

  const getDeliveryEmployees = async () => {
    // Logic to get all delivery people
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (user) {
        const chefs = await getAllDeliveryEmployees(user.uid);
        setDeliveryPeople(chefs);
      }
    } catch (error) {
      console.error('Error fetching chefs:', error);
    }
  }

  const approveRegistration = async (regId: string) => {
    // Logic to approve registration
    try{
      await updateUser(regId, 
        { role: 'customer', 
          isVIP: false,
          accountBalance: 0,
          totalSpent: 0,
          orderCount: 0,
          warnings: [],
          orderHistory: [],
          favorites: [],
          isBlacklisted: false,
          freeDeliveriesEarned: 0,
          freeDeliveriesUsed: 0
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

  const approveApplication = async (regId: string) => {
    // Logic to approve application
    try {
      hireEmployee(regId)
      setApplications((prevApplications) =>
        prevApplications.filter((r) => r.id !== regId)
      );
    } catch (error) {
      console.error("Error approving job application")
    }
  };

  const rejectApplication = async (regId: string) => {
    try {
      rejectEmployee(regId)
      setApplications((prevApplications) =>
        prevApplications.filter((r) => r.id !== regId)
      );
    } catch (error) {
      console.error("Error rejecting this application")
    }
  }

  const getEmployeeApps = async () => {
    // Logic to get employee applications
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      getEmployeeApplications(user.uid).then((res) => {
        console.log('Employee applicatiomns::', res);
        setApplications(res);
      }).catch((error) => {
        console.error('Error fetching employee apps bro:', error);
      });
    }
  }

  const handleSelectOrderBid = (entry: any) => {
    setSelectedOrderBid(entry);
    setSelectedBid(null);
    setShowOverridePage(false);
    setOverrideReason('');
  };

  const handleStartAcceptBid = (bid: any) => {
    if (!selectedOrderBid) return;
    const { lowestBidAmount, lowestBidderId } = selectedOrderBid;
    const isLowest =
      lowestBidAmount !== null &&
      Math.abs(bid.bidAmount - lowestBidAmount) < 0.0001 &&
      bid.deliveryPersonId === lowestBidderId;

    setSelectedBid(bid);

    if (isLowest) {
      // Accept immediately with no override reason
      handleConfirmAcceptBid(bid, '');
    } else {
      // Require override reason on separate page
      setShowOverridePage(true);
    }
  };

  const handleConfirmAcceptBid = async (bid: any, reason: string) => {
    if (!selectedOrderBid || !manager) return;

    setIsAcceptingBid(true);
    try {
      await acceptDeliveryBid(
        selectedOrderBid.order.id,
        bid.deliveryPersonId,
        bid.bidAmount,
        manager.id,
        reason && reason.trim().length > 0 ? reason : undefined
      );

      // Refresh bids list
      await loadOrderBids();
      setSelectedOrderBid(null);
      setSelectedBid(null);
      setShowOverridePage(false);
      setOverrideReason('');
      alert('Bid accepted and order assigned for delivery.');
    } catch (error: any) {
      alert('Error accepting bid: ' + error.message);
    } finally {
      setIsAcceptingBid(false);
    }
  };

  // Override reason page when manager picks non-lowest bid
  if (showOverridePage && selectedOrderBid && selectedBid) {
    const { order, lowestBidAmount } = selectedOrderBid;
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Confirm Bid Selection for Order #{order.id.slice(0, 8)}</CardTitle>
            <CardDescription>
              You are selecting a bid that is not the lowest. Please provide a reason for this HR record.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-semibold">Order Total:</span>{' '}
                {formatCurrency(order.finalPrice)}
              </div>
              <div>
                <span className="font-semibold">Chosen Driver:</span>{' '}
                {selectedBid.deliveryPersonName} ({selectedBid.deliveryPersonId})
              </div>
              <div>
                <span className="font-semibold">Chosen Bid Amount:</span>{' '}
                {formatCurrency(selectedBid.bidAmount)}
              </div>
              <div>
                <span className="font-semibold">Lowest Bid Amount:</span>{' '}
                {lowestBidAmount !== null ? formatCurrency(lowestBidAmount) : 'N/A'}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="overrideReason">
                Reason for choosing this bid (required)
              </label>
              <textarea
                id="overrideReason"
                className="w-full border rounded-md px-3 py-2 text-sm"
                rows={4}
                placeholder="Explain why this driver was chosen over the lowest bidder..."
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  setShowOverridePage(false);
                  setOverrideReason('');
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => handleConfirmAcceptBid(selectedBid, overrideReason)}
                disabled={isAcceptingBid || !overrideReason.trim()}
              >
                {isAcceptingBid ? 'Saving...' : 'Confirm and Save HR Action'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show manage employee page if an employee is being managed
  // This must be after all hooks are called
  if (managingEmployee) {
    return (
      <ManageEmployeePage
        employee={managingEmployee}
        managerId={manager.id}
        onBack={() => {
          setManagingEmployee(null);
          getChefs();
          getDeliveryEmployees();
        }}
        onUpdate={() => {
          setManagingEmployee(null);
          getChefs();
          getDeliveryEmployees();
        }}
      />
    );
  }

  // Show manage customer page if a customer is being managed
  if (managingCustomer) {
    return (
      <ManageCustomerPage
        customer={managingCustomer}
        managerId={manager.id}
        onBack={() => {
          setManagingCustomer(null);
          getCustomers();
        }}
        onUpdate={() => {
          setManagingCustomer(null);
          getCustomers();
        }}
      />
    );
  }

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
            <div className="text-2xl">{chefs.length + deliveryPeople.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {chefs.length} chefs, {deliveryPeople.length} delivery
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Customers</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{customers.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {customers.filter(c => c.isVIP === true).length} VIP members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Pending Registrations</CardTitle>
            <UserPlus className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{applications.length + registrations.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {registrations.length} customer, {applications.length} employee
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Pending Complaints</CardTitle>
            <AlertCircle className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{pendingComplaints}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {pendingDisputes} disputes pending
            </p>
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
          <TabsTrigger value="orderBids">Current Order Bids</TabsTrigger>
          <TabsTrigger value="knowledgeBase">Knowledge Base</TabsTrigger>
        </TabsList>

        <TabsContent value="employees">
          <div className="space-y-6">
            {/* Chefs */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Chefs ({chefs.length})</CardTitle>
                    <CardDescription>Manage chef employees</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
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
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setManagingEmployee(chef)}
                          >
                            Manage
                          </Button>
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
                    <CardTitle>Delivery People ({deliveryPeople.length})</CardTitle>
                    <CardDescription>Manage delivery employees</CardDescription>
                  </div>
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
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deliveryPeople.map(person => (
                      <TableRow key={person.id}>
                        <TableCell>{person.name}</TableCell>
                        <TableCell>{person.email}</TableCell>
                        <TableCell>{person.averageRating.toFixed(1)}</TableCell>
                        <TableCell>{person.deliveryCount || 0}</TableCell>
                        <TableCell>{formatCurrency(person.salary)}</TableCell>
                        <TableCell>
                          <Badge variant={person.status === 'active' ? 'default' : 'destructive'}>
                            {person.status || 'active'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setManagingEmployee(person)}
                          >
                            Manage
                          </Button>
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
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setManagingCustomer(customer)}
                        >
                          Manage
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="complaints">
          <div className="space-y-6">
            {/* Disputes Section */}
            {pendingDisputes > 0 && (
              <Card className="border-l-4 border-l-orange-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gavel className="w-5 h-5" />
                    Pending Disputes ({pendingDisputes})
                  </CardTitle>
                  <CardDescription>
                    Review and resolve disputes on complaints
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {disputesLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                      <p className="text-sm text-muted-foreground">Loading disputes...</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {disputes.map((dispute) => (
                        <Card key={dispute.id} className="border-l-4 border-l-orange-500">
                          <CardContent className="pt-6">
                            <div className="space-y-4">
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="destructive">Complaint</Badge>
                                  <Badge variant="outline">Disputed</Badge>
                                  <span className="text-sm text-muted-foreground">
                                    Order #{dispute.orderId?.slice(0, 8) || 'N/A'}
                                  </span>
                                </div>
                                <p className="font-semibold">
                                  Complaint against {dispute.targetName} ({dispute.targetType})
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  From {dispute.customerName} • {formatDate(dispute.createdAt)}
                                </p>
                                <div className="flex items-center gap-1 mt-2">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      className={`w-4 h-4 ${
                                        star <= dispute.rating
                                          ? 'fill-yellow-400 text-yellow-400'
                                          : 'text-gray-300'
                                      }`}
                                    />
                                  ))}
                                  <span className="text-sm ml-2">Rating: {dispute.rating}/5</span>
                                </div>
                                {dispute.comment && (
                                  <p className="text-sm mt-3 p-3 bg-red-50 rounded-md">
                                    <strong>Complaint:</strong> {dispute.comment}
                                  </p>
                                )}
                                {dispute.disputeReason && (
                                  <p className="text-sm mt-3 p-3 bg-blue-50 rounded-md">
                                    <strong>Dispute Reason:</strong> {dispute.disputeReason}
                                  </p>
                                )}
                              </div>

                              {!selectedDispute || selectedDispute.id !== dispute.id ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSelectedDispute(dispute)}
                                >
                                  Review Dispute
                                </Button>
                              ) : (
                                <div className="space-y-3 pt-4 border-t">
                                  <div>
                                    <Label>Decision</Label>
                                    <div className="flex gap-4 mt-2">
                                      <Button
                                        variant={disputeDecision === 'dismissed' ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setDisputeDecision('dismissed')}
                                      >
                                        Dismiss Complaint
                                      </Button>
                                      <Button
                                        variant={disputeDecision === 'upheld' ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setDisputeDecision('upheld')}
                                      >
                                        Uphold Complaint
                                      </Button>
                                    </div>
                                  </div>
                                  <div>
                                    <Label htmlFor="decision-reason">Decision Reason</Label>
                                    <Textarea
                                      id="decision-reason"
                                      placeholder="Explain your decision..."
                                      value={disputeDecisionReason}
                                      onChange={(e) => setDisputeDecisionReason(e.target.value)}
                                      className="mt-2"
                                      rows={4}
                                    />
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      onClick={handleResolveDispute}
                                      disabled={isResolvingDispute || !disputeDecision || !disputeDecisionReason.trim()}
                                    >
                                      {isResolvingDispute ? 'Resolving...' : 'Submit Decision'}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setSelectedDispute(null);
                                        setDisputeDecision('');
                                        setDisputeDecisionReason('');
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* All Complaints Section */}
            <Card>
              <CardHeader>
                <CardTitle>All Complaints</CardTitle>
                <CardDescription>
                  Review all customer and employee complaints
                </CardDescription>
              </CardHeader>
              <CardContent>
                {complaintsLoading ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p>Loading complaints...</p>
                  </div>
                ) : complaints.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No complaints at this time</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {complaints.map((complaint) => (
                      <Card 
                        key={complaint.id} 
                        className={`border-l-4 ${
                          complaint.isDisputed 
                            ? 'border-l-orange-500' 
                            : complaint.managerDecision === 'dismissed'
                            ? 'border-l-green-500'
                            : 'border-l-red-500'
                        }`}
                      >
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="destructive">Complaint</Badge>
                                {complaint.isDisputed && (
                                  <Badge variant="outline">Disputed</Badge>
                                )}
                                {complaint.managerDecision && (
                                  <Badge variant={complaint.managerDecision === 'dismissed' ? 'default' : 'destructive'}>
                                    {complaint.managerDecision === 'dismissed' ? 'Dismissed' : 'Upheld'}
                                  </Badge>
                                )}
                                <span className="text-sm text-muted-foreground">
                                  Order #{complaint.orderId?.slice(0, 8) || 'N/A'}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                  • {complaint.targetType === 'chef' ? 'Chef' : complaint.targetType === 'delivery' ? 'Delivery' : 'Customer'}
                                </span>
                              </div>
                              <p className="font-semibold mt-2">
                                {complaint.targetName} ({complaint.targetType})
                              </p>
                              <p className="text-sm text-muted-foreground">
                                From {complaint.customerName} • {formatDate(complaint.createdAt)}
                              </p>
                              <div className="flex items-center gap-1 mt-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`w-4 h-4 ${
                                      star <= complaint.rating
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                                <span className="text-sm ml-2">Rating: {complaint.rating}/5</span>
                              </div>
                              {complaint.comment && (
                                <p className="text-sm mt-3 p-3 bg-red-50 rounded-md">{complaint.comment}</p>
                              )}
                              {complaint.disputeReason && (
                                <p className="text-sm mt-3 p-3 bg-blue-50 rounded-md">
                                  <strong>Dispute:</strong> {complaint.disputeReason}
                                </p>
                              )}
                              {complaint.managerDecisionReason && (
                                <p className="text-sm mt-3 p-3 bg-gray-50 rounded-md">
                                  <strong>Manager Decision:</strong> {complaint.managerDecisionReason}
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
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

          {/* Employee Applications */}
          <Card>
            <CardHeader>
              <CardTitle>Employee Applications</CardTitle>
              <CardDescription>
                Approve or reject employee applications
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/*<div className="text-center py-12 text-muted-foreground">*/}
                {applications.length === 0 ? (
                  <>
                    <p>No employee applications</p> 
                    <UserPlus className="w-12 h-12 mx-auto mb-4 opacity-50" /> 
                  </>
                )
                : 
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Desired Role</TableHead>
                        <TableHead>Applied On</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {applications.map((reg) => (
                        <TableRow key={reg.id}>
                          <TableCell>{reg.name}</TableCell>
                          <TableCell>{reg.email}</TableCell>
                          <TableCell>{reg.desired_role}</TableCell>
                          <TableCell>{new Date(reg.createdAt.seconds * 1000).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm" className="mr-2 cursor-pointer" onClick={() => approveApplication(reg.id) }>Approve</Button>
                            <Button variant="destructive" size="sm" className="cursor-pointer" onClick={() => rejectApplication(reg.id) }>Reject</Button>
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

        <TabsContent value="orderBids">
          <Card>
            <CardHeader className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Current Order Bids ({orderBids.length})
                </CardTitle>
                <CardDescription>
                  View all orders with delivery bids and assign a driver.
                </CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={loadOrderBids}>
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              {orderBidsLoading ? (
                <div className="text-center py-12 text-muted-foreground">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p>Loading orders with bids...</p>
                </div>
              ) : orderBids.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No orders currently have bids.</p>
                </div>
              ) : selectedOrderBid ? (
                // Detail view for a selected order
                <div className="space-y-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedOrderBid(null);
                      setSelectedBid(null);
                    }}
                    className="mb-2"
                  >
                    Back to all orders
                  </Button>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Truck className="w-5 h-5" />
                        Order #{selectedOrderBid.order.id.slice(0, 8)}
                      </CardTitle>
                      <CardDescription>
                        Placed {formatDate(selectedOrderBid.order.createdAt)} • Total{' '}
                        {formatCurrency(selectedOrderBid.order.finalPrice)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-semibold">Status:</span>{' '}
                          {selectedOrderBid.order.status}
                        </div>
                        {selectedOrderBid.order.deliveryInfo && (
                          <div>
                            <span className="font-semibold">Delivery Address:</span>{' '}
                            {selectedOrderBid.order.deliveryInfo.streetAddress},{' '}
                            {selectedOrderBid.order.deliveryInfo.city}
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-semibold text-sm">Bids</h3>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Driver</TableHead>
                              <TableHead>Bid Amount</TableHead>
                              <TableHead>Placed At</TableHead>
                              <TableHead>Lowest?</TableHead>
                              <TableHead>Action</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedOrderBid.bids
                              .slice()
                              .sort((a: any, b: any) => a.bidAmount - b.bidAmount)
                              .map((bid: any, idx: number) => {
                                const isLowest =
                                  selectedOrderBid.lowestBidAmount !== null &&
                                  Math.abs(bid.bidAmount - selectedOrderBid.lowestBidAmount) < 0.0001 &&
                                  bid.deliveryPersonId === selectedOrderBid.lowestBidderId;
                                return (
                                  <TableRow key={idx}>
                                    <TableCell>{bid.deliveryPersonName}</TableCell>
                                    <TableCell>{formatCurrency(bid.bidAmount)}</TableCell>
                                    <TableCell>{formatDate(bid.createdAt)}</TableCell>
                                    <TableCell>
                                      {isLowest ? (
                                        <Badge className="bg-green-100 text-green-800">
                                          Lowest
                                        </Badge>
                                      ) : (
                                        ''
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleStartAcceptBid(bid)}
                                        disabled={isAcceptingBid}
                                      >
                                        Select Bid
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                // List of all orders with bids
                <div className="space-y-4">
                  {orderBids.map((entry) => {
                    const order = entry.order as Order;
                    const bidCount = entry.bids?.length || 0;
                    const lowestBidAmount = entry.lowestBidAmount;
                    return (
                      <Card
                        key={order.id}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleSelectOrderBid(entry)}
                      >
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-base">
                                Order #{order.id.slice(0, 8)}
                              </CardTitle>
                              <CardDescription>
                                Placed {formatDate(order.createdAt)} • Status {order.status}
                              </CardDescription>
                              {order.deliveryInfo && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  Deliver to: {order.deliveryInfo.streetAddress},{' '}
                                  {order.deliveryInfo.city}
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="text-sm">
                                <span className="font-semibold">{bidCount}</span> bids
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Lowest:{' '}
                                {lowestBidAmount !== null
                                  ? formatCurrency(lowestBidAmount)
                                  : 'N/A'}
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="knowledgeBase">
          <div className="space-y-6">
            {/* Flagged Entries Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  Flagged Entries ({flaggedEntries.length})
                </CardTitle>
                <CardDescription>
                  Knowledge base entries that received a 0 (outrageous) rating from users
                </CardDescription>
              </CardHeader>
              <CardContent>
                {flaggedEntriesLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading flagged entries...</div>
                ) : flaggedEntries.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No flagged entries. All knowledge base entries are in good standing.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {flaggedEntries.map((entry) => (
                      <Card key={entry.id} className="border-destructive">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-lg">{entry.question}</CardTitle>
                              <CardDescription className="mt-2">{entry.answer}</CardDescription>
                              <div className="flex gap-2 mt-3">
                                <Badge variant="outline">Category: {entry.category}</Badge>
                                <Badge variant="destructive">Flagged</Badge>
                                <Badge variant="secondary">Author ID: {entry.authorId}</Badge>
                                <Badge variant="outline">
                                  Created: {formatDate(entry.createdAt)}
                                </Badge>
                              </div>
                            </div>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteKnowledgeBaseEntry(entry.id, entry.authorId)}
                              className="ml-4 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete & Ban Author
                            </Button>
                          </div>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* All Knowledge Base Entries */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  All Knowledge Base Entries ({knowledgeBaseEntries.length})
                </CardTitle>
                <CardDescription>
                  View and manage all knowledge base entries
                </CardDescription>
              </CardHeader>
              <CardContent>
                {knowledgeBaseLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading knowledge base...</div>
                ) : knowledgeBaseEntries.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No knowledge base entries found.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {knowledgeBaseEntries.map((entry) => (
                      <Card key={entry.id} className={entry.isFlagged ? 'border-destructive' : ''}>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-lg">{entry.question}</CardTitle>
                              <CardDescription className="mt-2">{entry.answer}</CardDescription>
                              <div className="flex gap-2 mt-3">
                                <Badge variant="outline">Category: {entry.category}</Badge>
                                {entry.isFlagged && (
                                  <Badge variant="destructive">Flagged</Badge>
                                )}
                                <Badge variant="secondary">Author ID: {entry.authorId}</Badge>
                                <Badge variant="outline">
                                  Rating: {entry.rating > 0 ? entry.rating.toFixed(1) : 'N/A'} ({entry.ratingCount} ratings)
                                </Badge>
                                <Badge variant="outline">
                                  Created: {formatDate(entry.createdAt)}
                                </Badge>
                              </div>
                            </div>
                            {entry.isFlagged && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteKnowledgeBaseEntry(entry.id, entry.authorId)}
                                className="ml-4 cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete & Ban Author
                              </Button>
                            )}
                          </div>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
