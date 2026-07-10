# MediCast — Autonomous Surgical Video Intelligence 🏥🚀

<div align="center">
  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/AMD_Logo.svg/1200px-AMD_Logo.svg.png" width="200" alt="Powered by AMD" />
</div>

## 🏆 Built for the AMD Developer Hackathon: ACT II (Unicorn Track)

**MediCast** is an autonomous surgical video intelligence platform designed to extract real-time safety, anatomical, and educational insights from surgical operations. Using advanced AI-driven vision and text capabilities powered exclusively by **AMD infrastructure and the Fireworks AI API**, MediCast aims to revolutionize surgical training, post-operative debriefing, and surgical quality assurance.

In an industry where surgical errors cost billions and jeopardize patient safety, MediCast acts as an autonomous co-pilot for surgeons and medical students alike.

### 🌟 Unicorn Startup Value Proposition
- **Surgical Safety Assessment:** Automatically detects critical safety events and potential hazards during a procedure.
- **Interactive Debrief:** A conversational AI that lets surgeons and students query specific parts of the surgery (e.g., *"Why did the surgeon pause at frame 142?"* or *"Was the clip applied correctly?"*).
- **Educational Mining:** Extracts key anatomical landmarks and surgical phases to create automated training material for residents.
- **Zero Local Hardware Needed:** Deploys entirely via the cloud using AMD Developer Cloud and Fireworks AI. Hospitals do not need to install massive, expensive GPU servers in their server rooms—MediCast runs entirely via the cloud.

---

## ⚡ AMD & Fireworks AI Integration

MediCast fully leverages the required technology stack to deliver unparalleled speed and intelligence:

- **Compute:** Fully cloud-based inference powered by **AMD Instinct™ GPUs**.
- **Bonus Track — Best Use of Gemma Models:** The text generation and interactive debriefing engine is powered exclusively by Google's **Gemma 2** (`accounts/fireworks/models/gemma2-9b-it`), ensuring clinical accuracy and speed, while the vision tasks are routed to multimodal models.
- **Parallel Inference Engine:** The backend orchestrates a multi-agent swarm (Anatomy Agent, Safety Agent, Phase Agent, Education Agent) executing concurrently. By utilizing the fast inference speeds of Fireworks AI on AMD hardware, MediCast processes 60+ video frames in a fraction of the time it would take traditional systems.

---

## 🛠️ Setup and Usage Instructions

MediCast is fully containerized with Docker, making deployment a breeze.

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) & [Docker Compose](https://docs.docker.com/compose/install/)
- An active Internet connection to communicate with the Fireworks AI API.

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/medi_cast.git
cd medi_cast
```

### 2. Run with Docker Compose
To spin up both the React frontend and FastAPI backend:
```bash
docker compose up --build
```

### 3. Access the Application
- **Frontend Dashboard:** [http://localhost:5173](http://localhost:5173)
- **Backend API Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)

### How to use MediCast
1. Open the Frontend Dashboard.
2. Enter a **YouTube Surgical Video URL** (e.g., a laparoscopic cholecystectomy).
3. The backend uses `yt-dlp` and `ffmpeg` to securely extract real video frames.
4. The **Analysis Engine** fires off parallel API requests to the Fireworks AI API, building a structural context of the surgery.
5. Once complete, click **Interactive Debrief** to chat with the AI about the surgery!

---

## 🏗️ Architecture

- **Frontend:** React + Vite + TailwindCSS. Modern, glassmorphism-inspired UI for premium hospital environments.
- **Backend:** FastAPI (Python). Highly concurrent asynchronous architecture utilizing WebSockets for real-time analysis streaming.
- **AI Core:** LangChain-style custom multi-agent routing.
- **Containerization:** Docker Compose for seamless reproducible environments.

---

## 📜 License
MIT License - Open Source and ready for the world.