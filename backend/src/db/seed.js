require('dotenv').config();
const bcrypt = require('bcryptjs');
const { query } = require('./index');

async function seed() {
  console.log('Seeding database...');

  // Create super admin
  const superAdminHash = await bcrypt.hash('Rubix@cube13', 12);
  await query(`
    INSERT INTO users (name, email, password_hash, role, is_active, is_super_admin)
    VALUES ('Deep Pasnani', 'deeppasnani@yahoo.com', $1, 'admin', true, true)
    ON CONFLICT (email) DO UPDATE SET
      name = EXCLUDED.name,
      password_hash = EXCLUDED.password_hash,
      role = 'admin',
      is_active = true,
      is_super_admin = true;
  `, [superAdminHash]);

  console.log('✅ Seed complete.');
  console.log('   Super Admin: Deep Pasnani');
  console.log('   Email: deeppasnani@yahoo.com');
  console.log('   Password: Rubix@cube13');
  console.log('   ⚠️  Only super admins can create other super admins!');
  process.exit(0);
}

seed().catch(err => { console.error('Seed failed:', err); process.exit(1); });
