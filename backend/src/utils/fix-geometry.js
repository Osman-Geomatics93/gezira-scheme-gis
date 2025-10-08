import pool from '../config/database.js';

const fixGeometryType = async () => {
  const client = await pool.connect();

  try {
    console.log('🔧 Fixing geometry column type...\n');

    // Drop and recreate the sectors table with correct geometry type
    await client.query('BEGIN');

    // Drop existing table (cascade will drop dependent objects)
    await client.query('DROP TABLE IF EXISTS sectors CASCADE');
    console.log('✅ Dropped old sectors table');

    // Recreate table with MultiPolygon geometry
    await client.query(`
      CREATE TABLE sectors (
        id SERIAL PRIMARY KEY,
        objectid_1 INTEGER,
        objectid INTEGER,
        feature_id INTEGER,
        no_nemra INTEGER,
        canal_name VARCHAR(255),
        office VARCHAR(255),
        division VARCHAR(50) CHECK (division IN ('East', 'West', 'North', 'South')),
        name_ar VARCHAR(255),
        design_a_f NUMERIC(10, 2),
        remarks_1 TEXT,
        shape_leng NUMERIC(15, 6),
        shape_le_1 NUMERIC(15, 6),
        shape_area NUMERIC(15, 6),
        geometry GEOMETRY(MultiPolygon, 4326),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER REFERENCES users(id),
        updated_by INTEGER REFERENCES users(id)
      );
    `);
    console.log('✅ Created new sectors table with MultiPolygon geometry');

    // Recreate spatial index
    await client.query(`
      CREATE INDEX idx_sectors_geometry
      ON sectors USING GIST (geometry);
    `);
    console.log('✅ Created spatial index');

    // Recreate division index
    await client.query(`
      CREATE INDEX idx_sectors_division
      ON sectors (division);
    `);
    console.log('✅ Created division index');

    // Recreate change_history table
    await client.query('DROP TABLE IF EXISTS change_history CASCADE');
    await client.query(`
      CREATE TABLE change_history (
        id SERIAL PRIMARY KEY,
        sector_id INTEGER REFERENCES sectors(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id),
        action VARCHAR(20) CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
        field_name VARCHAR(100),
        old_value TEXT,
        new_value TEXT,
        changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Recreated change_history table');

    // Recreate indexes
    await client.query(`
      CREATE INDEX idx_change_history_sector
      ON change_history (sector_id);
    `);

    await client.query(`
      CREATE INDEX idx_change_history_user
      ON change_history (user_id);
    `);
    console.log('✅ Created change_history indexes');

    // Recreate trigger
    await client.query(`
      DROP TRIGGER IF EXISTS update_sectors_updated_at ON sectors;
      CREATE TRIGGER update_sectors_updated_at
      BEFORE UPDATE ON sectors
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);
    console.log('✅ Created update trigger');

    await client.query('COMMIT');
    console.log('\n🎉 Geometry type fixed successfully!');
    console.log('✅ Now run: npm run seed\n');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error fixing geometry type:', error);
    throw error;
  } finally {
    client.release();
  }
};

fixGeometryType()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
