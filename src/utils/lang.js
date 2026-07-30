export const getLang = (req) => {
  const raw = (req.headers['accept-language'] || 'tr').toLowerCase();
  // Şimdilik DB'de yalnızca title_tr / title_en var.
  // Türkçe dışındaki tüm diller İngilizceye düşer.
  if (raw.startsWith('tr')) return 'tr';
  return 'en';
};

export const localizeExercise = (exercise, lang, gender) => {
  let imagePath = exercise.imagePath;
  
  if (imagePath && gender) {
    if (gender === 'female' || gender === 'woman') {
      imagePath = imagePath.replace('_man', '_woman');
    } else {
      imagePath = imagePath.replace('_woman', '_man');
    }
  }

  const useEnglish = lang !== 'tr';

  return {
    ...exercise,
    title: useEnglish
      ? (exercise.title_en || exercise.title_tr)
      : exercise.title_tr,
    description: useEnglish
      ? (exercise.description_en || exercise.description_tr)
      : exercise.description_tr,
    imagePath: imagePath
  };
};
