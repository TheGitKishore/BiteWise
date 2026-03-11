// ============================================================
// entities/tracking/  — All Premium tracking entities
// ============================================================

// ---------------------------------------------------------------------------
// WeightEntry.js
// A single recorded weight measurement.

class WeightEntry {
  constructor({
    entryId    = null,
    userId     = null,
    weight     = 0,
    unit       = 'kg',   // 'kg' | 'lbs'
    recordedAt = null,
    notes      = '',
  } = {}) {
    this.entryId    = entryId;
    this.userId     = userId;
    this.weight     = weight;
    this.unit       = unit;
    this.recordedAt = recordedAt;
    this.notes      = notes;
  }
}

export { WeightEntry };

// ---------------------------------------------------------------------------
// HeightEntry.js
// A single recorded height measurement. History supported for tracking updates.

class HeightEntry {
  constructor({
    entryId    = null,
    userId     = null,
    height     = 0,
    unit       = 'cm',  // 'cm' | 'ft'
    recordedAt = null,
  } = {}) {
    this.entryId    = entryId;
    this.userId     = userId;
    this.height     = height;
    this.unit       = unit;
    this.recordedAt = recordedAt;
  }
}

export { HeightEntry };

// ---------------------------------------------------------------------------
// BodyMetrics.js
// Aggregated body data for a user. BMI is calculated by the Controller.
// Holds current values plus references to historical entries.

class BodyMetrics {
  constructor({
    metricsId     = null,
    userId        = null,
    currentWeight = 0,           // kg
    currentHeight = 0,           // cm
    bmi           = 0,           // calculated: weight / (height/100)^2
    bmiCategory   = '',          // 'Underweight' | 'Normal' | 'Overweight' | 'Obese'
    weightHistory = [],          // WeightEntry[]
    heightHistory = [],          // HeightEntry[]
    updatedAt     = null,
  } = {}) {
    this.metricsId     = metricsId;
    this.userId        = userId;
    this.currentWeight = currentWeight;
    this.currentHeight = currentHeight;
    this.bmi           = bmi;
    this.bmiCategory   = bmiCategory;
    this.weightHistory = weightHistory;
    this.heightHistory = heightHistory;
    this.updatedAt     = updatedAt;
  }
}

export { BodyMetrics };

// ---------------------------------------------------------------------------
// ExerciseEntry.js
// A single exercise logged within an ExerciseLog.

class ExerciseEntry {
  constructor({
    exerciseEntryId = null,
    exerciseLogId   = null,
    exerciseName    = '',
    category        = '',    // 'cardio' | 'strength' | 'flexibility' | 'sports'
    durationMinutes = 0,
    caloriesBurned  = 0,
    sets            = null,  // strength training
    reps            = null,
    weightKg        = null,  // load used, strength training
    notes           = '',
    loggedAt        = null,
  } = {}) {
    this.exerciseEntryId = exerciseEntryId;
    this.exerciseLogId   = exerciseLogId;
    this.exerciseName    = exerciseName;
    this.category        = category;
    this.durationMinutes = durationMinutes;
    this.caloriesBurned  = caloriesBurned;
    this.sets            = sets;
    this.reps            = reps;
    this.weightKg        = weightKg;
    this.notes           = notes;
    this.loggedAt        = loggedAt;
  }
}

export { ExerciseEntry };

// ---------------------------------------------------------------------------
// ExerciseLog.js
// One daily exercise log per user. Totals recalculated by Controller.

class ExerciseLog {
  constructor({
    exerciseLogId        = null,
    userId               = null,
    date                 = null,
    entries              = [],    // ExerciseEntry[]
    totalCaloriesBurned  = 0,
    totalDurationMinutes = 0,
  } = {}) {
    this.exerciseLogId        = exerciseLogId;
    this.userId               = userId;
    this.date                 = date;
    this.entries              = entries;
    this.totalCaloriesBurned  = totalCaloriesBurned;
    this.totalDurationMinutes = totalDurationMinutes;
  }
}

export { ExerciseLog };

// ---------------------------------------------------------------------------
// ConnectedDevice.js
// A fitness device or health platform linked to the user's account (Premium).

class ConnectedDevice {
  constructor({
    deviceId     = null,
    userId       = null,
    deviceName   = '',
    deviceType   = '',      // 'fitness_tracker' | 'smartwatch' | 'smart_scale'
    platform     = '',      // 'apple_health' | 'google_fit' | 'fitbit' | 'garmin'
    isConnected  = false,
    connectedAt  = null,
    lastSyncedAt = null,
  } = {}) {
    this.deviceId     = deviceId;
    this.userId       = userId;
    this.deviceName   = deviceName;
    this.deviceType   = deviceType;
    this.platform     = platform;
    this.isConnected  = isConnected;
    this.connectedAt  = connectedAt;
    this.lastSyncedAt = lastSyncedAt;
  }
}

export { ConnectedDevice };

// ---------------------------------------------------------------------------
// HealthDiaryEntry.js
// A personal daily note a Premium user logs about their health, mood, energy.

class HealthDiaryEntry {
  constructor({
    entryId     = null,
    userId      = null,
    title       = '',
    content     = '',
    mood        = '',           // 'great' | 'good' | 'neutral' | 'bad' | 'terrible'
    energyLevel = 0,            // 1–5
    tags        = [],
    date        = null,         // ISO date string
    createdAt   = null,
    updatedAt   = null,
  } = {}) {
    this.entryId     = entryId;
    this.userId      = userId;
    this.title       = title;
    this.content     = content;
    this.mood        = mood;
    this.energyLevel = energyLevel;
    this.tags        = tags;
    this.date        = date;
    this.createdAt   = createdAt;
    this.updatedAt   = updatedAt;
  }
}

export { HealthDiaryEntry };
