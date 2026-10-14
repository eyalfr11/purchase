# Security Specification & Threat Model

## 1. System Invariants
1. **Access Control (ABAC/RBAC)**:
   - Super Admin: Identified in `/admins/{uid}` or bootstrapped for `eyalfr@gmail.com`.
   - Manager: Identified in `/managers/{uid}` or inherits from Admin.
   - Viewer: Read-only access to `/items` and their own `/users/{uid}` profile.
   - Anonymous / Unauthenticated: Cannot write to any collection. Reads are allowed for authenticated users.
2. **Items Data Integrity**:
   - Only Admins and Managers can modify `/items/{itemId}`.
   - All string fields (code, desc, cat, series) are bounded by max length.
   - Numbers (stock, cust_ord, res_ord, po_imp, ship_imp, lead_time, consumption rates) must be valid numbers.
   - All writes must include proper author metadata.
3. **User Profile Protection**:
   - Users can create their own profile, but CANNOT self-elevate role (`role` field must be set to 'viewer' by default, only admin can promote to 'admin' or 'manager').
   - Admins/Managers marker documents in `/admins/{uid}` and `/managers/{uid}` can ONLY be written by authenticated Admins.
4. **Audit Logs**:
   - Only appendable by authenticated users for valid actions; cannot be edited or deleted once written.

## 2. The Dirty Dozen Payloads (Forbidden Test Cases)
1. **Unauthenticated Write**: An unauthenticated user attempts to update stock or delete an item from `/items/1`. Must yield `PERMISSION_DENIED`.
2. **Role Spoofing on Sign-up**: A new user signs up and attempts to write `{ "role": "admin" }` to `/users/{uid}`. Must fail unless approved or verified.
3. **Privilege Escalation on Admin Collection**: Non-admin user attempts to create `/admins/{my_uid}` with `{ email: "me@example.com" }`. Must fail.
4. **Manager Privilege Escalation**: Regular viewer tries to write `/managers/{uid}`. Must fail.
5. **Item Overwrite by Viewer**: A viewer role attempts to modify `lead_time` or `stock` on `/items/{itemId}`. Must fail.
6. **Negative Lead Time Injection**: An attacker attempts to inject `lead_time: -500` or NaN. Must fail.
7. **Buffer Overflow in Description**: An attacker injects a 5MB string into `desc` or `code`. Must fail due to `size() <= 255`.
8. **Malicious ID Path Traversal**: An attacker passes invalid document IDs with non-alphanumeric special characters. Must fail `isValidId()`.
9. **Tampering with Audit Logs**: Any user attempts to modify or delete an existing record in `/audit_logs/{logId}`. Must fail.
10. **Shadow Field Injection**: An attacker adds `{ "isBackdoorActive": true }` to an Item update. Must fail key validation.
11. **User Profile Hijacking**: User A tries to edit or delete User B's `/users/{userB}` document. Must fail.
12. **Admin Revocation by Non-Admin**: A regular user tries to delete an admin from `/admins/{adminId}`. Must fail.
