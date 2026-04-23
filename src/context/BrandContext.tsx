"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

interface BrandContextType {
  brandName: string;
  loading: boolean;
}

const BrandContext = createContext<BrandContextType>({
  brandName: "Yukti Computer Education",
  loading: true,
});

export const BrandProvider = ({ children }: { children: React.ReactNode }) => {
  const [brandName, setBrandName] = useState("Yukti Computer Education");
  const [loading, setLoading] = useState(true);

  const fetchBrand = async () => {
    try {
      const res = await fetch("/api/admin/settings?key=brand_name");
      const data = await res.json();
      if (data.value) setBrandName(data.value);
    } catch (err) {
      console.error("Failed to fetch brand name", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrand();
  }, []);

  return (
    <BrandContext.Provider value={{ brandName, loading }}>
      {children}
    </BrandContext.Provider>
  );
};

export const useBrand = () => useContext(BrandContext);
