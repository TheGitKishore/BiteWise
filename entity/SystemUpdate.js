// entities/admin/SystemUpdate.js
// Represents a system/app update logged and managed by the System Admin.

class SystemUpdate {
  constructor({
    updateId          = null,
    title             = '',
    description       = '',
    version           = '',          // e.g. '1.4.2'
    type              = '',          // 'PATCH' | 'MINOR' | 'MAJOR'
    status            = 'PENDING',   // 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'ROLLED_BACK'
    scheduledAt       = null,
    appliedAt         = null,
    appliedByAdminId  = null,
  } = {}) {
    this.updateId         = updateId;
    this.title            = title;
    this.description      = description;
    this.version          = version;
    this.type             = type;
    this.status           = status;
    this.scheduledAt      = scheduledAt;
    this.appliedAt        = appliedAt;
    this.appliedByAdminId = appliedByAdminId;
  }
}

export default SystemUpdate;
