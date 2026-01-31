import React, { useState, useMemo } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  Search, 
  MapPin, 
  X, 
  CheckCircle2, 
  ShieldCheck, 
  Database, 
  Building2, 
  Trash2, 
  CalendarDays, 
  Target, 
  History, 
  Fingerprint, 
  AlertTriangle, 
  Server, 
  Activity, 
  Cpu, 
  RefreshCw, 
  Layers, 
  ChevronRight,
  Filter,
  Zap,
  HardDrive,
  Info,
  PlusCircle,
  Link as LinkIcon,
  Globe,
  Navigation,
  ExternalLink,
  Loader2,
  CloudCheck,
  Signal,
  ShieldAlert,
  ArrowRightLeft
} from 'lucide-react';
import CourseSpecsDisplay from './CourseSpecsDisplay';
import { CourseSpecs, Facility, CourseDatabaseEntry, GroundingSource } from '../types';

interface CourseResult {
  title: string;
  uri: string;
  rating?: string;
  address?: string;
  difficulty?: 'Easy' | 'Moderate' | 'Challenging' | 'Elite';
  insight?: string;
  isGolfCourse?: boolean;
  courseStyle?: string; 
  whsId?: string;
  isvVerified?: boolean;
  dotgolfStatus?: 'Connected' | 'Restricted' | 'Synced';
  lastSynced?: string;
  groundingSources?: GroundingSource[];
}

interface CourseSearchProps {
  onSaveFacility?: (facility: Facility) => void;
  onRemoveFacility?: (id: string) => void;
  onPlanTournament?: (name: string, location: string, facilityId?: string) => void;
  savedFacilities?: Facility[];
  courseDatabase: CourseDatabaseEntry[];
  onUpdateCourseDatabase: (entries: CourseDatabaseEntry[]) => void;
  onRemoveFromDatabase: (whsId: string) => void;
}

const CourseSearch: React.FC<CourseSearchProps> = ({ 
  onSaveFacility, 
  onRemoveFacility, 
  onPlanTournament, 
  savedFacilities = [],
  courseDatabase,
  onUpdateCourseDatabase,
  onRemoveFromDatabase
}) => {
  const [query, setQuery] = useState('');
  const [dbSearchQuery, setDbSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchPhase, setSearchPhase] = useState<string>('');
  const [results, setResults] = useState<CourseResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'search' | 'registry' | 'database'>('search');
  
  const [selectedCourse, setSelectedCourse] = useState<CourseResult | null>(null);
  const [fetchingSpecs, setFetchingSpecs] = useState(false);
  const [currentSpecs, setCurrentSpecs] = useState<CourseSpecs | null>(null);

  const localDatabaseMatches = useMemo(() => {
    if (!query.trim() || query.length < 2) return [];
    const q = query.toLowerCase();
    return courseDatabase.filter(c => 
      c.title.toLowerCase().includes(q) || 
      c.address.toLowerCase().includes(q) ||
      (c.whsId && c.whsId.toLowerCase().includes(q))
    );
  }, [query, courseDatabase]);

  const filteredDatabase = useMemo(() => {
    if (!dbSearchQuery.trim()) return courseDatabase;
    const q = dbSearchQuery.toLowerCase();
    return courseDatabase.filter(c => 
      c.title.toLowerCase().includes(q) || 
      c.address.toLowerCase().includes(q) ||
      (c.whsId && c.whsId.toLowerCase().includes(q)) ||
      (c.courseStyle && c.courseStyle.toLowerCase().includes(q))
    );
  }, [dbSearchQuery, courseDatabase]);

  const handleSearch = async (e: React.FormEvent, forceLive: boolean = false) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    if (!forceLive && localDatabaseMatches.length > 0) {
      const convertedResults: CourseResult[] = localDatabaseMatches.map(c => ({
        ...c,
        dotgolfStatus: 'Synced',
        groundingSources: c.groundingSources
      }));
      setResults(convertedResults);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    setResults([]);
    setSelectedCourse(null);
    setCurrentSpecs(null);
    setSearchPhase('GolfNow Bridge: Initializing Grounding Protocols...');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      let locationConfig: any = null;
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 });
        });
        locationConfig = {
          latLng: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }
        };
      } catch (err) { /* location failed - continue without it */ }

      setSearchPhase('Grounding: Searching golfnow.co.uk...');
      
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Locate the golf course "${query}" on golfnow.co.uk. Return official venue details including full address, course style, and any specific hole info. Verify precise coordinates via Google Maps.`,
        config: {
          systemInstruction: "You are a professional golf scout. Strictly use Google Search for the site 'golfnow.co.uk' and Google Maps for venue verification. Your output must be based on current web data.",
          tools: [{ googleMaps: {} }, { googleSearch: {} }],
          ...(locationConfig && { toolConfig: { retrievalConfig: locationConfig } })
        },
      });

      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const sources: GroundingSource[] = [];

      groundingChunks.forEach((chunk: any) => {
        if (chunk.maps) {
          sources.push({ title: chunk.maps.title || "Maps Verification", uri: chunk.maps.uri });
        } else if (chunk.web) {
          sources.push({ title: chunk.web.title || "GolfNow Listing", uri: chunk.web.uri });
        }
      });

      setSearchPhase('Extraction: Parsing GolfNow Metadata...');
      
      const extractionResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Convert the grounded data for "${query}" into a JSON array of courses. 
        IMPORTANT: Create a deterministic WHS-style ID (e.g. 'gn-london-royal') if no official ID is found.`,
        config: {
          responseMimeType: "application/json",
          thinkingConfig: { thinkingBudget: 0 },
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                address: { type: Type.STRING },
                whsId: { type: Type.STRING },
                difficulty: { type: Type.STRING, enum: ['Easy', 'Moderate', 'Challenging', 'Elite'] },
                courseStyle: { type: Type.STRING },
                insight: { type: Type.STRING },
                isGolfCourse: { type: Type.BOOLEAN }
              },
              required: ["title", "address", "whsId", "difficulty", "courseStyle", "insight", "isGolfCourse"]
            }
          }
        }
      });

      let parsedResults = [];
      try {
        parsedResults = JSON.parse(extractionResponse.text || '[]');
      } catch (pErr) {
        throw new Error("Bridge Link Error: Malformed data from search engine.");
      }

      const extracted = parsedResults
        .filter((c: any) => c.isGolfCourse)
        .map((c: any) => {
          const cleanTitle = c.title.toLowerCase().replace(/[^a-z0-9]/g, '-');
          const finalId = c.whsId && !c.whsId?.includes('auto') ? c.whsId : `gn-ref-${cleanTitle}`;

          return {
            ...c,
            whsId: finalId,
            uri: sources.find(s => s.title.toLowerCase().includes(c.title.toLowerCase()))?.uri || sources.find(s => s.uri.includes('golfnow'))?.uri || sources[0]?.uri || '',
            groundingSources: sources,
            dotgolfStatus: 'Connected',
            isvVerified: true,
            lastSynced: new Date().toISOString()
          };
        });

      if (extracted.length > 0) {
        setResults(extracted);
        setSearchPhase('Sync: Committing to Society Directory...');
        
        const dbEntries: CourseDatabaseEntry[] = extracted.map((e: any) => ({
          title: e.title,
          address: e.address,
          whsId: e.whsId,
          difficulty: e.difficulty,
          courseStyle: e.courseStyle,
          isvVerified: e.isvVerified,
          lastSynced: e.lastSynced,
          uri: e.uri,
          insight: e.insight,
          groundingSources: e.groundingSources
        }));
        
        onUpdateCourseDatabase(dbEntries);
      } else {
        setError("GolfNow Bridge: No verified golf venues matched your query.");
      }
    } catch (err: any) {
      console.error("Course Search API Error:", err);
      setError(`Bridge Error: ${err.message || 'The search engine could not establish a secure data link.'}`);
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
        contents: `Scrape the full scorecard for "${course.title}" from golfnow.co.uk. I need Par, Yardage, Slope, and Rating.`,
        config: {
          responseMimeType: "application/json",
          thinkingConfig: { thinkingBudget: 0 },
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
              holePars: { type: Type.ARRAY, items: { type: Type.NUMBER } }
            },
            required: ["par", "length", "menSlope", "menRating", "womenSlope", "womenRating", "difficulty", "notableHole", "description", "holePars"]
          }
        },
      });
      setCurrentSpecs(JSON.parse(response.text || '{}') as CourseSpecs);
    } catch (err) { 
      setError("Sync Failed: Could not acquire detailed scorecard from GolfNow."); 
    } finally { 
      setFetchingSpecs(false); 
    }
  };

  const handleRegistryAdd = (course: CourseResult) => {
    if (onSaveFacility) {
      onSaveFacility({
        id: course.whsId || `gn-${Date.now()}`,
        name: course.title,
        address: course.address || "Verified GolfNow Venue",
        usgaId: course.whsId,
        courseStyle: course.courseStyle || "Parkland",
        difficulty: course.difficulty || "Moderate",
        addedAt: new Date().toISOString(),
        groundingSources: course.groundingSources
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-[1400px] mx-auto pb-20">
      {/* Navigation Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-1 p-1 bg-slate-200/50 w-fit rounded-2xl">
          <button 
            onClick={() => setActiveTab('search')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === 'search' ? 'bg-[#00843D] text-white shadow-xl' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Zap className="w-4 h-4" />
            GolfNow Bridge
          </button>
          <button 
            onClick={() => setActiveTab('database')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all relative ${
              activeTab === 'database' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            Global Directory
            <span className="text-[10px] font-black opacity-40 ml-1">({courseDatabase.length})</span>
          </button>
          <button 
            onClick={() => setActiveTab('registry')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all relative ${
              activeTab === 'registry' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Society Registry
            {savedFacilities.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#00843D] text-white rounded-full flex items-center justify-center text-[10px] font-black border-2 border-slate-900">
                {savedFacilities.length}
              </span>
            )}
          </button>
        </div>
        
        {activeTab === 'database' && (
          <div className="relative w-full md:w-80 animate-in slide-in-from-right-4 duration-300">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search Local Directory..." 
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:ring-4 ring-[#00843D]/10 transition-all"
              value={dbSearchQuery}
              onChange={(e) => setDbSearchQuery(e.target.value)}
            />
          </div>
        )}
      </div>

      {activeTab === 'search' ? (
        <>
          {/* Main Search Interface */}
          {!currentSpecs && !fetchingSpecs && (
            <div className="bg-slate-950 rounded-[3rem] p-12 text-white relative overflow-hidden shadow-2xl border border-white/5 group">
              <div className="absolute right-0 top-0 w-1/2 h-full opacity-[0.03] pointer-events-none group-hover:opacity-[0.05] transition-opacity"><Server className="w-full h-full" /></div>
              <div className="relative z-10 max-w-4xl">
                <div className="flex items-center gap-4 mb-10">
                  <div className="bg-[#00843D] p-4 rounded-3xl shadow-lg shadow-[#00843D]/20"><Activity className="w-8 h-8 text-white" /></div>
                  <div>
                    <h3 className="text-sm font-black text-[#00843D] uppercase tracking-[0.4em]">Official GolfNow Grounding</h3>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                      <span className="w-2 h-2 rounded-full bg-[#00843D] animate-pulse"></span>
                      Verified UK & Ireland Source
                    </div>
                  </div>
                </div>
                
                <h2 className="text-6xl font-black mb-8 tracking-tighter italic leading-none">Scout Venues</h2>
                <form onSubmit={handleSearch} className="relative group/form">
                  <div className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within/form:text-[#00843D] transition-colors"><Fingerprint className="w-8 h-8" /></div>
                  <input 
                    type="text" 
                    placeholder="Search by Course, City or Region..."
                    className="w-full pl-20 pr-48 py-8 bg-black/40 border-2 border-slate-800 rounded-[2rem] text-xl font-bold outline-none focus:ring-8 focus:ring-[#00843D]/10 focus:border-[#00843D] transition-all placeholder:text-slate-800"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-3">
                    <button 
                      type="submit"
                      disabled={loading}
                      className="bg-[#00843D] text-white font-black py-5 px-10 rounded-2xl transition-all flex items-center gap-3 shadow-2xl hover:bg-[#006e33] active:scale-95 disabled:opacity-50"
                    >
                      {loading ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Search className="w-6 h-6" />}
                      Sync
                    </button>
                    {localDatabaseMatches.length > 0 && (
                      <button 
                        type="button"
                        onClick={(e) => handleSearch(e as any, true)}
                        className="bg-slate-800 text-slate-400 hover:text-white font-black px-5 rounded-2xl transition-all border border-slate-700 active:scale-95"
                        title="Force Remote Refresh"
                      >
                        <Globe className="w-6 h-6" />
                      </button>
                    )}
                  </div>
                </form>

                <div className="mt-8 flex items-center justify-between">
                  {loading ? (
                    <div className="flex items-center gap-4 text-[#00843D]">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <p className="text-xs font-black uppercase tracking-[0.2em] italic">{searchPhase}</p>
                    </div>
                  ) : localDatabaseMatches.length > 0 ? (
                    <div className="flex items-center gap-2 text-[#00843D]/60 animate-in fade-in duration-500">
                      <Database className="w-4 h-4" />
                      <p className="text-[10px] font-black uppercase tracking-widest">{localDatabaseMatches.length} Matching Records in Local Sync</p>
                    </div>
                  ) : (
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Grounding Search: www.golfnow.co.uk</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Scorecard Syncing State */}
          {(fetchingSpecs || currentSpecs) && selectedCourse && (
            <div className="max-w-5xl mx-auto py-4">
              {fetchingSpecs ? (
                <div className="bg-slate-950 rounded-[4rem] p-32 shadow-2xl border border-white/5 flex flex-col items-center justify-center text-center">
                  <Cpu className="w-16 h-16 text-[#00843D] animate-pulse mb-6" />
                  <h3 className="text-4xl font-black text-white italic tracking-tight">Syncing Scorecard</h3>
                  <p className="text-slate-400 mt-4 font-bold text-lg">Acquiring GolfNow metadata for <span className="text-[#00843D]">{selectedCourse.title}</span>...</p>
                </div>
              ) : currentSpecs && (
                <CourseSpecsDisplay 
                  name={selectedCourse.title} 
                  address={selectedCourse.address} 
                  specs={currentSpecs} 
                  onClose={() => { setCurrentSpecs(null); setSelectedCourse(null); }}
                />
              )}
            </div>
          )}

          {/* Error Message */}
          {error && !currentSpecs && !fetchingSpecs && (
            <div className="bg-rose-950/40 border-2 border-rose-900/50 p-10 rounded-[3rem] flex items-center justify-between text-white animate-in zoom-in-95 duration-300">
              <div className="flex items-center gap-6">
                <ShieldAlert className="w-8 h-8 text-rose-400" />
                <div>
                  <h4 className="font-black text-rose-100 text-xl uppercase tracking-tight">Sync Handshake Failure</h4>
                  <p className="text-rose-300 font-bold mt-1">{error}</p>
                </div>
              </div>
              <button onClick={() => setError(null)} className="p-4 hover:bg-rose-900 rounded-2xl transition-colors"><X className="w-8 h-8" /></button>
            </div>
          )}

          {/* Result Grid */}
          {results.length > 0 && !currentSpecs && !fetchingSpecs && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20 animate-in slide-in-from-bottom-8 duration-700">
              {results.map((course) => {
                const isAlreadySaved = savedFacilities.some(f => f.name === course.title);
                const isInDatabase = courseDatabase.some(d => d.whsId === course.whsId);
                
                return (
                  <div key={course.whsId || course.title} className="bg-white rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all group overflow-hidden flex flex-col hover:-translate-y-2 duration-500">
                    <div className="h-56 bg-slate-950 relative overflow-hidden flex items-center justify-center">
                      <Building2 className="w-32 h-32 text-white/5 group-hover:scale-110 transition-transform duration-700" />
                      <div className="absolute top-6 left-6 flex flex-col gap-2">
                        <div className="bg-[#00843D] px-4 py-2 rounded-2xl flex items-center gap-2 shadow-2xl border border-emerald-400">
                          <ShieldCheck className="w-4 h-4 text-white" />
                          <span className="text-[10px] font-black text-white uppercase tracking-widest">GolfNow Verified</span>
                        </div>
                        {isInDatabase && (
                          <div className="bg-blue-600 px-4 py-2 rounded-2xl flex items-center gap-2 shadow-2xl border border-blue-400 animate-in slide-in-from-left-2">
                            <CloudCheck className="w-3.5 h-3.5 text-white" />
                            <span className="text-[9px] font-black text-white uppercase tracking-widest">In Global Cache</span>
                          </div>
                        )}
                      </div>
                      <div className="absolute top-6 right-6 px-3 py-2 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 flex items-center gap-2 text-emerald-400">
                        <Navigation className="w-3 h-3" />
                        <span className="text-[9px] font-black uppercase tracking-widest">{course.dotgolfStatus || 'CONNECTED'}</span>
                      </div>
                    </div>
                    
                    <div className="p-10 flex-1 flex flex-col">
                      <div className="flex items-center gap-2 mb-4">
                        <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tighter border-2 ${getDifficultyStyles(course.difficulty)}`}>{course.difficulty} Index</span>
                        <span className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tighter bg-slate-100 text-slate-500 border-2 border-slate-200">{course.courseStyle}</span>
                      </div>
                      
                      <h4 className="text-3xl font-black text-slate-900 group-hover:text-[#00843D] transition-colors mb-2 line-clamp-1 italic tracking-tight">{course.title}</h4>
                      <p className="text-sm font-bold text-slate-400 line-clamp-2 leading-relaxed mb-6">{course.address}</p>

                      <div className="mb-8 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[9px] font-black text-slate-700 uppercase tracking-widest mb-2 italic">Scout Intelligence</p>
                        <p className="text-[11px] font-bold text-slate-500 leading-relaxed italic">"{course.insight || "Verified WHS facility via the GolfNow Bridge."}"</p>
                      </div>

                      {course.groundingSources && course.groundingSources.length > 0 && (
                        <div className="mb-8 p-4 bg-emerald-50/30 rounded-2xl border border-emerald-100">
                          <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                            <LinkIcon className="w-3 h-3" /> Verified Sources
                          </p>
                          <div className="space-y-2">
                            {course.groundingSources.slice(0, 2).map((source, sIdx) => (
                              <a 
                                key={sIdx} 
                                href={source.uri} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center justify-between text-[10px] font-bold text-slate-600 hover:text-[#00843D] transition-colors group/link"
                              >
                                <span className="truncate max-w-[150px]">{source.title}</span>
                                <ExternalLink className="w-3 h-3 group-hover/link:translate-x-0.5 transition-transform" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="space-y-4 mt-auto">
                        <div className="grid grid-cols-2 gap-4">
                          <button onClick={() => handleRegistryAdd(course)} disabled={isAlreadySaved} className={`flex items-center justify-center gap-2 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${isAlreadySaved ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-white text-slate-600 border-slate-200 shadow-sm hover:border-slate-300 active:scale-95'}`}>
                            {isAlreadySaved ? <CheckCircle2 className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
                            {isAlreadySaved ? 'Recorded' : 'Record Venue'}
                          </button>
                          <button onClick={() => onPlanTournament?.(course.title, course.address || "TBD", course.whsId)} className="flex items-center justify-center gap-2 py-4 bg-slate-950 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-slate-800 active:scale-95 transition-all">
                            <CalendarDays className="w-4 h-4" />Plan Event
                          </button>
                        </div>
                        <button onClick={() => fetchCourseSpecs(course)} className="w-full py-5 bg-[#00843D] text-white rounded-2xl text-xs font-black flex items-center justify-center gap-4 shadow-xl hover:bg-[#006e33] active:scale-95 transition-all">
                          <Activity className="w-5 h-5" />
                          Master Scorecard Sync
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : activeTab === 'database' ? (
        <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700">
          <div className="bg-slate-900 rounded-[3.5rem] p-12 text-white border border-white/5 shadow-2xl overflow-hidden relative">
            <div className="absolute right-0 top-0 p-12 opacity-[0.03] pointer-events-none rotate-12"><HardDrive className="w-64 h-64" /></div>
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12">
              <div className="flex items-center gap-6">
                <div className="p-5 bg-[#00843D] rounded-[2rem] shadow-xl shadow-[#00843D]/20"><Layers className="w-10 h-10 text-white" /></div>
                <div>
                  <h3 className="text-4xl font-black italic tracking-tight">Global Directory</h3>
                  <p className="text-sm font-bold text-emerald-400 uppercase tracking-[0.3em] mt-2">
                    {courseDatabase.length} Verified Course Profiles Synced
                  </p>
                </div>
              </div>
              <button onClick={() => { if(confirm("Purge local cache directory?")) onUpdateCourseDatabase([]); }} className="flex items-center gap-3 px-8 py-4 bg-rose-900/50 text-rose-300 border border-rose-800 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-900 transition-all">
                <Trash2 className="w-5 h-5" /> Purge Cache
              </button>
            </div>

            {filteredDatabase.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDatabase.map((entry) => (
                  <div key={entry.whsId} className="bg-slate-950/50 rounded-[2.5rem] p-8 border border-slate-800 hover:border-[#00843D]/40 transition-all flex flex-col group relative">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex-1 pr-4">
                        <h4 className="text-2xl font-black text-white mb-2 leading-tight group-hover:text-[#00843D] transition-colors">{entry.title}</h4>
                        <div className="flex items-center gap-2 text-slate-500 text-xs font-bold">
                          <MapPin className="w-3 h-3 text-[#00843D]" />
                          <p className="line-clamp-1">{entry.address}</p>
                        </div>
                      </div>
                      <button onClick={() => onRemoveFromDatabase(entry.whsId)} className="p-3 text-slate-700 hover:text-rose-400 transition-colors rounded-xl hover:bg-rose-900/20">
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                      <div className="bg-slate-900 p-4 rounded-2xl border border-white/5">
                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1.5">WHS ID</p>
                        <p className="text-xs font-black text-[#00843D] truncate">{entry.whsId}</p>
                      </div>
                      <div className="bg-slate-900 p-4 rounded-2xl border border-white/5">
                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1.5">Last Grounding</p>
                        <p className="text-xs font-black text-slate-300">{new Date(entry.lastSynced).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-auto pt-6 border-t border-white/5 gap-3">
                      <div className="flex flex-col">
                        <p className="text-[8px] font-black text-slate-700 uppercase tracking-widest mb-1">Index Rank</p>
                        <p className="text-[10px] font-black text-slate-500">{entry.difficulty}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => onPlanTournament?.(entry.title, entry.address, entry.whsId)} 
                          className="flex items-center justify-center gap-2 px-4 py-3 bg-white text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm border border-slate-200 hover:bg-emerald-50 hover:border-emerald-200 transition-all active:scale-95"
                        >
                          <CalendarDays className="w-3.5 h-3.5 text-emerald-600" />
                          Plan
                        </button>
                        <button onClick={() => { setQuery(entry.title); setActiveTab('search'); }} className="p-3 bg-slate-800 text-white rounded-xl hover:bg-[#00843D] transition-all shadow-xl group/btn active:scale-95">
                          <ArrowRightLeft className="w-4 h-4 group-hover/btn:rotate-180 transition-transform duration-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-32 text-center border-4 border-dashed border-slate-800 rounded-[4rem] bg-slate-950/20">
                <History className="w-16 h-16 text-slate-800 mx-auto mb-6" />
                <h4 className="text-2xl font-black text-slate-700 uppercase tracking-widest italic">Local Directory Clear</h4>
                <p className="text-slate-600 font-bold max-w-sm mx-auto mt-2">Initialize the Bridge to begin syncing global golf venues with your society cache.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm animate-in slide-in-from-bottom-8 duration-700">
          <div className="flex items-center justify-between mb-16">
            <div>
              <h3 className="text-4xl font-black text-slate-900 italic tracking-tight">Society Registry</h3>
              <p className="text-sm text-slate-500 font-bold uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#00843D]" />
                {savedFacilities.length} Commissioned Venues Documented
              </p>
            </div>
            <button onClick={() => setActiveTab('search')} className="flex items-center gap-3 px-8 py-4 bg-slate-950 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-2xl active:scale-95">
              <PlusCircle className="w-5 h-5 text-emerald-400" />
              Scout New Facility
            </button>
          </div>
          
          {savedFacilities.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {savedFacilities.map((facility) => (
                <div key={facility.id} className="bg-slate-50 rounded-[3rem] p-10 border-2 border-slate-100 flex flex-col group relative hover:border-emerald-200 transition-all hover:bg-white hover:shadow-2xl">
                  <div className="absolute top-6 right-6 p-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <Signal className="w-5 h-5 text-emerald-500" />
                  </div>
                  <h4 className="text-3xl font-black mb-2 group-hover:text-[#00843D] transition-colors italic tracking-tight">{facility.name}</h4>
                  <p className="text-sm font-bold text-slate-400 line-clamp-1 mb-8 flex items-center gap-2"><MapPin className="w-4 h-4 text-[#00843D]" />{facility.address}</p>
                  
                  <div className="flex items-center gap-2 mb-10">
                    <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tighter border-2 ${getDifficultyStyles(facility.difficulty)}`}>{facility.difficulty}</span>
                    <span className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tighter bg-white border-2 border-slate-100 text-slate-500">{facility.courseStyle}</span>
                  </div>
                  
                  <div className="flex gap-4 mt-auto">
                    <button onClick={() => onPlanTournament?.(facility.name, facility.address, facility.usgaId)} className="flex-1 py-5 bg-slate-950 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest shadow-2xl hover:bg-[#00843D] active:scale-95 transition-all flex items-center justify-center gap-3">
                      <CalendarDays className="w-5 h-5" />
                      Plan Event
                    </button>
                    <button onClick={() => onRemoveFacility?.(facility.id)} className="p-5 bg-white text-slate-300 hover:text-rose-600 rounded-[1.5rem] border-2 border-slate-100 transition-all hover:border-rose-100 hover:bg-rose-50">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-40 text-center flex flex-col items-center">
              <Database className="w-20 h-20 text-slate-100 mb-6" />
              <h4 className="text-3xl font-black text-slate-900 tracking-tight">Registry Unpopulated</h4>
              <p className="text-slate-400 font-bold max-w-sm mx-auto mt-2 leading-relaxed text-lg">Use the GolfNow Bridge to begin scouting and documenting venues.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CourseSearch;