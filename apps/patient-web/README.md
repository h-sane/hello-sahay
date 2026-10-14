# Hello Sahay (హలో సహాయ్ / हेलो सहाय / ஹலோ சகாய்)

> **Accessible Rural Healthcare Companion for India**  
> Empowering rural communities with accessible healthcare guidance in Tamil, Hindi, and English. Features smart hospital discovery, Jan Aushadhi generic medicine cost comparison, dosage schedules/reminders, and emergency assistance.

---

## 🌟 Key Features

- **🌐 Multilingual Support**: Fully accessible interfaces and voice guidance in English, Hindi (हिंदी), and Tamil (தமிழ்).
- **🏥 Hospital & Care Discovery**: Find nearby primary health centers (PHCs), district hospitals, and clinics with service details and emergency contacts.
- **💊 Jan Aushadhi Generic Medicine Comparison**: Compare branded prescription drugs with government-subsidized generic equivalents to drastically reduce medication costs.
- **⏰ Smart Dosage Reminders**: Simple, visual medication schedules designed for low-literacy and elderly patients.
- **🚨 Emergency Quick-Assistance**: Instant access to ambulance, emergency helplines, and offline-first safety instructions.
- **🤖 Gemini AI Health Triage**: Intelligent voice and text conversational triage powered by the Google Gemini API to assess symptoms and recommend next steps.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling & UI**: Tailwind CSS, Lucide Icons, Motion (Framer Motion)
- **AI & Reasoning**: `@google/genai` (Google Gen AI SDK)
- **Tooling**: Node.js, npm

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- [npm](https://www.npmjs.com/)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/adhitya1538/Hello_Sahay.git
   cd Hello_Sahay
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy `.env.example` to `.env.local` (or `.env`):
   ```bash
   cp .env.example .env.local
   ```
   Open `.env.local` and add your Google Gemini API key:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📜 Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts Vite development server on port 3000 |
| `npm run build` | Compiles TypeScript and creates optimized production bundle in `dist/` |
| `npm run preview` | Previews the production build locally |
| `npm run lint` | Runs TypeScript type checking (`tsc --noEmit`) |

---

## 📄 License

This project is licensed under the MIT License - see the repository for details.
