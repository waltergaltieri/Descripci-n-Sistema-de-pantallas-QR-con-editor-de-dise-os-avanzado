const express = require('express');

const createUploadsStaticMiddleware = (uploadsDirectory) => {
  const router = express.Router();

  router.use((req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
  });

  router.use(express.static(uploadsDirectory));

  return router;
};

module.exports = {
  createUploadsStaticMiddleware
};
