import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Veritabanı tohumlanıyor (seeding)...');

  const exerciseTitlesTR = [
    'Aktivasyon', 'Kontrol', 'Yakıcı', 'Aktif Dinlenme', 'Güçlendirme',
    'Kontrol + Oblik', 'Aktif Dinlenme', 'Aktif Dinlenme', 'Core Güçlendirme',
    'Kontrol + Oblik', 'Yakıcı + Dayanıklılık', 'Aktif Dinlenme',
    'Core Güç + Kontrol', 'Alt Karın + Oblik', 'Yakıcı (Hafta Finali)',
    'Aktif Dinlenme', 'Core Dayanıklılık', 'Alt Karın + Oblik',
    'Yakıcı Kontrol', 'Aktif Dinlenme', 'Core Güç + Süre',
    'Alt Karın & Oblik Netleştirme', 'Yakıcı Dayanıklılık (Final Öncesi)',
    'Aktif Dinlenme', 'Core Dayanıklılık Zirvesi', 'Alt Karın + Oblik Maksimum Hacim',
    'Final Öncesi Yakıcı Kombin', 'Aktif Dinlenme', 'Final Güç Testi',
    'Final Burn & Kapanış'
  ];

  const exerciseTitlesEN = [
    'Activation', 'Control', 'Burner', 'Active Recovery', 'Strengthening',
    'Control + Oblique', 'Active Recovery', 'Active Recovery', 'Core Strengthening',
    'Control + Oblique', 'Burner + Endurance', 'Active Recovery',
    'Core Strength + Control', 'Lower Abs + Oblique', 'Burner (Week Final)',
    'Active Recovery', 'Core Endurance', 'Lower Abs + Oblique',
    'Burner Control', 'Active Recovery', 'Core Strength + Duration',
    'Lower Abs & Oblique Definition', 'Burner Endurance (Pre-Final)',
    'Active Recovery', 'Core Endurance Peak', 'Lower Abs + Oblique Max Volume',
    'Pre-Final Burner Combo', 'Active Recovery', 'Final Strength Test',
    'Final Burn & Closing'
  ];

  for (let i = 0; i < exerciseTitlesTR.length; i++) {
    const dayNumber = i + 1;
    await prisma.exercise.upsert({
      where: { id: dayNumber },
      update: {},
      create: {
        id: dayNumber,
        title_tr: exerciseTitlesTR[i],
        title_en: exerciseTitlesEN[i],
        description_tr: `${dayNumber}. Gün Antrenman Detayları - 10 Dakikalık Tam Karın Aktivasyonu`,
        description_en: `Day ${dayNumber} Workout Details - 10 Minutes Core Activation`,
        duration: 600, 
        difficulty: 'Orta',
        isPremium: dayNumber > 3,
        imagePath: `https://sixpack30.b-cdn.net/exercises/day_${(i % 18) + 1}.jpg`
      }
    });
  }

  console.log('Seeding tamamlandı!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
