require('dotenv').config();
const bcrypt = require('bcryptjs');
const { query } = require('./index');

async function seed() {
  console.log('Seeding database...');

  const hash = await bcrypt.hash('Admin@123', 12);

  await query(`
    INSERT INTO users (name, email, password_hash, role, is_active)
    VALUES ('Super Admin', 'admin@college.edu', $1, 'admin', true)
    ON CONFLICT (email) DO UPDATE SET
      name = EXCLUDED.name,
      password_hash = EXCLUDED.password_hash,
      role = 'admin',
      is_active = true;
  `, [hash]);

  console.log('✅ Seed complete.');
  console.log('   Admin email: admin@college.edu');
  console.log('   Admin password: Admin@123');
  console.log('   ⚠️  Change this password immediately after first login!');
  process.exit(0);
}

seed().catch(err => { console.error('Seed failed:', err); process.exit(1); });
