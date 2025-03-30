import { Storage } from '@google-cloud/storage';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
dotenv.config();

const storage = new Storage();

export const saveAudioToStorage = async (audioContent, fileName) => {
    const bucket = storage.bucket(process.env.GCS_BUCKET_NAME);
    const file = bucket.file(fileName);


    // Save audio content to a local file first
    const audioDirectory = path.join(process.cwd(), 'public', 'tts-audio');
    if (!fs.existsSync(audioDirectory)) {
        fs.mkdirSync(audioDirectory, { recursive: true });
    }

    const localFilePath = path.join(audioDirectory, fileName);
    fs.writeFileSync(localFilePath, audioContent);

    
    //Save audio content to GCS
    await file.save(audioContent, { contentType: 'audio/mpeg' });
    console.log(`Audio file saved to GCS: ${fileName}`);

    // Generate a signed URL that expires in 1 hour (3600 seconds)
    const [url] = await file.getSignedUrl({
        version: 'v4',
        action: 'read',
        expires: Date.now() + 5 * 60 * 60 * 1000,  //generated file expired after 5 hours
    });
   
    console.log(`Generated Signed URL: ${url}`);
    return {url, localFilePath};
};

//Delete audio file from GCS
export const deleteAudioFromStorage = async(fileName) =>{
    try{
        const bucket = storage.bucket(process.env.GCS_BUCKET_NAME);
        await bucket.file(fileName).delete();
        console.log(`Audio file deleted from GCS: ${fileName}`);
    } catch(error){
        console.error('Error deleting file from GCS: ', error.message);
    }
};
