export const getLang = (req) => {
  const lang = req.headers['accept-language'] || 'tr';
  return lang.toLowerCase().startsWith('en') ? 'en' : 'tr';
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

  return {
    ...exercise,
    title: lang === 'en' ? (exercise.title_en || exercise.title_tr) : exercise.title_tr,
    description: lang === 'en' ? (exercise.description_en || exercise.description_tr) : exercise.description_tr,
    imagePath: imagePath
  };
};
