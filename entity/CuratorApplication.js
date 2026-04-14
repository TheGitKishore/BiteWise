// CuratorApplication.js — SEEDED (no axios)
// UC #98 submit, #105 admin view, #106 admin approve/reject

const SEED_APPLICATIONS = [
  { applicationId: 'ca1', userId: 1, username: 'xuanxuan', motivation: 'I have lost 10kg over 6 months and want to inspire others with my healthy eating journey.', journey: 'Started tracking macros seriously in 2025. Consistent meal prep was the key to my success.', expertise: 'Meal prep, weight loss, balanced nutrition', social: 'instagram.com/xuanxuan_eats', status: 'PENDING', reviewedByAdminId: null, reviewedAt: null, rejectionReason: null, createdAt: '2026-03-20T09:00:00Z' },
  { applicationId: 'ca2', userId: 2, username: 'premuser', motivation: 'As a competitive athlete I have a deep understanding of performance nutrition and want to share evidence-based content.', journey: '5 years of competitive powerlifting. Built muscle naturally through disciplined nutrition and progressive overload.', expertise: 'Muscle gain, high protein nutrition, sports performance', social: 'youtube.com/premuser_lifts', status: 'APPROVED', reviewedByAdminId: 3, reviewedAt: '2026-03-22T14:00:00Z', rejectionReason: null, createdAt: '2026-03-18T11:00:00Z' },
  { applicationId: 'ca3', userId: 5, username: 'healthyjane', motivation: 'I want to help people with diabetes manage their diet effectively.', journey: 'Living with type 2 diabetes for 3 years and have reversed it through diet and lifestyle changes.', expertise: 'Diabetes management, low-GI eating', social: '', status: 'REJECTED', reviewedByAdminId: 3, reviewedAt: '2026-03-21T10:00:00Z', rejectionReason: 'Does not meet minimum content commitment criteria.', createdAt: '2026-03-17T08:00:00Z' },
];

let _applications = [...SEED_APPLICATIONS];
let _nextId       = 10;

class CuratorApplication {
  constructor({ applicationId=null, userId=null, username='', motivation='', journey='', expertise='', social='', status='PENDING', reviewedByAdminId=null, reviewedAt=null, rejectionReason=null, createdAt=null } = {}) {
    Object.assign(this, { applicationId, userId, username, motivation, journey, expertise, social, status, reviewedByAdminId, reviewedAt, rejectionReason, createdAt });
  }

  isPending()  { return this.status === 'PENDING'; }
  isApproved() { return this.status === 'APPROVED'; }
  isRejected() { return this.status === 'REJECTED'; }

  static getPending(apps)  { return apps.filter((a) => a.status === 'PENDING'); }
  static getApproved(apps) { return apps.filter((a) => a.status === 'APPROVED'); }

  static validateApplication({ motivation, journey, expertise }) {
    const errors = {};
    if (!motivation?.trim()) errors.motivation = 'Required.';
    if (!journey?.trim())    errors.journey    = 'Required.';
    if (!expertise?.trim())  errors.expertise  = 'Required.';
    return { valid: Object.keys(errors).length === 0, errors };
  }

  // UC #98 — submit a curator application
  static async create(userId, username, { motivation, journey, expertise, social }) {
    const check = CuratorApplication.validateApplication({ motivation, journey, expertise });
    if (!check.valid) return { success: false, errors: check.errors, message: 'Please fill in all required fields.', data: null };
    if (_applications.find((a) => a.userId === userId && a.status === 'PENDING'))
      return { success: false, message: 'You already have a pending application.', data: null };
    const app = new CuratorApplication({ applicationId: 'ca_' + _nextId++, userId, username, motivation: motivation.trim(), journey: journey.trim(), expertise: expertise.trim(), social: social?.trim() || '', status: 'PENDING', createdAt: new Date().toISOString() });
    _applications.push({ ...app });
    return { success: true, message: 'Application submitted! We will review it within 5-7 business days.', data: app };
  }

  // UC #105 — admin fetch all applications
  static async fetchAll() {
    return { success: true, data: [..._applications].map((a) => new CuratorApplication(a)).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)), message: '' };
  }

  // UC #106 — admin approve
  static async approve(applicationId, adminId) {
    const idx = _applications.findIndex((a) => a.applicationId === applicationId);
    if (idx === -1) return { success: false, message: 'Application not found.' };
    _applications[idx].status = 'APPROVED'; _applications[idx].reviewedByAdminId = adminId; _applications[idx].reviewedAt = new Date().toISOString();
    return { success: true, message: 'Application approved. User promoted to Curator.', data: new CuratorApplication(_applications[idx]) };
  }

  // UC #106 — admin reject
  static async reject(applicationId, adminId, reason) {
    const idx = _applications.findIndex((a) => a.applicationId === applicationId);
    if (idx === -1) return { success: false, message: 'Application not found.' };
    _applications[idx].status = 'REJECTED'; _applications[idx].reviewedByAdminId = adminId; _applications[idx].reviewedAt = new Date().toISOString(); _applications[idx].rejectionReason = reason?.trim() || 'Does not meet requirements.';
    return { success: true, message: 'Application rejected.', data: new CuratorApplication(_applications[idx]) };
  }
}

export default CuratorApplication;
