import { HashRouter, Route, Routes } from "react-router-dom";
import { SongGenerator } from './HomePage/SongGenerator'
import './App.css'
import { ChinSongList } from "./HomePage/ChinSongList";
import { AuthProvider } from "./auth/AuthContext";

export const Root = () => {
  return (
    <AuthProvider>
        <HashRouter>
          <Routes>
            <Route path="/" element={<SongGenerator />} />
            <Route path="/chinsonglist" element={<ChinSongList />} />
          </Routes>
        </HashRouter>
    </AuthProvider>
  );
};