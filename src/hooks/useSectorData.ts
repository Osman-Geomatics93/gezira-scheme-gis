import { useState, useEffect, useCallback } from 'react';
import { sectorsAPI, isAuthenticated } from '../services/api';
import type { SectorFeatureCollection, SectorDivision } from '../types';

export function useSectorData() {
  const [sectorsData, setSectorsData] = useState<Record<SectorDivision, SectorFeatureCollection | null>>({
    East: null,
    West: null,
    North: null,
    South: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<'local' | 'backend'>('local');

  const loadSectors = useCallback(async () => {
    try {
      setLoading(true);

      // Try to load from backend if authenticated
      if (isAuthenticated()) {
        try {
          console.log('Loading sectors from backend API...');

          const [eastData, westData, northData, southData] = await Promise.all([
            sectorsAPI.getByDivision('East'),
            sectorsAPI.getByDivision('West'),
            sectorsAPI.getByDivision('North'),
            sectorsAPI.getByDivision('South'),
          ]);

          console.log('Loaded sector data from backend:', { eastData, westData, northData, southData });

          setSectorsData({
            East: eastData.data as SectorFeatureCollection,
            West: westData.data as SectorFeatureCollection,
            North: northData.data as SectorFeatureCollection,
            South: southData.data as SectorFeatureCollection,
          });

          setDataSource('backend');
          setError(null);
          return;
        } catch (backendError) {
          console.warn('Failed to load from backend, falling back to local files:', backendError);
        }
      }

      // Fallback to local GeoJSON files
      console.log('Loading sectors from local files...');
      const [eastData, westData, northData, southData] = await Promise.all([
        fetch('/src/assets/data/East.geojson').then(r => r.json()),
        fetch('/src/assets/data/West.geojson').then(r => r.json()),
        fetch('/src/assets/data/North.geojson').then(r => r.json()),
        fetch('/src/assets/data/South.geojson').then(r => r.json()),
      ]);

      console.log('Loaded sector data from local files:', { eastData, westData, northData, southData });

      setSectorsData({
        East: eastData as SectorFeatureCollection,
        West: westData as SectorFeatureCollection,
        North: northData as SectorFeatureCollection,
        South: southData as SectorFeatureCollection,
      });

      setDataSource('local');
      setError(null);
    } catch (err) {
      console.error('Error loading sector data:', err);
      setError('Failed to load sector data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSectors();
  }, [loadSectors]);

  // Function to reload data (can be called after edits)
  const reloadData = useCallback(() => {
    return loadSectors();
  }, [loadSectors]);

  return { sectorsData, loading, error, dataSource, reloadData };
}
