import { query, getClient } from '../config/database.js';

// Get all sectors with optional filters
export const getAllSectors = async (req, res) => {
  try {
    const {
      division,
      search,
      minArea,
      maxArea,
      office,
      limit = 1000,
      offset = 0,
    } = req.query;

    let queryText = `
      SELECT
        id, objectid_1, objectid, feature_id, no_nemra, canal_name,
        office, division, name_ar, design_a_f, remarks_1,
        shape_leng, shape_le_1, shape_area,
        ST_AsGeoJSON(geometry)::json as geometry,
        created_at, updated_at, created_by, updated_by
      FROM sectors
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    // Filter by division
    if (division) {
      queryText += ` AND division = $${paramCount++}`;
      params.push(division);
    }

    // Filter by office
    if (office) {
      queryText += ` AND office ILIKE $${paramCount++}`;
      params.push(`%${office}%`);
    }

    // Filter by area range
    if (minArea) {
      queryText += ` AND design_a_f >= $${paramCount++}`;
      params.push(parseFloat(minArea));
    }

    if (maxArea) {
      queryText += ` AND design_a_f <= $${paramCount++}`;
      params.push(parseFloat(maxArea));
    }

    // Search in multiple fields
    if (search) {
      queryText += ` AND (
        canal_name ILIKE $${paramCount} OR
        office ILIKE $${paramCount} OR
        name_ar ILIKE $${paramCount} OR
        CAST(no_nemra AS TEXT) ILIKE $${paramCount}
      )`;
      params.push(`%${search}%`);
      paramCount++;
    }

    // Add ordering and pagination
    queryText += ` ORDER BY division, canal_name LIMIT $${paramCount++} OFFSET $${paramCount++}`;
    params.push(parseInt(limit), parseInt(offset));

    // Get total count for pagination
    let countQuery = `SELECT COUNT(*) FROM sectors WHERE 1=1`;
    const countParams = [];
    let countParamIndex = 1;

    if (division) {
      countQuery += ` AND division = $${countParamIndex++}`;
      countParams.push(division);
    }

    if (office) {
      countQuery += ` AND office ILIKE $${countParamIndex++}`;
      countParams.push(`%${office}%`);
    }

    if (minArea) {
      countQuery += ` AND design_a_f >= $${countParamIndex++}`;
      countParams.push(parseFloat(minArea));
    }

    if (maxArea) {
      countQuery += ` AND design_a_f <= $${countParamIndex++}`;
      countParams.push(parseFloat(maxArea));
    }

    if (search) {
      countQuery += ` AND (
        canal_name ILIKE $${countParamIndex} OR
        office ILIKE $${countParamIndex} OR
        name_ar ILIKE $${countParamIndex} OR
        CAST(no_nemra AS TEXT) ILIKE $${countParamIndex}
      )`;
      countParams.push(`%${search}%`);
    }

    const [sectorsResult, countResult] = await Promise.all([
      query(queryText, params),
      query(countQuery, countParams)
    ]);

    // Format as GeoJSON FeatureCollection
    const features = sectorsResult.rows.map(row => ({
      type: 'Feature',
      id: row.id,
      geometry: row.geometry,
      properties: {
        id: row.id,
        OBJECTID_1: row.objectid_1,
        OBJECTID: row.objectid,
        Id: row.feature_id,
        No_Nemra: row.no_nemra,
        Canal_Name: row.canal_name,
        Office: row.office,
        Division: row.division,
        Name_AR: row.name_ar,
        Design_A_F: row.design_a_f,
        Remarks_1: row.remarks_1,
        Shape_Leng: row.shape_leng,
        Shape_Le_1: row.shape_le_1,
        Shape_Area: row.shape_area,
        created_at: row.created_at,
        updated_at: row.updated_at,
      }
    }));

    res.json({
      success: true,
      data: {
        type: 'FeatureCollection',
        features,
        pagination: {
          total: parseInt(countResult.rows[0].count),
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: parseInt(offset) + features.length < parseInt(countResult.rows[0].count)
        }
      }
    });
  } catch (error) {
    console.error('Get sectors error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sectors'
    });
  }
};

// Get single sector by ID
export const getSectorById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT
        id, objectid_1, objectid, feature_id, no_nemra, canal_name,
        office, division, name_ar, design_a_f, remarks_1,
        shape_leng, shape_le_1, shape_area,
        ST_AsGeoJSON(geometry)::json as geometry,
        created_at, updated_at, created_by, updated_by
      FROM sectors
      WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Sector not found'
      });
    }

    const row = result.rows[0];

    res.json({
      success: true,
      data: {
        type: 'Feature',
        id: row.id,
        geometry: row.geometry,
        properties: {
          id: row.id,
          OBJECTID_1: row.objectid_1,
          OBJECTID: row.objectid,
          Id: row.feature_id,
          No_Nemra: row.no_nemra,
          Canal_Name: row.canal_name,
          Office: row.office,
          Division: row.division,
          Name_AR: row.name_ar,
          Design_A_F: row.design_a_f,
          Remarks_1: row.remarks_1,
          Shape_Leng: row.shape_leng,
          Shape_Le_1: row.shape_le_1,
          Shape_Area: row.shape_area,
          created_at: row.created_at,
          updated_at: row.updated_at,
        }
      }
    });
  } catch (error) {
    console.error('Get sector error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sector'
    });
  }
};

// Get sectors by division (for frontend compatibility)
export const getSectorsByDivision = async (req, res) => {
  try {
    const { division } = req.params;
    const { limit = 100, offset = 0 } = req.query; // Add pagination

    // Query with pagination
    const result = await query(
      `SELECT
        id, objectid_1, objectid, feature_id, no_nemra, canal_name,
        office, division, name_ar, design_a_f, remarks_1,
        shape_leng, shape_le_1, shape_area,
        ST_AsGeoJSON(geometry)::json as geometry
      FROM sectors
      WHERE division = $1
      ORDER BY canal_name
      LIMIT $2 OFFSET $3`,
      [division, parseInt(limit), parseInt(offset)]
    );

    // Get total count
    const countResult = await query(
      'SELECT COUNT(*) FROM sectors WHERE division = $1',
      [division]
    );

    const features = result.rows.map(row => ({
      type: 'Feature',
      id: row.id,
      geometry: row.geometry,
      properties: {
        OBJECTID_1: row.objectid_1,
        OBJECTID: row.objectid,
        Id: row.feature_id,
        No_Nemra: row.no_nemra,
        Canal_Name: row.canal_name,
        Office: row.office,
        Division: row.division,
        Name_AR: row.name_ar,
        Design_A_F: row.design_a_f,
        Remarks_1: row.remarks_1,
        Shape_Leng: row.shape_leng,
        Shape_Le_1: row.shape_le_1,
        Shape_Area: row.shape_area,
      }
    }));

    res.json({
      success: true,
      data: {
        type: 'FeatureCollection',
        features,
        pagination: {
          total: parseInt(countResult.rows[0].count),
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: parseInt(offset) + features.length < parseInt(countResult.rows[0].count)
        }
      }
    });
  } catch (error) {
    console.error('Get sectors by division error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sectors'
    });
  }
};

// Create new sector (admin/editor only)
export const createSector = async (req, res) => {
  try {
    const {
      objectid_1,
      objectid,
      feature_id,
      no_nemra,
      canal_name,
      office,
      division,
      name_ar,
      design_a_f,
      remarks_1,
      shape_leng,
      shape_le_1,
      shape_area,
      geometry
    } = req.body;

    // Validation
    if (!division || !geometry) {
      return res.status(400).json({
        success: false,
        message: 'Division and geometry are required'
      });
    }

    const result = await query(
      `INSERT INTO sectors (
        objectid_1, objectid, feature_id, no_nemra, canal_name,
        office, division, name_ar, design_a_f, remarks_1,
        shape_leng, shape_le_1, shape_area, geometry, created_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
        ST_GeomFromGeoJSON($14), $15
      )
      RETURNING id`,
      [
        objectid_1, objectid, feature_id, no_nemra, canal_name,
        office, division, name_ar, design_a_f, remarks_1,
        shape_leng, shape_le_1, shape_area,
        JSON.stringify(geometry),
        req.user.id
      ]
    );

    const newId = result.rows[0].id;

    // Log change history
    await query(
      `INSERT INTO change_history (sector_id, user_id, action, field_name, new_value)
       VALUES ($1, $2, 'INSERT', 'all', 'New sector created')`,
      [newId, req.user.id]
    );

    res.status(201).json({
      success: true,
      message: 'Sector created successfully',
      data: { id: newId }
    });
  } catch (error) {
    console.error('Create sector error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating sector'
    });
  }
};

// Update sector (admin/editor only)
export const updateSector = async (req, res) => {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const updates = req.body;

    // Get current values for change history
    const currentResult = await client.query(
      'SELECT * FROM sectors WHERE id = $1',
      [id]
    );

    if (currentResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Sector not found'
      });
    }

    const currentData = currentResult.rows[0];

    // Build dynamic update query
    const setClauses = [];
    const values = [];
    let paramCount = 1;

    const fieldMapping = {
      objectid_1: 'objectid_1',
      objectid: 'objectid',
      feature_id: 'feature_id',
      no_nemra: 'no_nemra',
      canal_name: 'canal_name',
      office: 'office',
      division: 'division',
      name_ar: 'name_ar',
      design_a_f: 'design_a_f',
      remarks_1: 'remarks_1',
      shape_leng: 'shape_leng',
      shape_le_1: 'shape_le_1',
      shape_area: 'shape_area',
    };

    // Log changes and build update query
    for (const [key, dbField] of Object.entries(fieldMapping)) {
      if (updates[key] !== undefined && updates[key] !== currentData[dbField]) {
        setClauses.push(`${dbField} = $${paramCount++}`);
        values.push(updates[key]);

        // Log change
        await client.query(
          `INSERT INTO change_history (sector_id, user_id, action, field_name, old_value, new_value)
           VALUES ($1, $2, 'UPDATE', $3, $4, $5)`,
          [id, req.user.id, key, String(currentData[dbField]), String(updates[key])]
        );
      }
    }

    // Handle geometry update
    if (updates.geometry) {
      setClauses.push(`geometry = ST_GeomFromGeoJSON($${paramCount++})`);
      values.push(JSON.stringify(updates.geometry));

      await client.query(
        `INSERT INTO change_history (sector_id, user_id, action, field_name, new_value)
         VALUES ($1, $2, 'UPDATE', 'geometry', 'Geometry updated')`,
        [id, req.user.id]
      );
    }

    if (setClauses.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'No updates provided'
      });
    }

    // Add updated_by
    setClauses.push(`updated_by = $${paramCount++}`);
    values.push(req.user.id);

    // Add id for WHERE clause
    values.push(id);

    const updateQuery = `
      UPDATE sectors
      SET ${setClauses.join(', ')}
      WHERE id = $${paramCount}
    `;

    await client.query(updateQuery, values);
    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Sector updated successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Update sector error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating sector'
    });
  } finally {
    client.release();
  }
};

// Delete sector (admin only)
export const deleteSector = async (req, res) => {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    const { id } = req.params;

    // Check if sector exists
    const checkResult = await client.query(
      'SELECT id FROM sectors WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Sector not found'
      });
    }

    // Log deletion
    await client.query(
      `INSERT INTO change_history (sector_id, user_id, action, field_name, old_value)
       VALUES ($1, $2, 'DELETE', 'all', 'Sector deleted')`,
      [id, req.user.id]
    );

    // Delete sector (cascade will handle change_history)
    await client.query('DELETE FROM sectors WHERE id = $1', [id]);

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Sector deleted successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Delete sector error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting sector'
    });
  } finally {
    client.release();
  }
};

// Get sector change history
export const getSectorHistory = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT
        ch.id, ch.action, ch.field_name, ch.old_value, ch.new_value, ch.changed_at,
        u.username, u.full_name
      FROM change_history ch
      JOIN users u ON ch.user_id = u.id
      WHERE ch.sector_id = $1
      ORDER BY ch.changed_at DESC`,
      [id]
    );

    res.json({
      success: true,
      data: {
        history: result.rows
      }
    });
  } catch (error) {
    console.error('Get sector history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sector history'
    });
  }
};

// Batch update multiple sectors (admin/editor only)
export const batchUpdateSectors = async (req, res) => {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    const { updates } = req.body; // Array of {id, fields}

    if (!Array.isArray(updates) || updates.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Invalid updates array'
      });
    }

    let updatedCount = 0;

    for (const update of updates) {
      const { id, ...fields } = update;

      // Get current values
      const currentResult = await client.query(
        'SELECT * FROM sectors WHERE id = $1',
        [id]
      );

      if (currentResult.rows.length === 0) {
        continue; // Skip if not found
      }

      const currentData = currentResult.rows[0];
      const setClauses = [];
      const values = [];
      let paramCount = 1;

      // Process each field update
      for (const [key, value] of Object.entries(fields)) {
        if (value !== undefined && value !== currentData[key]) {
          setClauses.push(`${key} = $${paramCount++}`);
          values.push(value);

          // Log change
          await client.query(
            `INSERT INTO change_history (sector_id, user_id, action, field_name, old_value, new_value)
             VALUES ($1, $2, 'UPDATE', $3, $4, $5)`,
            [id, req.user.id, key, String(currentData[key]), String(value)]
          );
        }
      }

      if (setClauses.length > 0) {
        setClauses.push(`updated_by = $${paramCount++}`);
        values.push(req.user.id);
        values.push(id);

        const updateQuery = `
          UPDATE sectors
          SET ${setClauses.join(', ')}
          WHERE id = $${paramCount}
        `;

        await client.query(updateQuery, values);
        updatedCount++;
      }
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: `Successfully updated ${updatedCount} sectors`,
      data: { updatedCount }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Batch update error:', error);
    res.status(500).json({
      success: false,
      message: 'Error performing batch update'
    });
  } finally {
    client.release();
  }
};
