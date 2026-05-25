const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const defaultCategories = [
  { name: 'Gaji', type: 'INCOME', icon: '💰' },
  { name: 'Freelance', type: 'INCOME', icon: '💻' },
  { name: 'Investasi', type: 'INCOME', icon: '📈' },
  { name: 'Makanan', type: 'EXPENSE', icon: '🍽️' },
  { name: 'Transport', type: 'EXPENSE', icon: '🚗' },
  { name: 'Hiburan', type: 'EXPENSE', icon: '🎮' },
  { name: 'Belanja', type: 'EXPENSE', icon: '🛒' },
  { name: 'Tagihan', type: 'EXPENSE', icon: '📄' },
  { name: 'Kesehatan', type: 'EXPENSE', icon: '🏥' },
  { name: 'Pendidikan', type: 'EXPENSE', icon: '📚' },
  { name: 'Lainnya', type: 'EXPENSE', icon: '📌' },
];

async function main() {
  console.log('Seeding default categories...');
  for (const cat of defaultCategories) {
    await prisma.category.upsert({
      where: { id: cat.name },
      update: { name: cat.name, type: cat.type, icon: cat.icon },
      create: { id: cat.name, name: cat.name, type: cat.type, icon: cat.icon },
    });
  }
  console.log('Default categories seeded successfully.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
