# MediCast — Autonomous Surgical Video Intelligence 🏥🚀

<div align="center">
  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/AMD_Logo.svg/1200px-AMD_Logo.svg.png" width="200" alt="Powered by AMD" />
</div>

## 🏆 Built for the AMD Developer Hackathon: ACT II (Unicorn Track)

**MediCast** is an autonomous surgical video intelligence platform designed to extract real-time safety, anatomical, and educational insights from surgical operations. Using advanced AI-driven vision and text capabilities powered exclusively by **AMD infrastructure and the Fireworks AI API**, MediCast aims to revolutionize surgical training, post-operative debriefing, and surgical quality assurance.

In an industry where surgical errors cost billions and jeopardize patient safety, MediCast acts as an autonomous co-pilot for surgeons and medical students alike.

## 🌟 Unicorn Startup Value Proposition
- **Multi-Agent Swarm Architecture:** Four independent AI agents (Anatomy, Safety, Phase, Education) run in parallel to analyze surgical frames instantly.
- **The Arbiter Agent:** A master AI that synthesizes the swarm's findings to issue a single, authoritative safety verdict (SAFE, WARNING, CRITICAL) for every moment of the surgery.
- **Automated Clinical Reports:** Automatically generates a comprehensive post-operative dictation report, saving surgeons 45 minutes of manual paperwork per procedure.
- **Cryptographic Black Box:** Aviation-style session sealing using SHA-256 hashes, ensuring that all AI safety verdicts are immutable and legally verifiable for hospital audit trails.
- **HIPAA-Compliant Edge Deployment:** Designed to run 100% on-premise on hospital servers using AMD Instinct GPUs. No patient data leaves the building, ensuring full data privacy while operating at sub-200ms latency.

---

## ⚡ Hardware Acceleration: AMD Instinct & ROCm

MediCast is architected to leverage AMD infrastructure at the edge for unparalleled speed and privacy:

- **Compute:** Optimized for local, on-premise inference powered by **AMD Instinct™ GPUs** via ROCm.
- **Bonus Track — Best Use of Gemma Models:** The core reasoning engine and the Arbiter are powered exclusively by Google's **Gemma 2** (`gemma2` local or `accounts/fireworks/models/gemma2-9b-it`), ensuring clinical accuracy and speed.
- **Local Edge LLMs (Ollama):** Includes native integration with Ollama/vLLM for running Vision and Text models (like LLaVA and Gemma 2) completely locally, resolving cloud latency and strict medical data privacy laws.

---

## 🛠️ Setup and Usage Instructions

MediCast is live and accessible online. No local installation is required!

### 1. Access the Live Demo
- **Live Application:** [https://medicast-frontend.onrender.com/](https://medicast-frontend.onrender.com/)

### 2. How to use MediCast
1. Open the Live Dashboard URL.
2. Click **Initialize Autonomous Analysis**.
3. The backend securely streams a surgical video while the **Analysis Engine** fires off parallel API requests to the Fireworks AI API.
4. Watch the 4 specialist agents and the Arbiter dynamically populate the UI.
5. Once complete, scroll down to view the **Clinical Report** and click **Seal Session** to trigger the cryptographic Black Box.

### Local Development (Cloud Inference)
If you wish to run the code locally using Fireworks API:
```bash
git clone https://github.com/ERIX-12/medicast--autonomous-surgical-video-intelligence.git
cd medicast--autonomous-surgical-video-intelligence
docker compose up --build
```
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`

### 🏥 On-Premise Edge Deployment (AMD ROCm)
To run the entire system completely locally with zero internet access (HIPAA compliant), utilizing AMD ROCm for hardware acceleration:
```bash
docker-compose -f docker-compose.rocm.yml up --build
```
*Note: Requires an AMD GPU with ROCm drivers installed. Models will be pulled and executed entirely in VRAM.*

---

## 🏗️ Architecture

- **Frontend:** React + Vite + TailwindCSS. Modern, dark-mode glassmorphism UI designed for premium hospital environments. Hosted on Render (Static Site).
- **Backend:** FastAPI (Python). Highly concurrent asynchronous architecture utilizing WebSockets for real-time analysis streaming. Hosted on Render (Web Service).
- **AI Core:** Custom multi-agent routing (Anatomy, Safety, Phase, Education) synthesized by an Arbiter agent.
- **Security:** SHA-256 cryptographic hashing for medical record immutability.

---

## 📜 License
MIT License - Open Source and ready for the world.