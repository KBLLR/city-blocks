import { useEffect, useState } from 'react';
import { Building, MapPin, Ruler, Layers, Sparkles, Loader2 } from 'lucide-react';
import { useAI } from '@/react-app/hooks/useAI';

interface BuildingInfoCardProps {
  height: number;
  tags: Record<string, string>;
  lat: number;
  lon: number;
  onClose?: () => void;
}

interface AIBuildingInfo {
  name: string;
  description: string;
  original_tags: Record<string, string>;
}

export default function BuildingInfoCard({ 
  height, 
  tags, 
  lat, 
  lon, 
  onClose 
}: BuildingInfoCardProps) {
  const [aiInfo, setAiInfo] = useState<AIBuildingInfo | null>(null);
  const { generateBuildingInfo, loading, error } = useAI();

  // Load Google Fonts
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    
    return () => {
      if (document.head.contains(link)) {
        document.head.removeChild(link);
      }
    };
  }, []);

  useEffect(() => {
    const loadAIInfo = async () => {
      const buildingData = {
        lat,
        lon,
        building_type: tags.building || 'building',
        name: tags.name || tags['addr:housename'],
        addr_street: tags['addr:street'],
        addr_housenumber: tags['addr:housenumber'],
        addr_city: tags['addr:city'],
        height: height,
        levels: tags['building:levels'] ? parseInt(tags['building:levels']) : undefined,
        tags
      };

      const result = await generateBuildingInfo(buildingData);
      if (result) {
        setAiInfo(result);
      }
    };

    loadAIInfo();
  }, [generateBuildingInfo, tags, height, lat, lon]);

  const getBuildingIcon = (buildingType: string) => {
    const type = buildingType.toLowerCase();
    if (type.includes('house') || type.includes('residential')) return '🏠';
    if (type.includes('commercial') || type.includes('office')) return '🏢';
    if (type.includes('school')) return '🏫';
    if (type.includes('hospital')) return '🏥';
    if (type.includes('church') || type.includes('cathedral')) return '⛪';
    if (type.includes('shop') || type.includes('retail')) return '🏪';
    if (type.includes('garage')) return '🚗';
    return '🏗️';
  };

  const buildingType = tags.building || 'building';
  const icon = getBuildingIcon(buildingType);

  return (
    <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-6 w-80 pointer-events-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-2xl">{icon}</div>
          <div>
            <h3 className="font-playfair font-bold text-xl text-gray-900 leading-tight">
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-gray-500">Analyzing...</span>
                </div>
              ) : (
                aiInfo?.name || tags.name || tags['addr:housename'] || 'Target Building'
              )}
            </h3>
            <div className="flex items-center gap-1 mt-1">
              <MapPin className="w-3 h-3 text-orange-500" />
              <span className="text-xs font-medium text-orange-600 uppercase tracking-wide">
                Target Location
              </span>
            </div>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
          >
            ×
          </button>
        )}
      </div>

      {/* AI Description */}
      {aiInfo && !loading && (
        <div className="mb-4 p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border border-purple-100">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-semibold text-purple-700 uppercase tracking-wide">
              AI-Generated Description
            </span>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed font-inter">
            {aiInfo.description}
          </p>
        </div>
      )}

      {/* Building Details */}
      <div className="space-y-3">
        <div className="flex items-center gap-3 text-sm">
          <Building className="w-4 h-4 text-gray-500" />
          <span className="font-medium text-gray-700">Type:</span>
          <span className="text-gray-600 capitalize">
            {buildingType.replace(/_/g, ' ')}
          </span>
        </div>

        <div className="flex items-center gap-3 text-sm">
          <Ruler className="w-4 h-4 text-gray-500" />
          <span className="font-medium text-gray-700">Height:</span>
          <span className="text-gray-600">{Math.round(height)}m</span>
        </div>

        {tags['building:levels'] && (
          <div className="flex items-center gap-3 text-sm">
            <Layers className="w-4 h-4 text-gray-500" />
            <span className="font-medium text-gray-700">Levels:</span>
            <span className="text-gray-600">{tags['building:levels']}</span>
          </div>
        )}

        {(tags['addr:street'] || tags['addr:housenumber']) && (
          <div className="flex items-center gap-3 text-sm">
            <MapPin className="w-4 h-4 text-gray-500" />
            <span className="font-medium text-gray-700">Address:</span>
            <span className="text-gray-600 text-xs">
              {[tags['addr:housenumber'], tags['addr:street'], tags['addr:city']]
                .filter(Boolean)
                .join(' ')}
            </span>
          </div>
        )}
      </div>

      {/* Additional Tags */}
      {Object.keys(tags).filter(key => 
        ['amenity', 'shop', 'cuisine', 'operator', 'brand'].includes(key)
      ).length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Additional Details
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(tags)
              .filter(([key]) => ['amenity', 'shop', 'cuisine', 'operator', 'brand'].includes(key))
              .map(([key, value]) => (
                <div key={key} className="px-2 py-1 bg-gray-100 rounded-md text-xs">
                  <span className="font-medium text-gray-600 capitalize">
                    {key}:
                  </span>
                  <span className="text-gray-700 ml-1">{value}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-xs text-red-700">
            AI analysis unavailable: {error}
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-400 text-center">
        Coordinates: {lat.toFixed(4)}, {lon.toFixed(4)}
      </div>
    </div>
  );
}
