import { useState, useMemo, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { sectorsAPI } from '../../services/api';
import type { SectorFeatureCollection, SectorDivision, SectorProperties } from '../../types';

interface AttributeTableProps {
  sectorsData: Record<SectorDivision, SectorFeatureCollection | null>;
  selectedSector: SectorDivision | null;
  onClose: () => void;
  onDataUpdate?: () => void;
}

type SortKey = keyof SectorProperties | 'Division';
type SortOrder = 'asc' | 'desc';

interface TableRow extends SectorProperties {
  Division: string;
  id?: number;
}

interface EditingCell {
  rowIndex: number;
  field: keyof SectorProperties;
}

export default function EditableAttributeTable({
  sectorsData,
  selectedSector,
  onClose,
  onDataUpdate
}: AttributeTableProps) {
  const { user, hasRole } = useAuth();
  const canEdit = hasRole(['admin', 'editor']);

  const [sortKey, setSortKey] = useState<SortKey>('Canal_Name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [editedValues, setEditedValues] = useState<Record<number, Partial<SectorProperties>>>({});
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Combine all features into a single table
  const allRows = useMemo(() => {
    const rows: TableRow[] = [];

    Object.entries(sectorsData).forEach(([division, data]) => {
      if (!data) return;
      if (selectedSector && division !== selectedSector) return;

      data.features.forEach((feature, index) => {
        // Use the database ID (from backend) or OBJECTID_1 (from local files) or fallback to index
        const featureWithId = feature as typeof feature & { id?: number; properties: typeof feature.properties & { id?: number } };
        const rowId = featureWithId.properties.id || feature.properties.OBJECTID_1 || featureWithId.id || index;

        rows.push({
          ...feature.properties,
          Division: division,
          id: rowId,
        });
      });
    });

    return rows;
  }, [sectorsData, selectedSector]);

  // Filter rows based on search
  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) return allRows;

    const search = searchTerm.toLowerCase();
    return allRows.filter((row) => {
      return (
        row.Canal_Name?.toLowerCase().includes(search) ||
        row.Name_AR?.includes(searchTerm) ||
        row.Office?.toLowerCase().includes(search) ||
        row.Division?.toLowerCase().includes(search) ||
        row.No_Nemra?.toString().includes(search)
      );
    });
  }, [allRows, searchTerm]);

  // Sort rows
  const sortedRows = useMemo(() => {
    return [...filteredRows].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }

      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();

      if (sortOrder === 'asc') {
        return aStr.localeCompare(bStr);
      } else {
        return bStr.localeCompare(aStr);
      }
    });
  }, [filteredRows, sortKey, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(sortedRows.length / itemsPerPage);
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedRows.slice(start, start + itemsPerPage);
  }, [sortedRows, currentPage, itemsPerPage]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const handleCellClick = (rowIndex: number, field: keyof SectorProperties) => {
    if (!canEdit) return;
    if (field === 'OBJECTID_1' || field === 'OBJECTID' || field === 'Id') return; // Don't allow editing IDs
    setEditingCell({ rowIndex, field });
  };

  const handleCellChange = (rowIndex: number, field: keyof SectorProperties, value: string) => {
    const row = paginatedRows[rowIndex];
    if (!row.id) {
      console.warn('No row ID found for editing');
      return;
    }

    setEditedValues(prev => ({
      ...prev,
      [row.id!]: {
        ...prev[row.id!],
        [field]: value
      }
    }));
  };

  const handleCellBlur = () => {
    setEditingCell(null);
  };

  const handleSaveChanges = async () => {
    if (Object.keys(editedValues).length === 0) {
      setSaveMessage({ type: 'error', text: 'No changes to save' });
      setTimeout(() => setSaveMessage(null), 3000);
      return;
    }

    setSaving(true);
    setSaveMessage(null);

    try {
      // Map frontend field names to backend field names
      const fieldMapping: Record<string, string> = {
        'Canal_Name': 'canal_name',
        'Name_AR': 'name_ar',
        'Office': 'office',
        'Design_A_F': 'design_a_f',
        'Remarks_1': 'remarks_1'
      };

      const updates = Object.entries(editedValues).map(([id, changes]) => {
        const mappedChanges: Record<string, unknown> = {};

        Object.entries(changes).forEach(([key, value]) => {
          const backendKey = fieldMapping[key] || key;
          mappedChanges[backendKey] = value;
        });

        return {
          id: parseInt(id),
          ...mappedChanges
        };
      });

      console.log('📝 Sending updates to backend:', updates);
      console.log('📝 Current editedValues before save:', editedValues);

      const response = await sectorsAPI.batchUpdate(updates);
      console.log('✅ Save response:', response);

      if (response.success) {
        setSaveMessage({
          type: 'success',
          text: `Successfully saved ${response.data.updatedCount} record(s)!`
        });

        console.log('🔄 Clearing editedValues and reloading data...');
        setEditedValues({});

        // Refresh data if callback provided
        if (onDataUpdate) {
          console.log('🔄 Calling onDataUpdate to reload fresh data...');
          await onDataUpdate();
          console.log('✅ Data reloaded');
        }
      }
    } catch (error) {
      console.error('Save error:', error);
      setSaveMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to save changes'
      });
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMessage(null), 5000);
    }
  };

  const handleDiscardChanges = () => {
    if (confirm('Are you sure you want to discard all unsaved changes?')) {
      setEditedValues({});
      setEditingCell(null);
      setSaveMessage({ type: 'success', text: 'Changes discarded' });
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  const getCellValue = (row: TableRow, field: keyof SectorProperties, _rowIndex: number) => {
    const rowId = row.id!;
    const editedValue = editedValues[rowId]?.[field];
    return editedValue !== undefined ? editedValue : row[field];
  };

  const isRowEdited = (row: TableRow) => {
    return row.id && editedValues[row.id] !== undefined;
  };

  const divisionColors: Record<string, string> = {
    East: 'bg-blue-50 text-blue-700',
    West: 'bg-green-50 text-green-700',
    North: 'bg-yellow-50 text-yellow-700',
    South: 'bg-red-50 text-red-700',
  };

  const hasUnsavedChanges = Object.keys(editedValues).length > 0;

  return (
    <div className="fixed inset-x-0 bottom-0 bg-white shadow-2xl border-t-4 border-green-500 z-[2000] animate-slide-up">
      <div className="flex flex-col h-[70vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-blue-50">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-bold text-gray-800">
              📊 Attribute Table
              {selectedSector && ` - ${selectedSector} Division`}
            </h2>
            <span className="text-sm text-gray-600">
              {sortedRows.length} records {hasUnsavedChanges && `• ${Object.keys(editedValues).length} edited`}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {/* User Role Badge */}
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              user?.role === 'admin' ? 'bg-red-100 text-red-700' :
              user?.role === 'editor' ? 'bg-blue-100 text-blue-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {canEdit ? '✏️ Can Edit' : '👁️ View Only'}
            </span>

            {/* Save/Discard Buttons - Always visible for editors/admins */}
            {canEdit && (
              <>
                <button
                  onClick={handleDiscardChanges}
                  disabled={saving || !hasUnsavedChanges}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center gap-2"
                >
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                  <span>Discard</span>
                </button>
                <button
                  onClick={handleSaveChanges}
                  disabled={saving || !hasUnsavedChanges}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path>
                      </svg>
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </>
            )}

            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-600 hover:text-gray-800"
              title="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Message Banner */}
        {saveMessage && (
          <div className={`px-6 py-3 ${
            saveMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          } border-b`}>
            <div className="flex items-center gap-2">
              {saveMessage.type === 'success' ? '✅' : '❌'}
              <span className="font-medium">{saveMessage.text}</span>
            </div>
          </div>
        )}

        {/* Search and Controls */}
        <div className="px-6 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <input
            type="text"
            placeholder="Search in table..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent w-96"
          />

          {canEdit && (
            <div className="text-sm text-gray-600 bg-blue-50 px-4 py-2 rounded-lg">
              💡 <strong>Tip:</strong> Click on a cell to edit (Canal Name, Office, Design Area, Remarks)
            </div>
          )}
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full">
            <thead className="bg-gray-100 sticky top-0 z-10">
              <tr>
                <SortableHeader label="Division" sortKey="Division" currentSort={sortKey} sortOrder={sortOrder} onSort={handleSort} />
                <SortableHeader label="Canal Name" sortKey="Canal_Name" currentSort={sortKey} sortOrder={sortOrder} onSort={handleSort} />
                <SortableHeader label="Arabic Name" sortKey="Name_AR" currentSort={sortKey} sortOrder={sortOrder} onSort={handleSort} />
                <SortableHeader label="Office" sortKey="Office" currentSort={sortKey} sortOrder={sortOrder} onSort={handleSort} />
                <SortableHeader label="Nemra No" sortKey="No_Nemra" currentSort={sortKey} sortOrder={sortOrder} onSort={handleSort} />
                <SortableHeader label="Design Area (F)" sortKey="Design_A_F" currentSort={sortKey} sortOrder={sortOrder} onSort={handleSort} />
                <SortableHeader label="Remarks" sortKey="Remarks_1" currentSort={sortKey} sortOrder={sortOrder} onSort={handleSort} />
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row, rowIndex) => (
                <tr
                  key={`${row.Division}-${row.OBJECTID_1 || rowIndex}`}
                  className={`border-b border-gray-200 hover:bg-gray-50 transition ${
                    isRowEdited(row) ? 'bg-yellow-50' : ''
                  }`}
                >
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${divisionColors[row.Division]}`}>
                      {row.Division}
                    </span>
                  </td>
                  <EditableCell
                    value={getCellValue(row, 'Canal_Name', rowIndex)}
                    field="Canal_Name"
                    rowIndex={rowIndex}
                    isEditing={editingCell?.rowIndex === rowIndex && editingCell?.field === 'Canal_Name'}
                    canEdit={canEdit}
                    onCellClick={handleCellClick}
                    onCellChange={handleCellChange}
                    onCellBlur={handleCellBlur}
                  />
                  <EditableCell
                    value={getCellValue(row, 'Name_AR', rowIndex)}
                    field="Name_AR"
                    rowIndex={rowIndex}
                    isEditing={editingCell?.rowIndex === rowIndex && editingCell?.field === 'Name_AR'}
                    canEdit={canEdit}
                    onCellClick={handleCellClick}
                    onCellChange={handleCellChange}
                    onCellBlur={handleCellBlur}
                    className="arabic-text"
                  />
                  <EditableCell
                    value={getCellValue(row, 'Office', rowIndex)}
                    field="Office"
                    rowIndex={rowIndex}
                    isEditing={editingCell?.rowIndex === rowIndex && editingCell?.field === 'Office'}
                    canEdit={canEdit}
                    onCellClick={handleCellClick}
                    onCellChange={handleCellChange}
                    onCellBlur={handleCellBlur}
                  />
                  <td className="px-4 py-3 text-sm">{row.No_Nemra}</td>
                  <EditableCell
                    value={getCellValue(row, 'Design_A_F', rowIndex)}
                    field="Design_A_F"
                    rowIndex={rowIndex}
                    isEditing={editingCell?.rowIndex === rowIndex && editingCell?.field === 'Design_A_F'}
                    canEdit={canEdit}
                    onCellClick={handleCellClick}
                    onCellChange={handleCellChange}
                    onCellBlur={handleCellBlur}
                    type="number"
                  />
                  <EditableCell
                    value={getCellValue(row, 'Remarks_1', rowIndex) || ''}
                    field="Remarks_1"
                    rowIndex={rowIndex}
                    isEditing={editingCell?.rowIndex === rowIndex && editingCell?.field === 'Remarks_1'}
                    canEdit={canEdit}
                    onCellClick={handleCellClick}
                    onCellChange={handleCellChange}
                    onCellBlur={handleCellBlur}
                  />
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between bg-gray-50">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Rows per page:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-3 py-1 border border-gray-300 rounded"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
            </select>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages} ({sortedRows.length} total)
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ««
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                «
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                »
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                »»
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Sortable Header Component
function SortableHeader({
  label,
  sortKey,
  currentSort,
  sortOrder,
  onSort
}: {
  label: string;
  sortKey: SortKey;
  currentSort: SortKey;
  sortOrder: SortOrder;
  onSort: (key: SortKey) => void;
}) {
  return (
    <th
      className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition"
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center space-x-1">
        <span>{label}</span>
        {currentSort === sortKey && (
          <span className="text-green-600">
            {sortOrder === 'asc' ? '↑' : '↓'}
          </span>
        )}
      </div>
    </th>
  );
}

// Editable Cell Component
function EditableCell({
  value,
  field,
  rowIndex,
  isEditing,
  canEdit,
  onCellClick,
  onCellChange,
  onCellBlur,
  type = 'text',
  className = ''
}: {
  value: string | number | null;
  field: keyof SectorProperties;
  rowIndex: number;
  isEditing: boolean;
  canEdit: boolean;
  onCellClick: (rowIndex: number, field: keyof SectorProperties) => void;
  onCellChange: (rowIndex: number, field: keyof SectorProperties, value: string) => void;
  onCellBlur: () => void;
  type?: 'text' | 'number';
  className?: string;
}) {
  const [editValue, setEditValue] = useState(value || '');
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize value only once when entering edit mode
  useEffect(() => {
    if (isEditing) {
      setEditValue(value || '');
      // Focus the input after a small delay to ensure it's rendered
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select(); // Select all text for easy replacement
      }, 10);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing]); // Only re-run when isEditing changes, not when value changes

  if (isEditing) {
    return (
      <td className="px-4 py-3">
        <input
          ref={inputRef}
          type={type}
          value={editValue}
          onChange={(e) => {
            console.log('📝 Input changed:', e.target.value);
            setEditValue(e.target.value);
            onCellChange(rowIndex, field, e.target.value);
          }}
          onBlur={onCellBlur}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onCellBlur();
            }
            if (e.key === 'Escape') {
              setEditValue(value || '');
              onCellBlur();
            }
          }}
          className={`w-full px-2 py-1 border-2 border-green-500 rounded focus:outline-none ${className}`}
        />
      </td>
    );
  }

  return (
    <td
      className={`px-4 py-3 text-sm ${canEdit ? 'cursor-pointer hover:bg-blue-50' : ''} ${className}`}
      onClick={() => canEdit && onCellClick(rowIndex, field)}
      title={canEdit ? 'Click to edit' : ''}
    >
      {value !== null && value !== undefined ? String(value) : '-'}
    </td>
  );
}
