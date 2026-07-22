import { useEffect, useState } from "react";
import { ChinSongList } from "./ChinSongList";
import { EngSongList } from "./EngSongList";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../auth/useAuth";
import type { Song } from "../types/song";

export const SongGenerator: React.FC = () => {
  const [eng, setEng] = useState<Song[]>([]);
  const [chinese, setChinese] = useState<Song[]>([]);
  const [sets, setSets] = useState<Song[][]>([]);
  const [songGap, setSongGap] = useState<number>(10)

  const [setLength, setSetLength] = useState<number[]>(Array(3).fill(20));
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
  const [isLoading, setIsLoading] = useState(false);

  const songsGap = songGap;
  const hostGap = 60;
  const { session, signOut } = useAuth();

  useEffect(() => {
    setSetLength(prev => {
      const newArr = [...prev];
      if (numSets > prev.length) {
        return [...newArr, ...Array(numSets - prev.length).fill(20)];
      } else {

        return newArr.slice(0, numSets);
      }
    });
  }, [numSets]);

  const handleSetLengthChange = (index: number, value: number) => {
    setSetLength(prev => {
      const newArr = [...prev];
      newArr[index] = value;
      return newArr;
    });
  };

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

  const getSetTotalSeconds = (set: Song[]) =>
    set.reduce((acc, s) => acc + converterToSeconds(s.duration), 0) + songsGap * (set.length - 1) + (host ? hostGap : 0);

  const shuffleArray = <T,>(arr: T[]): T[] => {
    return [...arr].sort(() => Math.random() - 0.5);
  };

  useEffect(() => {
    const fetchEng = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.from("engSongs").select("*");
        if (error) throw error;
        setEng((data as Song[]).filter(song => song.actuality === "active"));
      } catch (error) {
        console.error("Fetch error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    const fetchChin = async () => {
      const { data, error } = await supabase.from("chinSongs").select("*");
      if (error) {
        console.error("Fetch error:", error);
        return;
      }
      const tagged = (data as Song[]).map(song => ({ ...song, chin: 'chin' }));
      setChinese(tagged.filter((filt) => filt.actuality === 'active'));
    };
    fetchEng();
    fetchChin();
  }, []);

  const TARGET_TOLERANCE_SECONDS = 60;

  const generateSets = () => {
    if (!eng.length || !chinese.length) return;
    const extras = selectedExtras();
    const resultSets: Song[][] = [];

    const usedEng = new Set<string>();
    const usedChin = new Set<string>();

    for (let setIndex = 0; setIndex < numSets; setIndex++) {
      const targetSeconds = setLength[setIndex] * 60 - (host ? hostGap : 0);
      const maxSeconds = targetSeconds + TARGET_TOLERANCE_SECONDS;
      const minSeconds = targetSeconds - TARGET_TOLERANCE_SECONDS;

      const result: Song[] = [];
      let total = 0;

      let filteredEng = eng.filter(
        s => s.actuality !== "inactive"
          && (!s.extra || extras.includes(s.extra))
          && !usedEng.has(s.name)
      );
      let filteredChin = chinese.filter(
        s => s.actuality !== "inactive"
          && (!s.extra || extras.includes(s.extra))
          && !usedChin.has(s.name)
      );

      filteredEng = shuffleArray(filteredEng);
      filteredChin = shuffleArray(filteredChin);

      // Gaps go BETWEEN songs, not after the last one, so `total` always
      // matches the real elapsed set length shown to the user.
      const fits = (s: Song) => total + (result.length > 0 ? songsGap : 0) + converterToSeconds(s.duration) <= maxSeconds;
      const take = (s: Song, fromArray: Song[], isEng: boolean) => {
        total += (result.length > 0 ? songsGap : 0) + converterToSeconds(s.duration);
        result.push(s);
        fromArray.splice(fromArray.indexOf(s), 1);
        (isEng ? usedEng : usedChin).add(s.name);
      };

      while (filteredEng.length || filteredChin.length) {
        const firstArray = firstSongEng ? filteredEng : filteredChin;
        const secondArray = firstSongEng ? filteredChin : filteredEng;

        const selectedFirst = firstArray.find(fits);
        if (!selectedFirst) break;
        take(selectedFirst, firstArray, firstSongEng);

        const selectedSecond = secondArray.find(fits);
        if (!selectedSecond) break;
        take(selectedSecond, secondArray, !firstSongEng);
      }

      // Alternation may run out of candidates before reaching the target
      // (e.g. no more English songs). Fill the remaining gap from whichever
      // pool still fits, breaking strict alternation if needed.
      while (total < minSeconds) {
        const nextEng = filteredEng.find(fits);
        const nextChin = filteredChin.find(fits);
        if (!nextEng && !nextChin) break;

        if (nextEng) take(nextEng, filteredEng, true);
        else if (nextChin) take(nextChin, filteredChin, false);
      }

      resultSets.push(result);
    }

    setSets(resultSets);
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

  useEffect(() => {
    if (currentSet === null) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      const zone = target.closest("[data-set-search-zone]");
      const zoneIndex = zone ? Number(zone.getAttribute("data-set-search-zone")) : null;
      const isInsideSearchZone = zoneIndex === currentSet;

      const editor = target.closest("[data-song-editor]");
      const isCurrentEditor = !!editingSong
        && editor?.getAttribute("data-song-editor") === `${editingSong.setIndex}-${editingSong.songIndex}`;

      if (!isInsideSearchZone && !isCurrentEditor) {
        setCurrentSet(null);
        setEditingSong(null);
        setSearch("");
        setDropdownOptions([]);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [currentSet, editingSong]);

  const copyToClipboard = () => {
    const text = sets
      .map((set, i) => {
        const songLines = set.map(song => {
          const displayName = song.name.includes('-')
            ? song.name.slice(song.name.lastIndexOf('-') + 2)
            : song.name;
          const marker = song.chin === 'chin' ? ' 🇨🇳' : '';
          return `${displayName} - ${song.duration}${marker}`;
        }).join("\n");
        return `Set ${i + 1} (${timerGenerator(getSetTotalSeconds(set))}):\n${songLines}`;
      })
      .join("\n\n");
    navigator.clipboard.writeText(text);
    alert("Copied!");
  };

  return (
    <div className="p-4 font-sans space-y-4 bg-slate-100 flex flex-col md:flex-row gap-4">
      <div className="flex-1">
        <div className="flex gap-4 items-center justify-between">
          <div className="flex gap-4">
            <div
              className="border rounded p-2 text-[16px] text-white bg-amber-400 hover:bg-amber-500 transition-colors duration-300 ease-in-out box-border cursor-pointer"
              onClick={(() => {
                setChinListVisible(false)
                setEngListVisible(true)
              })}>
                  English songlist
              </div>
            <div
              className="border rounded p-2 text-[16px] text-white bg-amber-400 hover:bg-amber-500 transition-colors duration-300 ease-in-out box-border cursor-pointer"
              onClick={(() => {
                setChinListVisible(true)
                setEngListVisible(false)
              })}>
                Chinese songlist</div>
          </div>
          {session && (
            <div className="flex items-center gap-2 text-sm">
              <span>Logged in as {session.user.email}</span>
              <button
                onClick={() => signOut()}
                className="bg-slate-500 text-white px-2 py-1 rounded cursor-pointer hover:bg-slate-600"
              >
                Log out
              </button>
            </div>
          )}
        </div>

    <div className="flex flex-col gap-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div>
          <h2>Number of sets</h2>
          <input
            type="number"
            className="border p-2 rounded w-full md:w-48"
            min={1}
            value={numSets}
            onChange={e => 
              Number(e.target.value) < 1
                ? setNumSets(1)
                : setNumSets(Number(e.target.value))
              }
            placeholder="Number of sets"
          />
        </div>

        <div>
          <h2>Songs gap(sec):</h2>
          <input
            type="number"
            className="border p-2 rounded w-full md:w-48"
            min={1}
            value={songGap}
            onChange={e => 
              Number(e.target.value) < 1
                ? setSongGap(1)
                : setSongGap(Number(e.target.value))
            }
            placeholder="Songs gap"
          />
        </div>
      </div>
      <div className="flex flex-row flex-wrap gap-4">
        {setLength.map((length, index) => (
          <div
            key={index}
            className="w-full md:w-[calc(33%-1rem)]">
            <h4>Set {index + 1} length (minutes):</h4>
            <input
              type="number"
              className="border p-2 rounded w-full"
              min={1}
              value={length}
              onChange={e => handleSetLengthChange(index, Number(e.target.value))}
              placeholder="Set length (minutes)"
            />
          </div>
        ))}
      </div>
    </div>

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

    <div className="flex flex-wrap gap-4">
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={host} onChange={() => setHost(!host)} /> Have host?
      </label>
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={firstSongEng} onChange={() => setFirstSongEng(!firstSongEng)} /> Start with Eng Song?
      </label>
    </div>

    <div className="flex gap-2  mb-4">
      <button
        onClick={generateSets}
        disabled={isLoading}
        className={`px-4 py-2 rounded transition-colors duration-300 ease-in cursor-pointer
          ${isLoading 
            ? "bg-slate-400 cursor-not-allowed"
            : "bg-blue-500 text-white hover:bg-blue-700"}`}
      >
          {isLoading ? "Loading..." : "Generate List"}
        </button>
      <button onClick={copyToClipboard} className="bg-blue-500 text-white px-4 py-2 rounded transition-colors duration-300 ease-in hover:bg-blue-700 cursor-pointer">Copy List</button>
    </div>

    <div className="space-y-4">
      {sets.map((set, setIndex) => {
        const totalSeconds = getSetTotalSeconds(set);
        return (
          <div key={setIndex} className="border bg-white p-4 rounded relative">
            <h3 className="font-bold mb-2">Set {setIndex + 1}</h3>
            <p className="mb-2">Total Set length: {timerGenerator(totalSeconds)}</p>

            <ul className="mb-2 space-y-1">
              {set.map((song, songIndex) => (
                <li key={song.id} className="flex items-center gap-2">
                  <input
                    data-song-editor={`${setIndex}-${songIndex}`}
                    className="border p-1 rounded flex-1"
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
                  <span className="border p-1 rounded w-20 text-center bg-slate-100 text-slate-700 shrink-0">
                    {song.duration}
                  </span>
                  <span className="w-6 text-center shrink-0">
                    {song.chin === 'chin' ? '🇨🇳' : ''}
                  </span>
                </li>
              ))}
            </ul>

            <div data-set-search-zone={setIndex} className="mb-2 relative">
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
                      className="p-1 cursor-pointer hover:bg-slate-200"
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
                      {s.name} - {s.duration} {s.chin === 'chin' ? '🇨🇳' : ''}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => addSongToSet(setIndex)}
                className="bg-green-500 transform-color duration-300 ease-in text-white px-2 cursor-pointer hover:bg-green-600 py-1 rounded"
                disabled={!selectedSong}
              >
                Add Song
              </button>
              <button
                onClick={() => removeSong(setIndex)}
                className="bg-red-500 text-white px-2 py-1 rounded cursor-pointer transform-color duration-300 ease-in hover:bg-red-600"
              >
                Remove Song
              </button>
            </div>
          </div>
        );
      })}
    </div>
      </div>
        <div className="w-full md:w-1/2">
          {chinListVisible 
          ? (<div><ChinSongList /></div>)
          : null}

          {engListVisible 
            ? (<div><EngSongList /></div>)
            : null}
        </div>
    </div>
  );
};
