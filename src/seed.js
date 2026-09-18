require('dotenv').config();
const bcrypt = require('bcrypt');
const { User, Location, mongoose } = require('./models');

async function seed() {
  console.log('Seeding database...');
  await mongoose.connect(process.env.DATABASE_URL);

  const locations = await Location.find({});
  if (locations.length === 0) {
    await Location.create([
      { name: 'Main Store' },
      { name: 'Cold Room' },
    ]);
    console.log('Created locations: Main Store, Cold Room');
  }

  const adminEmail = 'DATTUKARAMUNGE';
  const existingAdmin = await User.findOne({ email: adminEmail });
  if (!existingAdmin) {
    const password_hash = await bcrypt.hash('Dkjk143143@', 10);
    await User.create({
      email: adminEmail,
      password: password_hash,
      name: 'Admin User',
      role: 'admin',
    });
    console.log('Created admin user: DATTUKARAMUNGE / Dkjk143143@');
  } else {
    console.log('Admin user already exists');
  }

  console.log('Seeding complete!');
  await mongoose.disconnect();
}

seed().catch(async (error) => {
  console.error('Seeding error:', error);
  await mongoose.disconnect();
  process.exit(1);
});
