from flask import Flask, jsonify
from flask_cors import CORS
import json
app = Flask(__name__)
CORS(app)

@app.route('/state')
def state():
    with open('state.json', 'r') as f:
        state = json.load(f)
    return jsonify(state)