// routes/auth.js
const express = require('express');
const router = express.Router();
const { getAuth, createAuth } = require('../controllers/authController');

router.get('/', getAuth);
router.post('/', createAuth);

module.exports = router;
