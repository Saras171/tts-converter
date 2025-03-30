import { saveAudioToStorage, deleteAudioFromStorage} from '../services/storageService.js';
import textToSpeech from '@google-cloud/text-to-speech';
import {supabase} from '../config/databaseConfig.js';
import fs from 'fs';
import path from 'path';

export const generateSpeech = async(req, res) => {
    try {
        const userId= req.user?.id;
        const {text,languageCode='en-US', voice, speed = 1.0, pitch = 0.0 } = req.body;

      if (!text) {
        return res.status(400).json({ success: false, message: 'No text provided for TTS' });
      }

         // Check if the user is authenticated
         if (!req.user || !userId) {
            return res.status(401).json({ success: false, message: 'User not authenticated' });
        }
// Create a client for Google Cloud TTS
const client = new textToSpeech.TextToSpeechClient();

// Construct the request for Google Cloud TTS
const request = {
    input: { text },
    voice: { languageCode: languageCode, name: voice },
    audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: speed,
        pitch: pitch,
    },
};

// Synthesize speech using Google Cloud TTS
const [response] = await client.synthesizeSpeech(request);
       
   // Generate a unique filename for the audio file
   const fileName = `output-${Date.now()}.mp3`;

    //Save audio file to google cloud storage and  get signed URL
        const {url, localFilePath} = await saveAudioToStorage(response.audioContent, fileName);
      
        // Construct the URL to be served from your backend's public folder
const serverUrl = `${process.env.SERVER_URL}/tts-audio/${fileName}`;
console.log("Generated Audio URL: ", serverUrl);

       //Save history in supabase database
       const { data, error } = await supabase
       .from('audio_history')
       .insert([
           {
            user_id: req.user?.id,
            filename: fileName, 
            text,
               language: languageCode,
               voice: voice,
               speed,
               pitch,
               audio_url: url,
               created_at: new Date().toISOString(),
           },
       ]);


   if (error) throw new Error(error.message);

   
        // Emit history update event
        req.app.get('io').emit('audioGenerated',
           { success: true,
            url: serverUrl,
             fileData: data });

       res.json({ success: true, url, fileData: data});

    } catch (error) {
        console.error(`Error generating speech: ${error.message}`); 
        res.status(500).json({ success: false, message: 'Sorry!!! Internal server error! TTS generation failed!' });
    }
};

//Get audio history
export const getAudioHistory = async(req, res) =>{
    try{
        //get the logged-in user's Id
        const userId= req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        const { data, error } = await supabase
        .from('audio_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

console.log('Audio History Retrieved for User Id: ', userId, ':', data);
            res.json({success: true, history: data});
            }catch(error){
                console.error(`Error fetching audio history:  ${error.message}`);
                res.status(500).json({success: false, message: 'Sorry!!! Internal server error. ' });
    }
};

//Delete Audio File
export const deleteAudio = async(req, res) =>{
    const {id} = req.params;

    try{
        //fetch file details from database
const {data, error} = await supabase
.from('audio_history')
.select('*')
.eq('id',id)
.single();

if (error || !data) throw new Error(error?.message || 'Audio file not found!');

const fileName = data.filename;
if(!fileName) throw new Error('Filename is missing  in the database');

//delete from Google Cloud Storage
await deleteAudioFromStorage(fileName);

//delete from local file
const filePath = path.join(process.cwd(), 'public', 'tts-audio', fileName);
if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(`Local audio file deleted: ${filePath}`);
}else{
    console.warn('Audio file not found in local storage: ',filePath)
}

//Delete record from Supabase
const {error: deleteError} =await supabase
.from('audio_history')
.delete()
.eq('id', id);

if(deleteError) throw new Error(deleteError.message);

res.json({success: true, message: 'Audio file deleted successfully!'});
    }catch(error){
        console.error(`Error deleting audio file: ${error.message}`);
        res.status(500).json({success: false, message: 'Error deleting audio file.'});
    }
    };
