const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

const router = express.Router({ mergeParams: true });

//All the below review routes will be protected
router.use(authController.protect);

router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.restrict('user'),
    reviewController.setTourUserIds,
    reviewController.createReview,
  );

router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(
    authController.restrict('admin', 'user'),
    reviewController.updateReview,
  )
  .delete(
    authController.restrict('admin', 'user'),
    reviewController.deleteReview,
  );

module.exports = router;
