# ASKAI 🌐🧠

> **An Offline-First Portable AI & Knowledge Infrastructure Server**  
> Expose local AI Chat, Semantic Document Search, and Offline Learning Content to any device on your local WiFi hotspot. Zero internet, 100% private, startup-grade MVP.

---

## 🚀 The Vision

In remote areas, schools, field offices, and emergency scenarios, internet connection is a luxury. Yet, the need for intelligent educational support and knowledge discovery remains critical. 

**ASKAI** turns a single laptop or edge computer into a portable, battery-powered intelligence hub. By running low-footprint, high-performance LLMs locally via Ollama, chunking documents into ChromaDB, and caching offline courses with Kolibri, ASKAI serves a private LAN. Anyone nearby can connect to the WiFi hotspot, open a browser, and instantly access:
1. **AI Chat** powered by `gemma3:1b`.
2. **Local Knowledge Search (RAG)** citing exact uploaded PDFs/Markdown sources.
3. **Offline Learning Modules** via Kolibri's extensive textbook/media library.
4. **CTO Admin Dashboard** to monitor LAN traffic, active user agents, system resource consumption, and manage vector indexing.

---

## 🏗️ System Architecture

```
                      ┌────────────────────────────────────────────────────────┐
                      │                     LAN / Hotspot                      │
                      │  Phones / Tablets / Laptops → Web Browser (Port 3000)  │
                      └───────────────────────────┬────────────────────────────┘
                                                  │
                                        ┌─────────▼──────────┐
                                        │  Next.js 15 Web    │
                                        │  App & API Routes  │
                                        └─────────┬──────────┘
                                                  │
                                  ┌───────────────┼───────────────┐
                                  │               │               │
                        ┌─────────▼────┐  ┌───────▼──────┐  ┌────▼──────────┐
                        │  SQLite DB   │  │ FastAPI AI   │  │  Kolibri      │
                        │  (Drizzle)   │  │ Service      │  │  (sibling     │
                        │              │  │ :8000        │  │   service)    │
                        └──────────────┘  └───────┬──────┘  └───────────────┘
                                                  │
                                        ┌─────────▼──────────┐
                                        │  Ollama            │
                                        │  :11434            │
                                        │  (gemma3:1b +      │
                                        │   embeddings)      │
                                        └────────────────────┘
```

---

## 🛠️ Tech Stack & Monorepo Structure

The project is managed as a high-performance **pnpm monorepo**:

* **`apps/web` (Next.js 15)**: The client application and administrative API.
  * Styling: Vanilla CSS custom design system with rich glassmorphic elements, modern dark mode, and sleek Framer Motion micro-animations.
  * Database: Drizzle ORM + Better-SQLite3 for local, high-speed relational storage.
  * Authentication: Iron Session for secure, stateless admin cookies.
* **`apps/ai-service` (FastAPI + LangChain)**: High-performance Python bridge.
  * Vector Store: Embedded ChromaDB instance.
  * Ingestion: Recursive character splitters, PDF/TXT/Markdown parsing, and nomic embedding generations.
  * Orchestration: Background worker threads for async chunk indexing and status callbacks.
* **`infra/docker`**: Production-grade Multi-container setups for offline deployments.

---

## 📦 Directory Structure

```
askai/
├── apps/
│   ├── web/                          # Next.js 15 frontend & api gateway
│   │   ├── app/                      # App router layout & pages
│   │   │   ├── (public)/             # Public access (chat, knowledge, learn)
│   │   │   ├── (admin)/              # Auth-protected Admin Dashboard
│   │   │   └── api/                  # API endpoints (RAG, logs, sessions, status)
│   │   ├── components/               # React components (Layout, UI primitives)
│   │   ├── lib/                      # DB schemas, iron-session configuration, AI provider
│   │   └── scripts/                  # DB seed & setup scripts
│   └── ai-service/                   # FastAPI Python server
│       ├── app/
│       │   ├── main.py               # API Router bindings
│       │   ├── routers/              # Chat, ingestion, & embeddings endpoints
│       │   └── services/             # ChromaDB vector store, Ollama wrappers
│       └── requirements.txt
├── infra/
│   └── docker/                       # Docker Compose and Dockerfile setups
├── .env.example                      # Production-grade configuration template
└── package.json                      # Workspace configurations
```

---

## 🚦 Quick Start Guide

### Prerequisites
1. **Node.js** (v18+) & **pnpm** installed.
2. **Python 3.10+** & `uv` package manager installed.
3. **Ollama** running locally.

### 1. Model Configuration
Ensure you have pulled the required local models in Ollama:
```bash
# Pull Gemma3 1B for lightning fast local inference
ollama pull gemma3:1b

# Pull Nomic Embed Text for high-accuracy local vector embeddings
ollama pull nomic-embed-text
```

### 2. Install Dependencies & Build
From the monorepo root:
```bash
# Install Node dependencies
pnpm install

# Setup local python environment inside ai-service
cd apps/ai-service
uv venv
source .venv/bin/activate
uv pip install -r requirements.txt
cd ../..
```

### 3. Database Initialization
Initialize the SQLite database and run the migrations:
```bash
# Copy env configuration
cp .env.example .env

# Run database setup & bootstrap admin credentials (admin / askai123)
pnpm --filter web run db:setup
```

### 4. Run Development Servers
You can launch both the web frontend and AI service simultaneously from the root:
```bash
# Run web client (localhost:3000) & AI service (localhost:8000)
pnpm dev
```

---

## 🌐 LAN Hotspot Deployment

To expose ASKAI to all nearby devices:

1. **Find your local network IP**:
   * **Mac**: `ipconfig getifaddr en0`
   * **Linux/Windows**: `hostname -I` or `ip addr show` (e.g., `192.168.1.45`)
2. **Configure your `.env`**:
   Ensure `HOST=0.0.0.0` to allow incoming traffic.
3. **Connect client devices**:
   Connect phones, tablets, or laptops to the same WiFi network and open `http://<your-host-ip>:3000` in any web browser.

---

## 🔒 Security & Offline Safety

* **Offline-First Isolation**: Zero network connections are made to the public internet. All transcripts, vector metrics, and database entries live locally.
* **Relational Logs**: System request statistics are tracked locally in `request_logs` to audit active client devices entirely offline.
* **Kolibri Bridging**: Integrates cleanly with a sibling Kolibri installation. Probes local port `8080` (or custom configured url) to check education content availability.

---

## 📄 License
This project is proprietary and built for high-performance localized AI applications.
