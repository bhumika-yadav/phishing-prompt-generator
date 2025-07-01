const express = require('express');
const router = express.Router();
const axios = require('axios');
const Prompt = require('../models/Prompt');
const Simulation = require('../models/Simulation'); // Ensure this is imported

require('dotenv').config(); // Load environment variables

router.post('/generate-prompt', async (req, res) => { // This is the start of the correct route handler
  const { prompt, type } = req.body;

  // --- NEW DEBUG LOGS ---
  console.log(`DEBUG_NODE: Received prompt from frontend: "${prompt}"`);
  console.log(`DEBUG_NODE: Received type from frontend: "${type}"`);
  // --- END NEW DEBUG LOGS ---

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required.' });
  }
  if (!type || !['email', 'sms'].includes(type)) {
    return res.status(400).json({ error: 'Invalid generation type specified. Must be "email" or "sms".' });
  }

  try {
    const pythonServiceUrl = process.env.PYTHON_AI_SERVICE_URL || 'http://localhost:5001/generate_phishing_scenario';

    // --- NEW DEBUG LOGS ---
    console.log(`DEBUG_NODE: Sending to Python -> user_prompt: "${prompt}", scenario_type: "${type}"`);
    // --- END NEW DEBUG LOGS ---

    const pythonResponse = await axios.post(pythonServiceUrl, {
      user_prompt: prompt,
      scenario_type: type,
    });

    const aiResponseData = pythonResponse.data;

    // Validate the AI response structure based on type
    let aiGeneratedScenario;
    let aiDetails = {}; // Will hold emailDetails or smsDetails

    if (type === 'email') {
      if (!aiResponseData.scenario || !aiResponseData.emailDetails) {
        console.error("ERROR_NODE: Invalid AI response for email generation:", aiResponseData);
        return res.status(500).json({ error: 'AI response missing scenario or email details for email type.' });
      }
      aiGeneratedScenario = aiResponseData.scenario;
      aiDetails = aiResponseData.emailDetails;
    } else if (type === 'sms') {
      if (!aiResponseData.scenario || !aiResponseData.smsDetails) {
        console.error("ERROR_NODE: Invalid AI response for SMS generation:", aiResponseData);
        return res.status(500).json({ error: 'AI response missing scenario or SMS details for SMS type.' });
      }
      aiGeneratedScenario = aiResponseData.scenario;
      aiDetails = aiResponseData.smsDetails;
    }

    const newPrompt = new Prompt({
      scenario: aiGeneratedScenario.description,
      type: type, // Store the type in the prompt record
      aiGeneratedId: aiGeneratedScenario.id,
      // Store specific details based on type
      emailDetails: type === 'email' ? aiDetails : undefined,
      smsDetails: type === 'sms' ? aiDetails : undefined,
      phishingType: aiResponseData.phishingType || 'unknown', // Assuming phishingType is always returned
    });
    await newPrompt.save();

    const newSimulation = new Simulation({
      promptId: newPrompt._id,
      generatedEmail: type === 'email' ? aiDetails : undefined, // Only store if it's an email
      generatedSms: type === 'sms' ? aiDetails : undefined,     // Only store if it's an SMS
    });
    await newSimulation.save();

    res.json({
      message: 'Phishing scenario generated successfully!',
      scenario: aiGeneratedScenario,
      emailDetails: type === 'email' ? aiDetails : undefined,
      smsDetails: type === 'sms' ? aiDetails : undefined,
      phishingType: aiResponseData.phishingType || 'unknown',
      promptId: newPrompt._id
    });

  } catch (error) { // This is the catch block for the above try
    console.error('ERROR_NODE: Error generating phishing scenario:', error.message);
    if (error.response) {
      console.error('ERROR_NODE: Python API Response Data (on error):', error.response.data);
      console.error('ERROR_NODE: Python API Status (on error):', error.response.status);
      return res.status(error.response.status).json({
        error: `Error from AI service: ${error.response.data.error || 'Unknown AI service error'}`,
        details: error.response.data
      });
    } else if (error.request) {
      console.error('ERROR_NODE: No response received from Python API (network issue?):', error.request);
      return res.status(500).json({ message: 'No response from Python AI service. It might be down or unreachable.' });
    } else {
      console.error('ERROR_NODE: Error setting up Python API request:', error.message);
      return res.status(500).json({ message: 'Failed to connect to Python AI service.' });
    }
  }
}); // This is the closing bracket for the router.post method

module.exports = router;