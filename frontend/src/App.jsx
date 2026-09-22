import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Browse from "./pages/Browse";
import MovieDetail from "./pages/MovieDetail";
import Wishlist from "./pages/Wishlist";
import { WishlistProvider } from "./wishlist";

export default function App() {
  return (
    <WishlistProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Browse />} />
            <Route path="/movie/:id" element={<MovieDetail />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </WishlistProvider>
  );
}
