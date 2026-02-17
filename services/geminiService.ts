
import { GoogleGenAI } from "@google/genai";
import { AdInputs, PredictionResult, ActualCampaignData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getMarketingAdvice = async (inputs: AdInputs, results: PredictionResult, actual?: ActualCampaignData) => {
  let prompt = `
    En tant qu'expert Meta Ads, analyse ces prévisions :
    - Budget mensuel : ${inputs.monthlyBudget} FCFA
    - CPC prévu : ${inputs.cpc} FCFA
    - Profit estimé : ${results.minProfit} - ${results.maxProfit} FCFA
  `;

  if (actual) {
    prompt += `
    COMPARAISON AVEC CAMPAGNE RÉELLE :
    - Budget dépensé : ${actual.spent} (converti ou brut)
    - Clics réels : ${actual.clicks}
    - Vues réelles : ${actual.views}
    - CPC réel : ${actual.cpc.toFixed(2)}
    - CTR réel : ${actual.ctr.toFixed(2)}%
    
    Analyse l'écart entre la prévision et la réalité. Explique si la campagne performe mieux ou moins bien que la moyenne et donne 2 actions correctives.
    `;
  } else {
    prompt += `
    1. Évalue la rentabilité.
    2. Conseil stratégique pour augmenter les ventes.
    `;
  }

  prompt += "\nRéponds de manière concise et structurée en français.";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    return "Erreur d'analyse IA.";
  }
};
