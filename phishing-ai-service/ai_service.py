import os
import json
import re
from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app) # Enable CORS for all routes

# Configure Gemini API
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel('models/gemini-2.5-flash')

# ... (imports) ...

@app.route('/generate_phishing_scenario', methods=['POST'])
def generate_phishing_scenario():
    data = request.json
    # --- NEW DEBUG LOGS ---
    print(f"DEBUG_PYTHON: Received raw request data: {data}")
    # --- END NEW DEBUG LOGS ---

    user_prompt = data.get('user_prompt')
    scenario_type = data.get('scenario_type', 'email')

    # --- NEW DEBUG LOGS ---
    print(f"DEBUG_PYTHON: Extracted user_prompt: '{user_prompt}'")
    print(f"DEBUG_PYTHON: Extracted scenario_type: '{scenario_type}'")
    # --- END NEW DEBUG LOGS ---

    if not user_prompt:
        # This is one condition that returns a 400
        print("DEBUG_PYTHON: user_prompt is missing or empty, returning 400.")
        return jsonify({"error": "No user_prompt provided."}), 400

    if scenario_type not in ['email', 'sms']:
        # This is another condition that returns a 400
        print(f"DEBUG_PYTHON: Invalid scenario_type '{scenario_type}', returning 400.")
        return jsonify({"error": "Invalid scenario_type. Must be 'email' or 'sms'."}), 400

    # ... (rest of your code) ...

    # NEW: Adjust prompt based on scenario_type
    if scenario_type == 'email':
        ai_prompt = f"""
        You are a highly sophisticated Phishing Scenario Generator AI. Your task is to create a realistic and detailed phishing email and a corresponding scenario description based on the user's prompt.

        The output must be in a strict JSON format. Do not include any other text, explanations, or markdown outside of the JSON block.

        The JSON should have the following structure:
        {{
            "scenario": {{
                "id": "unique_scenario_id_string",
                "description": "A concise description of the phishing scenario.",
                "goal": "The attacker's objective (e.g., 'credential harvesting', 'malware delivery', 'financial fraud')."
            }},
            "phishingType": "e.g., 'Impersonation', 'Urgency', 'Tech Support Scam', 'Package Delivery Scam'",
            "emailDetails": {{
                "subject": "The subject line of the phishing email.",
                "sender": "The fake sender's name and email address (e.g., 'PayPal <service@paypal.com>', 'IT Support <support@yourcompany.com>'). Ensure it looks convincing.",
                "recipient": "The intended recipient (e.g., 'user@example.com').",
                "body": "The full body of the phishing email. Use clear, convincing, and grammatically correct language. Include a call to action. Use \\n for newlines within the string.",
                "links": [
                    {{
                        "text": "Text for the hyperlink (e.g., 'Verify your account')",
                        "url": "https://malicious-site.com/verify",
                        "isPhishing": true
                    }},
                    {{
                        "text": "Text for another hyperlink (if any)",
                        "url": "https://example.com/legit-link",
                        "isPhishing": false
                    }}
                ],
                "attachments": [
                    "Optional: File name of a fake attachment (e.g., 'invoice.pdf')",
                    "Optional: Another attachment"
                ]
            }}
        }}

        Ensure the "body" field uses '\\n' for newlines to keep it a single-line string for JSON parsing.
        Generate a scenario and email based on: "{user_prompt}"
        """
    else: # scenario_type == 'sms'
        ai_prompt = f"""
        You are a highly sophisticated Phishing Scenario Generator AI. Your task is to create a realistic and detailed SMS phishing (smishing) message and a corresponding scenario description based on the user's prompt.

        The output must be in a strict JSON format. Do not include any other text, explanations, or markdown outside of the JSON block.

        The JSON should have the following structure:
        {{
            "scenario": {{
                "id": "unique_sms_scenario_id_string",
                "description": "A concise description of the SMS phishing scenario.",
                "goal": "The attacker's objective (e.g., 'credential harvesting', 'malware delivery', 'financial fraud')."
            }},
            "phishingType": "e.g., 'Package Delivery Scam', 'Bank Alert', 'Prize Notification', 'Utility Bill Scam'",
            "smsDetails": {{
                "senderPhone": "The fake sender's phone number or short code (e.g., '88976', '+1-800-555-0199', 'USPS').",
                "recipientPhone": "The intended recipient (e.g., '+1-555-123-4567').",
                "message": "The full body of the SMS message. Keep it concise, urgent, and convincing (max ~160 characters for a single SMS part, but for simulation, a bit longer is fine). Include a clear call to action. Use \\n for newlines within the string.",
                "links": [
                    {{
                        "text": "Optional: Text for the hyperlink (e.g., 'Click here to update')",
                        "url": "https://malicious-site.com/sms-link",
                        "isPhishing": true
                    }}
                ]
            }}
        }}

        Ensure the "message" field uses '\\n' for newlines within the string, though SMS are usually single line. Keep the message concise for SMS.
        Generate a scenario and SMS message based on: "{user_prompt}"
        """

    try:
        response = model.generate_content(ai_prompt)
        ai_output_str = response.text

        # Clean the output: remove backticks and "json" keyword
        cleaned_output = re.sub(r'```json\s*|\s*```', '', ai_output_str, flags=re.IGNORECASE).strip()

        # Attempt to parse the JSON
        parsed_json = json.loads(cleaned_output)

        # Basic validation for required fields
        if not all(k in parsed_json for k in ['scenario', 'phishingType']) or \
           (scenario_type == 'email' and 'emailDetails' not in parsed_json) or \
           (scenario_type == 'sms' and 'smsDetails' not in parsed_json):
            raise ValueError("AI response is missing essential keys.")

        return jsonify(parsed_json)

    except json.JSONDecodeError as e:
        print(f"ERROR: JSON Decode Error: {e}")
        print(f"Problematic string: {ai_output_str}") # Print original AI response for debugging
        return jsonify({"error": "Failed to parse JSON from AI response.", "details": str(e), "raw_ai_output": ai_output_str}), 500
    except Exception as e:
        print(f"ERROR: Error generating phishing scenario: {e}")
        return jsonify({"error": f"Error generating phishing scenario: {e}"}), 500

if __name__ == '__main__':
    # Default port for Python AI service
    app.run(host='0.0.0.0', port=5001, debug=True)