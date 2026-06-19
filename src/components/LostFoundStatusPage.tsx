import React from 'react';
import { ArrowLeft, HelpCircle } from 'lucide-react';
import { UserProfile } from '../types';

interface LostFoundStatusPageProps {
  currentUser: UserProfile;
  lostFoundItems: any[];
  onNavigateHome: () => void;
}

export default function LostFoundStatusPage({
  currentUser,
  lostFoundItems,
  onNavigateHome,
}: LostFoundStatusPageProps) {

  return (
    <div className="min-h-screen bg-[#050505] text-stone-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto flex flex-col gap-8">

        {/* Navigation title breadcrumb */}
        <div className="flex items-center gap-4 border-b border-white/5 pb-6">
          <button
            onClick={onNavigateHome}
            className="p-2.5 bg-white/5 border border-white/10 rounded-xl hover:text-[#C5A059] cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-3xl font-serif font-bold text-stone-100 tracking-wide flex items-center gap-2">
              <HelpCircle className="w-6 h-6 text-[#C5A059]" />
              Lost & Found Status
            </h1>
            <p className="text-stone-400 text-xs mt-1">
              Track the progress of items you have reported as lost or found.
            </p>
          </div>
        </div>

        {/* List of Reports */}
        <div className="flex flex-col gap-6">
          {lostFoundItems.length === 0 ? (
            <div className="border border-[#C5A059]/20 border-dashed rounded-3xl py-20 text-center text-stone-500 bg-white/2">
              <HelpCircle className="w-10 h-10 mx-auto text-stone-700 mb-3 animate-pulse" />
              <h3 className="text-stone-300 font-semibold mb-1">No Reports Found</h3>
              <p className="text-stone-500 text-xs max-w-sm mx-auto leading-relaxed mb-4">
                You haven't reported any lost or found items yet.
              </p>
              <button
                onClick={onNavigateHome}
                className="px-6 py-2.5 bg-gradient-to-r from-[#C5A059] to-[#F1D299] text-[#050505] text-xs font-bold uppercase tracking-wider rounded-lg shadow-xl cursor-pointer hover:opacity-90 transition-all font-sans"
              >
                Return to Dashboard
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {lostFoundItems.map((item) => (
                <div key={item.id} className="bg-stone-900/40 border border-stone-800 rounded-2xl p-6 flex flex-col gap-4 relative overflow-hidden shadow-xl">

                  {/* Status Banner */}
                  <div className={`absolute top-0 left-0 right-0 h-1.5 ${item.status === 'Pending' ? 'bg-amber-500' :
                      item.status === 'Under Review' ? 'bg-purple-500' :
                        item.status === 'Found' ? 'bg-blue-500' :
                          item.status === 'Returned' ? 'bg-green-500' :
                            'bg-stone-600'
                    }`} />

                  <div className="flex justify-between items-start mt-2">
                    <div className="flex flex-col gap-1.5">
                      <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-md w-fit border ${item.type === 'Lost' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20'
                        }`}>
                        {item.type} Item
                      </span>
                      <h3 className="text-xl font-bold text-stone-100">{item.itemName}</h3>
                    </div>
                    <span className={`text-[10px] font-bold tracking-widest uppercase px-3 py-1.5 rounded-lg border ${item.status === 'Pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                        item.status === 'Under Review' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                          item.status === 'Found' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                            item.status === 'Returned' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                              'bg-stone-800 text-stone-400 border-stone-700'
                      }`}>
                      Status: {item.status}
                    </span>
                  </div>

                  <p className="text-sm text-stone-400 leading-relaxed bg-black/40 p-3 rounded-xl border border-white/5">
                    {item.description}
                  </p>

                  {item.imageUrl && (
                    <div className="mt-2">
                      <span className="text-xs text-stone-500 font-mono mb-2 block">Attached Image:</span>
                      <img src={item.imageUrl} alt="Reported item" className="w-full h-32 object-cover rounded-xl border border-stone-800" />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 mt-2 pt-4 border-t border-stone-800/60 text-xs font-mono text-stone-500">
                    <div className="flex flex-col gap-1">
                      <span className="text-stone-600 uppercase tracking-wider text-[9px]">Theatre Location</span>
                      <span className="text-stone-300 font-bold">{item.theatreName}</span>
                      <span className="text-stone-400">{item.location}</span>
                    </div>
                    <div className="flex flex-col gap-1 text-right">
                      <span className="text-stone-600 uppercase tracking-wider text-[9px]">Reported Occurred</span>
                      <span className="text-stone-300 font-bold">{item.date}</span>
                      <span className="text-stone-400">{item.time}</span>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
