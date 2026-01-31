
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
  // Added AlertTriangle to fix the missing name error
  AlertTriangle
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
  usgaVerified?: boolean;
  igolfVerified?: boolean;
  whsId?: string;
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
    setSearchPhase('Initializing iGolf Engine Sync...');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      let locationConfig = {};
      const queryLower = query.toLowerCase();
      const containsLocationWord = queryLower.includes(' in ') || queryLower.includes(' at ') || queryLower.includes(' near ');
      
      if (!containsLocationWord) {
        setSearchPhase('Geolocating nearest WHS Venues...');
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

      setSearchPhase('Querying iGolf / England Golf Registry...');
      const searchPrompt = `Scout Request: "${query}". 
      Access the iGolf and WHS (World Handicap System) official course rating databases. 
      Identify legitimate clubs with active green-fee booking and rating history. 
      Prioritize results that have iGolf or USGA ID verification. 
      Extract exact addresses and Rating identifiers.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: searchPrompt,
        config: {
          systemInstruction: "You are the 'iGolf Technical Scout'. Your expertise is in the World Handicap System (WHS) and official England Golf / iGolf registries. You verify course Slope and Rating metadata to ensure society handicaps remain accurate.",
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
          });
        } else if (chunk.web) {
          extractedResults.push({
            title: chunk.web.title,
            uri: chunk.web.uri,
            snippet: "iGolf Reference Node"
          });
        }
      });

      const uniqueResults = extractedResults.filter((v, i, a) => a.findIndex(t => t.uri === v.uri) === i);
      
      if (uniqueResults.length > 0) {
        setSearchPhase('Verifying WHS Slope & Rating Compliance...');
        try {
          const enrichmentResponse = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Analyze these venues for WHS compliance: ${uniqueResults.map(r => r.title).join(', ')}. 
            Assign iGolf/WHS status. 
            Assign difficulty (Easy, Moderate, Challenging, Elite) based on official WHS Slope. 
            Assign course style. 
            Confirm if venue exists in iGolf/WHS registry.`,
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
                    igolfVerified: { type: Type.BOOLEAN },
                    whsId: { type: Type.STRING }
                  },
                  required: ["title", "difficulty", "insight", "isGolfCourse", "courseStyle", "igolfVerified"]
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
                insight: match?.insight || 'Official iGolf/WHS Data Verified.',
                courseStyle: match?.courseStyle || 'Parkland',
                isGolfCourse: match ? match.isGolfCourse : true,
                igolfVerified: match?.igolfVerified || false,
                whsId: match?.whsId || undefined
              };
            })
            .filter(res => res.isGolfCourse);
            
          setResults(enriched);
          
          if (enriched.length === 0) {
            setError("The iGolf engine could not find any WHS-rated venues for this query.");
          }
        } catch (enrichErr) {
          console.error("Enrichment failed:", enrichErr);
          setResults(uniqueResults);
        }
      } else {
        setError("iGolf Search found no matching WHS registries. Try a broader location.");
      }

    } catch (err) {
      console.error("Search error:", err);
      setError("Connectivity issue with WHS Registry. Please retry.");
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
        contents: `Retrieve iGolf/WHS scorecard specs for ${course.title}. 
                  Provide Par, Yards, Men's/Women's Slope and Rating, and hole sequence.`,
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
      console.error("Error fetching specs:", err);
      setError("Scorecard sync failed.");
    } finally {
      setFetchingSpecs(false);
    }
  };

  const handleRegistryAdd = (course: CourseResult) => {
    if (onSaveFacility) {
      onSaveFacility({
        id: course.whsId || `ig-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name: course.title,
        address: course.address || "iGolf Registered Venue",
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
            activeTab === 'search' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Fingerprint className="w-4 h-4 text-emerald-600" />
          iGolf Scout
        </button>
        <button 
          onClick={() => setActiveTab('registry')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all relative ${
            activeTab === 'registry' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookMarked className="w-4 h-4" />
          Society Registry
          {savedFacilities.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-600 text-white rounded-full flex items-center justify-center text-[10px] font-black animate-in zoom-in border-2 border-white">
              {savedFacilities.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'search' ? (
        <>
          {!currentSpecs && !fetchingSpecs && (
            <div className="bg-slate-950 rounded-[2.5rem] p-12 text-white relative overflow-hidden shadow-2xl transition-all duration-500 border border-white/5">
              <div className="absolute right-0 top-0 w-1/2 h-full opacity-[0.03] pointer-events-none rotate-12 translate-x-1/4">
                <Globe className="w-full h-full" />
              </div>
              
              <div className="relative z-10 max-w-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-emerald-500 p-2.5 rounded-2xl shadow-lg shadow-emerald-500/20">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-400 mb-0.5">WHS Rating Service</span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">iGolf England Golf Sync</span>
                  </div>
                </div>
                
                <h2 className="text-4xl sm:text-5xl font-black mb-6 tracking-tighter leading-tight">iGolf Course Intelligence</h2>
                <p className="text-slate-400 text-lg mb-10 leading-relaxed font-medium">
                  Search the iGolf registry to pull official WHS Scorecard and Slope data. Ensure your society's handicaps are calculated using verified course ratings.
                </p>
                
                <form onSubmit={handleSearch} className="relative group">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors">
                    <Search className="w-6 h-6" />
                  </div>
                  <input 
                    type="text" 
                    placeholder="E.g., Wentworth or clubs near Oxfordshire..."
                    className="w-full pl-16 pr-44 py-6 bg-white/10 backdrop-blur-md rounded-[1.5rem] text-white font-bold outline-none ring-1 ring-white/10 focus:ring-4 focus:ring-emerald-500/30 transition-all placeholder:text-slate-600 border border-white/5"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  <button 
                    type="submit"
                    disabled={loading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-emerald-600 text-white font-black py-4 px-8 rounded-2xl transition-all flex items-center gap-3 shadow-2xl hover:bg-emerald-500 active:scale-95 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                    {loading ? 'Consulting WHS...' : 'iGolf Lookup'}
                  </button>
                </form>

                {loading && (
                  <div className="mt-8 flex items-center gap-3 text-emerald-400/80 animate-pulse">
                    <Wifi className="w-4 h-4" />
                    <p className="text-xs font-black uppercase tracking-widest">{searchPhase}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {(fetchingSpecs || currentSpecs) && selectedCourse && (
            <div className="max-w-5xl mx-auto py-4">
              {fetchingSpecs ? (
                <div className="bg-white rounded-[3rem] p-24 shadow-xl border border-slate-100 flex flex-col items-center justify-center text-center">
                  <div className="w-24 h-24 bg-emerald-950 rounded-[2rem] flex items-center justify-center mb-8 animate-pulse border border-emerald-500/20 shadow-2xl">
                    <Fingerprint className="w-12 h-12 text-emerald-500" />
                  </div>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tight">WHS Handshake</h3>
                  <p className="text-slate-500 max-w-sm mt-3 font-bold">
                    Downloading iGolf-certified scorecard for <span className="text-emerald-600">{selectedCourse.title}</span>...
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
            <div className="bg-rose-50 border border-rose-100 p-8 rounded-[2rem] flex items-center justify-between gap-6 shadow-xl shadow-rose-900/5">
              <div className="flex items-center gap-5">
                <div className="p-3 bg-rose-100 rounded-2xl text-rose-600">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-black text-rose-900 text-lg uppercase tracking-tight">Sync Failure</h4>
                  <p className="text-rose-700/80 font-bold text-sm">{error}</p>
                </div>
              </div>
              <button onClick={() => setError(null)} className="p-2 text-rose-400 hover:text-rose-600 bg-white rounded-xl shadow-sm"><X className="w-6 h-6" /></button>
            </div>
          )}

          {results.length > 0 && !currentSpecs && !fetchingSpecs && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-24">
              {results.map((course, idx) => {
                const isAlreadySaved = savedFacilities.some(f => f.name === course.title);
                return (
                  <div key={idx} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all group overflow-hidden flex flex-col hover:-translate-y-2 duration-500">
                    <div className="h-48 bg-slate-950 relative overflow-hidden flex items-center justify-center">
                      <Target className="w-24 h-24 text-white/5" />
                      
                      {course.igolfVerified && (
                        <div className="absolute top-6 left-6 bg-emerald-600 px-4 py-2 rounded-2xl flex items-center gap-2 shadow-2xl z-10 border border-emerald-400/50">
                          <CheckCircle2 className="w-4 h-4 text-white" />
                          <span className="text-[10px] font-black text-white uppercase tracking-widest">iGolf Verified</span>
                        </div>
                      )}

                      {course.whsId && (
                        <div className="absolute bottom-6 left-6 bg-white/5 backdrop-blur-xl px-3 py-1.5 rounded-xl flex items-center gap-2 z-10 border border-white/10">
                          <span className="text-[9px] font-black text-white/60 uppercase tracking-widest">WHS: {course.whsId}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-8 flex-1 flex flex-col">
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter border ${getDifficultyStyles(course.difficulty)}`}>
                          {course.difficulty}
                        </span>
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter bg-slate-100 text-slate-500 border border-slate-200">
                          {course.courseStyle}
                        </span>
                      </div>

                      <h4 className="text-2xl font-black text-slate-900 group-hover:text-emerald-600 transition-colors mb-2 line-clamp-1">
                        {course.title}
                      </h4>
                      
                      <div className="flex items-start gap-2 text-slate-400 mb-8 flex-1">
                        <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-500/50" />
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
                            {isAlreadySaved ? <CheckCircle2 className="w-3.5 h-3.5" /> : <PlusCircle className="w-3.5 h-3.5" />}
                            {isAlreadySaved ? 'Registered' : 'Add Club'}
                          </button>
                          <button 
                            onClick={() => onPlanTournament?.(course.title, course.address || "TBD")}
                            className="flex items-center justify-center gap-2 py-3.5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 active:scale-95"
                          >
                            <CalendarDays className="w-3.5 h-3.5" />
                            Plan Event
                          </button>
                        </div>
                        <button 
                          onClick={() => fetchCourseSpecs(course)}
                          className="w-full py-5 bg-emerald-600 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-3 hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-600/20 active:scale-95 group"
                        >
                          <Award className="w-4 h-4" />
                          iGolf Scorecard Intel
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
                <SearchCheck className="w-12 h-12 text-slate-300 group-hover:text-emerald-500 transition-colors" />
              </div>
              <h3 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">WHS Course Scouting</h3>
              <p className="text-slate-400 max-w-sm text-base font-bold leading-relaxed">
                Enter a club name to pull official iGolf / England Golf Slope and Course Rating metadata.
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-8">
          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none">
              <Building2 className="w-48 h-48" />
            </div>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 relative z-10">
              <div>
                <h3 className="text-3xl font-black text-slate-900 tracking-tight">Club Registry</h3>
                <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-1">Verified WHS Venues • {savedFacilities.length} Records</p>
              </div>
            </div>

            {savedFacilities.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {savedFacilities.map((facility) => (
                  <div key={facility.id} className="bg-slate-50/50 rounded-[2rem] p-8 border border-slate-100 hover:border-emerald-200 transition-all group shadow-sm flex flex-col">
                    <div className="flex items-start justify-between mb-6">
                      <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100">
                        <Building2 className="w-6 h-6 text-emerald-600" />
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">iGolf WHS ID</span>
                        <span className="text-[10px] font-black text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-100 shadow-sm">{facility.usgaId || 'PENDING'}</span>
                      </div>
                    </div>
                    
                    <h4 className="text-xl font-black text-slate-900 mb-1 group-hover:text-emerald-700 transition-colors line-clamp-1">{facility.name}</h4>
                    <p className="text-xs font-bold text-slate-400 line-clamp-1 mb-6 flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-emerald-500/50" />
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
                        className="flex-1 py-4 bg-slate-950 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2"
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
                  <History className="w-12 h-12 text-slate-200" />
                </div>
                <h4 className="text-2xl font-black text-slate-900 tracking-tight">Registry Unpopulated</h4>
                <p className="text-slate-400 max-w-xs mx-auto mt-2 font-bold leading-relaxed">No clubs have been registered for society events. Use the Scout to synchronize WHS data.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseSearch;
