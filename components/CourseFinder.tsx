import React, { useState } from 'react';
import { Search, MapPin, Loader2, Navigation, CalendarPlus, PlusCircle } from 'lucide-react';
import { findCoursesNearby } from '../services/gemini';
import { Course } from '../types';

interface CourseFinderProps {
  courses: Course[];
  onAddCourse: (course: Course) => void;
  onCreateEvent: (course: Course) => void;
}

const CourseFinder: React.FC<CourseFinderProps> = ({ courses, onAddCourse, onCreateEvent }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<string>('');
  const [groundingChunks, setGroundingChunks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    setResults('');
    setGroundingChunks([]);

    try {
      const { text, groundingChunks } = await findCoursesNearby(query);
      setResults(text);
      setGroundingChunks(groundingChunks);
    } catch (err) {
      setError("Failed to fetch courses. Please check your connection or try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const createCourseObject = (name: string): Course => {
    // Generate default 18 holes structure since we don't get this from the AI summary easily
    const defaultHoles = Array(18).fill(null).map((_, i) => ({
      number: i + 1,
      par: 4, // Default to Par 4
      index: i + 1 // Default Stroke Index
    }));

    return {
      id: crypto.randomUUID(),
      name: name,
      par: 72, // Default
      holes: defaultHoles
    };
  };

  const handleAdd = (name: string) => {
    const course = createCourseObject(name);
    onAddCourse(course);
    alert(`${name} added to your course list!`);
  };

  const handleCreate = (name: string) => {
    const course = createCourseObject(name);
    onCreateEvent(course);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-3xl font-bold text-gray-900">AI Course Finder</h2>
        <p className="text-gray-500">Ask Gemini to find courses near you or anywhere in the world.</p>
      </div>

      <form onSubmit={handleSearch} className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. 'Challenging courses near Dublin' or 'Public courses in Florida'"
          className="w-full p-4 pl-12 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-emerald-500 outline-none text-lg"
        />
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={24} />
        <button 
          type="submit"
          disabled={isLoading}
          className="absolute right-2 top-2 bottom-2 bg-emerald-600 text-white px-6 rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="animate-spin" /> : 'Search'}
        </button>
      </form>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      {/* Results Display */}
      {(results || groundingChunks.length > 0) && (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 animate-fade-in">
          
          {/* Render Grounding Sources (Google Maps Cards) */}
          {groundingChunks.length > 0 && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
               {groundingChunks.map((chunk, idx) => {
                 const source = chunk.web || chunk.maps;
                 if (!source?.uri && !source?.title) return null;
                 
                 const exists = courses.some(c => c.name === source.title);

                 return (
                   <div key={idx} className="border p-4 rounded-lg hover:bg-gray-50 transition-colors flex flex-col justify-between">
                     <div>
                       <h4 className="font-bold text-emerald-800">{source.title}</h4>
                       <a href={source.uri} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline break-all mb-3 block">
                         View on {chunk.web ? 'Web' : 'Maps'}
                       </a>
                     </div>
                     
                     <div className="flex flex-wrap gap-2 mt-2">
                       <button 
                          onClick={() => handleAdd(source.title)}
                          disabled={exists}
                          className={`text-xs px-3 py-1.5 rounded flex items-center gap-1 font-medium ${exists ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}`}
                       >
                         <PlusCircle size={14} />
                         {exists ? 'In Database' : 'Add to DB'}
                       </button>
                       <button 
                          onClick={() => handleCreate(source.title)}
                          className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded flex items-center gap-1 hover:bg-blue-200 font-medium"
                       >
                         <CalendarPlus size={14} />
                         Create Event
                       </button>
                     </div>
                   </div>
                 )
               })}
             </div>
          )}

          {/* AI Text Response */}
          <div className="prose prose-emerald max-w-none">
             <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
               {/* Simple formatting for the raw text response */}
               {results.split('\n').map((line, i) => (
                 <p key={i} className={line.startsWith('*') || line.startsWith('-') ? 'ml-4' : ''}>
                    {line}
                 </p>
               ))}
             </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!results && !isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center opacity-60">
           <div className="p-4 bg-gray-50 rounded-lg">
             <MapPin className="mx-auto mb-2 text-emerald-600" />
             <p className="text-sm">Find local gems</p>
           </div>
           <div className="p-4 bg-gray-50 rounded-lg">
             <Navigation className="mx-auto mb-2 text-emerald-600" />
             <p className="text-sm">Get directions</p>
           </div>
           <div className="p-4 bg-gray-50 rounded-lg">
             <Search className="mx-auto mb-2 text-emerald-600" />
             <p className="text-sm">Discover ratings</p>
           </div>
        </div>
      )}
    </div>
  );
};

export default CourseFinder;