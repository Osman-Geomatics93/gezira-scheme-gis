import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { getClient } from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to your GeoJSON files
const dataPath = path.join(__dirname, '../../../src/assets/data');

const importGeoJSON = async () => {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    console.log('🌱 Starting database seed...\n');

    // Create admin user
    console.log('👤 Creating admin user...');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('admin123', salt);

    const adminResult = await client.query(`
      INSERT INTO users (username, email, password_hash, full_name, role)
      VALUES ('admin', 'admin@gezira.sd', $1, 'System Administrator', 'admin')
      ON CONFLICT (username) DO UPDATE
      SET email = EXCLUDED.email, full_name = EXCLUDED.full_name
      RETURNING id
    `, [passwordHash]);

    const adminId = adminResult.rows[0].id;
    console.log('✅ Admin user created/updated');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('   Role: admin\n');

    // Create sample editor user
    console.log('👤 Creating editor user...');
    const editorPassword = await bcrypt.hash('editor123', salt);
    await client.query(`
      INSERT INTO users (username, email, password_hash, full_name, role)
      VALUES ('editor', 'editor@gezira.sd', $1, 'Data Editor', 'editor')
      ON CONFLICT (username) DO UPDATE
      SET email = EXCLUDED.email, full_name = EXCLUDED.full_name
    `, [editorPassword]);
    console.log('✅ Editor user created/updated');
    console.log('   Username: editor');
    console.log('   Password: editor123');
    console.log('   Role: editor\n');

    // Create sample viewer user
    console.log('👤 Creating viewer user...');
    const viewerPassword = await bcrypt.hash('viewer123', salt);
    await client.query(`
      INSERT INTO users (username, email, password_hash, full_name, role)
      VALUES ('viewer', 'viewer@gezira.sd', $1, 'Data Viewer', 'viewer')
      ON CONFLICT (username) DO UPDATE
      SET email = EXCLUDED.email, full_name = EXCLUDED.full_name
    `, [viewerPassword]);
    console.log('✅ Viewer user created/updated');
    console.log('   Username: viewer');
    console.log('   Password: viewer123');
    console.log('   Role: viewer\n');

    // Import sectors data
    const divisions = ['East', 'West', 'North', 'South'];
    let totalFeatures = 0;

    for (const division of divisions) {
      console.log(`📥 Importing ${division} sector...`);

      const filePath = path.join(dataPath, `${division}.geojson`);

      if (!fs.existsSync(filePath)) {
        console.log(`⚠️  File not found: ${filePath}`);
        console.log(`   Skipping ${division} sector\n`);
        continue;
      }

      const geojson = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      console.log(`   Found ${geojson.features.length} features`);

      let importedCount = 0;
      let skippedCount = 0;

      for (const feature of geojson.features) {
        const props = feature.properties;
        const geometry = JSON.stringify(feature.geometry);

        try {
          // Check if sector already exists (by objectid_1 and division)
          const existing = await client.query(
            'SELECT id FROM sectors WHERE objectid_1 = $1 AND division = $2',
            [props.OBJECTID_1, division]
          );

          if (existing.rows.length > 0) {
            // Update existing sector
            await client.query(`
              UPDATE sectors SET
                objectid = $1,
                feature_id = $2,
                no_nemra = $3,
                canal_name = $4,
                office = $5,
                name_ar = $6,
                design_a_f = $7,
                remarks_1 = $8,
                shape_leng = $9,
                shape_le_1 = $10,
                shape_area = $11,
                geometry = ST_GeomFromGeoJSON($12),
                updated_by = $13
              WHERE id = $14
            `, [
              props.OBJECTID,
              props.Id,
              props.No_Nemra,
              props.Canal_Name,
              props.Office,
              props.Name_AR,
              props.Design_A_F,
              props.Remarks_1,
              props.Shape_Leng,
              props.Shape_Le_1,
              props.Shape_Area,
              geometry,
              adminId,
              existing.rows[0].id
            ]);
            skippedCount++;
          } else {
            // Insert new sector
            await client.query(`
              INSERT INTO sectors (
                objectid_1, objectid, feature_id, no_nemra, canal_name,
                office, division, name_ar, design_a_f, remarks_1,
                shape_leng, shape_le_1, shape_area, geometry, created_by
              ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
                ST_GeomFromGeoJSON($14), $15
              )
            `, [
              props.OBJECTID_1,
              props.OBJECTID,
              props.Id,
              props.No_Nemra,
              props.Canal_Name,
              props.Office,
              division,
              props.Name_AR,
              props.Design_A_F,
              props.Remarks_1,
              props.Shape_Leng,
              props.Shape_Le_1,
              props.Shape_Area,
              geometry,
              adminId
            ]);
            importedCount++;
          }
        } catch (error) {
          console.error(`   ❌ Error importing feature ${props.OBJECTID_1}:`, error.message);
        }
      }

      totalFeatures += importedCount;
      console.log(`✅ ${division}: ${importedCount} new, ${skippedCount} updated\n`);
    }

    // Get final statistics
    const stats = await client.query(`
      SELECT
        division,
        COUNT(*) as count,
        MIN(design_a_f) as min_area,
        MAX(design_a_f) as max_area,
        AVG(design_a_f) as avg_area
      FROM sectors
      WHERE design_a_f IS NOT NULL
      GROUP BY division
      ORDER BY division
    `);

    console.log('📊 Database Statistics:');
    console.log('┌─────────────┬───────┬──────────┬──────────┬──────────┐');
    console.log('│ Division    │ Count │ Min Area │ Max Area │ Avg Area │');
    console.log('├─────────────┼───────┼──────────┼──────────┼──────────┤');

    for (const row of stats.rows) {
      const division = row.division.padEnd(11);
      const count = String(row.count).padStart(5);
      const minArea = row.min_area ? parseFloat(row.min_area).toFixed(2).padStart(8) : 'N/A'.padStart(8);
      const maxArea = row.max_area ? parseFloat(row.max_area).toFixed(2).padStart(8) : 'N/A'.padStart(8);
      const avgArea = row.avg_area ? parseFloat(row.avg_area).toFixed(2).padStart(8) : 'N/A'.padStart(8);
      console.log(`│ ${division} │ ${count} │ ${minArea} │ ${maxArea} │ ${avgArea} │`);
    }
    console.log('└─────────────┴───────┴──────────┴──────────┴──────────┘\n');

    await client.query('COMMIT');
    console.log('🎉 All data imported successfully!');
    console.log('\n📝 Default Credentials:');
    console.log('   Admin:  username: admin,  password: admin123');
    console.log('   Editor: username: editor, password: editor123');
    console.log('   Viewer: username: viewer, password: viewer123\n');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error importing data:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Run seed
importGeoJSON()
  .then(() => {
    console.log('✅ Seed completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Seed failed:', error);
    process.exit(1);
  });
