const express = require('express');
const router = express.Router();
const Mission = require('../models/Mission');
const { auth, adminAuth } = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = {};
    if (req.user.role !== 'admin') {
      query.status = 'active';
    }

    const [missions, total] = await Promise.all([
      Mission.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'username')
        .populate('participants.user', 'username'),
      Mission.countDocuments(query)
    ]);

    res.json({
      missions,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalMissions: total
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching missions', error: error.message });
  }
});

router.post('/', adminAuth, async (req, res) => {
  try {
    const mission = new Mission({
      ...req.body,
      createdBy: req.user._id
    });
    await mission.save();
    res.status(201).json(mission);
  } catch (error) {
    res.status(500).json({ message: 'Error creating mission', error: error.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const mission = await Mission.findById(req.params.id)
      .populate('createdBy', 'username')
      .populate('participants.user', 'username')
      .populate('errorLogs.user', 'username');
    
    if (!mission) {
      return res.status(404).json({ message: 'Mission not found' });
    }
    
    res.json(mission);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching mission', error: error.message });
  }
});

router.put('/:id', adminAuth, async (req, res) => {
  try {
    const mission = await Mission.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!mission) {
      return res.status(404).json({ message: 'Mission not found' });
    }
    
    res.json(mission);
  } catch (error) {
    res.status(500).json({ message: 'Error updating mission', error: error.message });
  }
});

router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const mission = await Mission.findByIdAndDelete(req.params.id);
    
    if (!mission) {
      return res.status(404).json({ message: 'Mission not found' });
    }
    
    res.json({ message: 'Mission deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting mission', error: error.message });
  }
});

router.post('/:id/join', auth, async (req, res) => {
  try {
    const mission = await Mission.findById(req.params.id);
    
    if (!mission) {
      return res.status(404).json({ message: 'Mission not found' });
    }

    if (mission.status !== 'active') {
      return res.status(400).json({ message: 'Cannot join inactive mission' });
    }
    
    await mission.addParticipant(req.user._id);
    res.json(mission);
  } catch (error) {
    res.status(500).json({ message: 'Error joining mission', error: error.message });
  }
});

router.post('/:id/leave', auth, async (req, res) => {
  try {
    const mission = await Mission.findById(req.params.id);
    
    if (!mission) {
      return res.status(404).json({ message: 'Mission not found' });
    }
    
    await mission.removeParticipant(req.user._id);
    res.json(mission);
  } catch (error) {
    res.status(500).json({ message: 'Error leaving mission', error: error.message });
  }
});

router.post('/:id/logs', auth, async (req, res) => {
  try {
    const { message, severity } = req.body;
    const mission = await Mission.findById(req.params.id);
    
    if (!mission) {
      return res.status(404).json({ message: 'Mission not found' });
    }
    
    await mission.addErrorLog(message, severity, req.user._id);
    res.json(mission);
  } catch (error) {
    res.status(500).json({ message: 'Error adding log', error: error.message });
  }
});

router.post('/:id/complete', adminAuth, async (req, res) => {
  try {
    const mission = await Mission.findById(req.params.id);
    
    if (!mission) {
      return res.status(404).json({ message: 'Mission not found' });
    }
    
    await mission.complete();
    res.json(mission);
  } catch (error) {
    res.status(500).json({ message: 'Error completing mission', error: error.message });
  }
});

router.post('/:id/timer/start', adminAuth, async (req, res) => {
  try {
    const mission = await Mission.findById(req.params.id);
    
    if (!mission) {
      return res.status(404).json({ message: 'Mission not found' });
    }
    
    await mission.startTimer();
    res.json({
      ...mission.toObject(),
      currentTimer: mission.getCurrentTimer()
    });
  } catch (error) {
    res.status(500).json({ message: 'Error starting timer', error: error.message });
  }
});

router.post('/:id/timer/stop', adminAuth, async (req, res) => {
  try {
    const mission = await Mission.findById(req.params.id);
    
    if (!mission) {
      return res.status(404).json({ message: 'Mission not found' });
    }
    
    await mission.stopTimer();
    res.json({
      ...mission.toObject(),
      currentTimer: mission.getCurrentTimer()
    });
  } catch (error) {
    res.status(500).json({ message: 'Error stopping timer', error: error.message });
  }
});

router.get('/:id/timer', auth, async (req, res) => {
  try {
    const mission = await Mission.findById(req.params.id);
    
    if (!mission) {
      return res.status(404).json({ message: 'Mission not found' });
    }
    
    res.json({
      timer: mission.getCurrentTimer(),
      isRunning: mission.timerRunning
    });
  } catch (error) {
    res.status(500).json({ message: 'Error getting timer', error: error.message });
  }
});

router.post('/:id/timer', adminAuth, async (req, res) => {
  try {
    const { seconds } = req.body;
    const mission = await Mission.findById(req.params.id);
    
    if (!mission) {
      return res.status(404).json({ message: 'Mission not found' });
    }
    
    await mission.updateTimer(seconds);
    res.json({
      ...mission.toObject(),
      currentTimer: mission.getCurrentTimer()
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating timer', error: error.message });
  }
});

module.exports = router; 