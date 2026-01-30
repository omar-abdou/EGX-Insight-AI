
import React, { useState, useEffect, useMemo } from 'react';
import Layout from './components/Layout';
import StockChart from './components/StockChart';
import { analyzeStock, getMarketOverview } from './services/geminiService';
import { AnalysisResult, PricePoint, MarketOverview, Timeframe } from './types';

const generateData = (count: number, basePrice: number = 50): PricePoint[] => {
  const data: PricePoint[] = [];
  let currentPrice = basePrice;
  const now = new Date();
  for (let i = count; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    currentPrice = currentPrice + (Math.random() - 0.45) * 2;
    data.push({
      date: date.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' }),
      price: parseFloat(currentPrice.toFixed(2)),
    });
  }
  return data;
};

const App: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [marketData, setMarketData] = useState<MarketOverview | null>(null);
  const [activeStock, setActiveStock] = useState<string>('');
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>('1M');
  
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
             (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  // Calculate chart data based on timeframe
  const currentChartData = useMemo(() => {
    const basePrice = analysis ? parseFloat(analysis.currentPrice.replace(/[^\d.]/g, '')) : 50;
    switch (selectedTimeframe) {
      case '1D': return generateData(7, basePrice);
      case '1W': return generateData(7, basePrice);
      case '1M': return generateData(30, basePrice);
      case '3M': return generateData(90, basePrice);
      case '6M': return generateData(180, basePrice);
      case '1Y': return generateData(365, basePrice);
      default: return generateData(30, basePrice);
    }
  }, [selectedTimeframe, analysis]);

  useEffect(() => {
    const fetchData = async () => {
      const data = await getMarketOverview();
      setMarketData(data);
      setLastUpdated(new Date().toLocaleTimeString('ar-EG'));
    };
    fetchData();
    const interval = setInterval(fetchData, 300000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  const handleSearch = async (e: React.FormEvent | string) => {
    const query = typeof e === 'string' ? e : searchQuery;
    if (typeof e !== 'string') e.preventDefault();
    if (!query) return;
    
    setLoading(true);
    try {
      const result = await analyzeStock(query);
      setAnalysis(result);
      setActiveStock(query.toUpperCase());
    } catch (error) {
      alert("حدث خطأ أثناء تحليل السهم. يرجى التأكد من الرمز أو المحاولة مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  const timeframeOptions: { label: string; value: Timeframe }[] = [
    { label: 'يومي', value: '1D' },
    { label: 'أسبوعي', value: '1W' },
    { label: 'شهري', value: '1M' },
    { label: '3 شهور', value: '3M' },
    { label: '6 شهور', value: '6M' },
    { label: 'سنة', value: '1Y' },
  ];

  const getSentimentColor = (score: number) => {
    if (score < 40) return 'text-rose-500 bg-rose-500';
    if (score < 60) return 'text-amber-500 bg-amber-500';
    return 'text-emerald-500 bg-emerald-500';
  };

  return (
    <Layout isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode}>
      {/* Indices Section */}
      <section className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-3">
            <span className="w-2 h-8 bg-emerald-500 rounded-full"></span>
            المؤشرات الرئيسية
          </h2>
          <span className="text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full uppercase">
            تحديث مباشر: {lastUpdated}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(marketData?.indices || []).map((idx) => (
            <div key={idx.name} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 transition-all hover:shadow-xl hover:-translate-y-1">
              <div className="flex justify-between items-start mb-2">
                <span className="text-slate-500 dark:text-slate-400 font-bold text-sm tracking-wide">{idx.name}</span>
                <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${idx.changePercent >= 0 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30' : 'bg-rose-50 text-rose-600 dark:bg-rose-950/30'}`}>
                  {idx.changePercent >= 0 ? '▲' : '▼'} {Math.abs(idx.changePercent)}%
                </span>
              </div>
              <div className="text-3xl font-black text-slate-800 dark:text-white mb-4">{idx.value?.toLocaleString() || '---'}</div>
              <StockChart data={generateData(15, idx.value / 100)} color={idx.changePercent >= 0 ? '#10b981' : '#f43f5e'} height={120} />
            </div>
          ))}
          {!marketData && [1, 2, 3].map(i => (
            <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 animate-pulse h-56"></div>
          ))}
        </div>
      </section>

      {/* Grounded Market Brief */}
      <div className="glass-panel text-slate-900 dark:text-slate-50 rounded-[2rem] p-8 mb-12 shadow-2xl border-l-8 border-emerald-500 transition-all flex items-start gap-6">
        <div className="bg-emerald-500 p-4 rounded-2xl text-white shadow-lg shadow-emerald-500/20 shrink-0 hidden sm:block">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-black mb-3 text-slate-800 dark:text-white uppercase tracking-tight">رؤية المحلل المتقدمة</h2>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-base">
            {marketData?.marketSentiment || 'جاري تحليل اتجاهات السوق وجمع البيانات المباشرة...'}
          </p>
        </div>
      </div>

      {/* Search & Analysis Section */}
      <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 p-10 transition-colors mb-16 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
        
        <div className="flex flex-col lg:flex-row justify-between items-center gap-8 mb-12 relative z-10">
          <div className="text-center lg:text-right">
            <h2 className="text-3xl font-black text-slate-800 dark:text-white leading-tight">مركز تحليل الأسهم</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2 font-bold">بيانات فورية مدعومة بمحركات بحث مالية متقدمة</p>
          </div>
          <form onSubmit={handleSearch} className="relative w-full lg:w-1/2">
            <input 
              type="text" 
              placeholder="ابحث عن السهم برمز التداول (مثال: COMI)..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-16 pr-8 py-5 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border-2 border-slate-100 dark:border-slate-700 focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 dark:text-white transition-all outline-none shadow-xl text-lg font-bold"
            />
            <button type="submit" className="absolute left-4 top-1/2 -translate-y-1/2 bg-emerald-600 text-white p-3 rounded-2xl hover:bg-emerald-700 transition-all shadow-lg hover:scale-105 active:scale-95">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </form>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-8">
            <div className="relative">
              <div className="w-24 h-24 border-8 border-slate-100 dark:border-slate-800 border-t-emerald-600 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-full animate-ping"></div>
              </div>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black text-slate-800 dark:text-white animate-pulse">جاري الاستعلام...</p>
              <p className="text-slate-400 dark:text-slate-500 mt-2 font-bold">نقوم بجمع البيانات من 5 مصادر مالية مختلفة</p>
            </div>
          </div>
        ) : analysis ? (
          <div key={activeStock} className="animate-fade-in-up">
            {/* Header with Price */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
              <div className="lg:col-span-2 bg-slate-50 dark:bg-slate-800/50 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-700 flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <div className="relative z-10 text-center md:text-right">
                  <h3 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter mb-4">{activeStock}</h3>
                  <div className="flex items-center justify-center md:justify-start gap-4">
                    <span className="text-4xl font-black text-slate-900 dark:text-slate-100 animate-number-pop">{analysis.currentPrice}</span>
                    <span className={`px-4 py-1.5 rounded-full text-sm font-black shadow-sm ${analysis.priceChange.includes('+') ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40'}`}>
                      {analysis.priceChange}
                    </span>
                  </div>
                </div>

                <div className="relative z-10 flex flex-col items-center md:items-end gap-3">
                  <span className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">توصية النظام</span>
                  <div className={`text-2xl font-black px-10 py-4 rounded-3xl shadow-2xl transition-all hover:scale-105 ${
                    analysis.technicalAnalysis.signal === 'BUY' ? 'bg-emerald-600 text-white shadow-emerald-500/20' :
                    analysis.technicalAnalysis.signal === 'SELL' ? 'bg-rose-600 text-white shadow-rose-500/20' :
                    'bg-slate-600 text-white'
                  }`}>
                    {analysis.technicalAnalysis.signal === 'BUY' ? 'شراء قوي' : 
                     analysis.technicalAnalysis.signal === 'SELL' ? 'بيع فوراً' : 'احتفاظ'}
                  </div>
                </div>
              </div>

              {/* Fundamental Valuation Card */}
              <div className={`p-8 rounded-[2rem] text-white flex flex-col justify-center shadow-2xl transition-all ${
                analysis.fundamentalAnalysis.valuationStatus === 'UNDERVALUED' ? 'bg-emerald-600 shadow-emerald-500/20' :
                analysis.fundamentalAnalysis.valuationStatus === 'OVERVALUED' ? 'bg-rose-600 shadow-rose-500/20' :
                'bg-slate-600 shadow-slate-500/20'
              }`}>
                <p className="text-white/70 text-sm font-bold mb-2 uppercase tracking-widest">حالة القيمة الجوهرية</p>
                <p className="text-2xl font-black leading-tight mb-2">
                  {analysis.fundamentalAnalysis.intrinsicValue}
                </p>
                <p className="text-sm font-bold opacity-90">
                  {analysis.fundamentalAnalysis.valuationStatus === 'UNDERVALUED' ? 'فرصة شراء: السهم مقيم بأقل من قيمته الحقيقية' :
                   analysis.fundamentalAnalysis.valuationStatus === 'OVERVALUED' ? 'تنبيه: السهم مقيم بأعلى من قيمته الحقيقية' :
                   'السهم يتداول عند قيمته العادلة حالياً'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              <div className="lg:col-span-2 space-y-10">
                
                {/* 1. التحليل الأساسي (Fundamental) */}
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden relative">
                  <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500"></div>
                  <h4 className="text-2xl font-black text-slate-800 dark:text-white mb-8 flex items-center gap-3">
                    <span className="p-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-emerald-600">📊</span>
                    التحليل الأساسي (Fundamental)
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-700">
                      <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-widest">مكرر الربحية (P/E)</p>
                      <p className="text-xl font-black text-slate-800 dark:text-white">{analysis.fundamentalAnalysis.peRatio}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-700">
                      <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-widest">ربحية السهم (EPS)</p>
                      <p className="text-xl font-black text-slate-800 dark:text-white">{analysis.fundamentalAnalysis.eps}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-700">
                      <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-widest">عائد التوزيعات</p>
                      <p className="text-xl font-black text-slate-800 dark:text-white">{analysis.fundamentalAnalysis.dividendYield || '---'}</p>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="p-6 bg-emerald-50/30 dark:bg-emerald-950/10 rounded-2xl border border-emerald-100/50 dark:border-emerald-900/20">
                      <h5 className="font-black text-emerald-800 dark:text-emerald-400 mb-2 text-sm uppercase tracking-tight">خلاصة التحليل المالي</h5>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">{analysis.fundamentalAnalysis.analystVerdict}</p>
                    </div>
                  </div>
                </div>

                {/* 2. تحليل المشاعر (Sentiment Analysis) */}
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden relative">
                  <div className="absolute top-0 left-0 w-2 h-full bg-amber-500"></div>
                  <h4 className="text-2xl font-black text-slate-800 dark:text-white mb-8 flex items-center gap-3">
                    <span className="p-2 bg-amber-50 dark:bg-amber-950/40 rounded-xl text-amber-600">🧠</span>
                    تحليل المشاعر (Sentiment)
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 items-center">
                    <div className="md:col-span-1 text-center">
                      <div className="relative inline-block">
                        <svg className="w-32 h-32 transform -rotate-90">
                          <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100 dark:text-slate-800" />
                          <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" 
                            strokeDasharray={364}
                            strokeDashoffset={364 - (analysis.sentimentAnalysis.score / 100) * 364}
                            strokeLinecap="round"
                            className={`${analysis.sentimentAnalysis.score < 40 ? 'text-rose-500' : analysis.sentimentAnalysis.score < 60 ? 'text-amber-500' : 'text-emerald-500'} transition-all duration-1000`}
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-3xl font-black text-slate-800 dark:text-white">{analysis.sentimentAnalysis.score}</span>
                          <span className="text-[10px] font-bold text-slate-400">من 100</span>
                        </div>
                      </div>
                      <div className={`mt-4 text-sm font-black uppercase tracking-widest ${analysis.sentimentAnalysis.score < 40 ? 'text-rose-600' : analysis.sentimentAnalysis.score < 60 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {analysis.sentimentAnalysis.label}
                      </div>
                    </div>
                    
                    <div className="md:col-span-2 space-y-4">
                      <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                        <h5 className="text-xs font-black text-slate-400 mb-2 uppercase tracking-widest">نبض المتداولين</h5>
                        <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">{analysis.sentimentAnalysis.summary}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h5 className="text-xs font-black text-slate-400 mb-4 uppercase tracking-[0.2em]">أبرز الآراء والتوجهات</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {analysis.sentimentAnalysis.keyOpinions.map((opinion, idx) => (
                        <div key={idx} className="flex gap-3 items-start p-4 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                          <span className="text-emerald-500 mt-1">●</span>
                          <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{opinion}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 3. التحليل الفني (Technical) */}
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden relative">
                  <div className="absolute top-0 left-0 w-2 h-full bg-blue-500"></div>
                  <h4 className="text-2xl font-black text-slate-800 dark:text-white mb-4 flex items-center gap-3">
                    <span className="p-2 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-blue-600">📉</span>
                    التحليل الفني (Technical)
                  </h4>
                  <div className="flex flex-wrap items-center gap-2 mb-6 bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-700/50 w-fit">
                    {timeframeOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setSelectedTimeframe(opt.value)}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                          selectedTimeframe === opt.value
                            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-800'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] p-6 mb-10 border border-slate-100 dark:border-slate-700/50 shadow-inner overflow-hidden">
                    <StockChart 
                      data={currentChartData} 
                      color={analysis.priceChange.includes('+') ? '#10b981' : '#f43f5e'} 
                      height={320}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                    <div className="space-y-4">
                      <h5 className="font-black text-slate-400 text-xs uppercase tracking-[0.2em] mb-4">مستويات الدعم والمقاومة</h5>
                      <div className="flex flex-wrap gap-3">
                        {analysis.technicalAnalysis.support.map((val, idx) => (
                          <div key={idx} className="bg-emerald-50 dark:bg-emerald-950/30 px-4 py-2 rounded-xl text-emerald-700 dark:text-emerald-400 font-black border border-emerald-100 dark:border-emerald-900/40">S{idx+1}: {val}</div>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {analysis.technicalAnalysis.resistance.map((val, idx) => (
                          <div key={idx} className="bg-rose-50 dark:bg-rose-950/30 px-4 py-2 rounded-xl text-rose-700 dark:text-rose-400 font-black border border-rose-100 dark:border-rose-900/40">R{idx+1}: {val}</div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h5 className="font-black text-slate-400 text-xs uppercase tracking-[0.2em] mb-4">أهم المؤشرات الحالية</h5>
                      <div className="flex flex-wrap gap-2">
                        {analysis.technicalAnalysis.indicators.map((ind, idx) => (
                          <span key={idx} className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-400">{ind}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/30 p-8 rounded-2xl">
                     <h5 className="font-black text-slate-400 text-[10px] uppercase tracking-[0.3em] mb-3">رؤية المحلل الفنية</h5>
                     <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium whitespace-pre-wrap">{analysis.summary}</p>
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-8">
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-700 shadow-lg sticky top-24">
                  <h4 className="font-black text-slate-900 dark:text-white mb-8 text-xl tracking-tight border-b-4 border-emerald-500 pb-2 inline-block">مؤشرات إضافية</h4>
                  <div className="space-y-6">
                    {analysis.financialMetrics.map((metric, idx) => (
                      <div key={idx} className="flex justify-between items-center group">
                        <span className="text-slate-500 dark:text-slate-400 font-bold group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors">{metric.label}</span>
                        <div className="bg-white dark:bg-slate-900 px-4 py-2 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm font-black text-slate-800 dark:text-slate-100">
                           {metric.value}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-10 pt-10 border-t border-slate-200 dark:border-slate-700">
                    <h4 className="font-black text-slate-800 dark:text-white mb-6 text-sm uppercase tracking-widest">المصادر المالية</h4>
                    <div className="space-y-3">
                      {analysis.sources.map((src, idx) => (
                        <a 
                          key={idx}
                          href={src.uri} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 border border-slate-100 dark:border-slate-800 hover:border-emerald-100 dark:hover:border-emerald-800 transition-all group shadow-sm"
                        >
                          <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-emerald-600 transition-transform group-hover:rotate-12">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </div>
                          <span className="truncate font-bold text-slate-700 dark:text-slate-300 text-sm">{src.title}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-28 bg-slate-50 dark:bg-slate-800/50 rounded-[3rem] border-4 border-dashed border-slate-200 dark:border-slate-700 transition-all hover:bg-slate-100 dark:hover:bg-slate-800">
             <div className="flex justify-center mb-8">
                <div className="relative">
                   <div className="w-32 h-32 bg-emerald-100 dark:bg-emerald-950/30 rounded-[2.5rem] flex items-center justify-center shadow-inner">
                      <svg className="w-16 h-16 text-emerald-600 dark:text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                   </div>
                   <div className="absolute -bottom-4 -right-4 w-14 h-14 bg-white dark:bg-slate-900 shadow-2xl rounded-2xl flex items-center justify-center border-2 border-emerald-500 animate-bounce">
                      🚀
                   </div>
                </div>
             </div>
            <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">حلل محفظتك الآن</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-4 max-w-lg mx-auto font-bold text-lg leading-relaxed">أدخل رمز التداول لأي شركة مدرجة في البورصة المصرية وسيقوم ذكاؤنا الاصطناعي بجلب أحدث الأسعار والتحليلات الأساسية والفنية ونبض المتداولين فوراً.</p>
          </div>
        )}
      </section>

      {/* Market Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <section>
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 shadow-2xl border border-slate-100 dark:border-slate-800 transition-colors h-full">
            <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-8 flex items-center gap-3">
              <span className="w-10 h-10 bg-emerald-100 dark:bg-emerald-950/50 rounded-xl flex items-center justify-center text-emerald-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </span>
              أقوى الارتفاعات اليوم
            </h3>
            <div className="space-y-6">
              {(marketData?.topGainers || []).map((stock, idx) => (
                <div key={idx} className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700/50 hover:border-emerald-300 dark:hover:border-emerald-600 transition-all hover:scale-[1.02] flex justify-between items-center group cursor-pointer shadow-sm hover:shadow-xl" onClick={() => handleSearch(stock.symbol)}>
                  <div>
                    <div className="font-black text-slate-900 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors text-lg">{stock.name}</div>
                    <div className="text-xs text-slate-400 dark:text-slate-500 font-black tracking-widest uppercase mt-1">{stock.symbol}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">{stock.price} <span className="text-xs text-slate-400 font-bold">ج.م</span></div>
                    <div className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-1">{stock.change}</div>
                  </div>
                </div>
              ))}
              {!marketData && [1, 2, 3].map(i => (
                <div key={i} className="bg-slate-50 dark:bg-slate-800 h-28 rounded-[2rem] animate-pulse"></div>
              ))}
            </div>
          </div>
        </section>

        <section>
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 shadow-2xl border border-slate-100 dark:border-slate-800 transition-colors h-full">
            <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-8 flex items-center gap-3">
              <span className="w-10 h-10 bg-amber-100 dark:bg-amber-950/50 rounded-xl flex items-center justify-center text-amber-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </span>
              الأسهم الأكثر تداولاً
            </h3>
            <div className="space-y-6">
              {(marketData?.mostActive || []).map((stock, idx) => (
                <div key={idx} className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700/50 hover:border-amber-300 dark:hover:border-amber-600 transition-all hover:scale-[1.02] flex justify-between items-center group cursor-pointer shadow-sm hover:shadow-xl" onClick={() => handleSearch(stock.symbol)}>
                  <div className="flex gap-5 items-center">
                    <div className="w-12 h-12 bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-[1.25rem] flex items-center justify-center text-sm font-black shadow-inner">
                      {idx + 1}
                    </div>
                    <div>
                      <div className="font-black text-slate-900 dark:text-slate-100 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors text-lg">{stock.name}</div>
                      <div className="text-xs text-slate-400 dark:text-slate-500 font-black tracking-widest uppercase">{stock.symbol}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">{stock.price} <span className="text-xs text-slate-400 font-bold">ج.م</span></div>
                    <div className={`text-sm font-black ${stock.change.includes('-') ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'} mt-1`}>
                      {stock.change}
                    </div>
                  </div>
                </div>
              ))}
              {!marketData && [1, 2, 3].map(i => (
                <div key={i} className="bg-slate-50 dark:bg-slate-800 h-28 rounded-[2rem] animate-pulse"></div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default App;
