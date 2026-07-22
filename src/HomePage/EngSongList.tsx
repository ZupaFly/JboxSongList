/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import { SongCard } from "./SongCard";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../auth/useAuth";
import { LoginForm } from "../auth/LoginForm";
import type { Song } from "../types/song";

export const EngSongList = () => {
  const formRef = useRef<HTMLDivElement>(null);
  const [engSongs, setEngSongs] = useState<Song[]>([]);
  const [addEng, setAddEng] = useState({
    name: '',
    duration: '',
    extra: '',
    actuality:'active',
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
  const [songLoading, setSongLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { session } = useAuth();

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  };

useEffect(() => {
  const fetchEngSongs = async () => {
    try {
      const { data, error } = await supabase.from("engSongs").select("*");
      if (error) throw new Error("Помилка завантаження стандартного списку");

      setEngSongs([...(data as Song[])].sort((a, b) => a.name.localeCompare(b.name)));
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

  supabase
    .from("engSongs")
    .update({
      name: changeEng.name,
      duration: changeEng.duration,
      extra: changeEng.extra,
      actuality: changeEng.actuality
    })
    .eq("id", changeEng.id)
    .select()
    .then(({ data, error }) => {
      if (error) {
        setError(error.message);
        return;
      }
      setEngSongs(prev => prev.map(s => (s.id === data?.[0]?.id ? data[0] : s)));
      setChangeEng({
        id: '',
        name: '',
        duration: '',
        extra: '',
        actuality:'',
      });
    });
  }

  const deleteEngSong = (id: string) => {
    supabase
      .from("engSongs")
      .delete()
      .eq("id", id)
      .then(({ error }) => {
        if (error) {
          setError(error.message);
          return;
        }
        setEngSongs(prev => prev.filter(s => s.id !== id));
      });
  }

  const isFormValid =
    addEng.name.trim() !== '' &&
    /^\d{2}:\d{2}$/.test(addEng.duration);

  const addSong = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addEng) return;
    setSongLoading(true);

    const newSong: Song = {
      name: addEng.name,
      duration: addEng.duration,
      extra: addEng.extra,
      actuality: addEng.actuality,
    };

    try {
      const { data, error } = await supabase.from("engSongs").insert(newSong).select();
      if (error) {
        setError(error.message);
        return;
      }
      if(data) {
        setSuccess(true);
      }
      setEngSongs(prev => [...prev, data?.[0]]);
      setAddEng({
        name: '',
        duration: '',
        extra: '',
        actuality:'active',
      });
    } finally {
      setSongLoading(false);

      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    }
  }

  if (loading) return <p>Loading...</p>;
  if (error) return <p style={{ color: "red" }}>Помилка: {error}</p>;

  return (
    <div className="bg-slate-100 border rounded-2xl">
      <div className="flex justify-between pl-4 pt-4 pr-4 mb-2 pb-0">
        <h2
          onClick={scrollToForm}
          className="bg-amber-400 text-white rounded-2xl p-1 flex items-center justify-center cursor-pointer transform-color duration-300 ease-in hover:bg-amber-500">Create PDF</h2>
        <h2
          onClick={scrollToForm}
          className="bg-amber-400 text-white rounded-2xl p-1 flex items-center justify-center cursor-pointer transform-color duration-300 ease-in hover:bg-amber-500">Add new song</h2>
      </div>
      <ul>
        <SongCard
          songs={engSongs}
          changeSong={changeEngSong}
          setChangeSong={setChangeEng}
          deleteSong={deleteEngSong}
        />
      </ul>

      <div ref={formRef}>
      {!session && (
        <LoginForm title="Sign in to add songs" />
      )}

      {session && (
      <form
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
              required
            />
            <input
              className="text-black p-1 border rounded w-full"
              type="text"
              value={addEng.duration}
              placeholder="Song length mm:ss"
              required
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
              value={addEng.actuality}
              onChange={(e) => setAddEng(prev => ({ ...prev, actuality: e.target.value }))}
            >
            <option value="active">Active</option>
            <option value="passive">Passive</option>
          </select>
          </div>
          
        </div>
        <div className="flex justify-center mt-4">
          <button
            type="submit"
            disabled={!isFormValid || songLoading || success}
            className={`text-white w-1/2 px-3 py-1 rounded mb-2
              ${success 
                ? 'cursor-pointer bg-green-500'
                : isFormValid
                  ? 'cursor-pointer bg-blue-500 hover:bg-blue-600'
                  : 'cursor-not-allowed bg-blue-300'}
              transition-colors duration-300 ease-in`}
          >
            {songLoading
            ? 'Song is loading'
            : success 
              ? 'Success!!!'
              : 'Add song'}
          </button>
        </div>
      </form>
      )}
      </div>
    </div>
  );
};
