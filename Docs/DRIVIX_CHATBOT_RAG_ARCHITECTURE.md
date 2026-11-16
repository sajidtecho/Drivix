# Drivix AI Chatbot & RAG Architecture Specification

This document provides a comprehensive, production-grade architectural specification for building and integrating an AI Chatbot powered by **Retrieval-Augmented Generation (RAG)** and **Agentic Tool Calling** into the existing **Drivix Smart Parking Ecosystem**.

---

## 1. Executive Summary & Vision

The Drivix AI Assistant transforms static parking search and customer support into an intelligent, conversational experience. It blends two core AI capabilities:

1. **Retrieval-Augmented Generation (RAG)**: Answers questions on parking policies, gate navigation, pricing transparency, EV charging facilities, overstay penalties, and FAQs using verified domain documents.
2. **Agentic Tool Calling (Live Database & ML Execution)**: Performs real-time actions—such as searching available slots, quoting dynamic prices via the Drivix XGBoost model, retrieving active tickets, and extending reservations.

---

## 2. End-to-End System Architecture

The following flowchart illustrates how the Chatbot connects Web and Mobile clients, the Node.js/Express backend, the MongoDB Vector Store, the Python ML Service, and the LLM reasoning engine.

```mermaid
flowchart TD
    subgraph Clients["Frontend Clients"]
        WEB["React Web App (Floating Widget / Support Page)"]
        MOB["React Native / Expo App (Bottom Sheet / Support Tab)"]
    end

    subgraph Gateway["API Gateway & Security Layer"]
        AUTH["JWT Authentication Middleware"]
        RATE["Rate Limiter (e.g., 20 req/min)"]
        SAN["Input Sanitizer & Guardrails"]
    end

    subgraph ChatOrchestrator["Chat Orchestration Engine (Node.js or Python)"]
        ROUTER["Intent Classifier & Query Router"]
        MEM["Conversation Memory Manager"]
        PROMPT["Dynamic Prompt Assembler"]
    end

    subgraph KnowledgeStore["RAG Vector Storage"]
        EMBED_MODEL["Embedding Model (text-embedding-004)"]
        MONGO_VEC["MongoDB Atlas Vector Search ($vectorSearch)"]
        DOCS["Drivix Knowledge Base (Policies, FAQs, Amenities)"]
    end

    subgraph LiveTools["Drivix Core Operational Services"]
        SLOT_API["Slot Availability Service (MongoDB)"]
        PRICE_API["Dynamic Pricing Service (XGBoost / ml_service)"]
        BOOKING_API["Booking & Ticket Management"]
    end

    subgraph LLM["LLM Reasoning Engine"]
        GENAI["Large Language Model (Gemini 2.0 / GPT-4o-mini / Llama 3)"]
    end

    WEB --> AUTH
    MOB --> AUTH
    AUTH --> RATE
    RATE --> SAN
    SAN --> ROUTER

    DOCS --> EMBED_MODEL
    EMBED_MODEL --> MONGO_VEC

    ROUTER --> MEM
    ROUTER -->|"1. Vector Search Query"| MONGO_VEC
    MONGO_VEC -->|"2. Retrieved Chunks"| PROMPT

    ROUTER -->|"3. System Prompt + History + Chunks"| GENAI

    GENAI -->|"4a. Direct Text Response"| ROUTER
    GENAI -->|"4b. Function Call Request"| ROUTER

    ROUTER -->|"Execute Tool"| SLOT_API
    ROUTER -->|"Execute Tool"| PRICE_API
    ROUTER -->|"Execute Tool"| BOOKING_API

    SLOT_API -->|"Tool Output"| PROMPT
    PRICE_API -->|"Tool Output"| PROMPT
    BOOKING_API -->|"Tool Output"| PROMPT

    PROMPT -->|"5. Final Context + Tool Result"| GENAI
    GENAI -->|"6. Final Formatted Answer"| ROUTER
    ROUTER -->|"7. Server-Sent Events (SSE) Stream"| Clients
```

---

## 3. Data Ingestion & RAG Vector Pipeline

Before users can query policies and facility guides, documents must be processed, chunked, embedded, and indexed.

```mermaid
flowchart LR
    A["Raw Knowledge Docs (Markdown, PDF, FAQs)"] --> B["Document Loader"]
    B --> C["Recursive Character Splitter (500 chars, 50 overlap)"]
    C --> D["Embedding Model (text-embedding-004)"]
    D --> E["Vector Array (768 Dimensions)"]
    E --> F["MongoDB 'knowledge_chunks' Collection"]
    F --> G["MongoDB Atlas Vector Search Index (Cosine Similarity)"]
```

### Ingestion Steps
1. **Document Curation**: Store documents in a structured folder (`knowledge_base/`), covering:
   - `parking_rules.md` (overstay fines, cancellation windows, refund policies).
   - `facility_profiles.md` (locations, height clearances, EV charger specs, handicapped access).
   - `how_to_use.md` (QR entry procedures, Fastag, wallet payments, payment receipts).
2. **Chunking**: Break documents into chunks of 400–600 tokens with 50-token overlaps to preserve semantic continuity.
3. **Embedding Generation**: Vectorize each chunk via Google Gemini `text-embedding-004` (768 dimensions) or OpenAI `text-embedding-3-small` (1536 dimensions).
4. **Vector Indexing**: Store inside a MongoDB collection with an Atlas Vector Search index using `cosine` similarity.

---

## 4. Query & Response Sequence Diagram

This sequence diagram details the lifecycle of a user asking a question that requires both RAG context and live data retrieval.

```mermaid
sequenceDiagram
    autonumber
    actor User as User (App / Web)
    participant UI as Chat Widget UI
    participant Backend as Chat Controller (API)
    participant VectorDB as MongoDB Atlas Vector Search
    participant LLM as LLM (Gemini / GPT)
    participant DrivixAPI as Drivix Live APIs (Slots / ML)

    User->>UI: Types "Can I park my EV at City Center and what does it cost?"
    UI->>Backend: POST /api/chat/message (user token, sessionId, prompt)
    
    Backend->>VectorDB: Query embeddings: Find top 3 chunks for "EV parking City Center"
    VectorDB-->>Backend: Return: [City Center EV charging bays guide, base pricing structure]

    Backend->>Backend: Fetch last 6 messages from ChatSession (Short-term memory)
    Backend->>LLM: Send System Prompt + Retrieved Chunks + Conversation History + User Query
    
    Note over LLM: LLM identifies need for live pricing and slot availability
    LLM-->>Backend: Function Call: check_slot_availability(location="City Center", evOnly=true)
    
    Backend->>DrivixAPI: Query real-time bay status & call ml_service pricing
    DrivixAPI-->>Backend: Return: {availableSlots: 4, dynamicRate: 65, currency: "INR"}

    Backend->>LLM: Send tool execution output
    LLM-->>Backend: Formulate final natural language answer + structured action payload
    Backend-->>UI: Stream response via Server-Sent Events (SSE)
    UI-->>User: Displays response with "Reserve EV Bay Now" button
```

---

## 5. Agentic Function Calling / Tool Definitions

The LLM is provided with structured JSON schemas representing callable Drivix APIs:

```mermaid
flowchart TD
    LLM_DECISION{"Does query need real-time data or user actions?"}
    
    LLM_DECISION -->|"NO (e.g. 'What is refund policy?')"| RAG_ONLY["Answer directly from retrieved RAG context"]
    LLM_DECISION -->|"YES (e.g. 'Is slot A-12 free?')"| CALL_TOOL["Emit Tool Call (JSON Function Name + Arguments)"]
    
    CALL_TOOL --> TOOL_CHOICE{"Tool Selected"}
    TOOL_CHOICE --> T1["get_available_slots(location, time, type)"]
    TOOL_CHOICE --> T2["get_quote(location, duration, arrivalTime)"]
    TOOL_CHOICE --> T3["get_my_active_bookings(userId)"]
    TOOL_CHOICE --> T4["request_booking_extension(bookingId, extraMinutes)"]

    T1 --> BACKEND_EXEC["Drivix Backend Executes Controller Function"]
    T2 --> BACKEND_EXEC
    T3 --> BACKEND_EXEC
    T4 --> BACKEND_EXEC

    BACKEND_EXEC --> SYNTH["Feed Result Back to LLM for User-Friendly Synthesis"]
```

### Detailed Tool Specifications

1. **`get_available_slots`**:
   * *Parameters*: `locationId` (string), `vehicleType` (car/bike/ev), `entryTime` (ISO string).
   * *Returns*: Available bay count, bay numbers, nearest entrance gate.
2. **`get_quote`**:
   * *Parameters*: `locationId` (string), `durationHours` (number), `entryTime` (ISO string).
   * *Underlying Service*: Calls `ml_service/predict.py` (XGBoost model) + deterministic pricing multiplier.
   * *Returns*: Base rate, surge multiplier ($0.97\times - 1.05\times$), total INR price, demand level.
3. **`get_my_active_bookings`**:
   * *Parameters*: Implicitly derived from authenticated JWT `req.user.id`.
   * *Returns*: Active QR code link, parking bay name, start time, remaining time.
4. **`request_booking_extension`**:
   * *Parameters*: `bookingId` (string), `additionalMinutes` (integer).
   * *Returns*: Success status, additional amount due, updated expiry timestamp.

---

## 6. Database Schema Design (MongoDB)

To support conversational threads, context memory, and vector retrieval, three MongoDB models are introduced:

```mermaid
erDiagram
    ChatSession ||--o{ ChatMessage : contains
    User ||--o{ ChatSession : owns
    KnowledgeChunk }|..|| ChatSession : "referenced via RAG"

    User {
        ObjectId _id PK
        string name
        string email
        string role
    }

    ChatSession {
        ObjectId _id PK
        ObjectId userId FK
        string title
        string channel "web | mobile | admin"
        string status "active | archived"
        date lastInteractionAt
        date createdAt
    }

    ChatMessage {
        ObjectId _id PK
        ObjectId sessionId FK
        string sender "user | assistant | system | tool"
        string content
        array toolCalls
        array retrievedChunkIds
        date timestamp
    }

    KnowledgeChunk {
        ObjectId _id PK
        string documentTitle
        string category "faq | policy | facility | pricing"
        string content
        array embedding "Vector[768]"
        object metadata
        date updatedAt
    }
```

### MongoDB Atlas Vector Search Index Definition
```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 768,
      "similarity": "cosine"
    },
    {
      "type": "filter",
      "path": "category"
    }
  ]
}
```

---

## 7. REST & Streaming API Specifications

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/chat/sessions` | Initialize or resume a conversation thread | Yes (JWT) |
| `GET` | `/api/chat/sessions` | List user's past chat sessions | Yes (JWT) |
| `GET` | `/api/chat/sessions/:id/messages`| Retrieve historical message log for a session | Yes (JWT) |
| `POST` | `/api/chat/message` | Send message & receive streamed response (SSE) | Yes (JWT) |
| `POST` | `/api/chat/feedback` | Submit thumbs up/down and text feedback | Yes (JWT) |
| `POST` | `/api/chat/admin/sync-kb` | Ingest/re-index updated Markdown knowledge files| Admin Only |

### Streaming Protocol (Server-Sent Events)
For responsive UI interaction, `/api/chat/message` streams tokens in real-time:
```http
HTTP/1.1 200 OK
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive

data: {"type": "token", "content": "Sure! "}
data: {"type": "token", "content": "There are "}
data: {"type": "token", "content": "4 EV charging bays "}
data: {"type": "tool_execution", "tool": "get_quote", "result": {"totalInr": 120}}
data: {"type": "token", "content": "available at City Center for ₹120."}
data: {"type": "action_card", "action": "OPEN_BOOKING", "payload": {"location": "City Center"}}
data: {"type": "done"}
```

---

## 8. Frontend UI/UX Architecture

```mermaid
flowchart TD
    subgraph UIComponents["Chatbot Frontend Component Hierarchy"]
        ROOT["<DrivixChatWidget />"]
        HEADER["<ChatHeader /> (Avatar, Status, Minimize, Close)"]
        BODY["<ChatMessageList /> (Virtual scroll for history)"]
        BUBBLE_USER["<UserBubble />"]
        BUBBLE_BOT["<BotBubble /> (Markdown parser, KaTeX math)"]
        ACTION_CARD["<QuickActionCard /> (Booking Card / 'Pay Now' Button)"]
        SUGGESTIONS["<SuggestedPrompts /> ('Find EV Slot', 'My Booking')"]
        INPUT_BAR["<ChatInputBar /> (Text input, Send, Voice Input)"]
    end

    ROOT --> HEADER
    ROOT --> BODY
    BODY --> BUBBLE_USER
    BODY --> BUBBLE_BOT
    BUBBLE_BOT --> ACTION_CARD
    ROOT --> SUGGESTIONS
    ROOT --> INPUT_BAR
```

* **Web**: Floating action pill in bottom-right corner (`z-index: 9999`) that expands into a 400px $\times$ 600px drawer.
* **Mobile**: Bottom sheet modal (using `@gorhom/bottom-sheet` in React Native) or dedicated tab inside the Driver App.
* **Actionable Cards**: When the bot returns parking options, it renders interactive cards with a direct "Book This Bay" button that pre-fills the checkout screen.

---

## 9. Security, Privacy & Guardrails

```mermaid
flowchart LR
    INPUT["User Prompt"] --> G1["Prompt Injection Filter"]
    G1 --> G2["PII Redaction (Phone, Card #, Passwords)"]
    G2 --> G3["Role-Based Scope Checker"]
    G3 --> EXEC["LLM & RAG Execution"]
    EXEC --> G4["Hallucination & Grounding Check"]
    G4 --> OUTPUT["Safe Sanitized Output"]
```

1. **Prompt Injection Defense**: Prepend strict system rules instructing the model to reject instructions asking it to reveal internal system prompts or bypass security.
2. **Access Isolation**: The tool execution layer checks `req.user.id`. A user can never query or cancel another driver's booking.
3. **Data Privacy**: Redact sensitive payment information, credit card numbers, and raw passwords before text is sent to the LLM API.
4. **Fallback Handling**: If the vector database or LLM is unreachable, the system falls back to a deterministic rule-based FAQ response and surfaces the customer support phone number.

---

## 10. Phased Implementation Roadmap

```mermaid
gantt
    title Drivix AI Chatbot & RAG Implementation Timeline
    dateFormat  YYYY-MM-DD
    section Phase 1: Knowledge & Vector
    Curate Markdown Knowledge Base         :p1a, 2026-11-17, 2d
    Setup MongoDB Atlas Vector Index       :p1b, after p1a, 1d
    Build Ingestion & Embedding Script     :p1c, after p1a, 2d
    section Phase 2: RAG Backend
    Build Vector Search Service ($vectorSearch) :p2a, after p1c, 2d
    Integrate LLM API & Prompt Templates   :p2b, after p2a, 2d
    section Phase 3: Function Calling
    Implement Drivix Live Tools (Slots/ML) :p3a, after p2b, 3d
    Implement Session & History Models     :p3b, after p2b, 2d
    section Phase 4: Frontend UI
    Develop React Web Floating Widget      :p4a, after p3a, 3d
    Develop React Native Mobile Interface  :p4b, after p4a, 2d
    Implement Streaming Response (SSE)     :p4c, after p4a, 2d
    section Phase 5: Verification & Launch
    End-to-End Testing & Guardrails Audit  :p5a, after p4b, 2d
    Production Deployment & Monitoring     :p5b, after p5a, 1d
```

---

## 11. Conclusion & Immediate Next Steps

Integrating a RAG-powered chatbot with tool calling is a high-impact, natural evolution for Drivix. Because your infrastructure already leverages MongoDB, Node.js, and an advanced Python dynamic pricing ML service, **more than 70% of the foundational plumbing is already in place**.

The next actionable step is to create the initial knowledge base files and set up the MongoDB vector search collection.

