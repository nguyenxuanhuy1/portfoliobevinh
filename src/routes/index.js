import { Router } from 'express';
import authRouter from './auth.route.js';
import projectRouter from './project.route.js';
import adminProfileRouter from './adminProfile.route.js';
import skillRouter from './skill.route.js';
import experienceRouter from './experience.route.js';
import contactRouter from './contact.route.js';

const router = Router();

router.use('/auth', authRouter);
router.use('/api', projectRouter);
router.use('/api', adminProfileRouter);
router.use('/api', skillRouter);
router.use('/api', experienceRouter);
router.use('/api', contactRouter);

export default router;