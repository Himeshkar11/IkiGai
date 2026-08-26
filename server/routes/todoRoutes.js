const express = require('express');
const { auth } = require('../middleware/auth');
const todoController = require('../controllers/todoController');

const router = express.Router();

router.use(auth);

router.get('/', todoController.getTodos);
router.post('/', todoController.createTodo);
router.put('/:id', todoController.updateTodo);
router.delete('/:id', todoController.deleteTodo);

module.exports = router;
