import { createClient } from '@supabase/supabase-js';
import { engSongs } from './src/utilites/endSongList.js';
import { chinSongs } from './src/utilites/chinSongList.js';

// Run with: node --env-file=.env importSongs.js
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function upload () {
  const { data: engData, error: engError } = await supabase
    .from('engSongs')
    .insert(engSongs);

    if (engError) console.error('Error uploading engSongs:', engError);
      else console.log('Uploaded engSongs:', engData);

  const { data: chinData, error: chinError } = await supabase
    .from('chinSongs')
    .insert(chinSongs);

  if (chinError) console.error('Error uploading chinSongs:', chinError);
  else console.log('Uploaded chinSongs:', chinData);
}

upload();