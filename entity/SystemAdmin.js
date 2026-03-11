// entities/user/SystemAdmin.js
// Internal admin user. Manages users, reviews, curator applications,
// and system updates. Separate from the User hierarchy — no membership plan.

class SystemAdmin {
  constructor({
    adminId      = null,
    email        = '',
    passwordHash = '',
    firstName    = '',
    lastName     = '',
    createdAt    = null,
  } = {}) {
    this.adminId      = adminId;
    this.email        = email;
    this.passwordHash = passwordHash;
    this.firstName    = firstName;
    this.lastName     = lastName;
    this.createdAt    = createdAt;
  }
}

export default SystemAdmin;
