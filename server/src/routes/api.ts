import { Router } from 'express';
import { getRecommendations, recommend } from '../controllers/recommendController';
import { interpretTaste } from '../controllers/tasteController';

const router = Router();

router.post('/interpret-taste', interpretTaste);
router.post('/recommend', recommend);
router.get('/recommend', getRecommendations);

export const apiRoutes = router;
