require('dotenv').config();
const bcrypt = require('bcryptjs');
const { query } = require('./index');

const DEPARTMENTS = [
  'Computer Engineering',
  'Computer Science and Design',
  'Aeronautical Engineering',
  'Electrical Engineering',
  'Electronics and Communication Engineering',
  'Civil Engineering'
];

async function seed() {
  console.log('Seeding database...');

  const adminHash = await bcrypt.hash('Admin@123', 12);
  const superAdminHash = await bcrypt.hash('SuperAdmin@123', 12);

  // Create Super Admin
  await query(`
    INSERT INTO users (name, email, password_hash, role, is_active)
    VALUES ('Super Admin', 'superadmin@college.edu', $1, 'super_admin', true)
    ON CONFLICT (email) DO UPDATE SET
      name = EXCLUDED.name,
      password_hash = EXCLUDED.password_hash,
      role = 'super_admin',
      is_active = true;
  `, [superAdminHash]);

  // Create Admin
  await query(`
    INSERT INTO users (name, email, password_hash, role, is_active)
    VALUES ('Admin User', 'admin@college.edu', $1, 'admin', true)
    ON CONFLICT (email) DO UPDATE SET
      name = EXCLUDED.name,
      password_hash = EXCLUDED.password_hash,
      role = 'admin',
      is_active = true;
  `, [adminHash]);

  console.log('✅ Seed complete.');
  console.log('   Super Admin email: superadmin@college.edu');
  console.log('   Super Admin password: SuperAdmin@123');
  console.log('   Admin email: admin@college.edu');
  console.log('   Admin password: Admin@123');
  console.log('   ⚠️  Change these passwords immediately after first login!');
  process.exit(0);
}

seed().catch(err => { console.error('Seed failed:', err); process.exit(1); });
