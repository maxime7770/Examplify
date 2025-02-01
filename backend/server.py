from flask import Flask, request, jsonify
from flask_cors import CORS

from model import run_model

app = Flask(__name__)
CORS(app)  # Allow all origins (or configure specific ones)

@app.route('/generate', methods=['POST'])
def generate():
    data = request.json
    system_prompt = data['system_prompt']
    user_text = data['user_text']
    model_output = run_model(system_prompt, user_text)
    return jsonify({"generated_text": model_output})

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000)