
import React, { useState } from 'react';
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
  CalendarDays
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
  usgaId?: string;
}

interface CourseSearchProps {
  onSaveFacility?: (facility: Facility) => void;
  onPlanTournament?: (name: string, location: string) => void;
  savedFacilities?: Facility[];
}

const CourseSearch: React.FC<CourseSearchProps> = ({ onSaveFacility, onPlanTournament, savedFacilities = [] }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<CourseResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'search' | 'registry'>('search');
  
  // Selected Course for Specs
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

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      let locationConfig = {};
      const queryLower = query.toLowerCase();
      const containsLocationWord = queryLower.includes(' in ') || queryLower.includes(' at ') || queryLower.includes(' near ');
      
      if (!containsLocationWord) {
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
          console.warn("Geolocation failed or denied, proceeding with global search.");
        }
      }

      const searchPrompt = `Technical Lookup Request: "${query}". 
      Search for golf courses using the USGA Course Rating Database and WHS (World Handicap System) data. 
      Identify legitimate 9 or 18 hole venues.
      Exclude retailers, ranges without courses, and indoor facilities.
      If a USGA Course ID is available, note it.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: searchPrompt,
        config: {
          systemInstruction: "You are a 'Technical Golf Scout' with specialized access to USGA and WHS (World Handicap System) course rating information. Your priority is providing accurate Slope, Rating, and Par data. You filter results to ensure only actual playable golf courses are returned. You use Google Search and Maps to cross-verify database entries with real-world locations.",
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
            snippet: "USGA/WHS Data Source"
          });
        }
      });

      const uniqueResults = extractedResults.filter((v, i, a) => a.findIndex(t => t.uri === v.uri) === i);
      
      if (uniqueResults.length > 0) {
        try {
          const enrichmentResponse = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Analyze these venues against USGA/WHS standards: ${uniqueResults.map(r => r.title).join(', ')}. 
            For each, verify if it appears in official Course Rating databases. 
            Identify USGA ID if possible, difficulty category, and course style.
            Strictly exclude non-golf venues.`,
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
                    usgaVerified: { type: Type.BOOLEAN },
                    usgaId: { type: Type.STRING }
                  },
                  required: ["title", "difficulty", "insight", "isGolfCourse", "courseStyle", "usgaVerified"]
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
                insight: match?.insight || 'Official Course Rating data found for this venue.',
                courseStyle: match?.courseStyle || 'Parkland',
                isGolfCourse: match ? match.isGolfCourse : true,
                usgaVerified: match?.usgaVerified || false,
                usgaId: match?.usgaId || undefined
              };
            })
            .filter(res => res.isGolfCourse);
            
          setResults(enriched);
          
          if (enriched.length === 0) {
            setError("No official USGA/WHS listed courses found for this query.");
          }
        } catch (enrichErr) {
          console.error("Enrichment failed:", enrichErr);
          setResults(uniqueResults);
        }
      } else {
        setError("Database lookup returned no results. Try a more specific course name or state.");
      }

    } catch (err) {
      console.error("Search error:", err);
      setError("Failed to access course database. Please try a different query.");
    } finally {
      setLoading(false);
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
        contents: `Retrieve the USGA Official Scorecard and Course Rating details for ${course.title}. 
                  Provide the data for the Primary Men's and Women's Tees as listed in the USGA Course Rating Database.
                  Include the hole-by-hole par sequence.`,
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
      setError("Could not retrieve USGA verified specs for this venue.");
    } finally {
      setFetchingSpecs(false);
    }
  };

  const handleRegistryAdd = (course: CourseResult) => {
    if (onSaveFacility) {
      onSaveFacility({
        id: course.usgaId || Math.random().toString(36).substr(2, 9),
        name: course.title,
        address: course.address || "Unknown Location",
        usgaId: course.usgaId,
        rating: course.rating,
        courseStyle: course.courseStyle || "Parkland",
        difficulty: course.difficulty || "Moderate",
        addedAt: new Date().toISOString()
      });
      // Small feedback would be good, but for now we just rely on parent
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-200/50 w-fit rounded-2xl">
        <button 
          onClick={() => setActiveTab('search')}
          className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
            activeTab === 'search' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Rating Scout
        </button>
        <button 
          onClick={() => setActiveTab('registry')}
          className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all relative ${
            activeTab === 'registry' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Facility Registry
          {savedFacilities.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-600 text-white rounded-full flex items-center justify-center text-[10px] font-black animate-in zoom-in">
              {savedFacilities.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'search' ? (
        <>
          {!currentSpecs && !fetchingSpecs && (
            <div className="bg-slate-900 rounded-[2.5rem] p-12 text-white relative overflow-hidden shadow-2xl transition-all duration-500 border border-slate-800">
              <div className="absolute right-0 top-0 w-1/3 h-full opacity-10 pointer-events-none">
                <Database className="w-full h-full -rotate-12 translate-x-1/4 translate-y-1/4" />
              </div>
              
              <div className="relative z-10 max-w-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-emerald-500 p-2 rounded-xl">
                    <Database className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-[0.3em] text-emerald-400">Official USGA/WHS Integration</span>
                </div>
                <h2 className="text-4xl font-black mb-4 text-white">Course Rating Lookup</h2>
                <p className="text-slate-400 text-lg mb-8 leading-relaxed font-medium">
                  Directly search the USGA Course Rating Database to retrieve technical specifications, slope, and rating for any verified venue.
                </p>
                
                <form onSubmit={handleSearch} className="relative group">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                    <SearchCheck className="w-6 h-6" />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Search by Course Name, City, or USGA ID..."
                    className="w-full pl-16 pr-32 py-5 bg-white rounded-2xl text-slate-800 font-medium shadow-xl outline-none ring-4 ring-white/5 focus:ring-emerald-500/30 transition-all placeholder:text-slate-300"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  <button 
                    type="submit"
                    disabled={loading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-slate-900 border border-slate-700 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-xl transition-all flex items-center gap-2 shadow-lg"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Database className="w-5 h-5" />}
                    {loading ? 'Searching DB...' : 'Query DB'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {(fetchingSpecs || currentSpecs) && selectedCourse && (
            <div className="max-w-4xl mx-auto py-10">
              {fetchingSpecs ? (
                <div className="bg-white rounded-3xl p-20 shadow-xl border border-slate-100 flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center mb-6 animate-pulse border border-slate-800">
                    <Database className="w-10 h-10 text-emerald-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800">Synchronizing Database</h3>
                  <p className="text-slate-500 max-w-sm mt-2 font-medium">
                    Fetching certified USGA Rating and Slope data for <span className="text-emerald-600 font-bold">{selectedCourse.title}</span>...
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
            <div className="bg-rose-50 border border-rose-100 p-6 rounded-3xl flex items-center justify-between gap-4 animate-in slide-in-from-top-4">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-rose-100 rounded-xl text-rose-600">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <p className="text-rose-800 font-bold text-sm">{error}</p>
              </div>
              <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-600"><X className="w-5 h-5" /></button>
            </div>
          )}

          {results.length > 0 && !currentSpecs && !fetchingSpecs && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20">
              {results.map((course, idx) => {
                const isAlreadySaved = savedFacilities.some(f => f.name === course.title);
                return (
                  <div key={idx} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all group overflow-hidden flex flex-col">
                    <div className="h-44 bg-slate-900 relative overflow-hidden flex items-center justify-center">
                      <Database className="w-20 h-20 text-white/5 group-hover:scale-125 transition-transform duration-700" />
                      
                      {course.usgaVerified && (
                        <div className="absolute top-5 left-5 bg-emerald-500 px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-xl z-10">
                          <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                          <span className="text-[10px] font-black text-white uppercase tracking-widest">USGA/WHS Verified</span>
                        </div>
                      )}

                      {course.usgaId && (
                        <div className="absolute bottom-5 left-5 bg-black/40 backdrop-blur px-2.5 py-1 rounded-lg flex items-center gap-1.5 z-10 border border-white/10">
                          <span className="text-[9px] font-black text-white/60 uppercase tracking-tighter">ID: {course.usgaId}</span>
                        </div>
                      )}
                      
                      {course.rating && (
                        <div className="absolute top-5 right-5 bg-white/10 backdrop-blur px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 border border-white/10 z-10">
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          <span className="text-xs font-black text-white">{course.rating}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-7 flex-1 flex flex-col">
                      <h4 className="text-xl font-black text-slate-800 line-clamp-1 group-hover:text-emerald-600 transition-colors mb-2">
                        {course.title}
                      </h4>
                      
                      <div className="flex items-center gap-2 mb-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter border ${getDifficultyStyles(course.difficulty)}`}>
                          {course.difficulty}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter bg-slate-100 text-slate-600 border border-slate-200">
                          {course.courseStyle}
                        </span>
                      </div>

                      {course.address && (
                        <div className="flex items-start gap-2 text-slate-500 mb-6 min-h-[40px]">
                          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-500" />
                          <p className="text-xs font-bold leading-relaxed line-clamp-2">{course.address}</p>
                        </div>
                      )}

                      <div className="mt-auto flex flex-col gap-3">
                        <div className="grid grid-cols-2 gap-2">
                          <button 
                            onClick={() => handleRegistryAdd(course)}
                            disabled={isAlreadySaved}
                            className={`flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${
                              isAlreadySaved 
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            {isAlreadySaved ? <CheckCircle2 className="w-3 h-3" /> : <PlusCircle className="w-3 h-3" />}
                            {isAlreadySaved ? 'Saved' : 'Add Facility'}
                          </button>
                          <button 
                            onClick={() => onPlanTournament?.(course.title, course.address || "TBD")}
                            className="flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
                          >
                            <CalendarDays className="w-3 h-3" />
                            Plan Event
                          </button>
                        </div>
                        <button 
                          onClick={() => fetchCourseSpecs(course)}
                          className="w-full py-4 bg-slate-900 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all shadow-lg active:scale-95"
                        >
                          <Award className="w-3.5 h-3.5" />
                          Technical Scorecard
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!loading && results.length === 0 && !error && !currentSpecs && !fetchingSpecs && (
            <div className="bg-white p-24 rounded-[3rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center shadow-inner">
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-8 border border-slate-100">
                <SearchCheck className="w-12 h-12 text-slate-300" />
              </div>
              <h3 className="text-3xl font-black text-slate-800 mb-3">Certified Lookup</h3>
              <p className="text-slate-400 max-w-sm text-base font-bold">
                Enter a course name or location to retrieve official USGA Course Rating and WHS data for tournament management.
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-black text-slate-800">Society Facility Registry</h3>
                <p className="text-sm text-slate-500 font-medium">Official tournament venues verified for handicap calculation</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl text-slate-400">
                <Building2 className="w-6 h-6" />
              </div>
            </div>

            {savedFacilities.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedFacilities.map((facility) => (
                  <div key={facility.id} className="bg-slate-50/50 rounded-3xl p-6 border border-slate-100 hover:border-emerald-200 transition-all group">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-2.5 bg-white rounded-xl shadow-sm border border-slate-100">
                        <MapPin className="w-5 h-5 text-emerald-500" />
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">USGA ID</span>
                        <span className="text-[10px] font-black text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-100">{facility.usgaId || 'N/A'}</span>
                      </div>
                    </div>
                    
                    <h4 className="text-lg font-black text-slate-800 mb-1 group-hover:text-emerald-700 transition-colors line-clamp-1">{facility.name}</h4>
                    <p className="text-xs font-medium text-slate-500 line-clamp-1 mb-4">{facility.address}</p>
                    
                    <div className="flex items-center gap-2 mb-6">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter border ${getDifficultyStyles(facility.difficulty)}`}>
                        {facility.difficulty}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter bg-white text-slate-600 border border-slate-200">
                        {facility.courseStyle}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => onPlanTournament?.(facility.name, facility.address)}
                        className="flex-1 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg active:scale-95"
                      >
                        Plan Event
                      </button>
                      <button className="p-3 bg-white text-slate-400 hover:text-rose-600 rounded-xl border border-slate-200 transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <BookMarked className="w-10 h-10 text-slate-200" />
                </div>
                <h4 className="text-xl font-bold text-slate-800">No Facilities Registered</h4>
                <p className="text-slate-400 max-w-xs mx-auto mt-2">Use the Rating Scout to find courses and add them to your society registry.</p>
                <button 
                  onClick={() => setActiveTab('search')}
                  className="mt-8 px-8 py-3 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all shadow-xl active:scale-95"
                >
                  Go to Scout
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseSearch;
