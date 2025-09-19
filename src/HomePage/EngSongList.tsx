/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import { SongCard } from "./SongCard";

interface Song {
  id?: string;
  name: string;
  duration: string;
  extra?: string;
  actuality?: string;
}

export const EngSongList = () => {
  const formRef = useRef<HTMLFormElement>(null);
  const [engSongs, setEngSongs] = useState<Song[]>([]);
  const [addEng, setAddEng] = useState({
    name: '',
    duration: '',
    extra: '',
    actuality:'',
  });

  const [changeEng, setChangeEng] = useState<{
    id: string;
    name: string;
    duration: string;
    extra: string;
    actuality: string;
  }>({
    id: '',
    name: '',
    duration: '',
    extra: '',
    actuality: '',
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFta2R5YXF0aGlwZW1pbXZvb3Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwODkwODksImV4cCI6MjA3MzY2NTA4OX0.KS4J9xZA-1yScHmtbjAfKfeHTa2ewqwyo6lOMUp8F_w';

  console.log('addEng', addEng);
  console.log('changeEng', changeEng);

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  };

useEffect(() => {
  const fetchEngSongs = async () => {
    try {
      const res = await fetch("https://qmkdyaqthipemimvoovy.supabase.co/rest/v1/engSongs", {
        headers: {
          'apikey': apiKey,
          'Authorization': apiKey,
        }
      });
      if (!res.ok) throw new Error("Помилка завантаження стандартного списку");
      const data = await res.json();

      setEngSongs([...data].sort((a, b) => a.name.localeCompare(b.name)));
    } catch (err:any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  fetchEngSongs();
}, []);

const changeEngSong = (song: Song) => {
  if (!song) return;

    fetch(`https://qmkdyaqthipemimvoovy.supabase.co/rest/v1/engSongs?id=eq.${changeEng.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey,
        'Authorization': apiKey,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        name: changeEng.name,
        duration: changeEng.duration,
        extra: changeEng.extra,
        actuality: changeEng.actuality
      })
    })
      .then(res => res.json())
      .then(data => {
        setEngSongs(prev => [...prev, data]);
        setChangeEng({
          id: '',
          name: '',
          duration: '',
          extra: '',
          actuality:'',
        });
      })
      .catch(err => setError(err.message));
  }


  const addSong = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addEng) return;

    const newSong: Song = {
      name: addEng.name,
      duration: addEng.duration,
      extra: addEng.extra,
    };

    fetch("https://qmkdyaqthipemimvoovy.supabase.co/rest/v1/engSongs", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey,
        'Authorization': apiKey,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(newSong)
    })
      .then(res => res.json())
      .then(data => {
        setEngSongs(prev => [...prev, data]);
        setAddEng({
          name: '',
          duration: '',
          extra: '',
          actuality:'',
        });
      })
      .catch(err => setError(err.message));
  }

  if (loading) return <p>Завантаження...</p>;
  if (error) return <p style={{ color: "red" }}>Помилка: {error}</p>;

  return (
    <div className="bg-pink-100 border-none rounded-2xl">
      <div className="flex justify-between pl-4 pt-4 pr-4 mb-2 pb-0">
        <h2>English song list</h2>
        <h2 
          onClick={scrollToForm}
          className="bg-red-600 rounded-2xl p-1 flex items-center justify-center text-white cursor-pointer">Add new song</h2>
      </div>
      <ul>
        <SongCard
          songs={engSongs} 
          changeSong={changeEngSong} 
          setChangeSong={setChangeEng}
        />
      </ul>

      <form
        ref={formRef}
        onSubmit={addSong}
        className="flex gap-2 mt-4 flex-col">
        <div>
          <div className="flex justify-between px-4 gap-4 mb-2">
            <input
              className="text-black p-1 border rounded w-full"
              type="text"
              value={addEng.name}
              placeholder="Song name"
              onChange={(e) => setAddEng(prev => ({...prev, name: e.target.value}))}
            />
            <input
              className="text-black p-1 border rounded w-full"
              type="text"
              value={addEng.duration}
              placeholder="Song length mm:ss"
              onChange={(e) => {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length > 4) value = value.slice(0, 4);
                if (value.length > 2) {
                  value = value.slice(0, 2) + ':' + value.slice(2);
                }

                setAddEng(prev => ({ ...prev, duration: value }));
              }}
            />
          </div>
          <div className="flex justify-between px-4 gap-4">
            <div className="flex flex-col w-full">

              <div className="flex gap-4 content-center">
                <input
                  className="text-black p-1 border rounded flex items-center justify-center"
                  type="checkbox"
                  value='chinNewYear'
                  checked={addEng.extra === 'chinNewYear'}
                  onChange={(e) => setAddEng(prev => ({...prev, extra: e.target.value}))}
                />
                <h5 className="flex items-center justify-center">Chinese New Year</h5>
              </div>

              <div className="flex gap-4 content-center">
                <input
                  className="text-black p-1 border rounded flex items-center justify-center"
                  type="checkbox"
                  value='holidays'
                  checked={addEng.extra === 'holidays'}
                  onChange={(e) => setAddEng(prev => ({...prev, extra: e.target.value}))}
                />
                <h5 className="flex items-center justify-center">Holidays</h5>
              </div>

              <div className="flex gap-4 content-center">
                <input
                  className="text-black p-1 border rounded flex items-center justify-center"
                  type="checkbox"
                  value='christmas'
                  checked={addEng.extra === 'christmas'}
                  onChange={(e) => setAddEng(prev => ({...prev, extra: e.target.value}))}
                />
                <h5 className="flex items-center justify-center">Christmas</h5>
              </div>
            </div>

            <select
              className="text-black p-1 border rounded w-full"
              value={addEng.extra || 'active'}
              onChange={(e) => setAddEng(prev => ({ ...prev, extra: e.target.value }))}
            >
            <option value="active">Active</option>
            <option value="passive">Passive</option>
          </select>
          </div>
          
        </div>
        <div className="flex justify-center mt-4">
          <button
            type="submit"
            className="bg-blue-500 text-white w-1/2 px-3 py-1 rounded mb-2"
          >
            Add song
          </button>
        </div>
      </form>
    </div>
  );
};
