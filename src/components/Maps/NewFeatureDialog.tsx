import { useState, useEffect, useMemo } from 'react';
import type { SectorDivision, SectorFeatureCollection } from '../../types';

interface NewFeatureDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: NewFeatureData) => void;
  measurements: {
    area: number; // in Feddan
    perimeter: number; // in meters
  };
  sectorsData?: Record<SectorDivision, SectorFeatureCollection | null>;
}

export interface NewFeatureData {
  division: SectorDivision;
  office: string;
  canal_name: string;
  name_ar: string;
  no_nemra: string;
  design_a_f: number;
  remarks_1: string;
}

export default function NewFeatureDialog({ isOpen, onClose, onSave, measurements, sectorsData }: NewFeatureDialogProps) {
  const [formData, setFormData] = useState<NewFeatureData>({
    division: 'East',
    office: '',
    canal_name: '',
    name_ar: '',
    no_nemra: '',
    design_a_f: measurements.area,
    remarks_1: '',
  });

  // Extract unique offices per division
  const officesByDivision = useMemo(() => {
    const result: Record<SectorDivision, string[]> = {
      East: [],
      West: [],
      North: [],
      South: [],
    };

    if (!sectorsData) return result;

    Object.entries(sectorsData).forEach(([division, data]) => {
      if (!data) return;
      const offices = new Set<string>();
      data.features.forEach(feature => {
        if (feature.properties.Office) {
          offices.add(feature.properties.Office);
        }
      });
      result[division as SectorDivision] = Array.from(offices).sort();
    });

    return result;
  }, [sectorsData]);

  // Reset office when division changes
  useEffect(() => {
    setFormData(prev => ({ ...prev, office: '' }));
  }, [formData.division]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (field: keyof NewFeatureData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[3000] flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Add New Canal</h2>
            <p className="text-sm opacity-90">Draw a new agricultural canal boundary</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Measurements Display */}
        <div className="px-6 py-4 bg-blue-50 border-b border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">📏 Calculated Measurements</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <p className="text-xs text-gray-600">Area</p>
              <p className="text-2xl font-bold text-green-600">{measurements.area.toFixed(2)} <span className="text-sm">Feddan</span></p>
            </div>
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <p className="text-xs text-gray-600">Perimeter</p>
              <p className="text-2xl font-bold text-blue-600">{(measurements.perimeter / 1000).toFixed(2)} <span className="text-sm">km</span></p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {/* Division and Office */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Division <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.division}
                onChange={(e) => handleChange('division', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              >
                <option value="East">East</option>
                <option value="West">West</option>
                <option value="North">North</option>
                <option value="South">South</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Office <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.office}
                onChange={(e) => handleChange('office', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              >
                <option value="">Select Office...</option>
                {officesByDivision[formData.division].map(office => (
                  <option key={office} value={office}>{office}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {officesByDivision[formData.division].length} offices available in {formData.division}
              </p>
            </div>
          </div>

          {/* Canal Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Canal Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.canal_name}
              onChange={(e) => handleChange('canal_name', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Enter canal name"
              required
            />
          </div>

          {/* Arabic Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Arabic Name
            </label>
            <input
              type="text"
              value={formData.name_ar}
              onChange={(e) => handleChange('name_ar', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent arabic-text"
              placeholder="الاسم بالعربي"
              dir="rtl"
            />
          </div>

          {/* Nemra Number and Design Area */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nemra Number
              </label>
              <input
                type="text"
                value={formData.no_nemra}
                onChange={(e) => handleChange('no_nemra', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter number"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Design Area (Feddan)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.design_a_f}
                onChange={(e) => handleChange('design_a_f', parseFloat(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Remarks
            </label>
            <textarea
              value={formData.remarks_1}
              onChange={(e) => handleChange('remarks_1', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              rows={3}
              placeholder="Additional notes..."
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-gray-700 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Save Canal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
