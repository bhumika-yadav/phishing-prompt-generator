// routes/simulationRoutes.js
const express = require('express');
const router = express.Router();
const Simulation = require('../models/Simulation');

// Route to get all simulations
router.get('/', async (req, res) => {
  try {
    const simulations = await Simulation.find().populate('promptId'); // Populate prompt details
    res.status(200).json(simulations);
  } catch (error) {
    console.error('Error fetching simulations:', error.message);
    res.status(500).json({ message: 'Failed to fetch simulations', error: error.message });
  }
});

// Route to get a specific simulation by ID
router.get('/:id', async (req, res) => {
  try {
    const simulation = await Simulation.findById(req.params.id).populate('promptId');
    if (!simulation) {
      return res.status(404).json({ message: 'Simulation not found' });
    }
    res.status(200).json(simulation);
  } catch (error) {
    console.error('Error fetching simulation:', error.message);
    res.status(500).json({ message: 'Failed to fetch simulation', error: error.message });
  }
});

// Route to record user interaction for a simulation
router.post('/:id/interact', async (req, res) => {
  const { action, details } = req.body;
  if (!action) {
    return res.status(400).json({ message: 'Action is required.' });
  }

  try {
    const simulation = await Simulation.findById(req.params.id);
    if (!simulation) {
      return res.status(404).json({ message: 'Simulation not found' });
    }

    simulation.userInteractions.push({ action, details });
    await simulation.save();

    res.status(200).json({ message: 'Interaction recorded successfully', simulation });
  } catch (error) {
    console.error('Error recording interaction:', error.message);
    res.status(500).json({ message: 'Failed to record interaction', error: error.message });
  }
});

// Route to update simulation status (e.g., phished = true, score)
router.patch('/:id/update-status', async (req, res) => {
  const { phished, score } = req.body;

  try {
    const simulation = await Simulation.findById(req.params.id);
    if (!simulation) {
      return res.status(404).json({ message: 'Simulation not found' });
    }

    if (typeof phished === 'boolean') {
      simulation.phished = phished;
    }
    if (typeof score === 'number') {
      simulation.score = score;
    }

    await simulation.save();
    res.status(200).json({ message: 'Simulation status updated', simulation });
  } catch (error) {
    console.error('Error updating simulation status:', error.message);
    res.status(500).json({ message: 'Failed to update simulation status', error: error.message });
  }
});

module.exports = router;