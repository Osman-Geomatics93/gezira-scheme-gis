import { useMemo } from 'react';
import type { SectorFeatureCollection, SectorDivision, SectorStats } from '../../types';

interface StatsPanelProps {
  sectorsData: Record<SectorDivision, SectorFeatureCollection | null>;
  selectedSector: SectorDivision | null;
}

export default function StatsPanel({ sectorsData, selectedSector }: StatsPanelProps) {
  const stats = useMemo(() => {
    const calculateStats = (division: SectorDivision, data: SectorFeatureCollection | null): SectorStats | null => {
      if (!data || !data.features || data.features.length === 0) return null;

      const canals = new Set<string>();
      const offices = new Set<string>();
      let totalArea = 0;
      let totalDesignArea = 0;

      data.features.forEach((feature) => {
        canals.add(feature.properties.Canal_Name);
        offices.add(feature.properties.Office);
        totalArea += feature.properties.Shape_Area;
        totalDesignArea += feature.properties.Design_A_F;
      });

      return {
        division,
        totalFeatures: data.features.length,
        totalArea: totalArea / 1000000, // Convert to km²
        totalDesignArea,
        canals: Array.from(canals),
        offices: Array.from(offices),
      };
    };

    if (selectedSector) {
      const data = sectorsData[selectedSector];
      return data ? [calculateStats(selectedSector, data)] : [];
    }

    return Object.entries(sectorsData)
      .map(([division, data]) => calculateStats(division as SectorDivision, data))
      .filter((stat): stat is SectorStats => stat !== null);
  }, [sectorsData, selectedSector]);

  const totalStats = useMemo(() => {
    const total = {
      features: 0,
      area: 0,
      designArea: 0,
      canals: new Set<string>(),
      offices: new Set<string>(),
    };

    stats.forEach((stat) => {
      if (stat) {
        total.features += stat.totalFeatures;
        total.area += stat.totalArea;
        total.designArea += stat.totalDesignArea;
        stat.canals.forEach((canal) => total.canals.add(canal));
        stat.offices.forEach((office) => total.offices.add(office));
      }
    });

    return total;
  }, [stats]);

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 max-h-[70vh] overflow-y-auto">
      <h2 className="text-lg font-bold text-gray-800 mb-4">
        {selectedSector ? `${selectedSector} Sector Statistics` : 'All Sectors Statistics'}
      </h2>

      {/* Overall Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-blue-50 rounded-lg p-3">
          <p className="text-xs text-blue-600 font-medium">Total Plots</p>
          <p className="text-2xl font-bold text-blue-700">{totalStats.features}</p>
        </div>

        <div className="bg-green-50 rounded-lg p-3">
          <p className="text-xs text-green-600 font-medium">Total Area</p>
          <p className="text-2xl font-bold text-green-700">{totalStats.area.toFixed(2)}</p>
          <p className="text-xs text-green-600">km²</p>
        </div>

        <div className="bg-yellow-50 rounded-lg p-3">
          <p className="text-xs text-yellow-600 font-medium">Design Area</p>
          <p className="text-2xl font-bold text-yellow-700">{totalStats.designArea.toLocaleString()}</p>
          <p className="text-xs text-yellow-600">Feddan</p>
        </div>

        <div className="bg-purple-50 rounded-lg p-3">
          <p className="text-xs text-purple-600 font-medium">Canals</p>
          <p className="text-2xl font-bold text-purple-700">{totalStats.canals.size}</p>
        </div>
      </div>

      {/* Sector Breakdown */}
      {!selectedSector && stats.length > 0 && (
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Sector Breakdown</h3>
          <div className="space-y-2">
            {stats.map((stat) => stat && (
              <div key={stat.division} className="bg-gray-50 rounded-lg p-3">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold text-gray-800">{stat.division}</h4>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                    {stat.totalFeatures} plots
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-600">Area: </span>
                    <span className="font-medium">{stat.totalArea.toFixed(2)} km²</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Design: </span>
                    <span className="font-medium">{stat.totalDesignArea.toLocaleString()} F</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Canals: </span>
                    <span className="font-medium">{stat.canals.length}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Offices: </span>
                    <span className="font-medium">{stat.offices.length}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected Sector Details */}
      {selectedSector && stats[0] && (
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Canals ({stats[0].canals.length})</h3>
          <div className="flex flex-wrap gap-1 mb-4">
            {stats[0].canals.map((canal) => (
              <span
                key={canal}
                className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded"
              >
                {canal}
              </span>
            ))}
          </div>

          <h3 className="text-sm font-semibold text-gray-700 mb-3">Offices ({stats[0].offices.length})</h3>
          <div className="flex flex-wrap gap-1">
            {stats[0].offices.map((office) => (
              <span
                key={office}
                className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded"
              >
                {office}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
