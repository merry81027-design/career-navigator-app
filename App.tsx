import React, { useState, useEffect, useMemo } from 'react';
import { GoogleGenAI } from '@google/genai';
import { 
  Compass, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  BarChart3, 
  Target, 
  Users, 
  Lightbulb, 
  Coins, 
  ArrowRight,
  Info,
  ExternalLink,
  Download,
  Share2,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---
type Track = '人文' | '商管' | '理工' | '生醫';

interface Criterion {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  weight: number;
}

interface DiscoveryItem {
  id: string;
  category: string;
  label: string;
}

// --- Constants & Config ---
const tracks: Track[] = ['人文', '商管', '理工', '生醫'];

const TRACK_DETAILS: Record<Track, { color: string; desc: string; careers: string[] }> = {
  '人文': { 
    color: '#06b6d4', 
    desc: '對文字、美感、搞創作有熱忱的你，或是腦袋裡總裝著各種天馬行空點子的同學。', 
    careers: ['文史哲學群', '外語學群', '藝術學群', '建築與設計學群', '大眾傳播學群'] 
  },
  '商管': { 
    color: '#f59e0b', 
    desc: '喜歡跟人交流、對社會議題有感、擅長表達想法或是喜歡當大家傾聽者的你。', 
    careers: ['管理學群', '財經學群', '法政學群', '社會與心理學群', '教育學群', '遊憩與運動學群'] 
  },
  '理工': { 
    color: '#8b5cf6', 
    desc: '腦袋裝著各種邏輯、喜歡動手做實驗、寫程式打怪，對解決大問題很感興趣的你。', 
    careers: ['資訊學群', '工程學群', '數理化學群', '地球與環境學群', '建築與設計學群'] 
  },
  '生醫': { 
    color: '#10b981', 
    desc: '對生命科學好奇、喜歡動植物，或是未來想穿上白袍拯救世界、關心自己和別人身心健康的你。', 
    careers: ['醫藥衛生學群', '生命科學學群', '生物資源學群'] 
  }
};

const INITIAL_CRITERIA: Criterion[] = [
  { 
    id: 'interest', 
    label: '個人興趣', 
    description: '就算考試不考，你平常也會忍不住想多看兩眼的東東。', 
    icon: <Target className="w-5 h-5" />, 
    weight: 9 
  },
  { 
    id: 'ability', 
    label: '學科能力', 
    description: '看到數學就想睡？還是寫作文總是文思泉湧？這攸關你念書的成就感跟自信啊！', 
    icon: <Lightbulb className="w-5 h-5" />, 
    weight: 8 
  },
  { 
    id: 'career', 
    label: '未來規劃', 
    description: '想著以後要去哪裡上班？賺多少錢才夠付卡費？還是想當個對社會有貢獻的大人物？', 
    icon: <Coins className="w-5 h-5" />, 
    weight: 7 
  },
  { 
    id: 'external', 
    label: '外部環境', 
    description: '爸媽的碎碎念、現在超紅的 AI 趨勢、薪水穩定度等等各種擋不住的外在考量。', 
    icon: <Users className="w-5 h-5" />, 
    weight: 6 
  }
];

const INITIAL_DISCOVERY: DiscoveryItem[] = [
  { id: 'int_1', category: 'interest', label: '喜歡破解難題很有成就感' },
  { id: 'int_2', category: 'interest', label: '對畫畫、設計或創作超有熱忱' },
  { id: 'int_3', category: 'interest', label: '會關注社會新聞或想改變世界' },
  { id: 'int_4', category: 'interest', label: '喜歡泡在實驗室或動手做實驗' },
  { id: 'abl_1', category: 'ability', label: '腦袋靈光，邏輯跟數學都不錯' },
  { id: 'abl_2', category: 'ability', label: '靠文字或講話就能說服別人' },
  { id: 'abl_3', category: 'ability', label: '超愛做計畫、當報告的神隊友' },
  { id: 'abl_4', category: 'ability', label: '對空間美感跟顏色有天生直覺' },
  { id: 'car_1', category: 'career', label: '畢業就是要賺大錢或鐵飯碗' },
  { id: 'car_2', category: 'career', label: '夢想能出國工作、到處飛' },
  { id: 'car_3', category: 'career', label: '準時下班很重要，不想爆肝' },
  { id: 'car_4', category: 'career', label: '想讓這世界因為我有一點點不一樣' },
  { id: 'ext_1', category: 'external', label: '怕未來被 AI 取代，想選趨勢科系' },
  { id: 'ext_2', category: 'external', label: '爸媽有很強烈的期待或壓力' },
  { id: 'ext_3', category: 'external', label: '想跟好朋友選一樣的班群' },
  { id: 'ext_4', category: 'external', label: '參考家人以前的就讀或工作經驗' },
  { id: 'ext_5', category: 'external', label: '相信輔導老師或任課老師的建議' },
];

export default function App() {
  const [step, setStep] = useState(0);
  const [criteria, setCriteria] = useState<Criterion[]>(INITIAL_CRITERIA);
  const [scores, setScores] = useState<Record<string, Record<Track, number>>>(
    Object.fromEntries(INITIAL_CRITERIA.map(c => [c.id, Object.fromEntries(tracks.map(t => [t, 5]))]))
  );
  const [selectedDiscovery, setSelectedDiscovery] = useState<string[]>([]);
  const [newDiscoveryInput, setNewDiscoveryInput] = useState<Record<string, string>>({});
  const [allDiscoveryItems, setAllDiscoveryItems] = useState<DiscoveryItem[]>(INITIAL_DISCOVERY);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // --- Handlers ---
  const toggleDiscovery = (id: string) => {
    setSelectedDiscovery(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleAddCustomDiscovery = (categoryId: string) => {
    const text = newDiscoveryInput[categoryId]?.trim();
    if (!text) return;

    const newItem: DiscoveryItem = {
      id: `custom_${Date.now()}`,
      category: categoryId,
      label: text
    };

    setAllDiscoveryItems(prev => [...prev, newItem]);
    setSelectedDiscovery(prev => [...prev, newItem.id]);
    setNewDiscoveryInput(prev => ({ ...prev, [categoryId]: '' }));
  };

  const handleWeightChange = (id: string, weight: number) => {
    setCriteria(prev => prev.map(c => c.id === id ? { ...c, weight } : c));
  };

  const handleScoreChange = (criteriaId: string, track: Track, score: number) => {
    setScores(prev => ({
      ...prev,
      [criteriaId]: { ...prev[criteriaId], [track]: score }
    }));
  };

  const generateAIAdvice = async () => {
    setIsGenerating(true);
    try {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error('API Key missing');
      }
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const valueWeights = criteria.map(c => `${c.label} (權重 ${c.weight}/10)`).join('、');
      const analysisContent = `
        使用者評測出來最適合的班群是：${topTrack} 班群。
        使用者評估的核心價值觀與權重為：${valueWeights}。
        使用者特別在意的細項包含：${selectedDiscovery.length > 0 ? selectedDiscovery.map(id => allDiscoveryItems.find(i => i.id === id)?.label).join('、') : '憑直覺綜合評分'}。
        
        請以繁體中文、融合「生涯建構理論」精神且貼近高中生的口吻，撰寫一段給高中生的選班群建議。生涯不是被決定好的，而是自己一步步建構出來的。必須包含以下要點，並使用列點符號表示：
        1. 依據學生上述最看重的「核心價值觀」與關注的「細項」，為他量身打造，說明這個班群如何作為他們實踐這些價值與建構未來藍圖的絕佳起點。
        2. 選擇此班群須考量的現實挑戰或適應問題（針對他們的價值觀，給點客製化的現實預防針）。
        3. 與家長溝通此決定的技巧，展現自己對生涯已有思考與負責的態度。
        語氣要像是一位親切、懂他們的學長姐，盡量客製化，不要說教！字數不要超過800字。
      `;
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: analysisContent
      });
      setAiAnalysis(response.text || '無法生成分析');
    } catch (e) {
      console.error(e);
      const topCriteria = [...criteria].sort((a, b) => b.weight - a.weight)[0];
      setAiAnalysis(`
• **選擇此班群的優勢**：既然你對於「${topCriteria.label}」有著不可妥協的堅持，${topTrack}班群絕對能為你提供最直接的資源與舞台，幫你在這個領域直接裝備好打怪技能！
• **須考量的潛在挑戰**：不過也要注意，在追求這項目標的同時，這班群的競爭可能更激烈一點，你要想好怎麼穩住自己可能較弱、或比較沒興趣的科目喔。
• **與家長的溝通技巧**：跟爸媽開口時，可以直接給他們看你算出來的適配度分數以及你在「${topCriteria.label}」上的強烈動機，並且把你未來的藍圖講給他們聽，讓他們知道你已經經過深思熟慮，不是隨便選的！
      `.trim());
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: '我的生涯班群導航結果',
        text: `我最適合的班群是：${topTrack}班群！你也來測測看吧。`,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('連結已複製！');
    }
  };

  const handleDownloadPDF = () => {
    window.print();
  };

  // --- Calculations ---
  const finalResults = useMemo(() => {
    return tracks.map(track => {
      const totalScore = criteria.reduce((sum, c) => {
        return sum + (scores[c.id][track] * c.weight);
      }, 0);
      const maxPossible = criteria.reduce((sum, c) => sum + (10 * c.weight), 0);
      const percentage = (totalScore / maxPossible) * 100;
      return { track, score: totalScore, percentage };
    }).sort((a, b) => b.score - a.score);
  }, [criteria, scores]);

  const topTrack = finalResults[0].track;

  // AI Navigator Messages
  const aiMessage = useMemo(() => {
    if (step === 0) return "哈囉！歡迎來到班群導航。選班群不是決定人生的終點，而是建構你生涯藍圖的第一個重要起點！";
    if (step === 1) return "請盤點你內心深處真正在意的價值觀與能力，這些都是你未來故事的素材，勇敢勾選吧！";
    if (step === 2) return "每個人的生涯都是獨特的。在你專屬的藍圖中，哪一個價值觀是你最珍視的基石？";
    if (step === 3) return "想像你進入各個班群後，這些你在意的價值觀能否被實踐與滿足？給這份未來樣貌一個真實的評分。";
    if (step === 4) return `太棒了！看來 ${topTrack}班群 提供的環境，最能支持你建構出理想的生涯樣貌。快看看建議吧！`;
    return "";
  }, [step, topTrack]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-cyan-100 overflow-x-hidden print:bg-white print:min-h-0">
      {/* Ambient background blurs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden print:hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-cyan-100/50 rounded-full blur-[140px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-100/50 rounded-full blur-[140px]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30%] h-[30%] bg-white rounded-full blur-[100px]"></div>
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-xl z-50 flex items-center justify-between px-4 sm:px-6 border-b border-indigo-100/50 shadow-sm print:hidden">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-[10px] bg-gradient-to-br from-slate-900 to-indigo-950 shadow-[0_0_15px_rgba(6,182,212,0.2)] border border-indigo-800/50 overflow-hidden group">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-500/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <Compass className="w-5 h-5 text-cyan-400 relative z-10 group-hover:rotate-45 group-hover:scale-110 transition-all duration-500" />
          </div>
          <div className="flex flex-col justify-center">
            <h1 className="font-black text-[17px] sm:text-lg tracking-wider tech-gradient-text leading-none mb-1">
              班群導航
            </h1>
            <span className="text-[9px] font-mono font-extrabold text-cyan-600 uppercase tracking-[0.2em] leading-none">
              Track Navigator
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="hidden sm:flex gap-1.5">
            {[0, 1, 2, 3, 4].map(i => (
              <div 
                key={i} 
                className={`h-1 w-5 sm:w-7 transition-all duration-500 rounded-full ${step >= i ? 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.6)]' : 'bg-slate-200'}`} 
              />
            ))}
          </div>
          <div className="flex items-center gap-2 bg-slate-900 py-1.5 px-3 sm:px-4 sm:py-2 rounded-xl border border-slate-800 shadow-inner relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
            <div className={step === 4 ? "w-1.5 h-1.5 rounded-full bg-emerald-400 animate-[pulse_2s_ease-in-out_infinite]" : "w-1.5 h-1.5 rounded-full bg-cyan-400 animate-[pulse_2s_ease-in-out_infinite]"}></div>
            <span className="text-[10px] sm:text-xs font-mono font-bold text-slate-100 uppercase tracking-widest pl-0.5">
              Step 0{step + 1}
            </span>
          </div>
        </div>
      </header>

      <main className="relative pt-24 pb-52 md:pb-32 max-w-4xl mx-auto px-5 z-10 print:hidden">
        <AnimatePresence mode="wait">
          {/* Step 0: Welcome */}
          {step === 0 && (
            <motion.div 
              key="step0"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="space-y-10"
            >
              <div className="text-center space-y-4">
                <h2 className="text-3xl md:text-6xl font-black tracking-tight text-slate-900 leading-[1.1]">
                  建構你的<span className="text-cyan-600">生涯藍圖</span>
                </h2>
                <p className="text-base md:text-lg text-slate-500 max-w-xl mx-auto leading-relaxed">
                  透過決策平衡單盤點能力與價值觀，<br className="hidden md:block" />
                  讓班群選擇成為建構自己未來的起點。
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                {tracks.map((t) => (
                  <div key={t} className="p-7 tech-card tech-card-hover group overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 -mr-12 -mt-12 rounded-full opacity-5 group-hover:opacity-10 group-hover:scale-150 transition-all duration-700" style={{ backgroundColor: TRACK_DETAILS[t].color }} />
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-2.5 h-7 rounded-full shadow-sm" style={{ backgroundColor: TRACK_DETAILS[t].color }} />
                      <h3 className="text-xl font-bold text-slate-800">{t}班群</h3>
                    </div>
                    <p className="text-slate-500 mb-6 text-sm md:text-base leading-relaxed">
                      {TRACK_DETAILS[t].desc}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {TRACK_DETAILS[t].careers.map(c => (
                        <span key={c} className="px-3 py-1 bg-slate-50 text-slate-500 border border-slate-100 rounded-lg text-xs font-semibold tracking-wide">#{c}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-center pt-6">
                <button 
                  onClick={() => setStep(1)}
                  className="tech-button px-12 py-4 text-lg hover:shadow-cyan-200/50 flex items-center gap-3"
                >
                  開始建構生涯藍圖
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>
          )}

          {/* New Step 1: Discovery / Values Selection */}
          {step === 1 && (
            <motion.div 
              key="stepDiscovery"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-8"
            >
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">盤點生涯建構的素材</h2>
                <p className="text-sm text-slate-400">勾選你目前最在意的價值觀與現實考量，這些都是引導你未來的關鍵素材！</p>
              </div>

              <div className="grid gap-8 tech-card p-6 md:p-8">
                {INITIAL_CRITERIA.map(category => (
                  <div key={category.id} className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-50 text-cyan-600 rounded-xl">
                        {category.icon}
                      </div>
                      <span className="font-bold text-lg text-slate-800 tracking-wide">{category.label}</span>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {allDiscoveryItems.filter(item => item.category === category.id).map(item => (
                        <button
                          key={item.id}
                          onClick={() => toggleDiscovery(item.id)}
                          className={`px-4 py-2.5 rounded-2xl text-[13px] md:text-sm font-bold transition-all border ${
                            selectedDiscovery.includes(item.id)
                              ? 'bg-slate-900 text-cyan-400 border-slate-900 shadow-lg shadow-cyan-100/20'
                              : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-cyan-200 hover:bg-white'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <input 
                        type="text" 
                        placeholder={`我也很在意... (輸入關於${category.label}的點)`}
                        value={newDiscoveryInput[category.id] || ''}
                        onChange={e => setNewDiscoveryInput({...newDiscoveryInput, [category.id]: e.target.value})}
                        onKeyDown={e => e.key === 'Enter' && handleAddCustomDiscovery(category.id)}
                        className="flex-1 px-4 py-3 text-sm bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-50 transition-all"
                      />
                      <button 
                        onClick={() => handleAddCustomDiscovery(category.id)}
                        disabled={!newDiscoveryInput[category.id]?.trim()}
                        className="px-6 py-3 bg-cyan-50 text-cyan-700 font-black text-sm rounded-2xl hover:bg-cyan-600 hover:text-white disabled:opacity-30 transition-all font-mono uppercase tracking-widest"
                      >
                        ADD
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center px-4">
                <button onClick={() => setStep(0)} className="text-slate-400 font-bold text-sm flex items-center gap-2 hover:text-slate-900 transition-colors">
                  <ChevronLeft className="w-4 h-4" /> 返回首頁
                </button>
                <button 
                  onClick={() => setStep(2)}
                  disabled={selectedDiscovery.length === 0}
                  className="tech-button px-10 py-3.5 text-sm md:text-base disabled:opacity-20 flex items-center gap-2"
                >
                  評估重要性 <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Weighting */}
          {step === 2 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-8"
            >
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">確立生涯價值觀的優先序</h2>
                <p className="text-sm text-slate-400">在建構未來的過程中，哪些素材對你而言最不可或缺？拉動滑桿給予權重吧 (1是最不在意，10是最在意)！</p>
              </div>

              <div className="space-y-6 tech-card p-6 md:p-10">
                {criteria.map((c) => (
                  <div key={c.id} className="space-y-4 group">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-cyan-50 text-cyan-600 rounded-2xl group-hover:scale-110 transition-transform">
                          {c.icon}
                        </div>
                        <div className="max-w-[200px] sm:max-w-none">
                          <h4 className="font-black text-slate-800 text-base">{c.label}</h4>
                          <p className="text-xs text-slate-400 leading-tight pr-4">{c.description}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-2xl font-black text-cyan-600 font-mono leading-none">{c.weight}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase mt-1">Weight</span>
                      </div>
                    </div>
                    <div className="relative h-6 flex items-center">
                      <div className="absolute inset-x-0 h-1.5 bg-slate-100 rounded-full"></div>
                      <div className="absolute left-0 h-1.5 bg-gradient-to-r from-cyan-400 to-cyan-500 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.3)] transition-all duration-300 pointer-events-none" style={{ width: `${(c.weight - 1) / 9 * 100}%` }}></div>
                      <input 
                        type="range" 
                        min="1" 
                        max="10" 
                        step="1"
                        value={c.weight}
                        onChange={(e) => handleWeightChange(c.id, parseInt(e.target.value))}
                        className="absolute inset-x-0 w-full h-1.5 opacity-0 cursor-pointer z-10"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center px-4">
                <button onClick={() => setStep(1)} className="text-slate-400 font-bold text-sm hover:text-slate-900 transition-colors">返回勾選項目</button>
                <button onClick={() => setStep(3)} className="tech-button px-10 py-3.5 text-sm md:text-base flex items-center gap-2">
                  進入環境模擬測試 <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Rating */}
          {step === 3 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-8"
            >
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">模擬環境：我的價值觀能被實踐嗎？</h2>
                <p className="text-sm text-slate-400">想像進入該班群後你的生活樣貌，這些你重視的價值能在那被滿足幾分？(1是極低，10是極高)</p>
              </div>

              <div className="space-y-5">
                {criteria.map((c) => (
                  <div key={c.id} className="tech-card p-6 md:p-8 space-y-6">
                    <div className="flex flex-col gap-3 border-b border-slate-50 pb-5">
                      <div className="flex items-center gap-3">
                        <div className="text-cyan-600 p-2 bg-cyan-50 rounded-lg">{c.icon}</div>
                        <h4 className="font-black text-lg text-slate-800">{c.label}</h4>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedDiscovery.filter(id => allDiscoveryItems.find(i => i.id === id)?.category === c.id).map(id => (
                          <span key={id} className="px-3 py-1.5 bg-cyan-50/50 text-cyan-700 rounded-xl text-[12px] md:text-sm font-bold border border-cyan-100/50">
                            {allDiscoveryItems.find(i => i.id === id)?.label}
                          </span>
                        ))}
                        {selectedDiscovery.filter(id => allDiscoveryItems.find(i => i.id === id)?.category === c.id).length === 0 && (
                          <span className="text-[13px] md:text-sm text-slate-400 italic font-medium">因為沒選具體細項，請憑直覺給個綜合分數囉</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-8">
                      {tracks.map((t) => (
                        <div key={t} className="space-y-3">
                          <div className="flex justify-between items-center px-1">
                            <span className="font-bold text-[13px] flex items-center gap-2 text-slate-700">
                              <span className="w-2 h-4 rounded-md shadow-sm" style={{ backgroundColor: TRACK_DETAILS[t].color }} />
                              {t}班群
                            </span>
                            <span className="font-mono font-black text-cyan-600 text-sm">{scores[c.id][t]}</span>
                          </div>
                          <div className="relative h-4 flex items-center px-1">
                            <div className="absolute inset-x-0 h-1 bg-slate-100 rounded-full"></div>
                            <div className="absolute left-0 h-1 bg-slate-800 rounded-full transition-all duration-300" style={{ width: `${(scores[c.id][t] - 1) / 9 * 100}%` }}></div>
                            <input 
                              type="range"
                              min="1"
                              max="10"
                              value={scores[c.id][t]}
                              onChange={(e) => handleScoreChange(c.id, t, parseInt(e.target.value))}
                              className="absolute inset-x-0 w-full h-1 opacity-0 cursor-pointer z-10"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center px-4">
                <button onClick={() => setStep(2)} className="text-slate-400 font-bold text-sm hover:text-slate-900 transition-colors">返回修改權重</button>
                <button onClick={() => setStep(4)} className="tech-button px-10 py-4 flex items-center gap-3">
                  檢視生涯起點建議 <Sparkles className="w-5 h-5 text-cyan-400" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 4: Final Results */}
          {step === 4 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-10"
            >
              <div className="text-center space-y-4">
                <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                  專屬於你的<span className="text-cyan-600">生涯起點建議</span>
                </h2>
              </div>

              {/* Main Winner Card */}
              <div className="relative p-1.5 rounded-[2rem] overflow-hidden shadow-2xl shadow-cyan-900/20">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/30 to-blue-600/30"></div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-400/20 rounded-full blur-3xl -mr-32 -mt-32"></div>
                <div className="relative bg-slate-950 p-8 md:p-12 text-white rounded-[1.7rem] border border-slate-800/80">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                    <div className="space-y-6">
                      <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-slate-900 border border-slate-700 rounded-full shadow-inner ring-1 ring-white/5">
                        <div className="w-2.5 h-2.5 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,211,238,0.8)]"></div>
                        <span className="text-white font-black tracking-[0.2em] uppercase text-sm font-mono">Recommendation</span>
                      </div>
                      <h3 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">{topTrack}班群</h3>
                      <p className="text-slate-300 text-lg max-w-md leading-relaxed font-medium">
                        {TRACK_DETAILS[topTrack].desc}
                      </p>
                    </div>
                    <div className="flex flex-col items-center justify-center p-8 bg-white/5 backdrop-blur-md rounded-[3rem] border border-white/10 shadow-2xl">
                      <span className="text-7xl font-black font-mono tracking-tighter text-cyan-400">
                        {Math.round(finalResults[0].percentage)}<span className="text-2xl ml-1 opacity-50">%</span>
                      </span>
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">Match Rate</span>
                    </div>
                  </div>
                  
                  <div className="mt-12 pt-8 border-t border-white/5 flex flex-col gap-4">
                    <span className="text-lg font-black text-slate-200">潛在發展方向（建議學群）：</span>
                    <div className="flex flex-wrap gap-3">
                      {TRACK_DETAILS[topTrack].careers.map(c => (
                        <span key={c} className="px-5 py-2.5 bg-cyan-900/40 rounded-2xl text-base md:text-lg font-black text-cyan-50 border border-cyan-800/50 hover:bg-cyan-600 hover:text-white transition-colors cursor-default shadow-inner shadow-cyan-500/10">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Comparison List */}
              <div className="space-y-4">
                <h4 className="text-sm font-black text-slate-500 uppercase tracking-widest px-4">其他班群適配性對比</h4>
                <div className="grid gap-4">
                  {finalResults.slice(1).map(({ track, percentage }) => (
                    <div key={track} className="tech-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: TRACK_DETAILS[track].color }}></div>
                        <span className="font-black text-lg text-slate-800">{track}班群</span>
                      </div>
                      <div className="flex items-center gap-6 w-full sm:w-auto">
                        <div className="flex-1 sm:w-48 h-2 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            className="h-full bg-slate-800 rounded-full"
                          />
                        </div>
                        <span className="font-mono font-black text-slate-900 w-12 text-right">
                          {Math.round(percentage)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Insight Box */}
              <div className="bg-slate-950 rounded-[2.5rem] p-8 sm:p-10 text-white relative overflow-hidden group shadow-2xl shadow-slate-200">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
                <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center gap-3">
                    <Lightbulb className="w-6 h-6 text-cyan-400" />
                    <span className="font-black text-sm uppercase tracking-[0.2em] text-white/50">Career Construction Insights</span>
                  </div>
                  {!aiAnalysis && (
                    <button 
                      onClick={generateAIAdvice}
                      disabled={isGenerating}
                      className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-2xl transition-all shadow-lg shadow-cyan-900 animate-pulse disabled:opacity-50 disabled:animate-none flex items-center gap-2"
                    >
                      {isGenerating ? <><Loader2 className="w-3.5 h-3.5 animate-spin"/> 生成中...</> : '生成完整建議'}
                    </button>
                  )}
                </div>
                
                {aiAnalysis ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-slate-300 leading-relaxed margin-0 space-y-4"
                  >
                    <div className="text-sm md:text-base font-medium leading-relaxed border-l-2 border-cyan-600 pl-6 bg-cyan-950/40 py-5 rounded-r-2xl whitespace-pre-wrap">
                      {aiAnalysis}
                    </div>
                    <div className="flex gap-4 pt-4">
                      <button onClick={handleDownloadPDF} className="text-xs font-bold text-cyan-400 border border-cyan-900/50 px-4 py-2 rounded-xl hover:bg-cyan-900/30 transition-all flex items-center gap-2">
                        <Download className="w-3.5 h-3.5" /> 下載 PDF 報告
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <div className="h-24 flex items-center justify-center text-slate-800 italic font-mono text-xs uppercase tracking-widest bg-slate-900/30 rounded-3xl border border-white/5">
                    Ready to generate deeper insights...
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-6">
                <button 
                  onClick={() => {
                    setStep(1);
                    setAiAnalysis(null);
                    setSelectedDiscovery([]);
                  }}
                  className="px-10 py-4 bg-white text-slate-900 border border-slate-200 rounded-full font-bold hover:bg-slate-50 transition-all shadow-sm"
                >
                  重新盤點生涯
                </button>
                <button onClick={handleShare} className="tech-button px-12 py-4 flex justify-center items-center gap-2">
                  秀給同學看 <Share2 className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* AI Floating Guide Navigation */}
      <div className="fixed bottom-4 sm:bottom-6 right-4 left-4 sm:left-auto sm:w-96 z-40 pointer-events-none print:hidden">
        <motion.div 
          key={step}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-slate-900/95 backdrop-blur-xl p-4 sm:p-5 rounded-3xl border border-slate-800 shadow-2xl flex gap-3 sm:gap-4 items-start pointer-events-auto shadow-cyan-900/20"
        >
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-cyan-600 rounded-2xl flex-shrink-0 flex items-center justify-center text-white shadow-lg shadow-cyan-500/30">
             <Lightbulb className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="space-y-0.5">
             <div className="text-[11px] font-black text-cyan-400 uppercase tracking-widest hidden sm:block">Career Construction System</div>
             <p className="text-[14px] sm:text-[15px] text-slate-100 leading-snug font-medium pt-0.5 sm:pt-0">
               {aiMessage}
             </p>
          </div>
        </motion.div>
      </div>

      {/* Progress Footer */}
      <footer className="fixed bottom-6 left-6 px-6 py-2.5 bg-white/50 backdrop-blur-md border border-slate-100 shadow-sm rounded-full hidden lg:flex items-center gap-6 z-40 print:hidden">
        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-3">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
          Decision System Ready • v3.8.0
        </span>
      </footer>

      {/* --- Print Layout --- */}
      {step === 4 && (
        <div className="hidden print:block w-full max-w-[21cm] mx-auto bg-white p-2 font-sans text-slate-900 !break-words">
          <div className="border-b-4 border-slate-900 pb-6 mb-8 mt-4">
            <h1 className="text-4xl font-black text-slate-900 mb-2 mt-2">專屬生涯藍圖建構分析報告</h1>
            <p className="text-slate-500 font-medium text-lg">透過決策平衡單盤點能力與價值觀的導航結果</p>
          </div>

          <div className="flex gap-8 mb-8">
            <div className="w-1/2 space-y-6">
              <div>
                <h3 className="text-xl font-black text-slate-800 mb-4 border-l-4 border-cyan-500 pl-3">核心價值觀與考量</h3>
                <div className="space-y-4">
                  {criteria.map(c => {
                    const selectedForCategory = selectedDiscovery.filter(id => allDiscoveryItems.find(i => i.id === id)?.category === c.id);
                    return (
                      <div key={c.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 break-inside-avoid">
                        <div className="flex justify-between items-center mb-2 border-b border-slate-200 pb-2">
                          <span className="font-bold text-slate-800 text-lg flex items-center gap-2">{c.label}</span>
                          <span className="text-sm font-black text-cyan-700 bg-cyan-100 px-3 py-1 rounded-full shadow-sm">權重 {c.weight}</span>
                        </div>
                        {selectedForCategory.length > 0 ? (
                          <ul className="list-disc list-inside text-sm text-slate-700 space-y-1.5 font-medium ml-1">
                            {selectedForCategory.map(id => (
                              <li key={id}>{allDiscoveryItems.find(i => i.id === id)?.label}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-slate-400 italic">未勾選具體細項，憑直覺綜合評分</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="w-1/2 space-y-6">
              <div>
                <h3 className="text-xl font-black text-slate-800 mb-4 border-l-4 border-cyan-500 pl-3">最佳適配班群</h3>
                <div className="bg-slate-50 text-slate-900 p-6 rounded-2xl border border-slate-200 shadow-sm print:border-slate-300">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Recommendation</div>
                  <div className="text-5xl font-black mb-3 text-cyan-600">{topTrack}班群</div>
                  <div className="text-sm font-medium text-slate-600 mb-4">{TRACK_DETAILS[topTrack].desc}</div>
                  <div className="text-4xl font-black font-mono mt-4 border-t border-slate-200 pt-4 text-slate-800">
                    {Math.round(finalResults[0].percentage)}<span className="text-xl ml-1 opacity-50">% MATCH</span>
                  </div>
                </div>
              </div>

              <div>
                 <h3 className="text-xl font-black text-slate-800 mb-4 border-l-4 border-cyan-500 pl-3">潛在發展方向 (建議學群)</h3>
                 <div className="flex flex-wrap gap-2">
                   {TRACK_DETAILS[topTrack].careers.map(c => (
                     <span key={c} className="px-3 py-1.5 bg-cyan-50 text-cyan-800 border border-cyan-200 rounded-xl text-sm font-bold shadow-sm">
                       {c}
                     </span>
                   ))}
                 </div>
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-800 mb-4 border-l-4 border-cyan-500 pl-3">其他班群適配度對比</h3>
                <div className="space-y-4 bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                  {finalResults.map(({ track, percentage }) => (
                    <div key={track} className="flex items-center justify-between gap-3 group">
                      <span className="w-16 font-bold text-sm text-slate-700 flex-shrink-0">{track}班群</span>
                      <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                        <div className={`h-full rounded-full ${track === topTrack ? 'bg-cyan-500' : 'bg-slate-400'}`} style={{ width: `${percentage}%` }}></div>
                      </div>
                      <span className="w-12 text-right font-mono font-black text-sm text-slate-800">{Math.round(percentage)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {aiAnalysis && (
            <div className="break-inside-avoid">
               <h3 className="text-xl font-black text-slate-800 mb-4 border-l-4 border-cyan-500 pl-3">專業導航建議 (AI分析)</h3>
               <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm">
                 <div className="text-base leading-relaxed text-slate-700 font-medium">
                   {/* Handle markdown bold parsing visually */}
                   {aiAnalysis.split('\n').map((paragraph, i) => {
                     if (!paragraph.trim()) return <br key={i} />;
                     // Simple regex to make bold text bold instead of raw markdown tokens
                     const formatted = paragraph.split(/(\*\*.*?\*\*)/).map((part, j) => {
                       if (part.startsWith('**') && part.endsWith('**')) {
                         return <strong key={j} className="text-slate-900">{part.slice(2, -2)}</strong>;
                       }
                       return part;
                     });
                     return <p key={i} className="mb-2">{formatted}</p>;
                   })}
                 </div>
               </div>
            </div>
          )}

          <div className="mt-12 text-center pb-8 border-t border-slate-200 pt-6 flex justify-between items-center px-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Generated by Career Construction System
            </span>
            <span className="text-xs font-bold text-slate-400">
              {new Date().toLocaleDateString('zh-TW')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
