
import React, { useState } from 'react';
import axios from 'axios';
import './App.css'; // Your main CSS file

function App() {
  const [prompt, setPrompt] = useState('');
  const [scenario, setScenario] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // NEW STATE: to select the type of generation (email or sms)
  const [generationType, setGenerationType] = useState('email'); // Default to 'email'

  const generateScenario = async () => {
    setLoading(true);
    setError(null);
    setScenario(null); // Clear previous scenario
    try {
      // Pass the selected generationType to the backend
      const response = await axios.post('http://localhost:5000/api/generate-prompt', {
        prompt,
        type: generationType, // <-- NEW: Include the type
      });
      setScenario(response.data);
    } catch (err) {
      console.error("Error generating scenario:", err);
      // More specific error message if the backend sends one
      setError(err.response?.data?.error || "Failed to generate scenario. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gemini-container">
      <h1 className="app-title">Phishing Scenario Generator</h1>

      {/* Input Card - Gemini Style */}
      <div className="input-card">
        <textarea
          className="prompt-textarea"
          placeholder="e.g., 'Generate a phishing email about a fake software update.' OR 'Generate an SMS about a delayed package delivery.'"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows="4"
        ></textarea>

        {/* NEW: Radio buttons for selecting generation type */}
        <div className="generation-type-selector">
          <label>
            <input
              type="radio"
              value="email"
              checked={generationType === 'email'}
              onChange={() => setGenerationType('email')}
            />
            Generate Email
          </label>
          <label>
            <input
              type="radio"
              value="sms"
              checked={generationType === 'sms'}
              onChange={() => setGenerationType('sms')}
            />
            Generate SMS
          </label>
        </div>

        <button
          className="generate-button"
          onClick={generateScenario}
          disabled={loading || !prompt.trim()}
        >
          {loading ? 'Generating...' : 'Generate Scenario'}
        </button>
      </div>

      {/* Loading, Error, and Output Display */}
      {loading && <p className="loading-message">Generating your scenario...</p>}
      {error && <p className="error-message">{error}</p>}

      {scenario && (
        <div className="output-card">
          <h2>Generated Scenario</h2>
          <p><strong>Description:</strong> {scenario.scenario.description}</p>
          <p><strong>Phishing Type:</strong> {scenario.phishingType}</p>

          {/* Conditional rendering based on generationType */}
          {generationType === 'email' && scenario.emailDetails && (
            <>
              <h3>Email Details</h3>
              <p><strong>Subject:</strong> {scenario.emailDetails.subject}</p>
              <p><strong>Sender:</strong> {scenario.emailDetails.sender}</p>
              <p><strong>Recipient:</strong> {scenario.emailDetails.recipient}</p>
              <h4>Body:</h4>
              <pre className="email-body-pre">{scenario.emailDetails.body}</pre>

              {scenario.emailDetails.links && scenario.emailDetails.links.length > 0 && (
                <>
                  <h4>Links:</h4>
                  <ul className="links-list">
                    {scenario.emailDetails.links.map((link, index) => (
                      <li key={index} className={link.isPhishing ? 'phishing-link' : ''}>
                        <a href={link.url} target="_blank" rel="noopener noreferrer">
                          {link.text || link.url}
                        </a>
                        {link.isPhishing && <span className="phishing-label"> (Phishing)</span>}
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {scenario.emailDetails.attachments && scenario.emailDetails.attachments.length > 0 && (
                <>
                  <h4>Attachments:</h4>
                  <ul className="attachments-list">
                    {scenario.emailDetails.attachments.map((attachment, index) => (
                      <li key={index}>{attachment}</li>
                    ))}
                  </ul>
                </>
              )}
            </>
          )}

          {generationType === 'sms' && scenario.smsDetails && (
            <>
              <h3>SMS Details</h3>
              <p><strong>Sender Phone:</strong> {scenario.smsDetails.senderPhone}</p>
              <p><strong>Recipient Phone:</strong> {scenario.smsDetails.recipientPhone}</p>
              <h4>Message:</h4>
              <pre className="sms-message-pre">{scenario.smsDetails.message}</pre>
              {scenario.smsDetails.links && scenario.smsDetails.links.length > 0 && (
                <>
                  <h4>Links:</h4>
                  <ul className="links-list">
                    {scenario.smsDetails.links.map((link, index) => (
                      <li key={index} className={link.isPhishing ? 'phishing-link' : ''}>
                        <a href={link.url} target="_blank" rel="noopener noreferrer">
                          {link.text || link.url}
                        </a>
                        {link.isPhishing && <span className="phishing-label"> (Phishing)</span>}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default App;