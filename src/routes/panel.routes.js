import { Router } from 'express';
import { panelAuth } from '../middlewares/panelAuth.middleware.js';
import { getPanelHealth } from '../controllers/panel/health.controller.js';
import { getPanelAnalyse } from '../controllers/panel/analyse.controller.js';
import {
  getPanelUser,
  listPanelUsers,
  patchPanelUser,
} from '../controllers/panel/users.controller.js';
import {
  createPanelWorkout,
  deletePanelWorkout,
  getPanelWorkout,
  listPanelWorkouts,
  patchPanelWorkout,
} from '../controllers/panel/workouts.controller.js';
import { panelWorkoutUpload } from '../middlewares/panelUpload.middleware.js';
import {
  getPanelUserWorkout,
  listPanelUserWorkouts,
  listPanelUserWorkoutsByUser,
  patchPanelUserWorkout,
} from '../controllers/panel/userWorkouts.controller.js';

const router = Router();

router.use(panelAuth);

router.get('/health', getPanelHealth);
router.get('/analyse', getPanelAnalyse);

router.get('/users', listPanelUsers);
router.get('/users/:userId/workouts', listPanelUserWorkoutsByUser);
router.get('/users/:id', getPanelUser);
router.patch('/users/:id', patchPanelUser);

router.get('/workouts', listPanelWorkouts);
router.post('/workouts', panelWorkoutUpload, createPanelWorkout);
router.get('/workouts/:id', getPanelWorkout);
router.patch('/workouts/:id', panelWorkoutUpload, patchPanelWorkout);
router.delete('/workouts/:id', deletePanelWorkout);

router.get('/user-workouts', listPanelUserWorkouts);
router.get('/user-workouts/:id', getPanelUserWorkout);
router.patch('/user-workouts/:id', patchPanelUserWorkout);

export default router;
