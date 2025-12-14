import { Router } from 'express';
import { classifyAndRecommend } from '../controllers/recommendationController';
import { getRecommendations, recommend } from '../controllers/recommendController';
import { interpretTaste } from '../controllers/tasteController';

const router = Router();

router.post('/interpret-taste', interpretTaste);
router.post('/recommend', recommend);
router.get('/recommend', getRecommendations);
router.post('/classify-and-recommend', classifyAndRecommend);

export const apiRoutes = router;
