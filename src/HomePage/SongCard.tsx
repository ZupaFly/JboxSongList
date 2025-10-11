import type { FC } from "react";
import { useRef, useState } from "react";
import change from '../images/412-4127471_notepad-pen-svg-png-icon-free-download-notepad.png';
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface Song {
  id?: string;
  name: string;
  duration: string;
  extra?: string;
  actuality?: string;
  chin?: string;
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
  chin?: string;
}

export const SongCard: FC<SongCardProps> = ({ songs, changeSong, setChangeSong, chin }) => {
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [exportFile, setExportFile] = useState<boolean>(true);
  const [password, setPassword] =  useState(false);
  const [enteredPassword, setEnteredPassword] = useState<string>('');
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const focusInput = () => inputRef.current?.focus();
  const pass = '12345';

  const checkPassword = () => {
  if (enteredPassword === pass) {
    setPassword(true);
  }
  setError(true);
};

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

const exportToPDF = async () => {
  if (!printRef.current) return;
  setExportFile(false);

  try {
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    let yOffset = 0;

    const children = Array.from(printRef.current.children) as HTMLElement[];

    for (let i = 0; i < children.length; i++) {
      const el = children[i];

      const canvas = await html2canvas(el, {
        scale: 2,
        backgroundColor: null,
        onclone: (clonedDoc) => {

          const clonedButtons = clonedDoc.querySelectorAll('button');
          clonedButtons.forEach(btn => {
            (btn as HTMLElement).style.textAlign = "left";
            (btn as HTMLElement).style.justifyContent = "left";
            (btn as HTMLElement).style.background = "transparent";
          });
        }
      });

      const imgData = canvas.toDataURL("image/png");
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      if (yOffset + imgHeight > pdfHeight) {
        pdf.addPage();
        yOffset = 0;
      }

      pdf.addImage(imgData, "PNG", 0, yOffset, pdfWidth, imgHeight);
      yOffset += imgHeight;
    }

    const pdfBlob = pdf.output("blob");
    const url = URL.createObjectURL(pdfBlob);
    window.open(url, "_blank");
    setExportFile(true);

  } catch (error) {
    console.error("PDF export error:", error);
  }
};

  return (
    <>
    <div ref={printRef} className="rounded-[10px] pb-1 mb-1 text-center flex flex-col justify-center items-center px-2 cursor-pointer">
      <h2 className="border-none rounded-[10px] pb-1 mb-1 text-left px-2 cursor-pointer w-full">{`J-box ${chin === 'chin'
        ? 'Chinese'
        : 'English'} Song List:`}</h2>
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
          className="border-none rounded-[10px] pb-1 mb-1 text-left px-2 cursor-pointer w-full z-50 bg-[#eda58f]"
        >
          {index + 1}. {song.name}
        </button>
      ))}

{selectedSong && (
  <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
    <div className="bg-white rounded-xl p-6 max-w-md w-full relative shadow-lg flex flex-col gap-4 z-50">
      {password === true ? (
        <>
          <h2 className="text-xl font-bold">Update song information</h2>

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
              className="px-4 py-2 bg-gray-300 rounded cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              style={{ backgroundColor: '#3B82F6'}}
              className="px-4 py-2 text-white rounded cursor-pointer"
            >
              Save changes
            </button>
          </div>
        </>
      ) : (
        <>
          <h2 className="text-xl font-bold">Enter the password:</h2>
          <div className="flex flex-col items-left">
            <div className="flex items-center gap-2 mt-4">
              <input
                ref={inputRef}
                type="password"
                value={enteredPassword}
                onChange={(e) => setEnteredPassword(e.target.value)}
                className="border p-1 rounded flex-1"
              />
              <button
                type="button"
                onClick={checkPassword}
                className="px-3 py-1 bg-blue-500 text-white rounded cursor-pointer"
              >
                OK
              </button>
            </div>
              {error && (
                <div className="text-red-600 text-left">Wrong Password...</div>
              )}
          </div>
        </>
      )}
    </div>
  </div>
)}
    </div>
      <button
        onClick={exportToPDF}
        className="mt-4 px-4 py-2 bg-blue-500 transform-color duration-300 ease-in text-white rounded hover:bg-blue-600 cursor-pointer"
      >
        {`${exportFile
          ? 'Export to PDF'
          : 'Exporting...'
        }`}
      </button>
    </>
  );
};
