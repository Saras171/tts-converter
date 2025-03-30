// server.js - Entry point
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import bodyParser from 'body-parser';
import {fileURLToPath} from 'url';
import path from 'path';
import cookieParser from 'cookie-parser';
import {createServer} from 'http';
import {Server} from 'socket.io';

import './config/passportConfig.js';
import {redisClient, redisSessionStore} from './config/redis.js';
import authRoutes from './routes/authRoute.js';
import ttsRouter from './routes/ttsRoute.js';

dotenv.config();
const app = express();
const server = createServer(app);
// Start server
const PORT = process.env.PORT || 7001;
 server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(cors({
  origin: process.env.CLIENT_SITE,
  methods: ['GET', 'POST','PUT','DELETE'],
credentials: true,
}));
app.use(express.static('public'));
app.use(  //middleware for handling cookies & save session
    session({
      store: redisSessionStore,
      secret: process.env.SESSION_SECRET ,
      resave:  false,
    saveUninitialized:  false,
      cookie:{
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 24*60*60*1000,
    },
  }));
  // Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_SITE,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});
app.set('io', io);

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

export { io };

  app.use(passport.initialize()); //passport middlewares
  app.use(passport.session());

// Connect to Redis and Database
 redisClient;

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tts', ttsRouter);

// Serve static files from the public folder
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/public', express.static(path.join(__dirname, 'public')));

//testing GET route for backend
app.get('/', (req, res) => {
    res.send('Backend Server is Running!!!');
    });

    //Handle unknown routes
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
    });
    //Error Handling
app.use((err, req, res, next) => {
        console.error(err.stack);
        res.status(500).json({ error: 'Internal Server Error' });
      });
      



