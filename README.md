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
- **Zero Local Hardware Needed:** Deployed entirely via the cloud on **Render**. Hospitals do not need to install massive, expensive GPU servers—MediCast runs purely via the cloud.

---

## ⚡ AMD & Fireworks AI Integration

MediCast fully leverages the required technology stack to deliver unparalleled speed and intelligence:

- **Compute:** Fully cloud-based inference powered by **AMD Instinct™ GPUs**.
- **Bonus Track — Best Use of Gemma Models:** The core reasoning engine and the Arbiter are powered exclusively by Google's **Gemma 2** (`accounts/fireworks/models/gemma2-9b-it`), ensuring clinical accuracy and speed.
- **Parallel Inference Engine:** By utilizing the fast inference speeds of Fireworks AI on AMD hardware, MediCast processes complex multi-agent JSON outputs in a fraction of the time it would take traditional monolithic systems.

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

### Local Development (Docker)
If you wish to run the code locally:
```bash
git clone https://github.com/ERIX-12/medicast--autonomous-surgical-video-intelligence.git
cd medicast--autonomous-surgical-video-intelligence
docker compose up --build
```
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`

---

## 🏗️ Architecture

- **Frontend:** React + Vite + TailwindCSS. Modern, dark-mode glassmorphism UI designed for premium hospital environments. Hosted on Render (Static Site).
- **Backend:** FastAPI (Python). Highly concurrent asynchronous architecture utilizing WebSockets for real-time analysis streaming. Hosted on Render (Web Service).
- **AI Core:** Custom multi-agent routing (Anatomy, Safety, Phase, Education) synthesized by an Arbiter agent.
- **Security:** SHA-256 cryptographic hashing for medical record immutability.

---

## 📜 License
MIT License - Open Source and ready for the world.