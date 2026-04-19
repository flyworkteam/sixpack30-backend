import type { Request } from 'express';

export const getLang = (req: Request) => {
  const lang = (req.headers['accept-language'] as string) || 'tr';
  return lang.toLowerCase().startsWith('en') ? 'en' : 'tr';
};

export const localizeExercise = (exercise: any, lang: string) => {
  return {
    ...exercise,
    title: lang === 'en' ? (exercise.title_en || exercise.title_tr) : exercise.title_tr,
    description: lang === 'en' ? (exercise.description_en || exercise.description_tr) : exercise.description_tr,
  };
};
