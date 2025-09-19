import { createClient } from '@supabase/supabase-js';
import { engSongs } from './src/utilites/endSongList.js';
import { chinSongs } from './src/utilites/chinSongList.js';

const supabase = createClient (
  'https://qmkdyaqthipemimvoovy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFta2R5YXF0aGlwZW1pbXZvb3Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwODkwODksImV4cCI6MjA3MzY2NTA4OX0.KS4J9xZA-1yScHmtbjAfKfeHTa2ewqwyo6lOMUp8F_w'
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