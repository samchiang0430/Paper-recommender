# --- /model/app.py ---

from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
import pickle
from transformers import BertTokenizer, BertModel
import torch.nn.functional as F
from gnn_model import DeeperGraphSAGE  # Your GNN model class

app = Flask(__name__)
CORS(app)

# Load paper metadata
with open("paper_dataset.pkl", "rb") as f:
    paper_data = pickle.load(f)

# Load embedded vectors from dicts
with open("encoded_papers_dataset.pkl", "rb") as f:
    encoded_papers = pickle.load(f)

# Extract and convert all 384-dim vectors
paper_vecs_list = [entry["embedding"] for entry in encoded_papers]
paper_vecs = torch.tensor(paper_vecs_list, dtype=torch.float32)
paper_vecs = F.normalize(paper_vecs, dim=1)

# Load pretrained GNN model (still needed if you use it later)
model = DeeperGraphSAGE(in_channels=384, hidden_channels=128, out_channels=64)
model.load_state_dict(torch.load("graph_model.pt", map_location=torch.device("cpu")))
model.eval()

# Load BERT
tokenizer = BertTokenizer.from_pretrained("bert-base-uncased")
bert_model = BertModel.from_pretrained("bert-base-uncased")

def embed_input(text):
    inputs = tokenizer(text, return_tensors="pt", padding=True, truncation=True)
    outputs = bert_model(**inputs)
    # Use token embeddings (not pooled) and average, then truncate to 384 dims
    token_embeddings = outputs.last_hidden_state  # shape: [1, seq_len, 768]
    avg_embedding = token_embeddings.mean(dim=1)  # shape: [1, 768]
    reduced_embedding = avg_embedding[:, :384]    # shape: [1, 384]
    return reduced_embedding.detach()


@app.route("/recommend", methods=["POST"])
def recommend():
    data = request.get_json()
    answers = data.get("clarificationAnswers", [])
    if not answers:
        return jsonify({"recommended": []})

    query_text = " ".join(answers)
    query_vec = embed_input(query_text)  # shape [1, 768]
    query_vec = F.normalize(query_vec, dim=1)

    # Extract embeddings from encoded_papers
    paper_vecs = []
    for paper in encoded_papers:
        if isinstance(paper, dict) and 'embedding' in paper:
            paper_vecs.append(paper['embedding'])
    
    paper_vecs = torch.tensor(paper_vecs, dtype=torch.float32)
    paper_vecs = F.normalize(paper_vecs, dim=1)

    sim_scores = F.cosine_similarity(query_vec, paper_vecs)
    top_indices = torch.topk(sim_scores, k=5).indices.tolist()

    recommended = []
    for i in top_indices:
        paper = paper_data[i]
        recommended.append({
            "title": paper.get("title", "No Title"),
            "authors": ", ".join(paper.get("authors", [])),
            "paperId": paper.get("paperId", "No ID"),  # Ensure paperId is included
            "abstract": paper.get("abstract", "No abstract available")  # Include the abstract
        })

    return jsonify({"recommended": recommended})


if __name__ == "__main__":
    app.run(port=5000, debug=True)
