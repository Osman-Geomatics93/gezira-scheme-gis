import pool from '../config/database.js';

const createTables = async () => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Enable PostGIS extension
    await client.query(`
      CREATE EXTENSION IF NOT EXISTS postgis;
    `);

    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255),
        role VARCHAR(20) DEFAULT 'viewer' CHECK (role IN ('admin', 'editor', 'viewer')),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create sectors table with PostGIS geometry
    await client.query(`
      CREATE TABLE IF NOT EXISTS sectors (
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

    // Create spatial index on geometry column
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_sectors_geometry
      ON sectors USING GIST (geometry);
    `);

    // Create index on division
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_sectors_division
      ON sectors (division);
    `);

    // Create change history/audit table
    await client.query(`
      CREATE TABLE IF NOT EXISTS change_history (
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

    // Create index on change history
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_change_history_sector
      ON change_history (sector_id);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_change_history_user
      ON change_history (user_id);
    `);

    // Create user sessions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        token_hash VARCHAR(255) UNIQUE NOT NULL,
        ip_address VARCHAR(45),
        user_agent TEXT,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create trigger function to update updated_at timestamp
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    // Create triggers for updated_at
    await client.query(`
      DROP TRIGGER IF EXISTS update_users_updated_at ON users;
      CREATE TRIGGER update_users_updated_at
      BEFORE UPDATE ON users
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS update_sectors_updated_at ON sectors;
      CREATE TRIGGER update_sectors_updated_at
      BEFORE UPDATE ON sectors
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);

    await client.query('COMMIT');
    console.log('✅ Database tables created successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error creating tables:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Run migration
createTables()
  .then(() => {
    console.log('🎉 Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  });
