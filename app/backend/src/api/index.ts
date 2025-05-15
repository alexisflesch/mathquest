
import express from 'express';
import v1Router from './v1';

const router = express.Router();

// Mount the v1 router
router.use('/v1', v1Router);

export default router;
