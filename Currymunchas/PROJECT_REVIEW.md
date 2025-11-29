# Project Requirements Review

##  IMPLEMENTED FEATURES

### 1. User Groups

#### Employees
-  **Chefs**: Can create dishes, accept orders, mark orders as ready
-  **Delivery People**: Can bid on orders, deliver orders, rate customers
-  **Manager**: Can process registrations, handle complaints/compliments, hire/fire employees, manage knowledge base
-  **Knowledge Base**: System exists and can be managed by managers

#### Customers
-  **Registered Customers**: Can browse/search menu, order, rate food and delivery (1-5 stars)
-  **Discussion Forum**: Customers can start/participate in discussions about chefs/dishes/delivery
-  **VIP Status**: 
  - Automatic promotion after $100 spent OR 3 orders (without outstanding complaints)
  - 5% discount on orders
  - 1 free delivery per 3 orders
  - Access to VIP-only dishes
  - Complaints/compliments count 2x weight
-  **Knowledge Base Contributions**: System exists but direct UI for customer contributions may need verification

#### Visitors
-  Can browse menus
-  Can ask questions via AI chat
-  Can apply to be registered customers

### 2. System Features

#### Overall GUI
-  Web-based GUI with pictures for each dish
-  Password-protected login system
-  Personalized recommendations based on order history
-  Most popular and highest-rated dishes on landing page
-  Top-rated chefs displayed
-  AI chat box for questions

#### Reputation Management
-  Customers can file complaints/compliments about chefs, delivery people, and other customers (via discussion forum)
-  Delivery people can complain/compliment customers
-  Manager handles all complaints/compliments
-  Dispute system: Complainees can dispute complaints
-  Manager makes final decision (dismiss/uphold)
-  False complaints result in warnings to complainant
-  Registered customers with 3 warnings are deregistered
-  VIPs with 2 warnings downgraded to regular customers (warnings cleared)
-  Warnings displayed on customer dashboard
-  When complaints are upheld, discussions/comments are removed

#### Finance Management
-  Customers must deposit money into account
-  Orders rejected if balance insufficient
-  Automatic warning for insufficient balance attempts

#### Human Resources
-  Manager can clear deposits and close accounts for kicked-out customers
-  Blacklist system: Kicked-out customers cannot re-register
-  **Chef Demotion/Firing**:
  - Automatic demotion if ratings < 2 (3+ ratings) OR 3+ net complaints
  - Chef demoted twice is fired
  - Fired chefs' dishes are deleted
-  **Chef Bonuses**:
  - Automatic bonus if ratings > 4 (3+ ratings) OR 3+ compliments
  - 10% salary increase
-  **Delivery People**: Same demotion/bonus system as chefs
-  **Delivery Bidding**: Delivery people compete by bidding
-  **Manager Assignment**: Manager assigns orders based on lowest bid (with override option and memo)
-  **Manual Salary Adjustments**: Automatic demotion/promotion exists, but manual raise/cut pay may need UI implementation

#### AI-Based Customer Service
-  System searches local knowledge base first
-  Falls back to LLM (Gemini) if no knowledge base answer
-  Users can rate knowledge base responses (1-5 stars)
-  Rating of 0 (outrageous) flags entry for manager review
-  Manager can delete flagged entries
-  Authors of bad entries are banned from contributing

## POTENTIAL GAPS

1. **Knowledge Base Contributions UI**: While the knowledge base exists and can be managed, there may not be a direct UI for employees/customers to add entries. This might need to be done through Firestore directly or may need UI implementation.

2. **Manual Salary Management**: The system has automatic demotion/promotion, but managers may not have a direct UI to manually raise/cut pay. The "Manage" buttons in the employee tables may need functionality.

## NOTES

- Most core features are fully implemented
- The system is functional and meets the majority of requirements
- Minor UI enhancements may be needed for knowledge base contributions and manual salary management

