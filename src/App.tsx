import React, { useState, useEffect, useMemo, useRef, Component, ErrorInfo, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, 
  Shield, 
  Wind, 
  Zap, 
  AlertTriangle, 
  Info, 
  Globe as GlobeIcon, 
  Clock, 
  Database,
  Maximize2,
  RefreshCw,
  BarChart3,
  LayoutDashboard,
  Settings,
  Bell,
  Trash2,
  Save
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import Globe from './components/Globe';
import { fetchNOAASolarWind, type SolarWindData } from './lib/noaa';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Error Boundary Component
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-screen bg-[#020810] flex flex-col items-center justify-center p-8 text-center">
          <AlertTriangle size={48} className="text-[#ff2244] mb-4" />
          <h1 className="text-xl font-black tracking-widest uppercase mb-2">System Critical Error</h1>
          <p className="text-xs opacity-50 font-mono max-w-md mb-6">{this.state.error?.message}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 border border-[#00c8ff]/30 text-[#00c8ff] text-[10px] font-black uppercase tracking-widest hover:bg-[#00c8ff]/10 transition-colors"
          >
            Restart System
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const TRANSLATIONS = {
  en: {
    command: "Command",
    analytics: "Analytics",
    agencies: "Agencies",
    settings: "Settings",
    alerts: "Alert Notifications",
    terminal: "System Terminal",
    bz: "Magnetic Field (Bz)",
    speed: "Solar Wind Speed",
    pd: "Dynamic Pressure (Pd)",
    risk: "Risk Assessment",
    status: "System Status",
    operational: "Operational",
    alert: "Alert",
    config: "System Configuration",
    thresholds: "Alert Thresholds",
    visuals: "Visual Simulation",
    system: "System & Data",
    language: "Language",
    save: "Save Configuration",
    reset: "Reset Defaults",
    nominal: "Nominal",
    watch: "Watch",
    warning: "Warning",
    critical: "Critical",
    compression: "Compression",
    criticalCompression: "Critical Compression",
    earthSim: "ALACA GÖZLEM",
    magMode: "Magnetosphere Mode",
    clearAll: "Clear All",
    noAlerts: "No Active Alerts",
    source: "Source",
    refreshRate: "Data Refresh Rate (s)",
    bufferSize: "Telemetry Buffer Size",
    highFidelity: "High-Fidelity Globe",
    fieldLines: "Magnetic Field Lines",
    particles: "Solar Wind Particles",
    pulse: "Real-time Pulse",
    autoScroll: "Terminal Auto-scroll",
    seconds: "SECONDS",
    minutes: "MINUTES",
    frames: "FRAMES",
    notifiedAgencies: "Notified Agencies",
    globalNetwork: "Global Space Weather Distribution Network",
    deepAnalytics: "Deep Analytics",
    historicalTelemetry: "Historical Telemetry & Trend Analysis",
    emergencyProtocol: "Emergency Broadcast Protocol",
    emergencyDesc: "In the event of a G4 or G5 class geomagnetic storm, ALACA GÖZLEM automatically initiates the Inter-Agency Space Weather Protocol (IASWP). Encrypted telemetry is pushed to all connected defense and civilian agencies within 150ms of L1 detection.",
    l1Telemetry: "L1 Telemetry",
    geoStorm: "Geomagnetic Storm (G)",
    radStorm: "Radiation Storm (S)",
    radioBlackout: "Radiation Blackout (R)",
    criticalAlert: "CRITICAL ALERT",
    kpIndex: "Kp Index (24h)",
    telemetryNote: "Telemetry Note",
    telemetryDesc: "Solar wind dynamic pressure is calculated using Tsyganenko (2002) model parameters. Current Bz orientation suggests {orientation} IMF coupling.",
    atmosAnalysis: "Atmospheric Analysis",
    ionoDensity: "Ionosphere Density",
    thermalExcite: "Thermal Excitation",
    liveFeed: "Live Feed",
    relVelocity: "Relative Earth Velocity",
    dscovrSat: "DSCOVR Satellite",
    l1Active: "L1 Lagrange Point | Active",
    protonDensity: "Proton Density",
    plasmaTemp: "Plasma Temperature",
    totalField: "Total Field (Bt)",
    kpTitle: "Planetary K-Index (Kp) - Last 24 Hours",
    kpResolution: "3-Hour Resolution",
    sysTerminal: "System Terminal",
    langEn: "ENGLISH",
    langTr: "TURKISH",
    logFetching: "Fetching NOAA L1 Telemetry...",
    logSync: "Sync Complete: {count} frames retrieved.",
    logCriticalBz: "CRITICAL: Bz is extremely negative, critical conditions for strong impact.",
    logWarningBz: "WARNING: Bz is strongly negative, geomagnetic impact probability significantly increased.",
    logWatchBz: "WATCH: Bz is negative, monitor conditions.",
    logCriticalPd: "CRITICAL: High Dynamic Pressure detected: {val} nPa",
    logWarningPd: "WARNING: Dynamic Pressure is high: {val} nPa",
    logWatchPd: "WATCH: Dynamic Pressure is elevated: {val} nPa",
    logCriticalSpeed: "CRITICAL: Solar wind is very fast, strong event conditions may occur.",
    logWarningSpeed: "WARNING: Solar wind speed is high, impact probability is increasing.",
    logWatchSpeed: "WATCH: Solar wind speed is elevated.",
    logCriticalDensity: "CRITICAL: Density is very high ({val} p/cm³), probability of sudden impact increased.",
    logWarningDensity: "WARNING: Density is significantly high ({val} p/cm³), shock passage possible.",
    logWatchDensity: "WATCH: Density is elevated ({val} p/cm³).",
    logCriticalBt: "CRITICAL: Bt is very high ({val} nT), strong driving conditions may occur.",
    logWarningBt: "WARNING: Bt is high ({val} nT), impact may increase if combined with negative Bz.",
    logWatchBt: "WATCH: Bt is elevated ({val} nT).",
    logCriticalKp: "CRITICAL: Kp is very high ({val}), risk of strong geomagnetic storm.",
    logWarningKp: "WARNING: Kp reached storm threshold ({val}, G1 and above possible).",
    logMockData: "Using simulated data (NOAA Feed Offline)",
    logWarningFeed: "WARNING: NOAA Feed unreachable. Switching to local simulation.",
    logConnError: "Connection Error (Using Simulated Data)",
    roleSARGE: "Space Research & Ground Electronics",
    roleASELSAN: "Defense & Space Electronics",
    roleTUSAS: "Aerospace & Satellite Systems",
    roleBAYKAR: "Autonomous Systems & Avionics",
    roleHAVELSAN: "Software & Simulation Systems",
    roleTURKSAT: "Satellite Communications & GPS",
    roleTEIAS: "Electricity Transmission Grid",
    roleEUAS: "Electricity Generation Corp.",
    roleNOAA: "Primary Data Source",
    roleTUA: "Turkish Space Agency",
    statusActive: "Active",
    statusConnected: "Connected",
    statusStandby: "Standby",
    locTrabzon: "Trabzon, TR",
    locAnkara: "Ankara, TR",
    locIstanbul: "İstanbul, TR",
    locBoulder: "Boulder, CO"
  },
  tr: {
    command: "Komuta",
    analytics: "Analiz",
    agencies: "Kurumlar",
    settings: "Ayarlar",
    alerts: "Uyarı Bildirimleri",
    terminal: "Sistem Terminali",
    bz: "Manyetik Alan (Bz)",
    speed: "Güneş Rüzgarı Hızı",
    pd: "Dinamik Basınç (Pd)",
    risk: "Risk Değerlendirmesi",
    status: "Sistem Durumu",
    operational: "Operasyonel",
    alert: "Uyarı",
    config: "Sistem Yapılandırması",
    thresholds: "Uyarı Eşikleri",
    visuals: "Görsel Simülasyon",
    system: "Sistem ve Veri",
    language: "Dil",
    save: "Yapılandırmayı Kaydet",
    reset: "Varsayılanlara Sıfırla",
    nominal: "Normal",
    watch: "İzlenmeli",
    warning: "Uyarı",
    critical: "Kritik",
    compression: "Sıkışma",
    criticalCompression: "Kritik Sıkışma",
    earthSim: "ALACA GÖZLEM",
    magMode: "Manyetosfer Modu",
    clearAll: "Tümünü Temizle",
    noAlerts: "Aktif Uyarı Yok",
    source: "Kaynak",
    refreshRate: "Veri Yenileme Hızı (sn)",
    bufferSize: "Telemetri Arabellek Boyutu",
    highFidelity: "Yüksek Kaliteli Küre",
    fieldLines: "Manyetik Alan Çizgileri",
    particles: "Güneş Rüzgarı Parçacıkları",
    pulse: "Gerçek Zamanlı Nabız",
    autoScroll: "Terminal Otomatik Kaydırma",
    seconds: "SANİYE",
    minutes: "DAKİKA",
    frames: "KARE",
    notifiedAgencies: "Bildirim Yapılan Kurumlar",
    globalNetwork: "Küresel Uzay Hava Durumu Dağıtım Ağı",
    deepAnalytics: "Derin Analiz",
    historicalTelemetry: "Geçmiş Telemetri ve Trend Analizi",
    emergencyProtocol: "Acil Durum Yayın Protokolü",
    emergencyDesc: "G4 veya G5 sınıfı bir jeomanyetik fırtına durumunda ALACA GÖZLEM, Kurumlar Arası Uzay Hava Durumu Protokolünü (IASWP) otomatik olarak başlatır. Şifreli telemetri, L1 tespitinden sonraki 150 ms içinde tüm bağlı savunma ve sivil kurumlara iletilir.",
    l1Telemetry: "L1 Telemetrisi",
    geoStorm: "Jeomanyetik Fırtına (G)",
    radStorm: "Radyasyon Fırtınası (S)",
    radioBlackout: "Radyo Kesintisi (R)",
    criticalAlert: "KRİTİK UYARI",
    kpIndex: "Kp İndeksi (24s)",
    telemetryNote: "Telemetri Notu",
    telemetryDesc: "Güneş rüzgarı dinamik basıncı Tsyganenko (2002) model parametreleri kullanılarak hesaplanmıştır. Mevcut Bz yönelimi {orientation} IMF eşleşmesini göstermektedir.",
    atmosAnalysis: "Atmosferik Analiz",
    ionoDensity: "İyonosfer Yoğunluğu",
    thermalExcite: "Termal Uyarılma",
    liveFeed: "Canlı Yayın",
    relVelocity: "Göreceli Dünya Hızı",
    dscovrSat: "DSCOVR Uydusu",
    l1Active: "L1 Lagrange Noktası | Aktif",
    protonDensity: "Proton Yoğunluğu",
    plasmaTemp: "Plazma Sıcaklığı",
    totalField: "Toplam Alan (Bt)",
    kpTitle: "Gezegensel K-İndeksi (Kp) - Son 24 Saat",
    kpResolution: "3 Saatlik Çözünürlük",
    sysTerminal: "Sistem Terminali",
    langEn: "İNGİLİZCE",
    langTr: "TÜRKÇE",
    logFetching: "NOAA L1 Telemetrisi Alınıyor...",
    logSync: "Senkronizasyon Tamamlandı: {count} kare alındı.",
    logCriticalBz: "KRİTİK: Bz aşırı negatif, güçlü etki için kritik koşul oluştu.",
    logWarningBz: "UYARI: Bz güçlü negatif, jeomanyetik etki ihtimali belirgin arttı.",
    logWatchBz: "İZLENMELİ: Bz negatif, koşulları izleyin.",
    logCriticalPd: "KRİTİK: Yüksek Dinamik Basınç tespit edildi: {val} nPa",
    logWarningPd: "UYARI: Dinamik Basınç yüksek: {val} nPa",
    logWatchPd: "İZLENMELİ: Dinamik Basınç arttı: {val} nPa",
    logCriticalSpeed: "KRİTİK: Güneş rüzgarı çok hızlı, güçlü olay koşulu oluşabilir.",
    logWarningSpeed: "UYARI: Güneş rüzgarı hızı yüksek, etki ihtimali artıyor.",
    logWatchSpeed: "İZLENMELİ: Güneş rüzgarı hızı arttı.",
    logCriticalDensity: "KRİTİK: Yoğunluk çok yüksek ({val} p/cm³), ani etki ihtimali artmış durumda.",
    logWarningDensity: "UYARI: Yoğunluk belirgin yüksek ({val} p/cm³), şok geçişi olabilir.",
    logWatchDensity: "İZLENMELİ: Yoğunluk arttı ({val} p/cm³).",
    logCriticalBt: "KRİTİK: Bt çok yüksek ({val} nT), güçlü sürüş koşulu oluşabilir.",
    logWarningBt: "UYARI: Bt yüksek ({val} nT), negatif Bz ile birleşirse etki büyüyebilir.",
    logWatchBt: "İZLENMELİ: Bt arttı ({val} nT).",
    logCriticalKp: "KRİTİK: Kp çok yüksek ({val}), güçlü jeomanyetik fırtına riski var.",
    logWarningKp: "UYARI: Kp fırtına eşiğine ulaştı ({val}, G1 ve üzeri mümkün).",
    logMockData: "Simüle edilmiş veri kullanılıyor (NOAA Akışı Çevrimdışı)",
    logWarningFeed: "UYARI: NOAA Akışına ulaşılamıyor. Yerel simülasyona geçiliyor.",
    logConnError: "Bağlantı Hatası (Simüle Edilmiş Veri Kullanılıyor)",
    roleSARGE: "Uzay Araştırmaları ve Yer Elektroniği",
    roleASELSAN: "Savunma ve Uzay Elektroniği",
    roleTUSAS: "Havacılık ve Uydu Sistemleri",
    roleBAYKAR: "Otonom Sistemler ve Aviyonik",
    roleHAVELSAN: "Yazılım ve Simülasyon Sistemleri",
    roleTURKSAT: "Uydu Haberleşmesi ve GPS",
    roleTEIAS: "Elektrik İletim Şebekesi",
    roleEUAS: "Elektrik Üretim A.Ş.",
    roleNOAA: "Birincil Veri Kaynağı",
    roleTUA: "Türkiye Uzay Ajansı",
    statusActive: "Aktif",
    statusConnected: "Bağlı",
    statusStandby: "Beklemede",
    locTrabzon: "Trabzon, TR",
    locAnkara: "Ankara, TR",
    locIstanbul: "İstanbul, TR",
    locBoulder: "Boulder, CO"
  }
};

const MetricCard = ({ 
  label, 
  value, 
  unit, 
  status, 
  icon: Icon, 
  data, 
  dataKey,
  t,
  showChart = true
}: { 
  label: string; 
  value: string | number; 
  unit: string; 
  status: 'nominal' | 'watch' | 'warning' | 'critical'; 
  icon: any; 
  data: any[]; 
  dataKey: string;
  t: any;
  showChart?: boolean;
}) => {
  const statusColors = {
    nominal: 'text-[#00ff88] border-[#00ff88]/30 bg-[#00ff88]/5 shadow-[0_0_15px_rgba(0,255,136,0.05)]',
    watch: 'text-[#00c8ff] border-[#00c8ff]/30 bg-[#00c8ff]/5 shadow-[0_0_15px_rgba(0,200,255,0.05)]',
    warning: 'text-[#ff8800] border-[#ff8800]/30 bg-[#ff8800]/5 shadow-[0_0_15px_rgba(255,136,0,0.05)]',
    critical: 'text-[#ff2244] border-[#ff2244]/30 bg-[#ff2244]/5 shadow-[0_0_15px_rgba(255,34,68,0.05)]',
  };

  return (
    <div className={cn(
      "p-2 border rounded-sm backdrop-blur-md transition-all duration-500 relative overflow-hidden group",
      statusColors[status]
    )}>
      {/* Dominant background glow */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-current opacity-[0.03] blur-3xl -mr-12 -mt-12 group-hover:opacity-[0.08] transition-opacity" />
      
      <div className="flex items-center justify-between mb-0.5 relative z-10">
        <div className="flex items-center gap-1.5">
          <Icon size={10} className="opacity-70" />
          <span className="text-[8px] uppercase font-black tracking-widest opacity-70">{label}</span>
        </div>
        <div className={cn(
          "px-1 py-0.5 rounded-full text-[6px] font-black uppercase tracking-tighter",
          status === 'nominal' ? 'bg-[#00ff88]/20' : status === 'watch' ? 'bg-[#00c8ff]/20' : status === 'warning' ? 'bg-[#ff8800]/20' : 'bg-[#ff2244]/20'
        )}>
          {t[status as keyof typeof t] || status}
        </div>
      </div>
      
      <div className="flex items-baseline gap-1 mb-1 relative z-10">
        <span className="text-xl font-black tracking-tighter font-mono leading-none">{value}</span>
        <span className="text-[8px] opacity-40 uppercase font-black">{unit}</span>
      </div>

      {showChart && (
        <div className="h-12 w-full relative z-10">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="currentColor" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="currentColor" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="time" stroke="#ffffff20" fontSize={6} tickLine={false} axisLine={false} />
              <Area 
                type="stepAfter" 
                dataKey={dataKey} 
                stroke="currentColor" 
                strokeWidth={2} 
                fillOpacity={1} 
                fill={`url(#gradient-${dataKey})`} 
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

const ScaleIndicator = ({ label, value, max, color }: { label: string; value: number; max: number; color: string }) => {
  return (
    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
      <span className="opacity-60">{label}</span>
      <span className={cn("px-2 py-0.5 rounded-sm", value > 0 ? `${color} text-black` : "bg-white/10 text-white/40")}>{value}</span>
    </div>
  );
};

const MOCK_DATA: SolarWindData[] = Array.from({ length: 50 }).map((_, i) => ({
  time: `${12 + Math.floor(i/10)}:${(i%10)*6}`,
  density: 5 + Math.random() * 5,
  speed: 400 + Math.random() * 100,
  temperature: 100000 + Math.random() * 50000,
  bz: (Math.random() - 0.5) * 10,
  pd: 2 + Math.random() * 2,
  kp: Math.floor(Math.random() * 6)
}));



const AnalyticsView = ({ data, current, t }: { data: SolarWindData[], current: SolarWindData, t: any }) => {
  const metrics = [
    { key: 'bz', label: t.bz, unit: 'nT', color: '#ff2244' },
    { key: 'speed', label: t.speed, unit: 'km/s', color: '#00ff88' },
    { key: 'density', label: t.protonDensity, unit: 'p/cm³', color: '#00c8ff' },
    { key: 'pd', label: t.pd, unit: 'nPa', color: '#a855f7' }
  ];

  return (
    <div className="p-4 space-y-6 overflow-y-auto h-full custom-scrollbar">
      <div className="flex flex-col gap-0.5">
        <h1 className="text-lg font-black tracking-[0.3em] uppercase text-[#00c8ff]">{t.deepAnalytics}</h1>
        <p className="text-[8px] opacity-40 uppercase tracking-widest">{t.historicalTelemetry}</p>
      </div>

      {/* Kp Index 24h Bar Chart Removed */}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {metrics.map((m) => (
          <div key={m.key} className="p-3 border border-white/5 bg-white/5 rounded-sm space-y-3">
            <div className="flex justify-between items-center">
              <div className="space-y-0.5">
                <h3 className="text-[9px] font-black tracking-widest uppercase opacity-70">{m.label}</h3>
                <div className="text-lg font-black tracking-tighter font-mono">
                  {current[m.key as keyof SolarWindData]?.toString() || '0'} 
                  <span className="text-[8px] opacity-40 uppercase ml-1.5">{m.unit}</span>
                </div>
              </div>
              <div className="text-[7px] font-bold uppercase tracking-widest opacity-20">60m</div>
            </div>
            
            <div className="h-20 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id={`grad-${m.key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={m.color} stopOpacity={0.2}/>
                      <stop offset="95%" stopColor={m.color} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis dataKey="time" stroke="#ffffff20" fontSize={7} tickLine={false} axisLine={false} />
                  <YAxis 
                    stroke="#ffffff15" 
                    fontSize={7} 
                    tickFormatter={(val) => val.toLocaleString()}
                    width={25}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#020810', border: '1px solid #ffffff10', fontSize: '8px' }}
                    itemStyle={{ color: m.color }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey={m.key} 
                    stroke={m.color} 
                    strokeWidth={1} 
                    fillOpacity={1} 
                    fill={`url(#grad-${m.key})`} 
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const Terminal = ({ logs, t }: { logs: string[], t: any }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="flex-1 min-h-0 flex flex-col border-t border-white/5 pt-4">
      <h2 className="text-[10px] font-black tracking-[0.2em] uppercase opacity-50 mb-3 flex items-center gap-2">
        <span className="w-1 h-1 bg-[#00c8ff] rounded-full animate-pulse" />
        {t.sysTerminal}
      </h2>
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto font-mono text-[9px] space-y-1 pr-2 custom-scrollbar"
      >
        {logs.map((log, i) => (
          <div key={i} className="flex gap-2 leading-relaxed">
            <span className="opacity-30 shrink-0">[{new Date().toLocaleTimeString([], { hour12: false })}]</span>
            <span className={cn(
              "break-all",
              log.includes('CRITICAL') ? 'text-[#ff2244]' : 
              log.includes('WARNING') ? 'text-[#ff8800]' : 
              log.includes('ERROR') ? 'text-[#ff2244]' :
              'text-[#c8e8ff]/60'
            )}>
              {log}
            </span>
          </div>
        ))}
        <div className="flex gap-2 animate-pulse">
          <span className="opacity-30">[{new Date().toLocaleTimeString([], { hour12: false })}]</span>
          <span className="text-[#00c8ff]">_</span>
        </div>
      </div>
    </div>
  );
};

const SettingsView = ({ settings, setSettings, t }: { settings: any, setSettings: any, t: any }) => {
  return (
    <div className="p-8 space-y-8 overflow-y-auto h-full custom-scrollbar max-w-5xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-black tracking-[0.3em] uppercase text-[#00c8ff]">{t.config}</h1>
        <p className="text-[10px] opacity-40 uppercase tracking-widest">{t.historicalTelemetry}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Visual Simulation */}
        <div className="p-6 border border-white/5 bg-white/5 rounded-sm space-y-6">
          <h3 className="text-xs font-black tracking-widest uppercase text-[#00c8ff] border-b border-[#00c8ff]/20 pb-2">{t.visuals}</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold opacity-60">{t.highFidelity}</span>
              <button 
                onClick={() => setSettings({ ...settings, highFidelity: !settings.highFidelity })}
                className={cn(
                  "w-8 h-4 rounded-full transition-colors relative",
                  settings.highFidelity ? "bg-[#00ff88]" : "bg-white/10"
                )}
              >
                <div className={cn(
                  "absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all",
                  settings.highFidelity ? "left-4.5" : "left-0.5"
                )} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold opacity-60">{t.fieldLines}</span>
              <button 
                onClick={() => setSettings({ ...settings, showMagneticField: !settings.showMagneticField })}
                className={cn(
                  "w-8 h-4 rounded-full transition-colors relative",
                  settings.showMagneticField ? "bg-[#00ff88]" : "bg-white/10"
                )}
              >
                <div className={cn(
                  "absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all",
                  settings.showMagneticField ? "left-4.5" : "left-0.5"
                )} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold opacity-60">{t.particles}</span>
              <button 
                onClick={() => setSettings({ ...settings, showSolarWind: !settings.showSolarWind })}
                className={cn(
                  "w-8 h-4 rounded-full transition-colors relative",
                  settings.showSolarWind ? "bg-[#00ff88]" : "bg-white/10"
                )}
              >
                <div className={cn(
                  "absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all",
                  settings.showSolarWind ? "left-4.5" : "left-0.5"
                )} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold opacity-60">{t.pulse}</span>
              <button 
                onClick={() => setSettings({ ...settings, pulseEnabled: !settings.pulseEnabled })}
                className={cn(
                  "w-8 h-4 rounded-full transition-colors relative",
                  settings.pulseEnabled ? "bg-[#00ff88]" : "bg-white/10"
                )}
              >
                <div className={cn(
                  "absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all",
                  settings.pulseEnabled ? "left-4.5" : "left-0.5"
                )} />
              </button>
            </div>
          </div>
        </div>

        {/* System & Data */}
        <div className="p-6 border border-white/5 bg-white/5 rounded-sm space-y-6">
          <h3 className="text-xs font-black tracking-widest uppercase text-[#00c8ff] border-b border-[#00c8ff]/20 pb-2">{t.system}</h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold opacity-60">{t.language}</label>
              <select 
                value={settings.language}
                onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                className="w-full bg-[#020810] border border-white/10 text-[10px] font-mono p-2 rounded-sm focus:border-[#00c8ff] outline-none"
              >
                <option value="en">{t.langEn}</option>
                <option value="tr">{t.langTr}</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold opacity-60">{t.autoScroll}</span>
              <button 
                onClick={() => setSettings({ ...settings, autoScroll: !settings.autoScroll })}
                className={cn(
                  "w-8 h-4 rounded-full transition-colors relative",
                  settings.autoScroll ? "bg-[#00ff88]" : "bg-white/10"
                )}
              >
                <div className={cn(
                  "absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all",
                  settings.autoScroll ? "left-4.5" : "left-0.5"
                )} />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold opacity-60">{t.refreshRate}</label>
              <select 
                value={settings.refreshRate}
                onChange={(e) => setSettings({ ...settings, refreshRate: parseInt(e.target.value) })}
                className="w-full bg-[#020810] border border-white/10 text-[10px] font-mono p-2 rounded-sm focus:border-[#00c8ff] outline-none"
              >
                <option value={30}>30 {t.seconds}</option>
                <option value={60}>60 {t.seconds}</option>
                <option value={300}>5 {t.minutes}</option>
                <option value={600}>10 {t.minutes}</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold opacity-60">{t.bufferSize}</label>
              <select 
                value={settings.bufferSize}
                onChange={(e) => setSettings({ ...settings, bufferSize: parseInt(e.target.value) })}
                className="w-full bg-[#020810] border border-white/10 text-[10px] font-mono p-2 rounded-sm focus:border-[#00c8ff] outline-none"
              >
                <option value={50}>50 {t.frames}</option>
                <option value={100}>100 {t.frames}</option>
                <option value={500}>500 {t.frames}</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <button className="flex items-center gap-2 px-6 py-2 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all">
          <Trash2 size={12} />
          {t.reset}
        </button>
        <button className="flex items-center gap-2 px-6 py-2 bg-[#00c8ff] text-black text-[10px] font-black uppercase tracking-widest hover:bg-[#00c8ff]/80 transition-all shadow-[0_0_20px_rgba(0,200,255,0.3)]">
          <Save size={12} />
          {t.save}
        </button>
      </div>
    </div>
  );
};

const AlertsPanel = ({ notifications, clearNotifications, t }: { notifications: any[], clearNotifications: () => void, t: any }) => {
  return (
    <div className="w-80 border-l border-[#00c8ff]/10 bg-[#040d1a]/80 backdrop-blur-xl flex flex-col overflow-hidden">
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell size={14} className="text-[#ff2244]" />
          <h2 className="text-[10px] font-black tracking-[0.2em] uppercase">{t.alerts}</h2>
        </div>
        <button 
          onClick={clearNotifications}
          className="text-[8px] font-black uppercase opacity-40 hover:opacity-100 transition-opacity"
        >
          {t.clearAll}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {notifications.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-20 space-y-2">
            <Shield size={32} />
            <span className="text-[9px] font-black uppercase tracking-widest">{t.noAlerts}</span>
          </div>
        ) : (
          notifications.map((alert, i) => (
            <div key={i} className={cn(
              "p-3 border rounded-sm space-y-2 animate-in slide-in-from-right-4 duration-300",
              alert.type === 'critical' ? 'border-[#ff2244]/30 bg-[#ff2244]/5' : 
              alert.type === 'warning' ? 'border-[#ff8800]/30 bg-[#ff8800]/5' : 
              'border-[#00c8ff]/30 bg-[#00c8ff]/5'
            )}>
              <div className="flex justify-between items-start">
                <span className={cn(
                  "text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full",
                  alert.type === 'critical' ? 'bg-[#ff2244]/20 text-[#ff2244]' : 
                  alert.type === 'warning' ? 'bg-[#ff8800]/20 text-[#ff8800]' : 
                  'bg-[#00c8ff]/20 text-[#00c8ff]'
                )}>
                  {t[alert.type as keyof typeof t] || alert.type}
                </span>
                <span className="text-[8px] font-mono opacity-40">{alert.time}</span>
              </div>
              <p className="text-[10px] font-bold leading-tight">{alert.message}</p>
              <div className="text-[8px] opacity-40 uppercase font-black tracking-tighter">
                {t.source}: {alert.source}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

function CommandCenter() {
  const [activeTab, setActiveTab] = useState<'COMMAND' | 'ANALYTICS' | 'SETTINGS'>('COMMAND');
  const [data, setData] = useState<SolarWindData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [logs, setLogs] = useState<string[]>(["Initializing ALACA GÖZLEM Core...", "Establishing L1 Uplink...", "DSCOVR Handshake: OK"]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showAlerts, setShowAlerts] = useState(false);
  const [testAlert, setTestAlert] = useState(false);
  
  const [settings, setSettings] = useState({
    bzThreshold: -2,
    bzCriticalThreshold: -5,
    speedThreshold: 600,
    speedCriticalThreshold: 800,
    pdThreshold: 4.0,
    densityThreshold: 20,
    densityCriticalThreshold: 30,
    btThreshold: 15,
    btCriticalThreshold: 20,
    kpThreshold: 5,
    kpCriticalThreshold: 7,
    highFidelity: true,
    pulseEnabled: true,
    autoScroll: true,
    showMagneticField: true,
    showSolarWind: true,
    refreshRate: 60,
    bufferSize: 100,
    language: 'tr'
  });

  const t = TRANSLATIONS[settings.language as keyof typeof TRANSLATIONS];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Simulated micro-fluctuations for real-time feel
  const [pulse, setPulse] = useState({ bz: 0, speed: 0 });

  const current = useMemo(() => {
    const base = data[data.length - 1] || MOCK_DATA[MOCK_DATA.length - 1];
    return {
      ...base,
      bz: base.bz + pulse.bz,
      speed: base.speed + pulse.speed
    };
  }, [data, pulse]);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev.slice(-40), msg]);
  };

  const addNotification = (msg: string, type: 'watch' | 'warning' | 'critical', source: string = 'NOAA-L1') => {
    setNotifications(prev => [
      { message: msg, type, source, time: new Date().toLocaleTimeString([], { hour12: false }) },
      ...prev.slice(0, 19)
    ]);
  };

  const refreshData = async () => {
    try {
      addLog("Fetching NOAA L1 Telemetry...");
      const newData = await fetchNOAASolarWind();
      if (newData.length > 0) {
        setData(newData);
        setError(null);
        addLog(`Sync Complete: ${newData.length} frames retrieved.`);
        
        const latest = newData[newData.length - 1];
        const isDisturbed = latest.pd >= 3 || latest.speed >= 500 || latest.density >= 10;

        if (latest.bz < -10) {
          addLog(t.logCriticalBz);
          addNotification(t.logCriticalBz, 'critical');
        } else if (latest.bz < -5) {
          addLog(t.logWarningBz);
          addNotification(t.logWarningBz, 'warning');
        } else if (latest.bz < 0 && isDisturbed) {
          addLog(t.logWatchBz);
          addNotification(t.logWatchBz, 'watch');
        }

        if (latest.pd > 5) {
          addLog(t.logCriticalPd.replace('{val}', latest.pd.toFixed(2)));
          addNotification(t.logCriticalPd.replace('{val}', latest.pd.toFixed(2)), 'critical');
        } else if (latest.pd >= 4) {
          addLog(t.logWarningPd.replace('{val}', latest.pd.toFixed(2)));
          addNotification(t.logWarningPd.replace('{val}', latest.pd.toFixed(2)), 'warning');
        } else if (latest.pd >= 3) {
          addLog(t.logWatchPd.replace('{val}', latest.pd.toFixed(2)));
          addNotification(t.logWatchPd.replace('{val}', latest.pd.toFixed(2)), 'watch');
        }

        if (latest.speed > 900) {
          addLog(t.logCriticalSpeed);
          addNotification(t.logCriticalSpeed, 'critical');
        } else if (latest.speed >= 700) {
          addLog(t.logWarningSpeed);
          addNotification(t.logWarningSpeed, 'warning');
        } else if (latest.speed >= 500) {
          addLog(t.logWatchSpeed);
          addNotification(t.logWatchSpeed, 'watch');
        }

        if (latest.density >= 50) {
          addLog(t.logCriticalDensity.replace('{val}', latest.density.toFixed(1)));
          addNotification(t.logCriticalDensity.replace('{val}', latest.density.toFixed(1)), 'critical');
        } else if (latest.density >= 25) {
          addLog(t.logWarningDensity.replace('{val}', latest.density.toFixed(1)));
          addNotification(t.logWarningDensity.replace('{val}', latest.density.toFixed(1)), 'warning');
        } else if (latest.density >= 10) {
          addLog(t.logWatchDensity.replace('{val}', latest.density.toFixed(1)));
          addNotification(t.logWatchDensity.replace('{val}', latest.density.toFixed(1)), 'watch');
        }

        if (latest.kp >= settings.kpThreshold) {
          addLog(t.logWarningKp.replace('{val}', latest.kp.toFixed(1)));
          addNotification(t.logWarningKp.replace('{val}', latest.kp.toFixed(1)), 'warning');
        }
      } else {
        if (data.length === 0) setData(MOCK_DATA);
        setError("Using simulated data (NOAA Feed Offline)");
        addLog("WARNING: NOAA Feed unreachable. Switching to local simulation.");
      }
    } catch (err) {
      // Improved error logging for NOAA fetch failures
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.warn(`NOAA Data Fetch Issue: ${errorMessage}. Falling back to simulated data.`);
      
      if (data.length === 0) setData(MOCK_DATA);
      setError(settings.language === 'tr' ? "Bağlantı Hatası (Simüle Edilmiş Veri)" : "Connection Error (Simulated Data)");
      addLog(settings.language === 'tr' ? "HATA: Veri akışı kesildi. Acil durum simülasyonu devrede." : "ERROR: Uplink failure. Emergency simulation active.");
    } finally {
      setLoading(false);
      setLastUpdate(new Date());
    }
  };

  useEffect(() => {
    refreshData();
    const dataInterval = setInterval(refreshData, 60000);
    
    // Pulse interval for "instant" feel
    const pulseInterval = setInterval(() => {
      setPulse({
        bz: (Math.random() - 0.5) * 0.2,
        speed: (Math.random() - 0.5) * 2
      });
    }, 2000);

    return () => {
      clearInterval(dataInterval);
      clearInterval(pulseInterval);
    };
  }, []);

  const getStatus = (val: number, type: 'bz' | 'speed' | 'pd' | 'density' | 'kp', fullData?: any) => {
    if (type === 'bz') {
      const isDisturbed = fullData ? (fullData.pd >= 3 || fullData.speed >= 500 || fullData.density >= 10) : false;
      if (val < -10) return 'critical';
      if (val < -5) return 'warning';
      if (val < 0 && isDisturbed) return 'watch';
      return 'nominal';
    }
    if (type === 'speed') {
      if (val > 900) return 'critical';
      if (val >= 700) return 'warning';
      if (val >= 500) return 'watch';
      return 'nominal';
    }
    if (type === 'density') {
      if (val >= 50) return 'critical';
      if (val >= 25) return 'warning';
      if (val >= 10) return 'watch';
      return 'nominal';
    }
    if (type === 'kp') {
      if (val >= settings.kpThreshold) return 'warning';
      return 'nominal';
    }
    if (type === 'pd') {
      if (val > 5) return 'critical';
      if (val >= 4) return 'warning';
      if (val >= 3) return 'watch';
      return 'nominal';
    }
    return 'nominal';
  };

  if (loading && data.length === 0) {
    return (
      <div className="h-screen w-screen bg-[#020810] flex flex-col items-center justify-center p-8 text-center">
        <RefreshCw size={32} className="text-[#00c8ff] animate-spin mb-4" />
        <h1 className="text-sm font-black tracking-[0.4em] uppercase animate-pulse">Initializing ALACA GÖZLEM System...</h1>
        <p className="text-[9px] opacity-40 mt-2 tracking-widest uppercase">Connecting to L1 Lagrange Point Telemetry</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#020810] text-[#c8e8ff] font-sans selection:bg-[#00c8ff]/30 overflow-hidden">
      {/* Critical Alert Overlay */}
      <AnimatePresence>
        {(testAlert || getStatus(current.bz, 'bz', current) === 'critical' || 
          getStatus(current.speed, 'speed') === 'critical' || 
          getStatus(current.density, 'density') === 'critical' || 
          getStatus(current.kp, 'kp') === 'critical' || 
          getStatus(current.pd, 'pd') === 'critical') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center bg-[#ff2244]/10"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                opacity: [0.7, 1, 0.7]
              }}
              transition={{ 
                duration: 1,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="flex flex-col items-center gap-4"
            >
              <AlertTriangle size={120} className="text-[#ff2244] drop-shadow-[0_0_30px_#ff2244]" />
              <h1 className="text-6xl font-black tracking-[0.5em] uppercase text-[#ff2244] drop-shadow-[0_0_20px_#ff2244]">
                {t.criticalAlert}
              </h1>
            </motion.div>
            
            {/* Corner Warning Borders */}
            <div className="absolute top-0 left-0 w-32 h-32 border-t-8 border-l-8 border-[#ff2244] animate-pulse" />
            <div className="absolute top-0 right-0 w-32 h-32 border-t-8 border-r-8 border-[#ff2244] animate-pulse" />
            <div className="absolute bottom-0 left-0 w-32 h-32 border-b-8 border-l-8 border-[#ff2244] animate-pulse" />
            <div className="absolute bottom-0 right-0 w-32 h-32 border-b-8 border-r-8 border-[#ff2244] animate-pulse" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Bar */}
      <header className="h-12 border-b border-[#00c8ff]/20 flex items-center justify-between px-6 bg-[#020810]/80 backdrop-blur-xl z-50">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-[#00c8ff] rounded-full animate-pulse shadow-[0_0_10px_#00c8ff]" />
            <div className="flex items-center gap-1.5">
              <span className="font-black tracking-[0.3em] text-sm uppercase text-[#00c8ff]">ALACA GÖZLEM</span>
              <div className="flex items-center justify-center w-6 h-4 bg-[#E30A17] rounded-[2px] overflow-hidden shadow-[0_0_10px_rgba(227,10,23,0.3)]">
                <svg viewBox="0 0 1200 800" className="w-full h-full">
                  <rect width="1200" height="800" fill="#E30A17"/>
                  <path 
                    d="M 400 400 m -200 0 a 200 200 0 1 0 400 0 a 200 200 0 1 0 -400 0 M 450 400 m -160 0 a 160 160 0 1 1 320 0 a 160 160 0 1 1 -320 0" 
                    fill="white" 
                    fillRule="evenodd"
                  />
                  <path 
                    d="M 680 400 l -58.8 -19.1 l -19.1 -58.8 l -19.1 58.8 l -58.8 19.1 l 58.8 19.1 l 19.1 58.8 l 19.1 -58.8 z" 
                    fill="white" 
                    transform="rotate(-18 680 400)"
                  />
                </svg>
              </div>
            </div>
            <span className="ml-2 px-1.5 py-0.5 bg-[#00c8ff]/20 text-[#00c8ff] text-[7px] font-black rounded-xs animate-pulse">LIVE</span>
          </div>
          
          <nav className="flex items-center gap-1">
            {[
              { id: 'COMMAND', icon: LayoutDashboard, label: t.command },
              { id: 'ANALYTICS', icon: BarChart3, label: t.analytics },
              { id: 'SETTINGS', icon: Settings, label: t.settings }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-2 px-4 py-1.5 rounded-sm text-[9px] font-black uppercase tracking-widest transition-all",
                  activeTab === tab.id 
                    ? "bg-[#00c8ff]/10 text-[#00c8ff] border border-[#00c8ff]/20" 
                    : "text-white/40 hover:text-white/60 hover:bg-white/5"
                )}
              >
                <tab.icon size={12} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-6">
          <button
            onClick={() => {
              setTestAlert(true);
              setTimeout(() => setTestAlert(false), 5000);
            }}
            className="flex items-center gap-2 px-3 py-1.5 border border-[#ff8800]/30 bg-[#ff8800]/10 text-[#ff8800] rounded-sm text-[9px] font-black uppercase tracking-widest hover:bg-[#ff8800]/20 transition-colors"
          >
            <AlertTriangle size={12} />
            {settings.language === 'tr' ? 'Uyarı Testi' : 'Test Alert'}
          </button>
          <button 
            onClick={() => setShowAlerts(!showAlerts)}
            className={cn(
              "relative p-2 rounded-sm transition-all",
              notifications.length > 0 ? "text-[#ff2244] animate-pulse" : "text-white/40"
            )}
          >
            <Bell size={16} />
            {notifications.length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#ff2244] rounded-full border border-[#020810]" />
            )}
          </button>
          {error && (
            <div className="flex items-center gap-2 text-[9px] font-bold text-[#ff8800] animate-pulse">
              <AlertTriangle size={12} />
              <span>{error}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-[10px] font-mono opacity-60">
            <Clock size={12} />
            <span>UTC {currentTime.toLocaleTimeString('en-GB', { timeZone: 'UTC' })}</span>
          </div>
          <div className={cn(
            "px-3 py-1 border rounded-sm text-[9px] font-black tracking-widest uppercase",
            getStatus(current.bz, 'bz', current) === 'nominal' ? 'border-[#00ff88]/30 text-[#00ff88] bg-[#00ff88]/5' : 'border-[#ff2244]/30 text-[#ff2244] bg-[#ff2244]/5 animate-pulse'
          )}>
            {t.status}: {getStatus(current.bz, 'bz', current) === 'nominal' ? t.operational : t.alert}
          </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'COMMAND' && (
            <motion.div 
              key="command"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex-1 flex overflow-hidden"
            >
              {/* Left Sidebar - Telemetry */}
              <aside className="w-64 border-r border-[#00c8ff]/10 bg-[#040d1a]/50 flex flex-col overflow-y-auto p-4 space-y-4 custom-scrollbar">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-[10px] font-black tracking-[0.2em] uppercase opacity-50">{t.l1Telemetry}</h2>
                  <Database size={12} className="opacity-30" />
                </div>

                <MetricCard 
                  label={t.bz} 
                  value={current.bz.toFixed(1)} 
                  unit="nT" 
                  status={getStatus(current.bz, 'bz', current)} 
                  icon={Shield}
                  data={data}
                  dataKey="bz"
                  t={t}
                />

                <MetricCard 
                  label={t.speed} 
                  value={Math.round(current.speed)} 
                  unit="km/s" 
                  status={getStatus(current.speed, 'speed')} 
                  icon={Wind}
                  data={data}
                  dataKey="speed"
                  t={t}
                  showChart={false}
                />

                <MetricCard 
                  label={t.pd} 
                  value={current.pd.toFixed(2)} 
                  unit="nPa" 
                  status={getStatus(current.pd, 'pd')} 
                  icon={Zap}
                  data={data}
                  dataKey="pd"
                  t={t}
                />

                <div className="p-4 border border-[#ff8800]/20 bg-[#ff8800]/5 rounded-sm space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-[9px] font-black tracking-widest uppercase text-[#ff8800]">{t.kpIndex}</h3>
                    <div className="text-[12px] font-mono font-black text-[#ff8800]">{current.kp || 0}</div>
                  </div>
                  <div className="h-12 w-full flex items-end gap-0.5">
                    {data.slice(-12).map((entry: any, i) => (
                      <div 
                        key={i} 
                        className={cn(
                          "flex-1 rounded-t-[1px] transition-all",
                          entry.kp >= 5 ? 'bg-[#ff8800]' : entry.kp >= 4 ? 'bg-[#ff8800]/60' : 'bg-[#00ff88]'
                        )}
                        style={{ height: `${(entry.kp / 9) * 100}%`, opacity: i === 11 ? 1 : 0.3 }}
                      />
                    ))}
                  </div>
                </div>

                {/* Risk Assessment Removed */}
              </aside>

              {/* Center - 3D World */}
              <section className="flex-1 relative bg-black">
                <Globe 
                  bz={current.bz} 
                  speed={current.speed} 
                  pd={current.pd}
                  showMagneticField={settings.showMagneticField}
                  showSolarWind={settings.showSolarWind}
                  highFidelity={settings.highFidelity}
                />
                
                {/* HUD Overlays */}
                <div className="absolute inset-0 pointer-events-none p-8 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div className="w-32">
                      {/* Empty left spacer */}
                    </div>

                    {/* Empty center spacer */}
                    <div className="w-32">
                    </div>
                    
                    <div className="text-right space-y-1">
                      <div className="text-xs font-black tracking-widest uppercase text-[#00c8ff]">{t.dscovrSat}</div>
                      <div className="text-[10px] font-mono opacity-40">{t.l1Active}</div>
                    </div>
                  </div>

                  <div className="flex justify-between items-end">
                    {/* Telemetry note and maximize button removed */}
                  </div>
                </div>

                {/* Grid Lines */}
                <div className="absolute inset-0 pointer-events-none opacity-10" 
                     style={{ backgroundImage: 'radial-gradient(#00c8ff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
              </section>

              {/* Right Sidebar - Analysis */}
              <aside className="w-72 border-l border-[#00c8ff]/10 bg-[#040d1a]/50 flex flex-col p-4 space-y-6">
                <Terminal logs={logs} t={t} />
              </aside>
            </motion.div>
          )}

          {activeTab === 'ANALYTICS' && (
            <motion.div 
              key="analytics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 bg-[#040d1a]/30"
            >
              <AnalyticsView data={data.length > 0 ? data : MOCK_DATA} current={current} t={t} />
            </motion.div>
          )}



          {activeTab === 'SETTINGS' && (
            <motion.div 
              key="settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 bg-[#040d1a]/30"
            >
              <SettingsView settings={settings} setSettings={setSettings} t={t} />
            </motion.div>
          )}
        </AnimatePresence>

        {showAlerts && (
          <AlertsPanel 
            notifications={notifications} 
            clearNotifications={() => setNotifications([])} 
            t={t}
          />
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <CommandCenter />
    </ErrorBoundary>
  );
}
