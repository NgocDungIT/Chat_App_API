const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const { setupSocket } = require('./socket');

const authRoutes = require('./routes/AuthRoute');
const userRoutes = require('./routes/UserRoute');
const contactsRoutes = require('./routes/ContactRoute');
const messagesRoutes = require('./routes/MessagesRoute');

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;
const databaseURL = process.env.DATABASE_URL;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.API_CLOUDINARY_KEY,
    api_secret: process.env.API_CLOUDINARY_SECRET,
});

app.use(
    cors({
        origin: [process.env.ORIGIN],
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
    })
);

app.use('/static', express.static(path.join(__dirname, 'public')));
app.use('/uploads/files', express.static('uploads/files'));

app.use(cookieParser());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/contacts', contactsRoutes);
app.use('/api/messages', messagesRoutes);

const server = app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});

// set up socket
setupSocket(server);

mongoose
    .connect(databaseURL)
    .then(() => console.log('Connected DB Successfully!'))
    .catch((error) => console.log('Connection DB Error: ', error.message));
