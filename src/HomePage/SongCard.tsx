import type { FC } from "react";
import { useRef, useState } from "react";
import change from '../images/412-4127471_notepad-pen-svg-png-icon-free-download-notepad.png';

interface Song {
  id?: string;
  name: string;
  duration: string;
  extra?: string;
  actuality?: string;
}

interface SongCardProps {
  songs: Song[];
  changeSong: (song:Song) => void;
  setChangeSong: React.Dispatch<React.SetStateAction<{
    id: string;
    name: string;
    duration: string;
    extra: string;
    actuality: string;
  }>>;
}

export const SongCard: FC<SongCardProps> = ({ songs, changeSong, setChangeSong }) => {
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const focusInput = () => inputRef.current?.focus();

const handleInputChange = (field: keyof Song, value: string) => {
  if (!selectedSong) return;

  const updated = { ...selectedSong, [field]: value };

  setSelectedSong(updated);

  setChangeSong({
    id: updated.id ?? '',
    name: updated.name,
    duration: updated.duration,
    extra: updated.extra ?? '',
    actuality: updated.actuality ?? '',
  });
};

  const handleSave = () => {
    if (!selectedSong) return;
    changeSong(selectedSong);
    setSelectedSong(null);
  };

  return (
    <div className="flex flex-col px-2">
      {songs.map((song, index) => (
        <button
          key={index}
          onClick={() => {
            setSelectedSong(song);
            setChangeSong({
              id: song.id || '',
              name: song.name,
              duration: song.duration,
              extra: song.extra || '',
              actuality: song.actuality || ''
            });
          }}
          className="border-none bg-pink-300 rounded-[10px] pb-1 mb-1 text-left px-2 cursor-pointer"
        >
          {index + 1}. {song.name}
        </button>
      ))}

      {selectedSong && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full relative shadow-lg flex flex-col gap-4">
            <h2 className="text-xl font-bold">Редактирование песни</h2>

            {(['name', 'duration', 'extra', 'actuality'] as (keyof Song)[]).map(field => (
              <div key={field} className="flex items-center gap-2">
                <label className="w-24 capitalize">{field}:</label>
                <input
                  ref={inputRef}
                  type="text"
                  value={selectedSong[field] ?? ''}
                  onChange={(e) => handleInputChange(field, e.target.value)}
                  className="border p-1 rounded flex-1"
                />
                <button
                  type="button"
                  onClick={focusInput}
                  className="w-6 h-6 bg-no-repeat bg-center bg-contain"
                  style={{ backgroundImage: `url(${change})` }}
                />
              </div>
            ))}

            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setSelectedSong(null)}
                className="px-4 py-2 bg-gray-300 rounded"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-2 bg-blue-500 text-white rounded"
              >
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
