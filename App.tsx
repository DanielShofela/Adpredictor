
import React, { useState, useCallback, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import { Calculator, TrendingUp, MessageCircle, ShoppingBag, PieChart, Sparkles, AlertCircle, RefreshCw, Calendar, Clock, ClipboardPaste, ArrowRightLeft, CheckCircle2, XCircle, MinusCircle, Star, Target } from 'lucide-react';
import InputCard from './components/InputCard';
import ResultCard from './components/ResultCard';
import { AdInputs, PredictionResult, ActualCampaignData } from './types';
import { DEFAULT_BENCHMARKS, CURRENCY } from './constants';
import { getMarketingAdvice } from './services/geminiService';

type ViewMode = 'daily' | 'monthly';

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('monthly');
  const [inputs, setInputs] = useState<AdInputs>({
    dailyBudget: 10000,
    monthlyBudget: 300000,
    cpc: 10,
    productPrice: 5000,
    productCost: 2000,
  });

  const [pasteContent, setPasteContent] = useState('');
  const [actualData, setActualData] = useState<ActualCampaignData | null>(null);
  const [aiAdvice, setAiAdvice] = useState<string>('');
  const [isAdviceLoading, setIsAdviceLoading] = useState<boolean>(false);

  const parseFacebookData = (text: string) => {
    try {
      const clicksMatch = text.match(/Clics sur un lien\s*([\d\s]+)/i);
      const clicks = clicksMatch ? parseInt(clicksMatch[1].replace(/\s/g, '')) : 0;

      const viewsMatch = text.match(/Vues\s*([\d\s]+)/i);
      const views = viewsMatch ? parseInt(viewsMatch[1].replace(/\s/g, '')) : 0;

      const dailyBudgetMatch = text.match(/Budget quotidien\s*([\d,.]+)\s*\$US/i);
      const dailyBudget = dailyBudgetMatch ? parseFloat(dailyBudgetMatch[1].replace(',', '.')) : 0;
      
      const durationMatch = text.match(/Durée\s*(\d+)\s*jours/i);
      const duration = durationMatch ? parseInt(durationMatch[1]) : 1;

      const spent = dailyBudget * duration * 600; 
      const cpc = clicks > 0 ? spent / clicks : 0;
      const ctr = views > 0 ? (clicks / views) * 100 : 0;

      if (clicks > 0 || views > 0) {
        setActualData({ 
          clicks, views, spent, duration, cpc, ctr,
          conversations: actualData?.conversations ?? 0,
          sales: actualData?.sales ?? 0
        });
      }
    } catch (e) {
      console.error("Erreur de parsing", e);
    }
  };

  const getPerformanceBadge = (value: number, min: number, max: number) => {
    if (value === 0) return { label: 'ZÉRO', color: 'bg-red-100 text-red-700', icon: <XCircle size={14} /> };
    if (value < min) return { label: 'Sous-moyenne', color: 'bg-red-100 text-red-700', icon: <XCircle size={14} /> };
    if (value < (min + max) / 2) return { label: 'Moyen', color: 'bg-amber-100 text-amber-700', icon: <MinusCircle size={14} /> };
    if (value <= max) return { label: 'Bon', color: 'bg-green-100 text-green-700', icon: <CheckCircle2 size={14} /> };
    return { label: 'Excellent', color: 'bg-blue-100 text-blue-700', icon: <Star size={14} /> };
  };

  const handleDailyBudgetChange = (val: number) => setInputs(prev => ({ ...prev, dailyBudget: val, monthlyBudget: val * 30 }));

  const monthlyResults = useMemo<PredictionResult>(() => {
    const clicks = inputs.cpc > 0 ? inputs.monthlyBudget / inputs.cpc : 0;
    const minConvos = clicks * DEFAULT_BENCHMARKS.clickToConvoMin;
    const maxConvos = clicks * DEFAULT_BENCHMARKS.clickToConvoMax;
    const minSales = minConvos * DEFAULT_BENCHMARKS.convoToSaleMin;
    const maxSales = maxConvos * DEFAULT_BENCHMARKS.convoToSaleMax;
    const minRevenue = minSales * inputs.productPrice;
    const maxRevenue = maxSales * inputs.productPrice;
    const minProfit = minRevenue - (inputs.monthlyBudget + (minSales * inputs.productCost));
    const maxProfit = maxRevenue - (inputs.monthlyBudget + (maxSales * inputs.productCost));
    return { clicks: Math.floor(clicks), minConversations: Math.floor(minConvos), maxConversations: Math.ceil(maxConvos), minSales: Math.floor(minSales), maxSales: Math.ceil(maxSales), minRevenue, maxRevenue, minProfit, maxProfit };
  }, [inputs]);

  const actualSummary = useMemo(() => {
    if (!actualData) return null;
    const divider = viewMode === 'daily' ? actualData.duration : (actualData.duration / 30);
    const actualRevenue = (actualData.sales ?? 0) * inputs.productPrice;
    const actualProfitTotal = actualRevenue - (actualData.spent + ((actualData.sales ?? 0) * inputs.productCost));
    const normalizedActualProfit = actualProfitTotal / (viewMode === 'daily' ? actualData.duration : (actualData.duration / 30));
    
    const clickToConvo = actualData.conversations ? (actualData.conversations / actualData.clicks) : 0;
    const convoToSale = (actualData.sales && actualData.conversations) ? (actualData.sales / actualData.conversations) : 0;

    return {
      profit: Math.round(normalizedActualProfit).toLocaleString(),
      isPositive: normalizedActualProfit >= 0,
      clickToConvo: clickToConvo * 100,
      convoToSale: convoToSale * 100,
      statusConvo: getPerformanceBadge(clickToConvo, DEFAULT_BENCHMARKS.clickToConvoMin, DEFAULT_BENCHMARKS.clickToConvoMax),
      statusSale: getPerformanceBadge(convoToSale, DEFAULT_BENCHMARKS.convoToSaleMin, DEFAULT_BENCHMARKS.convoToSaleMax),
    };
  }, [actualData, viewMode, inputs]);

  const displayResults = useMemo(() => {
    const divider = viewMode === 'daily' ? 30 : 1;
    return {
      minProfit: Math.round(monthlyResults.minProfit / divider).toLocaleString(),
      maxProfit: Math.round(monthlyResults.maxProfit / divider).toLocaleString(),
    };
  }, [monthlyResults, viewMode]);

  const profitChartData = useMemo(() => {
    const divider = viewMode === 'daily' ? 30 : 1;
    const data = [
      { name: 'Min Prévu', Profit: Math.round(monthlyResults.minProfit / divider), type: 'pred' },
      { name: 'Max Prévu', Profit: Math.round(monthlyResults.maxProfit / divider), type: 'pred' }
    ];

    if (actualSummary) {
      data.push({
        name: 'Réel',
        Profit: parseInt(actualSummary.profit.replace(/\s/g, '')),
        type: 'actual'
      });
    }

    return data;
  }, [monthlyResults, actualSummary, viewMode]);

  const fetchAdvice = useCallback(async () => {
    setIsAdviceLoading(true);
    const advice = await getMarketingAdvice(inputs, monthlyResults, actualData || undefined);
    setAiAdvice(advice);
    setIsAdviceLoading(false);
  }, [inputs, monthlyResults, actualData]);

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg text-white"><TrendingUp size={24} /></div>
            <h1 className="text-xl font-bold text-slate-800">AdPredictor <span className="text-blue-600">Pro</span></h1>
          </div>
          <button onClick={fetchAdvice} disabled={isAdviceLoading} className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 text-white px-5 py-2 rounded-full font-bold transition-all shadow-lg active:scale-95 disabled:opacity-50">
            {isAdviceLoading ? <RefreshCw size={18} className="animate-spin" /> : <Sparkles size={18} />}
            <span>Analyse Expert</span>
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-2 mb-6 text-slate-800 font-bold">
                <Calculator className="text-blue-600" size={20} />
                <h2>Paramètres</h2>
              </div>
              <div className="space-y-4">
                <InputCard label="Budget Quotidien" value={inputs.dailyBudget} onChange={handleDailyBudgetChange} suffix={CURRENCY} />
                <InputCard label="CPC" value={inputs.cpc} onChange={(v) => setInputs(p => ({...p, cpc: v}))} suffix={CURRENCY} step="0.1" />
                <InputCard label="Prix Vente" value={inputs.productPrice} onChange={(v) => setInputs(p => ({...p, productPrice: v}))} suffix={CURRENCY} />
                <InputCard label="Coût Produit" value={inputs.productCost} onChange={(v) => setInputs(p => ({...p, productCost: v}))} suffix={CURRENCY} />
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 border-dashed border-blue-300">
              <div className="flex items-center gap-2 mb-4 text-slate-800 font-bold">
                <ClipboardPaste className="text-blue-500" size={20} />
                <h2>Importer Réel</h2>
              </div>
              <textarea 
                className="w-full h-24 p-3 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 mb-4"
                placeholder="Collez les résultats Meta ici..."
                value={pasteContent}
                onChange={(e) => { setPasteContent(e.target.value); parseFacebookData(e.target.value); }}
              />
              
              {actualData && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Conversations</label>
                      <input 
                        type="number" 
                        value={actualData.conversations ?? ''} 
                        onChange={(e) => setActualData({...actualData, conversations: parseInt(e.target.value) || 0})}
                        className="w-full bg-transparent font-bold text-slate-800 outline-none"
                        placeholder="0"
                      />
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Ventes</label>
                      <input 
                        type="number" 
                        value={actualData.sales ?? ''} 
                        onChange={(e) => setActualData({...actualData, sales: parseInt(e.target.value) || 0})}
                        className="w-full bg-transparent font-bold text-slate-800 outline-none"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white p-1.5 rounded-xl border border-slate-200 inline-flex shadow-sm">
              <button onClick={() => setViewMode('daily')} className={`px-6 py-2 rounded-lg font-semibold transition-all ${viewMode === 'daily' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500'}`}>Vue Jour</button>
              <button onClick={() => setViewMode('monthly')} className={`px-6 py-2 rounded-lg font-semibold transition-all ${viewMode === 'monthly' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500'}`}>Vue Mois</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ResultCard 
                title="Profit Prévisionnel" 
                min={`${displayResults.minProfit} ${CURRENCY}`} 
                max={`${displayResults.maxProfit} ${CURRENCY}`} 
                icon={<Target size={20} />} 
                color="blue" 
              />
              {actualSummary && (
                <ResultCard 
                  title="Profit Réel Obtenu" 
                  value={`${actualSummary.profit} ${CURRENCY}`} 
                  icon={<PieChart size={20} />} 
                  color={actualSummary.isPositive ? 'green' : 'red'} 
                />
              )}
            </div>

            {actualSummary && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-800">
                  <CheckCircle2 className="text-emerald-600" size={20} />
                  Analyse des Taux de Conversion
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-slate-500">CLIC → CONVERSATION</span>
                      <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${actualSummary.statusConvo.color}`}>
                        {actualSummary.statusConvo.label}
                      </span>
                    </div>
                    <div className="text-4xl font-black text-slate-800 tracking-tighter">{actualSummary.clickToConvo.toFixed(1)}%</div>
                    <div className="relative w-full h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                       <div className="absolute inset-0 flex opacity-20">
                          <div className="h-full bg-red-500 w-[20%] border-r border-white"></div>
                          <div className="h-full bg-green-500 w-[20%] border-r border-white"></div>
                          <div className="h-full bg-blue-500 w-[60%]"></div>
                       </div>
                       <div className="absolute h-full w-1.5 bg-slate-900 shadow-xl transition-all duration-700" style={{ left: `${Math.min(actualSummary.clickToConvo, 100)}%` }}></div>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                       <span>0%</span><span>20%</span><span>40%</span><span>100%</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-slate-500">CONVERSATION → VENTE</span>
                      <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${actualSummary.statusSale.color}`}>
                        {actualSummary.statusSale.label}
                      </span>
                    </div>
                    <div className="text-4xl font-black text-slate-800 tracking-tighter">{actualSummary.convoToSale.toFixed(1)}%</div>
                    <div className="relative w-full h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                       <div className="absolute inset-0 flex opacity-20">
                          <div className="h-full bg-red-500 w-[5%] border-r border-white"></div>
                          <div className="h-full bg-green-500 w-[10%] border-r border-white"></div>
                          <div className="h-full bg-blue-500 w-[85%]"></div>
                       </div>
                       <div className="absolute h-full w-1.5 bg-slate-900 shadow-xl transition-all duration-700" style={{ left: `${Math.min(actualSummary.convoToSale, 100)}%` }}></div>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                       <span>0%</span><span>5%</span><span>15%</span><span>100%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-bold mb-8 flex items-center gap-2 text-slate-800">
                <PieChart className="text-blue-600" size={20} />
                Graphique Comparatif de Profitabilité
              </h2>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={profitChartData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 700, fill: '#64748b'}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                    <Tooltip 
                      cursor={{fill: '#f8fafc'}} 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                      formatter={(val: number) => [`${val.toLocaleString()} ${CURRENCY}`, 'Profit']}
                    />
                    <Bar dataKey="Profit" radius={[8, 8, 0, 0]} barSize={50}>
                      {profitChartData.map((entry, index) => {
                        let color = '#cbd5e1'; // Gris pour Min
                        if (entry.name === 'Max Prévu') color = '#3b82f6'; // Bleu pour Max
                        if (entry.type === 'actual') {
                           color = entry.Profit >= 0 ? '#10b981' : '#ef4444'; // Vert si positif, Rouge si négatif
                        }
                        return <Cell key={`cell-${index}`} fill={color} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {aiAdvice && (
              <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-xl shadow-indigo-200 border border-indigo-500 animate-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-white/20 p-2 rounded-lg"><Sparkles size={20} /></div>
                  <h2 className="text-xl font-bold tracking-tight">Analyse Stratégique IA</h2>
                </div>
                <div className="leading-relaxed whitespace-pre-wrap text-sm font-medium text-indigo-50 italic">
                  {aiAdvice}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
