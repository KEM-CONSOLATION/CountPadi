I am updating my multi-tenant inventory web app. Below is my full context and what I want you (Cursor) to generate and update for me.

==========================
CURRENT VERSION (IMPORTANT)
==========================

- Built as a multi-tenant app.
- Each tenant = 1 business.
- Currently supports only ONE branch per business.
- Staff roles exist (admin + staff/cashier) but NOT branch-based.
- Features currently working:
  • Inventory tracking
  • Low-stock alerts
  • Profit calculation based on cost & selling price
  • Restocking flow
- Tenancy works but only for the main business, not sub-branches.

==========================
WHAT I WANT TO UPGRADE TO
==========================
I want full MULTI-BRANCH and STAFF HIERARCHY support.

A tenant (business) should be able to create multiple branches.

Each branch has:
• Branch Manager
• Branch Cashiers/Staff
• Branch-specific inventory
• Branch-specific sales & POS transactions
• Branch-specific restocking
• Branch-specific reporting

Business Admin (Super Admin of the tenant) should:
• See all branches
• Switch between branches from UI
• View combined inventory or per-branch inventory
• View summarized reports across all branches
• Manage branch managers and assign staff to branches

Branch Manager should:
• Only see their branch
• Manage inventory for their branch
• Manage restocking for their branch
• View branch-level reports
• Manage their branch staff

Staff/Cashier should:
• Only see their branch
• Only use POS + sales + basic inventory actions

==========================
ROLE + BRANCH ACCESS RULES (VERY IMPORTANT)
==========================

TENANT ADMIN:

- Can switch between all branches.
- Has access to global + branch-level data.
- branch_id is dynamic and selected via UI (/branch-selector).

BRANCH MANAGER:

- Cannot switch branches.
- Only sees their assigned branch.
- branch_id is fixed on login.

STAFF/CASHIER:

- Cannot switch branches.
- branch_id is fixed on login.
- Only accesses POS + basic inventory for their branch.

IMPORTANT:

- Only Tenant Admin should see the branch selector UI.
- Branch Manager and Staff/Cashier NEVER see a branch switcher.
- All backend APIs must enforce branch_id authorization.

==========================
NEW FEATURES I WANT YOU TO IMPLEMENT
==========================

1. **Branch Management**
   - Add CRUD for branches.
   - Allow tenant admin to assign users to branches.
   - Allow switching between branches (UI + middleware).
   - Branch should be required context for all inventory and sales operations.

2. **POS Integration**
   - Branch-specific POS.
   - Cashiers record sales only for their branch.
   - Sales update:
     • branch inventory stock deduction
     • revenue + profit tracking
     • receipts generation
   - Add endpoints/components for:
     • creating/opening a sale
     • searching/scanning products
     • adding/removing items
     • completing sale

3. **Supplier Management**
   - Supplier creation per business.
   - Products link to suppliers.
   - Branch restocking from suppliers.
   - Track:
     • supplier info
     • restock history
     • cost price

4. **Inventory Enhancements**
   - Inventory is now **per branch**.
   - Show:
     • global business-wide stock (tenant admin only)
     • branch-specific stock (branch manager + staff)
   - Low-stock alerts MUST be branch-specific.
   - Support **Transfers** between branches:
     • Move stock from one branch to another
     • Record source branch, destination branch, quantity, product
     • Deduct stock from source branch, add to destination branch
     • Track user who performed transfer
     • Transfers do NOT increase total business stock (unlike restocking)

5. **Restocking**
   - Branch can restock at any time (NO approval flow).
   - Branch Manager or Tenant Admin can perform restock.
   - On restock:
     • Add quantity to branch_inventory table.
   - Restock is considered **stock coming from outside** (supplier).

6. **Reporting**
   - Branch-level reporting.
   - Business-level (all branches combined) reporting.
   - Metrics:
     • Sales
     • Revenue
     • Profit
     • Inventory valuation
     • Fast/slow-moving products
   - Include transfers in branch-level reporting.

7. **Authentication / Authorization Upgrades**
   Add new RBAC system with:
   - Tenant Admin
   - Branch Manager
   - Staff/Cashier

   Each user must have:
   - tenant_id
   - branch_id (null for tenant admin until selected)
   - role

==========================
DATABASE / BACKEND UPDATES NEEDED
==========================

Add Tables:
• branches (id, tenant_id, name, address)
• user_branch_roles (user_id, branch_id, role)
• branch_inventory (product_id, branch_id, qty)
• branch_sales (branch_id, items, cashier_id, total, timestamp)
• suppliers (tenant_id, name, contact)
• restock_logs (branch_id, product_id, qty, cost_price, timestamp)
• branch_transfers (id, product_id, qty, from_branch_id, to_branch_id, performed_by, timestamp)

Modify Tables:
• users: - remove legacy role - add optional default_branch_id for managers and staff
• products: - products stay global to tenant; stock moves to branch_inventory

Generate Backend:
• API routes:
/api/branches/_
/api/pos/_
/api/suppliers/_
/api/restock/_
/api/transfers/_
/api/reports/_
• Branch-aware middleware
• RBAC middleware enforcing branch_id + role rules

==========================
FRONTEND UPDATES NEEDED
==========================
Create/update:
• Branch selector UI (ADMIN ONLY)
• Branch dashboard
• Branch inventory page
• POS UI (branch-locked)
• Supplier management UI
• Branch staff management UI
• Business-level overview dashboard
• Branch-level reports dashboard
• Stock Transfer UI (for Tenant Admin + Branch Manager)
• Role-based page restrictions

==========================
VERY IMPORTANT
==========================
Do NOT rewrite my whole codebase.
Instead:
• Analyze my structure
• Modify only what is needed
• Extend existing tenancy logic to support multi-branch
• Keep all current features working

Whenever you generate new or updated files, specify exact paths like:
• /app/api/branches/create.ts
• /components/dashboard/BranchSelector.tsx
• /components/inventory/TransferStock.tsx
• /db/schema/\*
• /middleware/requireBranch.ts

==========================
END OF REQUIREMENTS
==========================

Now generate:
• Complete schema updates
• Backend logic
• API endpoints (including /transfers)
• Frontend components (including transfer UI)
• Branch switching logic
• RBAC logic
• Any needed instructions
And apply them cleanly to the existing codebase.
