import { Router } from 'express';
import { UsersController } from '../controllers/users.controller';
import { authenticate } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { updateProfileSchema, changePasswordSchema } from '@agentflow/shared';

const router = Router();

router.use(authenticate);
router.get('/profile', UsersController.getProfile);
router.patch('/profile', validate(updateProfileSchema), UsersController.updateProfile);
router.post('/change-password', validate(changePasswordSchema), UsersController.changePassword);

export default router;
