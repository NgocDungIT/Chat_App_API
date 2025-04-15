const { Router } = require('express');
const { verifyToken } = require('../middlewares/AuthMiddleware');
const { searchContacts, getContactsForDMList } = require('../controllers/ContactsController');

const contactsRoutes = Router();

contactsRoutes.post('/search', verifyToken, searchContacts);
contactsRoutes.get('/get-contacts-for-dm', verifyToken, getContactsForDMList);

module.exports = contactsRoutes;
