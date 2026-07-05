import express from 'express';
import theatreController from '../controllers/theatreController.js';
import { authMiddleware, adminMiddleware, optionalAuthMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/', optionalAuthMiddleware, theatreController.getAll);
router.get('/:id', theatreController.getById);
router.post('/', authMiddleware, adminMiddleware, theatreController.create);
router.put('/:id', authMiddleware, adminMiddleware, theatreController.update);
router.delete('/:id', authMiddleware, adminMiddleware, theatreController.delete);
router.delete('/', authMiddleware, adminMiddleware, (req, res) => {
  req.params.id = "";
  return theatreController.delete(req, res);
});

export default router;
