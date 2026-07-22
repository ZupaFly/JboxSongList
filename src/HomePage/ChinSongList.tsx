/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import { SongCard } from "./SongCard";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../auth/useAuth";
import { LoginForm } from "../auth/LoginForm";
import type { Song } from "../types/song";

export const ChinSongList = () => {
  const formRef = useRef<HTMLDivElement>(null);
  const [chinSongs, setChinSongs] = useState<Song[]>([]);
  const [addChin, setAddChin] = useState({
    name: '',
    duration: '',
    extra: '',
    actuality:'active',
  });

  const [changeChin, setChangeChin] = useState<{
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
  const fetchChinSongs = async () => {
    try {
      const { data, error } = await supabase.from("chinSongs").select("*");
      if (error) throw new Error("Помилка завантаження стандартного списку");

      setChinSongs([...(data as Song[])].sort((a, b) => a.name.localeCompare(b.name)));
    } catch (err:any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  fetchChinSongs();
}, []);

const changeChinSong = (song: Song) => {
  if (!song) return;

  supabase
    .from("chinSongs")
    .update({
      name: changeChin.name,
      duration: changeChin.duration,
      extra: changeChin.extra,
      actuality: changeChin.actuality
    })
    .eq("id", changeChin.id)
    .select()
    .then(({ data, error }) => {
      if (error) {
        setError(error.message);
        return;
      }
      setChinSongs(prev => prev.map(s => (s.id === data?.[0]?.id ? data[0] : s)));
      setChangeChin({
        id: '',
        name: '',
        duration: '',
        extra: '',
        actuality:'',
      });
    });
  }

  const deleteChinSong = (id: string) => {
    supabase
      .from("chinSongs")
      .delete()
      .eq("id", id)
      .then(({ error }) => {
        if (error) {
          setError(error.message);
          return;
        }
        setChinSongs(prev => prev.filter(s => s.id !== id));
      });
  }

  const isFormValid =
    addChin.name.trim() !== '' &&
    /^\d{2}:\d{2}$/.test(addChin.duration);

  const addSong = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addChin) return;
    setSongLoading(true);

    const newSong: Song = {
      name: addChin.name,
      duration: addChin.duration,
      extra: addChin.extra,
      actuality: addChin.actuality,
    };

    try {
      const { data, error } = await supabase.from("chinSongs").insert(newSong).select();
      if (error) {
        setError(error.message);
        return;
      }
      if(data) {
        setSuccess(true);
      }
      setChinSongs(prev => [...prev, data?.[0]]);
      setAddChin({
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

  if (loading) return <p>Завантаження...</p>;
  if (error) return <p style={{ color: "red" }}>Помилка: {error}</p>;

  return (
    <div className="bg-slate-100 border-none rounded-2xl">
      <div className="flex justify-between pl-4 pt-4 pr-4 mb-2 pb-0">
        <h2 onClick={scrollToForm}
          className="bg-amber-400 text-white rounded-2xl p-1 flex items-center justify-center cursor-pointer transform-color duration-300 ease-in hover:bg-amber-500">Create PDF</h2>
        <h2
          onClick={scrollToForm}
          className="bg-amber-400 text-white rounded-2xl p-1 flex items-center justify-center cursor-pointer transform-color duration-300 ease-in hover:bg-amber-500">Add new song</h2>
      </div>
      <ul>
        <SongCard
          songs={chinSongs}
          changeSong={changeChinSong}
          setChangeSong={setChangeChin}
          deleteSong={deleteChinSong}
          chin={'chin'}
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
              value={addChin.name}
              placeholder="Song name"
              onChange={(e) => setAddChin(prev => ({...prev, name: e.target.value}))}
            />
            <input
              className="text-black p-1 border rounded w-full"
              type="text"
              value={addChin.duration}
              placeholder="Song length mm:ss"
              onChange={(e) => {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length > 4) value = value.slice(0, 4);
                if (value.length > 2) {
                  value = value.slice(0, 2) + ':' + value.slice(2);
                }

                setAddChin(prev => ({ ...prev, duration: value }));
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
                  checked={addChin.extra === 'chinNewYear'}
                  onChange={(e) => setAddChin(prev => ({...prev, extra: e.target.value}))}
                />
                <h5 className="flex items-center justify-center">Chinese New Year</h5>
              </div>

              <div className="flex gap-4 content-center">
                <input
                  className="text-black p-1 border rounded flex items-center justify-center"
                  type="checkbox"
                  value='holidays'
                  checked={addChin.extra === 'holidays'}
                  onChange={(e) => setAddChin(prev => ({...prev, extra: e.target.value}))}
                />
                <h5 className="flex items-center justify-center">Holidays</h5>
              </div>

              <div className="flex gap-4 content-center">
                <input
                  className="text-black p-1 border rounded flex items-center justify-center"
                  type="checkbox"
                  value='christmas'
                  checked={addChin.extra === 'christmas'}
                  onChange={(e) => setAddChin(prev => ({...prev, extra: e.target.value}))}
                />
                <h5 className="flex items-center justify-center">Christmas</h5>
              </div>
            </div>

            <select
              className="text-black p-1 border rounded w-full"
              value={addChin.actuality}
              onChange={(e) => setAddChin(prev => ({ ...prev, actuality: e.target.value }))}
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
