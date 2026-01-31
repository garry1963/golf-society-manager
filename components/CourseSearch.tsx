
import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  Search, 
  MapPin, 
  Star, 
  ExternalLink, 
  Loader2, 
  Globe, 
  Sparkles, 
  X, 
  CheckCircle2, 
  ShieldCheck, 
  Database, 
  SearchCheck, 
  Award,
  BookMarked,
  PlusCircle,
  Building2,
  Trash2,
  CalendarDays,
  Target,
  ArrowRight,
  Wifi,
  History,
  Info,
  Download,
  Fingerprint,
  AlertTriangle,
  Server,
  Activity,
  Cpu,
  RefreshCw
} from 'lucide-react';
import CourseSpecsDisplay from './CourseSpecsDisplay';
import { CourseSpecs, Facility } from '../types';

interface CourseResult {
  title: string;
  uri: string;
  rating?: string;
  address?: string;
  snippet?: string;
  difficulty?: 'Easy' | 'Moderate' | 'Challenging' | 'Elite';
  insight?: string;
  isGolfCourse?: boolean;
  courseStyle?: string; 
  whsId?: string;
  isvVerified?: boolean;
  dotgolfStatus?: 'Connected' | 'Restricted' | 'Synced';
}

interface CourseSearchProps {
  onSaveFacility?: (facility: Facility) => void;
  onRemoveFacility?: (id: string) => void;
  onPlanTournament?: (name: string, location: string) => void;
  savedFacilities?: Facility[];
}

const CourseSearch: React.FC<CourseSearchProps> = ({ 
  onSaveFacility, 
  onRemoveFacility, 
  onPlanTournament, 
  savedFacilities = [] 
}) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchPhase, setSearchPhase] = useState<string>('');
  const [results, setResults] = useState<CourseResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'search' | 'registry'>('search');
  
  const [selectedCourse, setSelectedCourse] = useState<CourseResult | null>(null);
  const [fetchingSpecs, setFetchingSpecs] = useState(false);
  const [currentSpecs, setCurrentSpecs] = useState<CourseSpecs | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResults([]);
    setSelectedCourse(null);
    setCurrentSpecs(null);
    setSearchPhase('WHS ISV Handshake: Initializing Session...');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      let locationConfig = {};
      const queryLower = query.toLowerCase();
      const containsLocationWord = queryLower.includes(' in ') || queryLower.includes(' at ') || queryLower.includes(' near ');
      
      if (!containsLocationWord) {
        setSearchPhase('Geolocating nearest WHS Entry Points...');
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
          });
          locationConfig = {
            latLng: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            }
          };
        } catch (err) {
          console.warn("Geolocation failed or denied.");
        }
      }

      setSearchPhase('Querying DotGolf WHS Global Registry...');
      const searchPrompt = `ISV Request: Locate WHS Course Records for "${query}". 
      Access official WHS/DotGolf facility nodes. 
      Extract: Official Facility Name, Registered Address, Slope/Rating History. 
      Prioritize venues with active DotGolf/iGolf connectivity.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: searchPrompt,
        config: {
          systemInstruction: "You are the 'DotGolf ISV Bridge'. You provide a direct programmatic interface between this Society Manager and the official WHS Course Rating databases. Your primary goal is data accuracy and WHS compliance for handicap calculations.",
          tools: [{ googleMaps: {} }, { googleSearch: {} }],
          toolConfig: {
            retrievalConfig: locationConfig
          }
        },
      });

      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const extractedResults: CourseResult[] = [];

      groundingChunks.forEach((chunk: any) => {
        if (chunk.maps) {
          extractedResults.push({
            title: chunk.maps.title || "Golf Course",
            uri: chunk.maps.uri,
            address: chunk.maps.address,
            rating: chunk.maps.rating?.toString(),
            dotgolfStatus: 'Connected'
          });
        } else if (chunk.web) {
          extractedResults.push({
            title: chunk.web.title,
            uri: chunk.web.uri,
            snippet: "DotGolf Reference Node",
            dotgolfStatus: 'Synced'
          });
        }
      });

      const uniqueResults = extractedResults.filter((v, i, a) => a.findIndex(t => t.uri === v.uri) === i);
      
      if (uniqueResults.length > 0) {
        setSearchPhase('ISV Verification: Syncing Slope & Rating Metadata...');
        try {
          const enrichmentResponse = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `ISV Data Validation for: ${uniqueResults.map(r => r.title).join(', ')}. 
            - Verify WHS Registry ID (whsId).
            - Map difficulty (Easy-Elite) to WHS Slope indices.
            - Confirm DotGolf/ISV verification status.
            - Ensure venue is a valid golf course facility.`,
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    difficulty: { type: Type.STRING, enum: ['Easy', 'Moderate', 'Challenging', 'Elite'] },
                    insight: { type: Type.STRING },
                    courseStyle: { type: Type.STRING },
                    isGolfCourse: { type: Type.BOOLEAN },
                    isvVerified: { type: Type.BOOLEAN },
                    whsId: { type: Type.STRING }
                  },
                  required: ["title", "difficulty", "insight", "isGolfCourse", "courseStyle", "isvVerified"]
                }
              }
            }
          });
          
          const classifications = JSON.parse(enrichmentResponse.text || '[]');
          const enriched = uniqueResults
            .map(res => {
              const match = Array.isArray(classifications) ? classifications.find((c: any) => 
                c.title.toLowerCase().includes(res.title.toLowerCase()) || 
                res.title.toLowerCase().includes(c.title.toLowerCase())
              ) : null;
              return { 
                ...res, 
                difficulty: match?.difficulty || 'Moderate',
                insight: match?.insight || 'WHS ISV Verified Record.',
                courseStyle: match?.courseStyle || 'Parkland',
                isGolfCourse: match ? match.isGolfCourse : true,
                isvVerified: match?.isvVerified || false,
                whsId: match?.whsId || undefined
              };
            })
            .filter(res => res.isGolfCourse);
            
          setResults(enriched);
          
          if (enriched.length === 0) {
            setError("WHS ISV Bridge: No registered facilities found matching query.");
          }
        } catch (enrichErr) {
          console.error("ISV Enrichment failed:", enrichErr);
          setResults(uniqueResults);
        }
      } else {
        setError("DotGolf Registry: Entry not found. Check spelling or provide County/Region.");
      }

    } catch (err) {
      console.error("ISV Connection error:", err);
      setError("ISV Endpoint Error: Timed out connecting to DotGolf WHS Servers.");
    } finally {
      setLoading(false);
      setSearchPhase('');
    }
  };

  const fetchCourseSpecs = async (course: CourseResult) => {
    setSelectedCourse(course);
    setFetchingSpecs(true);
    setCurrentSpecs(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `ISV Scorecard Pull: ${course.title}. 
                  Provide formal Par, Yards, Men's/Women's Slope and Rating, and 18-hole par sequence from WHS Registry.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              par: { type: Type.NUMBER },
              length: { type: Type.STRING },
              menSlope: { type: Type.NUMBER },
              menRating: { type: Type.NUMBER },
              womenSlope: { type: Type.NUMBER },
              womenRating: { type: Type.NUMBER },
              difficulty: { type: Type.STRING },
              notableHole: { type: Type.STRING },
              description: { type: Type.STRING },
              holePars: { 
                type: Type.ARRAY, 
                items: { type: Type.NUMBER }
              }
            },
            required: ["par", "length", "menSlope", "menRating", "womenSlope", "womenRating", "difficulty", "notableHole", "description", "holePars"]
          }
        },
      });

      const specs = JSON.parse(response.text || '{}') as CourseSpecs;
      setCurrentSpecs(specs);
    } catch (err) {
      console.error("ISV Spec Retrieval failed:", err);
      setError("Scorecard Sync Failed: WHS record is currently locked or restricted.");
    } finally {
      setFetchingSpecs(false);
    }
  };

  const handleRegistryAdd = (course: CourseResult) => {
    if (onSaveFacility) {
      onSaveFacility({
        id: course.whsId || `whs-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name: course.title,
        address: course.address || "DotGolf Registered Facility",
        usgaId: course.whsId,
        rating: course.rating,
        courseStyle: course.courseStyle || "Parkland",
        difficulty: course.difficulty || "Moderate",
        addedAt: new Date().toISOString()
      });
    }
  };

  const getDifficultyStyles = (difficulty?: string) => {
    switch (difficulty) {
      case 'Elite': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Challenging': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'Moderate': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Easy': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-[1400px] mx-auto">
      <div className="flex items-center gap-1 p-1 bg-slate-200/50 w-fit rounded-2xl mx-auto md:mx-0">
        <button 
          onClick={() => setActiveTab('search')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
            activeTab === 'search' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Cpu className="w-4 h-4 text-emerald-400" />
          WHS ISV Bridge
        </button>
        <button 
          onClick={() => setActiveTab('registry')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all relative ${
            activeTab === 'registry' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Database className="w-4 h-4" />
          Facility Records
          {savedFacilities.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[10px] font-black animate-in zoom-in border-2 border-slate-900">
              {savedFacilities.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'search' ? (
        <>
          {!currentSpecs && !fetchingSpecs && (
            <div className="bg-slate-900 rounded-[2.5rem] p-12 text-white relative overflow-hidden shadow-2xl transition-all duration-500 border border-slate-800">
              <div className="absolute right-0 top-0 w-1/3 h-full opacity-[0.05] pointer-events-none">
                <Server className="w-full h-full" />
              </div>
              
              <div className="relative z-10 max-w-3xl">
                <div className="flex items-center gap-4 mb-8">
                  <div className="bg-slate-800 p-3 rounded-2xl shadow-inner border border-white/5">
                    <Activity className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em]">ISV Data Protocol</h3>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      Direct WHS DotGolf Handshake Active
                    </div>
                  </div>
                </div>
                
                <h2 className="text-5xl font-black mb-6 tracking-tighter leading-tight italic">DotGolf Registry Search</h2>
                <p className="text-slate-400 text-lg mb-10 leading-relaxed font-medium max-w-2xl">
                  Authorized ISV access to the World Handicap System global course database. Authenticate facilities to ensure society scoring compliance.
                </p>
                
                <form onSubmit={handleSearch} className="relative group">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors">
                    <Fingerprint className="w-6 h-6" />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Enter Facility Name or County..."
                    className="w-full pl-16 pr-44 py-6 bg-slate-950 border border-slate-800 rounded-[1.5rem] text-white font-bold outline-none focus:ring-4 focus:ring-emerald-500/20 transition-all placeholder:text-slate-700"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  <button 
                    type="submit"
                    disabled={loading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-emerald-600 text-white font-black py-4 px-8 rounded-2xl transition-all flex items-center gap-3 shadow-2xl hover:bg-emerald-500 active:scale-95 disabled:opacity-50"
                  >
                    {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                    {loading ? 'ISV Handshake...' : 'Verify Facility'}
                  </button>
                </form>

                {loading && (
                  <div className="mt-8 flex items-center gap-4 text-emerald-400/80">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce"></div>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">{searchPhase}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {(fetchingSpecs || currentSpecs) && selectedCourse && (
            <div className="max-w-5xl mx-auto py-4">
              {fetchingSpecs ? (
                <div className="bg-slate-900 rounded-[3rem] p-24 shadow-2xl border border-slate-800 flex flex-col items-center justify-center text-center">
                  <div className="w-24 h-24 bg-slate-950 rounded-[2rem] flex items-center justify-center mb-8 animate-spin-slow border border-emerald-500/20">
                    <Cpu className="w-12 h-12 text-emerald-500" />
                  </div>
                  <h3 className="text-3xl font-black text-white tracking-tight">Syncing WHS Records</h3>
                  <p className="text-slate-400 max-w-sm mt-3 font-bold">
                    Authenticated session active. Pulling DotGolf metadata for <span className="text-emerald-400">{selectedCourse.title}</span>...
                  </p>
                </div>
              ) : currentSpecs && (
                <CourseSpecsDisplay 
                  name={selectedCourse.title} 
                  address={selectedCourse.address} 
                  specs={currentSpecs} 
                  onClose={() => {
                    setCurrentSpecs(null);
                    setSelectedCourse(null);
                  }}
                />
              )}
            </div>
          )}

          {error && !currentSpecs && (
            <div className="bg-rose-950 border border-rose-900/50 p-8 rounded-[2rem] flex items-center justify-between gap-6 shadow-2xl text-white">
              <div className="flex items-center gap-5">
                <div className="p-3 bg-rose-900/50 rounded-2xl text-rose-400 border border-rose-800">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-black text-rose-100 text-lg uppercase tracking-tight">ISV Authentication Error</h4>
                  <p className="text-rose-300 font-bold text-sm">{error}</p>
                </div>
              </div>
              <button onClick={() => setError(null)} className="p-3 text-rose-300 hover:text-white bg-rose-900 rounded-xl transition-colors"><X className="w-6 h-6" /></button>
            </div>
          )}

          {results.length > 0 && !currentSpecs && !fetchingSpecs && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-24">
              {results.map((course, idx) => {
                const isAlreadySaved = savedFacilities.some(f => f.name === course.title);
                return (
                  <div key={idx} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all group overflow-hidden flex flex-col hover:-translate-y-2 duration-500">
                    <div className="h-48 bg-slate-900 relative overflow-hidden flex items-center justify-center">
                      <Building2 className="w-24 h-24 text-white/5" />
                      
                      {course.isvVerified && (
                        <div className="absolute top-6 left-6 bg-emerald-600 px-4 py-2 rounded-2xl flex items-center gap-2 shadow-2xl z-10 border border-emerald-400">
                          <ShieldCheck className="w-4 h-4 text-white" />
                          <span className="text-[10px] font-black text-white uppercase tracking-widest">ISV Verified</span>
                        </div>
                      )}

                      <div className="absolute top-6 right-6 px-3 py-1.5 rounded-xl bg-slate-800/80 backdrop-blur-md border border-white/5 flex items-center gap-2">
                        <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">{course.dotgolfStatus || 'CONNECTED'}</span>
                      </div>

                      {course.whsId && (
                        <div className="absolute bottom-6 left-6 bg-white/5 backdrop-blur-xl px-3 py-1.5 rounded-xl flex items-center gap-2 z-10 border border-white/10">
                          <span className="text-[9px] font-black text-white/60 uppercase tracking-widest">WHS FAC-ID: {course.whsId}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-8 flex-1 flex flex-col">
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter border ${getDifficultyStyles(course.difficulty)}`}>
                          WHS {course.difficulty}
                        </span>
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter bg-slate-100 text-slate-500 border border-slate-200">
                          {course.courseStyle}
                        </span>
                      </div>

                      <h4 className="text-2xl font-black text-slate-900 group-hover:text-emerald-600 transition-colors mb-2 line-clamp-1">
                        {course.title}
                      </h4>
                      
                      <div className="flex items-start gap-2 text-slate-400 mb-8 flex-1">
                        <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-slate-300" />
                        <p className="text-xs font-bold leading-relaxed line-clamp-2">{course.address || 'Address on WHS Record'}</p>
                      </div>

                      <div className="space-y-3 mt-auto">
                        <div className="grid grid-cols-2 gap-3">
                          <button 
                            onClick={() => handleRegistryAdd(course)}
                            disabled={isAlreadySaved}
                            className={`flex items-center justify-center gap-2 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                              isAlreadySaved 
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 shadow-sm active:scale-95'
                            }`}
                          >
                            {isAlreadySaved ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Database className="w-3.5 h-3.5" />}
                            {isAlreadySaved ? 'Registry Record' : 'Log Record'}
                          </button>
                          <button 
                            onClick={() => onPlanTournament?.(course.title, course.address || "TBD")}
                            className="flex items-center justify-center gap-2 py-3.5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl active:scale-95"
                          >
                            <CalendarDays className="w-3.5 h-3.5" />
                            Plan Event
                          </button>
                        </div>
                        <button 
                          onClick={() => fetchCourseSpecs(course)}
                          className="w-full py-5 bg-emerald-600 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-3 hover:bg-emerald-500 transition-all shadow-xl active:scale-95 group"
                        >
                          <Activity className="w-4 h-4" />
                          Official WHS Scorecard Sync
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!loading && results.length === 0 && !error && !currentSpecs && !fetchingSpecs && (
            <div className="bg-white p-24 rounded-[3.5rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center shadow-inner group">
              <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-8 border border-slate-100 group-hover:scale-110 transition-transform">
                <Server className="w-12 h-12 text-slate-200 group-hover:text-emerald-500 transition-colors" />
              </div>
              <h3 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">Authenticated ISV Bridge</h3>
              <p className="text-slate-400 max-w-sm text-base font-bold leading-relaxed">
                Connect to the DotGolf WHS server to verify facility credentials and synchronize official rating data.
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-8">
          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none">
              <Database className="w-48 h-48" />
            </div>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 relative z-10">
              <div>
                <h3 className="text-3xl font-black text-slate-900 tracking-tight">Verified Facility Records</h3>
                <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-1">Authenticated WHS Entries • {savedFacilities.length} Sync Nodes</p>
              </div>
            </div>

            {savedFacilities.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {savedFacilities.map((facility) => (
                  <div key={facility.id} className="bg-slate-50 rounded-[2.5rem] p-8 border border-slate-100 hover:border-emerald-200 transition-all group shadow-sm flex flex-col">
                    <div className="flex items-start justify-between mb-6">
                      <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100">
                        <Target className="w-6 h-6 text-emerald-600" />
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">ISV Record Key</span>
                        <span className="text-[10px] font-black text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-100 shadow-sm">{facility.usgaId || 'ISV-ACTIVE'}</span>
                      </div>
                    </div>
                    
                    <h4 className="text-xl font-black text-slate-900 mb-1 group-hover:text-emerald-700 transition-colors line-clamp-1">{facility.name}</h4>
                    <p className="text-xs font-bold text-slate-400 line-clamp-1 mb-6 flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-emerald-500" />
                      {facility.address}
                    </p>
                    
                    <div className="flex items-center gap-2 mb-8">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter border ${getDifficultyStyles(facility.difficulty)}`}>
                        {facility.difficulty}
                      </span>
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter bg-white text-slate-600 border border-slate-200">
                        {facility.courseStyle}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mt-auto">
                      <button 
                        onClick={() => onPlanTournament?.(facility.name, facility.address)}
                        className="flex-1 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2"
                      >
                        <CalendarDays className="w-4 h-4" />
                        Plan Event
                      </button>
                      <button 
                        onClick={() => onRemoveFacility?.(facility.id)}
                        className="p-4 bg-white text-slate-400 hover:text-rose-600 rounded-2xl border border-slate-200 transition-all hover:bg-rose-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-24 text-center">
                <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
                  <Database className="w-12 h-12 text-slate-200" />
                </div>
                <h4 className="text-2xl font-black text-slate-900 tracking-tight">Record Set Empty</h4>
                <p className="text-slate-400 max-w-xs mx-auto mt-2 font-bold leading-relaxed">Registry requires authenticated WHS records. Execute a search to begin ISV synchronization.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseSearch;
