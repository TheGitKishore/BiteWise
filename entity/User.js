class User {
  constructor({
    userId           = null,
    email            = '',
    passwordHash     = '',
    firstName        = '',
    lastName         = '',
    dateOfBirth      = null,
    gender           = '',      // 'male' | 'female' | 'other'
    profileType      = null,    // 'MEAL_PLANNER' | 'ATHLETE' | 'HEALTH_ORIENTED'
    role             = 'FREE',  // 'FREE' | 'PREMIUM' | 'CURATOR' | 'ADMIN'
    membershipPlanId = null,
    isActive         = true,
    createdAt        = null,
    updatedAt        = null,
  } = {}) {
    this.userId           = userId;
    this.email            = email;
    this.passwordHash     = passwordHash;
    this.firstName        = firstName;
    this.lastName         = lastName;
    this.dateOfBirth      = dateOfBirth;
    this.gender           = gender;
    this.profileType      = profileType;
    this.role             = role;
    this.membershipPlanId = membershipPlanId;
    this.isActive         = isActive;
    this.createdAt        = createdAt;
    this.updatedAt        = updatedAt;
  }
}

export default User;