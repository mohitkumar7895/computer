"use client";

import { useEffect } from "react";

type Role = "admin" | "atc" | "student";

const titles: Record<Role, string> = {
  admin: "Admin Panel | Yukti Computer Institute",
  atc: "Institute Panel | Yukti Computer Institute",
  student: "Student Panel | Yukti Computer Institute",
};

export const usePageTitle = (role: Role) => {
  useEffect(() => {
    const newTitle = titles[role] || "Yukti Computer Institute";
    if (document.title !== newTitle) {
      document.title = newTitle;
    }
  }, [role]);
};
