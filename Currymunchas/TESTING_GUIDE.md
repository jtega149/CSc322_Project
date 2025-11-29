# Testing Guide for Currymunchas Restaurant System

## **Purpose**: This guide helps testers navigate and test all features of the restaurant management system.

---

## **Login Credentials**

### Manager Account
- **Email**: `admin@manager.com`
- **Password**: `manager123`

### Chef Accounts
- **Chef 1**: 
  - Email: `chef1@restaurant.com`
  - Password: `testing123`
- **Chef 2**: 
  - Email: `chef2@restaurant.com`
  - Password: `testing123`

### Delivery Driver Accounts
- **Driver 1**: 
  - Email: `delivery1@restaurant.com`
  - Password: `testing123`
- **Driver 2**: 
  - Email: `delivery2@restaurant.com`
  - Password: `testing123`

### Customer Accounts
- Create your own customer account through the registration form!

---

## **Testing Scenarios**

### **1. Visitor Testing (Not Logged In)**

#### Browse Menu
1. Visit the landing page
2. You should see:
   - Most Popular Dishes section
   - Top Rated Chefs section
   - Browse Menu tab with all dishes
3. Click on dishes to see descriptions and prices

#### AI Chat
1. Click on "AI Assistant" tab
2. Ask questions like:
   - "What are your opening hours?"
   - "Do you have vegetarian options?"
   - "How do I become a VIP?"
3. Try rating responses (if logged in, you can rate knowledge base answers)

#### Registration
1. Click "Register" tab
2. Fill out the registration form
3. Submit and wait for manager approval
4. Manager must approve your registration before you can log in

---

### **2. Customer Testing**

#### Registration & Login
1. Register a new account (if not already done)
2. Wait for manager approval
3. Log in with your credentials

#### Deposit Money
1. After logging in, go to your dashboard
2. Click "Deposit Money" button
3. Add funds to your account (e.g., $50, $100)
4. Verify balance updates

#### Browse & Order
1. Browse the menu
2. Add dishes to cart
3. Go to checkout
4. Fill in delivery information
5. Place order
6. Verify:
   - Account balance decreases
   - Order appears in "My Orders"
   - Order count increases

#### VIP Status Testing
1. Make 3 orders OR spend $100+ to become VIP
2. Verify:
   - VIP badge appears on dashboard
   - 5% discount applied at checkout
   - Free delivery option appears (1 per 3 orders)
   - VIP-only dishes become visible

#### Rating System
1. After receiving an order, go to "My Orders"
2. Rate the chef (1-5 stars)
3. Rate the delivery person (1-5 stars)
4. Add comments (compliments or complaints)

#### Discussion Forum
1. Go to "Discussions" tab
2. Create a new discussion about a dish, chef, or delivery experience
3. Reply to existing discussions
4. Test the "Report" button on comments/discussions you disagree with

#### Complaints/Compliments
1. After rating an order, you can file a complaint or compliment
2. File a complaint against a chef or delivery person
3. Wait for manager review
4. If the complaint is disputed, you can respond

---

### **3. Chef Testing**

#### Login
1. Log in with chef credentials
2. You should see the Chef Dashboard

#### Create Dishes
1. Go to "My Dishes" section
2. Click "Create New Dish"
3. Fill in:
   - Name, description, price
   - Upload an image URL
   - Select category
   - Mark as VIP-only (optional)
4. Save the dish
5. Verify it appears in your dishes list

#### Accept Orders
1. Go to "Pending Orders" section
2. See orders waiting for a chef
3. Click "Accept Order" on an order
4. Order moves to "Preparing Orders"

#### Mark Orders Ready
1. In "Preparing Orders", click "Mark as Ready"
2. Order status changes to "ready"
3. Delivery drivers can now bid on it

#### View Feedback
1. Check "Feedback" section
2. See ratings, compliments, and complaints from customers
3. Monitor your average rating

---

### **4. Delivery Driver Testing**

#### Login
1. Log in with delivery driver credentials
2. You should see the Delivery Dashboard

#### Bid on Orders
1. Go to "Available Orders" section
2. See orders with status "ready" or "preparing"
3. Enter a bid amount (lower is better)
4. Click "Submit Bid"
5. Manager will see all bids and assign the order

#### View Active Deliveries
1. Once assigned an order, it appears in "Active Deliveries"
2. Click "Finish Delivery" when completed
3. Your delivery count increases

#### Rate Customers
1. After completing a delivery, go to "Delivery History"
2. Rate the customer (1-5 stars)
3. Add a compliment or complaint about the customer

#### View Feedback
1. Check feedback section to see customer ratings
2. Monitor your performance score

---

### **5. Manager Testing**

#### Approve Registrations
1. Log in as manager
2. Go to "Registrations" tab
3. See pending customer registrations
4. Click "Approve" or "Reject"

#### Hire Employees
1. Go to "Employees" tab
2. See employee applications
3. Click "Hire" to approve applications
4. Employees are added to the system

#### Manage Complaints
1. Go to "Complaints" tab
2. See all complaints and compliments
3. Review disputes
4. Make decisions:
   - **Dismiss**: Complainant gets a warning
   - **Upheld**: Target gets a warning, content is removed if it's a discussion/comment

#### Handle Disputes
1. When someone disputes a complaint, it appears in "Disputes"
2. Review the dispute reason
3. Make final decision:
   - **Dismiss**: Original complaint stands, complainant gets warning
   - **Upheld**: Complaint is valid, target gets warning

#### Manage Orders & Bids
1. Go to "Current Order Bids" tab
2. See all orders with delivery bids
3. Assign orders:
   - Usually assign to lowest bidder
   - Can override and assign to higher bidder (must provide memo/justification)

#### Manage Employees
1. Go to "Employees" tab
2. View all chefs and delivery people
3. See their:
   - Ratings
   - Salaries
   - Status (active/demoted/fired)
   - Complaints/compliments
4. System automatically:
   - Demotes employees with low ratings (<2) or 3+ complaints
   - Fires employees demoted twice
   - Gives bonuses to employees with high ratings (>4) or 3+ compliments

#### Manage Customers
1. Go to "Customers" tab
2. View all customers
3. See their:
   - VIP status
   - Account balance
   - Order count
   - Warnings
4. Can manage customer accounts (clear deposits, close accounts, blacklist)

#### Knowledge Base Management
1. Go to "Knowledge Base" tab
2. View all knowledge base entries
3. See flagged entries (rated 0 by users)
4. Delete bad entries
5. Ban authors from contributing

---

## **Key Features to Test**

### VIP System
- [ ] Make 3 orders → Should become VIP
- [ ] Spend $100+ → Should become VIP
- [ ] VIP gets 5% discount
- [ ] VIP gets 1 free delivery per 3 orders
- [ ] VIP complaints count 2x weight
- [ ] VIP with 2 warnings → Downgraded to regular customer

### Warning System
- [ ] Insufficient balance → Automatic warning
- [ ] False complaint dismissed → Warning to complainant
- [ ] 3 warnings (regular customer) → Deregistered
- [ ] 2 warnings (VIP) → Downgraded to regular
- [ ] Warnings displayed on dashboard

### Employee Management
- [ ] Chef with <2 rating (3+ times) → Demoted
- [ ] Chef with 3+ complaints → Demoted
- [ ] Chef demoted twice → Fired
- [ ] Chef with >4 rating (3+ times) → Bonus
- [ ] Chef with 3+ compliments → Bonus
- [ ] Same rules apply to delivery people

### Delivery Bidding
- [ ] Multiple drivers bid on same order
- [ ] Manager sees all bids
- [ ] Manager assigns to lowest bidder
- [ ] Manager can override with justification

### Discussion Forum
- [ ] Create discussions
- [ ] Reply to discussions
- [ ] Report comments/discussions
- [ ] Manager upholds complaint → Content removed

### AI Chat
- [ ] Searches knowledge base first
- [ ] Falls back to Gemini LLM
- [ ] Can rate knowledge base answers
- [ ] Rating 0 flags for manager review

---

## **Common Issues & Solutions**

### Can't log in after registration
- **Solution**: Manager must approve your registration first

### Order rejected
- **Check**: Account balance must be sufficient (order total + tip)

### Can't see VIP dishes
- **Check**: You must be a VIP customer

### Delivery bid not showing
- **Check**: Order must be in "ready" or "preparing" status
- **Check**: Chef must have marked order as ready

### Complaints not appearing
- **Check**: Manager must review them in the Complaints tab

---

## 📝 **Testing Checklist**

### Basic Functionality
- [ ] Visitor can browse menu
- [ ] Visitor can use AI chat
- [ ] Visitor can register
- [ ] Customer can log in
- [ ] Customer can deposit money
- [ ] Customer can place orders
- [ ] Chef can create dishes
- [ ] Chef can accept orders
- [ ] Chef can mark orders ready
- [ ] Driver can bid on orders
- [ ] Driver can complete deliveries
- [ ] Manager can approve registrations
- [ ] Manager can manage complaints

### Advanced Features
- [ ] VIP promotion works
- [ ] VIP benefits apply
- [ ] Warning system works
- [ ] Employee demotion/promotion works
- [ ] Delivery bidding works
- [ ] Discussion forum works
- [ ] Report system works
- [ ] Knowledge base works
- [ ] AI chat works

---

## **Tips for Testing**

1. **Test with multiple accounts**: Use different browsers or incognito mode to test interactions between users
2. **Test edge cases**: Try ordering with insufficient balance, filing false complaints, etc.
3. **Test the full workflow**: Place an order → Chef accepts → Chef marks ready → Driver bids → Manager assigns → Driver delivers → Customer rates
4. **Test VIP features**: Make sure to test VIP promotion and all VIP benefits
5. **Test warnings**: Try to trigger warnings and see the consequences
6. **Test employee actions**: See how employee ratings/complaints affect their status

---

## **Have Fun Testing!**

Remember: This is a complex system with many interconnected features. Take your time exploring and don't hesitate to try different scenarios!

