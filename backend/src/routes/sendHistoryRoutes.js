const express = require('express');
const router = express.Router();
const SendHistoryController = require('../controllers/SendHistoryController');
const { validation, rateLimiting } = require('../middleware');

router.get('/', rateLimiting.general, SendHistoryController.getAll.bind(SendHistoryController));
router.get('/filtered', rateLimiting.general, SendHistoryController.getFilteredHistory.bind(SendHistoryController));
router.get('/stats/engagement', rateLimiting.general, SendHistoryController.getEngagementStats.bind(SendHistoryController));
router.get('/:id', validation.validate(validation.schemas.mongoId, 'params'), SendHistoryController.getById.bind(SendHistoryController));

module.exports = router;
