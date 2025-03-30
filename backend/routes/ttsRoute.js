import express from 'express';
import { generateSpeech, getAudioHistory, deleteAudio } from '../controller/ttsController.js';
import {ensureAuthenticated} from '../middleware/authMiddleware.js';

const ttsRouter = express.Router();

ttsRouter.post('/generate', ensureAuthenticated, generateSpeech); 
ttsRouter.get('/history', ensureAuthenticated, getAudioHistory);
ttsRouter.delete('/delete/:id', ensureAuthenticated, deleteAudio);
export default ttsRouter;