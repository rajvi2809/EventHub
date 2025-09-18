import { Route, Routes } from "react-router-dom";
import Home from "../components/home";

export default function allRoutes() {
  return (
    <>
      <Routes>
        <Route index element={<Home />}></Route>
      </Routes>
    </>
  );
}
