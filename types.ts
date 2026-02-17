
export interface AdInputs {
  dailyBudget: number;
  monthlyBudget: number;
  cpc: number;
  productPrice: number;
  productCost: number;
}

export interface ActualCampaignData {
  clicks: number;
  views: number;
  spent: number;
  duration: number;
  cpc: number;
  ctr: number;
  conversations?: number; // Saisie manuelle ou extraite
  sales?: number;         // Saisie manuelle ou extraite
}

export interface PredictionResult {
  clicks: number;
  minConversations: number;
  maxConversations: number;
  minSales: number;
  maxSales: number;
  minRevenue: number;
  maxRevenue: number;
  minProfit: number;
  maxProfit: number;
}

export interface IndustryBenchmarks {
  clickToConvoMin: number;
  clickToConvoMax: number;
  convoToSaleMin: number;
  convoToSaleMax: number;
}
