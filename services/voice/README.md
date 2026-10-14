# services/voice — Voice pipeline

Browser/app audio over WebSocket → Amazon Transcribe (ta/hi/en-IN) → safety gate → Bedrock with tools → Polly (hi/en) / Sarvam or Google (ta) → audio back.
Flow: `docs/ARCHITECTURE.md` §2.1. Task cards: P1-5 to P1-8.
