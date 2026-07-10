# IdeaXchange

A MERN-stack decentralized micro-contribution ledger platform for secure student innovation and stakeholder funding. IdeaXchange provides an immutable record of academic collaboration, using blockchain-inspired hashing and cryptographic signing to ensure fair attribution and quality control.

The platform addresses the "freeloader effect" in student projects by recording individual "delta" contributions into a chronological ledger. Stakeholders (faculty, industry experts, and funders) can monitor project progress through a real-time Dashboard, while an automated Project Impact Score (PIS) algorithm determines the market readiness of innovations.

### Architecture
```
Client:5173 (React/Vite) 
      ↓ 
Nginx:80 (Reverse Proxy) 
      ↓ 
[ Node Instance 1:3001 | Node Instance 2:3002 | Node Instance 3:3003 ]
      ↓ 
Distributed Consensus (Raft/TSS) 
      ↓ 
[ MongoDB (Ledger Data) | Redis (Real-time/Cache) ]
```

### Prerequisites
- Node.js 18.x or higher
- Docker Desktop (for containerized deployment)
- MongoDB Instance (local or Atlas)
- Redis Instance

### Quick Setup

1. **Clone & Environment**:
   ```bash
   git clone https://github.com/your-org/ideaxchange.git
   cd ideaxchange
   cp .env.example .env
   # Fill in GEMINI_API_KEY, JWT_SECRET, and MONGO_URI
   ```

2. **Backend Setup**:
   ```bash
   npm install
   npm run seed  # Initialize with test users and faculty
   npm run dev   # Starts server at http://localhost:3001
   ```

3. **Frontend Setup**:
   ```bash
   cd client
   npm install
   npm run dev   # Starts Vite at http://localhost:3000 (proxied to 3001)
   ```

4. **Docker Deployment**:
   ```bash
   docker-compose up --build
   ```

### Environment Variables
| Variable | Description | Example | Required |
| --- | --- | --- | --- |
| `PORT` | Server port | `3001` | Yes |
| `MONGO_URI` | Connection string | `mongodb://...` | Yes |
| `JWT_SECRET` | Auth encryption key | `a-long-random-string` | Yes |
| `PLATFORM_SIGNING_KEY` | HMAC Signing key | `sha256-key-v1` | Yes |
| `RAFT_SECRET` | Internal cluster auth | `raft-cluster-123` | Yes |

### API Reference (v1)
| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| POST | `/api/v1/auth/login` | No | Authenticate user and set cookies |
| GET | `/api/v1/projects` | Yes | List active projects |
| POST | `/api/v1/projects` | Yes | Create genesis block for new project |
| POST | `/api/v1/contributions/:id` | Yes | Append a delta block to the project chain |
| GET | `/api/v1/ledger/:id/verify` | Yes | Perform SHA-256 integrity check on chain |
| POST | `/api/v1/governance/propose` | Yes | Initiate TSS multi-sig proposal |

### Known Limitations
- **Sample Size**: Current PIS weights are optimized for small cohorts (3-7 members).
- **DiffSize Metric**: Relies on textual delta size; may not fully reflect conceptual density.
- **Legal Standing**: The ledger provides technical proof but requires institutional bylaws for legal IP claims.
- **Offline Mode**: Real-time hashing requires an active connection to the Raft leader.

### Future Work
- **AI Matchmaking**: Semantic matching between student innovations and stakeholder problem statements.
- **DAO Governance**: Transitioning from institutional-only to community-wide TSS quorums.
- **CRDT Sync**: Enabling true offline editing with delayed ledger commitment.

---
© 2024 IdeaXchange Research Group. All rights reserved.
