const mongoose = require('mongoose');

const missionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'failed'],
    default: 'active'
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number,
    default: 0
  },
  timer: {
    type: Number,
    default: 0
  },
  timerRunning: {
    type: Boolean,
    default: false
  },
  lastTimerUpdate: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'left'],
      default: 'active'
    }
  }],
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  errorLogs: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    message: String,
    severity: {
      type: String,
      enum: ['info', 'warning', 'error'],
      default: 'info'
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }]
}, {
  timestamps: true
});

missionSchema.methods.addErrorLog = function(message, severity = 'info', userId = null) {
  this.errorLogs.push({ message, severity, user: userId });
  return this.save();
};

missionSchema.methods.complete = function() {
  this.status = 'completed';
  this.endTime = new Date();
  this.duration = Math.round((this.endTime - this.startTime) / (1000 * 60)); // Convert to minutes
  this.timerRunning = false;
  return this.save();
};

missionSchema.methods.startTimer = function() {
  if (!this.timerRunning) {
    this.timerRunning = true;
    this.lastTimerUpdate = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

missionSchema.methods.stopTimer = function() {
  if (this.timerRunning) {
    this.timerRunning = false;
    const now = new Date();
    const elapsedSeconds = Math.floor((now - this.lastTimerUpdate) / 1000);
    this.timer += elapsedSeconds;
    this.lastTimerUpdate = now;
    return this.save();
  }
  return Promise.resolve(this);
};

missionSchema.methods.getCurrentTimer = function() {
  if (this.timerRunning) {
    const now = new Date();
    const elapsedSeconds = Math.floor((now - this.lastTimerUpdate) / 1000);
    return this.timer + elapsedSeconds;
  }
  return this.timer;
};

missionSchema.methods.updateTimer = function(seconds) {
  this.timer = seconds;
  this.lastTimerUpdate = new Date();
  return this.save();
};

missionSchema.methods.addParticipant = function(userId) {
  if (!this.participants.some(p => p.user.toString() === userId.toString())) {
    this.participants.push({ user: userId });
    return this.save();
  }
  return Promise.resolve(this);
};

missionSchema.methods.removeParticipant = function(userId) {
  const participant = this.participants.find(p => p.user.toString() === userId.toString());
  if (participant) {
    participant.status = 'left';
    return this.save();
  }
  return Promise.resolve(this);
};

missionSchema.methods.updateParticipantStatus = function(userId, status) {
  const participant = this.participants.find(p => p.user.toString() === userId.toString());
  if (participant) {
    participant.status = status;
    return this.save();
  }
  return Promise.resolve(this);
};

const Mission = mongoose.model('Mission', missionSchema);

module.exports = Mission; 