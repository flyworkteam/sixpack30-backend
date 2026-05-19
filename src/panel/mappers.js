import { getCdnUrl } from '../utils/cdn.js';

const DIFFICULTY_TO_PANEL = {
  kolay: 'beginner',
  easy: 'beginner',
  beginner: 'beginner',
  orta: 'intermediate',
  medium: 'intermediate',
  intermediate: 'intermediate',
  zor: 'advanced',
  hard: 'advanced',
  advanced: 'advanced',
};

const DIFFICULTY_FROM_PANEL = {
  beginner: 'Kolay',
  intermediate: 'Orta',
  advanced: 'Zor',
};

export function mapDifficultyToPanel(value) {
  if (!value) return null;
  const key = String(value).toLowerCase();
  return DIFFICULTY_TO_PANEL[key] || value;
}

export function mapDifficultyFromPanel(value) {
  if (!value) return null;
  const key = String(value).toLowerCase();
  return DIFFICULTY_FROM_PANEL[key] || value;
}

export function secondsToMinutes(seconds) {
  if (seconds == null) return null;
  return Math.round(Number(seconds) / 60);
}

export function minutesToSeconds(minutes) {
  if (minutes == null) return null;
  return Math.round(Number(minutes) * 60);
}

export function mapUserToPanel(user, questionnaire = null) {
  return {
    id: String(user.id),
    email: user.email ?? null,
    displayName: user.name ?? null,
    phone: null,
    status: 'active',
    createdAt: user.createdAt?.toISOString() ?? null,
    lastLoginAt: user.updatedAt?.toISOString() ?? null,
    extras: {
      firebaseUid: user.firebaseUid,
      isPremium: user.isPremium,
      photoUrl: user.photoUrl,
      waterIntake: user.waterIntake,
      healthConnected: user.healthConnected,
      notificationsEnabled: user.notificationsEnabled,
      hasQuestionnaire: Boolean(questionnaire),
      goal: questionnaire?.goal ?? null,
      gender: questionnaire?.gender ?? null,
      trainingDays: questionnaire?.trainingDays ?? null,
    },
  };
}

export function mapExerciseToPanelWorkout(exercise) {
  const publishedAt =
    exercise.status === 'published'
      ? (exercise.publishedAt || exercise.createdAt)?.toISOString?.() ?? null
      : exercise.publishedAt?.toISOString?.() ?? null;

  return {
    id: String(exercise.id),
    title: exercise.title_tr,
    description: exercise.description_tr ?? null,
    status: exercise.status || 'published',
    difficulty: mapDifficultyToPanel(exercise.difficulty),
    durationMinutes: secondsToMinutes(exercise.duration),
    category: exercise.category || 'program',
    coverImageUrl: getCdnUrl(exercise.imagePath),
    createdAt: exercise.createdAt?.toISOString() ?? null,
    updatedAt: exercise.updatedAt?.toISOString() ?? null,
    publishedAt,
    extras: {
      title_en: exercise.title_en,
      description_en: exercise.description_en,
      isPremium: exercise.isPremium,
      programDay: exercise.id,
      durationSeconds: exercise.duration,
      videoUrl: getCdnUrl(exercise.videoPath),
      locale: 'tr',
    },
  };
}

export function mapPanelWorkoutInputToExercise(body, existing = null) {
  const status = body.status ?? existing?.status ?? 'published';
  let publishedAt = existing?.publishedAt ?? null;
  if (status === 'published' && !publishedAt) {
    publishedAt = new Date();
  }
  if (status !== 'published') {
    publishedAt = body.publishedAt ? new Date(body.publishedAt) : publishedAt;
  }

  const durationMinutes =
    body.durationMinutes !== undefined
      ? body.durationMinutes
      : existing
        ? secondsToMinutes(existing.duration)
        : 10;

  return {
    title_tr: body.title ?? existing?.title_tr,
    title_en: body.extras?.title_en ?? body.title_en ?? existing?.title_en ?? body.title,
    description_tr: body.description ?? existing?.description_tr ?? null,
    description_en: body.extras?.description_en ?? existing?.description_en ?? null,
    duration: minutesToSeconds(durationMinutes) ?? existing?.duration ?? 600,
    difficulty:
      mapDifficultyFromPanel(body.difficulty) ?? existing?.difficulty ?? 'Orta',
    imagePath: existing?.imagePath ?? null,
    videoPath: existing?.videoPath ?? null,
    isPremium:
      body.extras?.isPremium ??
      (body.isPremium !== undefined ? Boolean(body.isPremium) : existing?.isPremium) ??
      false,
    status,
    category: body.category ?? existing?.category ?? 'program',
    publishedAt,
  };
}

export function mapProgressToPanelUserWorkout(progress, exercise) {
  const fullDuration = exercise?.duration ?? progress.duration;
  const isCompleted = progress.duration >= fullDuration * 0.9;

  return {
    id: `p_${progress.id}`,
    userId: String(progress.userId),
    workoutId: String(progress.exerciseId),
    workoutTitle: exercise?.title_tr ?? null,
    status: isCompleted ? 'completed' : 'started',
    startedAt: progress.completedAt?.toISOString() ?? null,
    completedAt: isCompleted ? progress.completedAt?.toISOString() ?? null : null,
    durationMinutes: secondsToMinutes(progress.duration),
    caloriesBurned: progress.calories ?? null,
    progressPercent: fullDuration
      ? Math.min(100, Math.round((progress.duration / fullDuration) * 100))
      : null,
    extras: {
      source: 'progress',
      exerciseId: progress.exerciseId,
    },
  };
}

export function mapCompletedDayToPanelUserWorkout(completedDay, exercise) {
  return {
    id: `cd_${completedDay.id}`,
    userId: String(completedDay.userId),
    workoutId: String(completedDay.dayNumber),
    workoutTitle: exercise?.title_tr ?? `Gün ${completedDay.dayNumber}`,
    status: 'completed',
    startedAt: completedDay.completedAt?.toISOString() ?? null,
    completedAt: completedDay.completedAt?.toISOString() ?? null,
    durationMinutes: exercise ? secondsToMinutes(exercise.duration) : null,
    caloriesBurned: null,
    progressPercent: 100,
    extras: {
      source: 'completed_day',
      dayNumber: completedDay.dayNumber,
    },
  };
}
