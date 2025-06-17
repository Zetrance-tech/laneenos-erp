import React from "react";
import { Navigate, Route, Routes } from "react-router";
import { authRoutes, publicRoutes, protectedPublicRoutes } from "./router.link";
import Feature from "../feature";
import AuthFeature from "../authFeature";
import Login from "../auth/login/login";
import ProtectedFeature from "../protectedFeature";
const ALLRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route element={<Feature />}>
        {publicRoutes.map((route, idx) => (
          <Route path={route.path} element={route.element} key={idx} />
        ))}
      </Route>
      <Route element={<ProtectedFeature />}>
        {protectedPublicRoutes.map((route, idx) => (
          <Route
            element={<ProtectedFeature />}
            key={idx}
          >
            <Route path={route.path} element={route.element} />
          </Route>
        ))}
      </Route>
      {authRoutes.map((route, idx) => (
        <Route
          element={<AuthFeature/>}
          key={idx}
        >
          <Route path={route.path} element={route.element} />
        </Route>
      ))}
    </Routes>
  );
};

export default ALLRoutes;
