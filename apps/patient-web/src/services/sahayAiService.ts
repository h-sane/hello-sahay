import { Hospital, Language, SahayAiAdvice, UserCoordinates } from '../types';
import { api, ApiAdvisory } from './api';
import { hospitalService } from './hospitalService';
import { locationService } from './locationService';

export interface DoctorAdviceResponse {
  reply: string;
  emergency: boolean;
  sources: { label: string; host: string | null; url: string | null; live: boolean }[];
  doctorConsultation?: {
    assessment: string;
    homeCare: string;
    medicineGuidance: string;
    warningSigns: string;
  };
  recommendedHospital?: Hospital;
  recommendedDepartment?: string;
  recommendedReason?: string;
}

const API_LANGS = ['en', 'hi', 'ta'];
const apiLang = (lang: Language) => (API_LANGS.includes(lang) ? lang : 'en');

const REASON: Record<string, string> = {
  emergency: 'Nearest government facility. Call 108 first if the person is in danger.',
  symptom: 'A doctor must assess symptoms. This is the nearest government facility.',
  none: 'Ask here for verified information. This is the nearest government facility.',
};

let advice: SahayAiAdvice[] = [];

function toAdvice(a: ApiAdvisory): SahayAiAdvice {
  const title = a.title || a.issuer || 'Health advisory';
  const source = [a.issuer, a.published].filter(Boolean).join(', ');
  return {
    id: a.doc_id,
    title: { en: title, hi: title, ta: title },
    advice: { en: a.summary, hi: a.summary, ta: a.summary },
    category: 'seasonal',
    urgent: false,
    actionStep: { en: source ? `Source: ${source}` : '', hi: source ? `Source: ${source}` : '', ta: source ? `Source: ${source}` : '' },
  };
}

export const sahayAiService = {
  /** Government advisories from GET /advisories, cached for the synchronous getters. */
  async loadAdvice(lang: Language): Promise<void> {
    try {
      let rows = await api.advisories(apiLang(lang));
      if (rows.length === 0) rows = await api.advisories('en');
      advice = rows.map(toAdvice);
    } catch {
      advice = [];
    }
  },

  getDailyAdvice(index = 0): SahayAiAdvice | null {
    return advice.length ? advice[index % advice.length] : null;
  },

  getAllAdvice(): SahayAiAdvice[] {
    return advice;
  },

  /** Cited answers only: the safety gate and retrieval run on the server (POST /chat). */
  async consultSahayAi(
    userMessage: string,
    lang: Language,
    customCoords?: UserCoordinates
  ): Promise<DoctorAdviceResponse> {
    const res = await api.chat(userMessage, apiLang(lang));
    const sources = res.citations.map((c) => ({
      label: c.live ? c.title || c.issuer || 'Official website' : [c.issuer, c.title].filter(Boolean).join(' · '),
      host: c.live ? c.issuer : null,
      url: c.url,
      live: !!c.live,
    }));
    const out: DoctorAdviceResponse = {
      reply: res.answer,
      emergency: res.safety_flag === 'emergency',
      sources,
    };
    if (!res.grounded || res.safety_flag !== 'ok') {
      const coords = customCoords || locationService.getSavedLocation();
      const government = hospitalService.getAll().filter((h) => h.category !== 'private');
      const nearest = coords
        ? locationService.getNearestHospital(government, coords)
        : government[0] || null;
      if (nearest) {
        out.recommendedHospital = nearest;
        out.recommendedDepartment = 'General Medicine';
        out.recommendedReason = REASON[res.safety_flag === 'ok' ? 'none' : res.safety_flag];
      }
    }
    return out;
  },
};
