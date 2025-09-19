/* eslint-disable @typescript-eslint/no-empty-object-type */
/* eslint-disable @typescript-eslint/no-unused-expressions */
import React, { useEffect, useState } from "react";
import { ChinSongList } from "./ChinSongList";
import { EngSongList } from "./EngSongList";

interface Song {
  id: string;
  name: string;
  duration: string;
  extra?: string;
  popularity?: boolean;
  actuality?: "active" | "inactive";
}

interface SetSong extends Song {}

export const SongGenerator: React.FC = () => {
  const [eng, setEng] = useState<Song[]>([]);
  const [chinese, setChinese] = useState<Song[]>([]);
  const [sets, setSets] = useState<SetSong[][]>([]);
  const [songGap, setSongGap] = useState<number>(10)

  const [setLength, setSetLength] = useState<number>(20);
  const [numSets, setNumSets] = useState<number>(3);

  const [holidays, setHolidays] = useState(false);
  const [christmas, setChristmas] = useState(false);
  const [chinNewYear, setChinNewYear] = useState(false);

  const [host, setHost] = useState(false);
  const [firstSongEng, setFirstSongEng] = useState(false);

  const [search, setSearch] = useState("");
  const [dropdownOptions, setDropdownOptions] = useState<Song[]>([]);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);

  const [currentSet, setCurrentSet] = useState<number | null>(null);
  const [editingSong, setEditingSong] = useState<{ setIndex: number; songIndex: number } | null>(null);

  const [chinListVisible, setChinListVisible] = useState(false);
  const [engListVisible, setEngListVisible] = useState(false);

  const songsGap = songGap;
  const hostGap = 60;
  const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFta2R5YXF0aGlwZW1pbXZvb3Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwODkwODksImV4cCI6MjA3MzY2NTA4OX0.KS4J9xZA-1yScHmtbjAfKfeHTa2ewqwyo6lOMUp8F_w';

  const selectedExtras = () => {
    const arr: string[] = [];
    if (holidays) arr.push("holidays");
    if (christmas) arr.push("christmas");
    if (chinNewYear) arr.push("chinNewYear");
    return arr;
  };

  const converterToSeconds = (time: string) => {
    if (!time || !/^\d{1,2}:\d{2}$/.test(time)) return 0;
    const [m, s] = time.split(":").map(Number);
    return m * 60 + s;
  };

  const timerGenerator = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const shuffleArray = <T,>(arr: T[]): T[] => {
    return [...arr].sort(() => Math.random() - 0.5);
  };

  // ===== Fetch songs from API =====
  useEffect(() => {
    const fetchEng = async () => {
      const res = await fetch("https://qmkdyaqthipemimvoovy.supabase.co/rest/v1/engSongs", {
        headers: {
          'apikey': apiKey,
          'Authorization': apiKey,
        }
      });
      const data: Song[] = await res.json();
      setEng(data.filter((filt) => filt.actuality === 'active'));
    };
    const fetchChin = async () => {
      const res = await fetch("https://qmkdyaqthipemimvoovy.supabase.co/rest/v1/chinSongs", {
        headers: {
          'apikey': apiKey,
          'Authorization': apiKey,
        }
      });
      const data: Song[] = await res.json();
      setChinese(data.filter((filt) => filt.actuality === 'active'));
    };
    fetchEng();
    fetchChin();
  }, []);

  // ===== Generate Sets =====
  const generateSets = () => {
    if (!eng.length || !chinese.length) return;
    const extras = selectedExtras();
    const resultSets: SetSong[][] = [];

    for (let setIndex = 0; setIndex < numSets; setIndex++) {
      let count = setLength * 60 - (host ? hostGap : 0);

      const selectedEng = new Set<string>();
      const selectedChin = new Set<string>();
      const result: SetSong[] = [];

      let filteredEng = eng.filter(s => s.actuality !== "inactive" && (!s.extra || extras.includes(s.extra)));
      let filteredChin = chinese.filter(s => s.actuality !== "inactive" && (!s.extra || extras.includes(s.extra)));

      filteredEng = shuffleArray(filteredEng);
      filteredChin = shuffleArray(filteredChin);

      while (count > 0 && (filteredEng.length || filteredChin.length)) {
        const firstArray = firstSongEng ? filteredEng : filteredChin;
        const secondArray = firstSongEng ? filteredChin : filteredEng;

        const selectedFirst = firstArray.find(s => converterToSeconds(s.duration) <= count && !selectedEng.has(s.name) && !selectedChin.has(s.name));
        if (!selectedFirst) break;

        result.push(selectedFirst);
        count -= converterToSeconds(selectedFirst.duration) + songsGap;
        firstSongEng ? selectedEng.add(selectedFirst.name) : selectedChin.add(selectedFirst.name);
        firstArray.splice(firstArray.indexOf(selectedFirst), 1);

        const selectedSecond = secondArray.find(s => converterToSeconds(s.duration) <= count && !selectedEng.has(s.name) && !selectedChin.has(s.name));
        if (!selectedSecond) break;

        result.push(selectedSecond);
        count -= converterToSeconds(selectedSecond.duration) + songsGap;
        firstSongEng ? selectedChin.add(selectedSecond.name) : selectedEng.add(selectedSecond.name);
        secondArray.splice(secondArray.indexOf(selectedSecond), 1);
      }

      resultSets.push(result);
    }

    setSets(resultSets);
  };

  const updateSong = (setIndex: number, songIndex: number, field: "name" | "duration", value: string) => {
    setSets(prev => {
      const copy = [...prev];
      copy[setIndex][songIndex] = { ...copy[setIndex][songIndex], [field]: value };
      return copy;
    });
  };

  const removeSong = (setIndex: number) => {
    setSets(prev => {
      const copy = [...prev];
      copy[setIndex] = copy[setIndex].slice(0, -1);
      return copy;
    });
  };

  const addSongToSet = (setIndex: number) => {
    if (!selectedSong) return;

    setSets(prev => {
      const copy = [...prev];
      copy[setIndex] = [...(copy[setIndex] || []), selectedSong];
      return copy;
    });

    setSearch("");
    setDropdownOptions([]);
    setSelectedSong(null);
  };

  useEffect(() => {
    if (!search) {
      setDropdownOptions([]);
      return;
    }
    const combined = [...eng, ...chinese];
    const filtered = combined.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
    setDropdownOptions(filtered);
    if (filtered.length === 0) setSelectedSong(null);
  }, [search, eng, chinese]);

  const copyToClipboard = () => {
    const text = sets
      .map((set, i) => `Set ${i + 1}:\n${set.map(song => `${song.name.includes('-')
        ? song.name.slice(song.name.lastIndexOf('-') + 2)
        : song.name
      } - ${song.duration}`).join("\n")}`)
      .join("\n\n");
    navigator.clipboard.writeText(text);
    alert("Copied!");
  };

  console.log(chinListVisible)

  return (
    <div className="p-4 font-sans space-y-4 bg-pink-200 flex gap-4">
      <div>
        <div className="flex gap-4">
          <div 
            className="border rounded p-2 text-[16px] bg-amber-300 hover:bg-amber-400 box-border"
            onClick={(() => {
              setChinListVisible(false)
              setEngListVisible(true)
            })}>
                English songlist
            </div>
          <div
            className="border rounded p-2 text-[16px] bg-amber-300 hover:bg-amber-400 box-border"
            onClick={(() => {
              setChinListVisible(true)
              setEngListVisible(false)
            })}>
              Chinese songlist</div>
        </div>
    {/* Inputs for set length and num sets */}
    <div className="flex flex-col md:flex-row gap-4">
      <div>
        <h2>Set Length (minutes)</h2>
        <input
          type="number"
          className="border p-2 rounded w-full md:w-48"
          min={1}
          value={setLength}
          onChange={e => setSetLength(Number(e.target.value))}
          placeholder="Set length (minutes)"
        />
      </div>
      
      <div>
        <h2>Number of sets</h2>
        <input
          type="number"
          className="border p-2 rounded w-full md:w-48"
          min={1}
          value={numSets}
          onChange={e => setNumSets(Number(e.target.value))}
          placeholder="Number of sets"
        />
      </div>

      <div>
        <h2>Songs gap</h2>
        <input
          type="number"
          className="border p-2 rounded w-full md:w-48"
          min={1}
          value={songGap}
          onChange={e => setSongGap(Number(e.target.value))}
          placeholder="Songs gap"
        />
      </div>
    </div>

    {/* Checkboxes for extras */}
    <div className="flex flex-wrap gap-4">
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={holidays} onChange={() => setHolidays(!holidays)} /> Weekend/Holidays
      </label>
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={christmas} onChange={() => setChristmas(!christmas)} /> Christmas/NewYear
      </label>
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={chinNewYear} onChange={() => setChinNewYear(!chinNewYear)} /> Chinese New Year
      </label>
    </div>

    {/* Host and first song */}
    <div className="flex flex-wrap gap-4">
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={host} onChange={() => setHost(!host)} /> Have host?
      </label>
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={firstSongEng} onChange={() => setFirstSongEng(!firstSongEng)} /> Start with Eng Song?
      </label>
    </div>

    <div className="flex gap-2">
      <button onClick={generateSets} className="bg-blue-500 text-white px-4 py-2 rounded">Generate List</button>
      <button onClick={copyToClipboard} className="bg-green-500 text-white px-4 py-2 rounded">Copy List</button>
    </div>

    <div className="space-y-4">
      {sets.map((set, setIndex) => {
        const totalSeconds = set.reduce((acc, s) => acc + converterToSeconds(s.duration), 0) + songsGap * (set.length - 1) + (host ? hostGap : 0);
        return (
          <div key={setIndex} className="border p-4 rounded relative">
            <h3 className="font-bold mb-2">Set {setIndex + 1}</h3>
            <p className="mb-2">Total Set length: {timerGenerator(totalSeconds)}</p>

            <ul className="mb-2 space-y-1">
              {set.map((song, songIndex) => (
                <li key={song.id} className="flex justify-between items-center gap-2">
                  <input
                    className="border p-1 rounded w-2/3"
                    value={
                      editingSong && editingSong.setIndex === setIndex && editingSong.songIndex === songIndex
                        ? search
                        : song.name.includes('-')
                          ? song.name.slice(song.name.lastIndexOf('-') + 2)
                          : song.name
                    }
                    onFocus={() => {
                      setCurrentSet(setIndex);
                      setEditingSong({ setIndex, songIndex });
                      setSearch(song.name);
                    }}
                    onChange={e => {
                      setCurrentSet(setIndex);
                      setEditingSong({ setIndex, songIndex });
                      setSearch(e.target.value);
                    }}
                  />
                  <input
                    className="border p-1 rounded w-20 text-center"
                    value={song.duration}
                    onChange={e => updateSong(setIndex, songIndex, "duration", e.target.value)}
                    pattern="\d{2}:\d{2}"
                    placeholder="mm:ss"
                  />
                </li>
              ))}
            </ul>

            {/* Search dropdown */}
            <div className="mb-2 relative">
              <input
                type="text"
                placeholder="Search song..."
                className="border p-1 rounded w-full"
                value={currentSet === setIndex ? search : ""}
                onChange={e => {
                  setCurrentSet(setIndex);
                  setSearch(e.target.value);
                }}
              />
              {currentSet === setIndex && dropdownOptions.length > 0 && (
                <ul className="absolute bg-white border w-full max-h-40 overflow-auto z-10">
                  {dropdownOptions.map(s => (
                    <li
                      key={s.id}
                      className="p-1 cursor-pointer hover:bg-gray-200"
                      onClick={() => {
                        if (editingSong) {
                          setSets(prev => {
                            const copy = [...prev];
                            copy[editingSong.setIndex][editingSong.songIndex] = { ...s };
                            return copy;
                          });
                          setEditingSong(null);
                        } else {
                          addSongToSet(currentSet!);
                        }
                        setSelectedSong(s);
                        setSearch("");
                        setDropdownOptions([]);
                      }}
                    >
                      {s.name} - {s.duration}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => addSongToSet(setIndex)}
                className="bg-yellow-500 text-white px-2 py-1 rounded"
                disabled={!selectedSong}
              >
                Add Song
              </button>
              <button
                onClick={() => removeSong(setIndex)}
                className="bg-red-500 text-white px-2 py-1 rounded"
              >
                Remove Song
              </button>
            </div>
          </div>
        );
      })}
    </div>
      </div>
      {chinListVisible 
        ? (<div><ChinSongList /></div>)
        : null}

      {engListVisible 
        ? (<div><EngSongList /></div>)
        : null}

    </div>
  );
};
