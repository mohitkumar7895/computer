"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

interface BrandContextType {
  brandName: string;
  brandMobile: string;
  brandEmail: string;
  brandAddress: string;
  brandUrl: string;
  brandLogo: string;
  loading: boolean;
}

const BrandContext = createContext<BrandContextType>({
  brandName: "Yukti Computer Education",
  brandMobile: "",
  brandEmail: "",
  brandAddress: "",
  brandUrl: "",
  brandLogo: "",
  loading: true,
});

export const BrandProvider = ({ children }: { children: React.ReactNode }) => {
  const [brandName, setBrandName] = useState("Yukti Computer Education");
  const [brandMobile, setBrandMobile] = useState("");
  const [brandEmail, setBrandEmail] = useState("");
  const [brandAddress, setBrandAddress] = useState("");
  const [brandUrl, setBrandUrl] = useState("");
  const [brandLogo, setBrandLogo] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchBrand = async () => {
    try {
      const bRes = await fetch("/api/admin/settings?key=brand_name");
      const bData = await bRes.json();
      if (bData.value) setBrandName(bData.value);

      const bmRes = await fetch("/api/admin/settings?key=brand_mobile");
      const bmData = await bmRes.json();
      if (bmData.value) setBrandMobile(bmData.value);

      const beRes = await fetch("/api/admin/settings?key=brand_email");
      const beData = await beRes.json();
      if (beData.value) setBrandEmail(beData.value);

      const baRes = await fetch("/api/admin/settings?key=brand_address");
      const baData = await baRes.json();
      if (baData.value) setBrandAddress(baData.value);

      const buRes = await fetch("/api/admin/settings?key=brand_url");
      const buData = await buRes.json();
      if (buData.value) setBrandUrl(buData.value);

      const blRes = await fetch("/api/admin/settings?key=brand_logo");
      const blData = await blRes.json();
      if (blData.value) setBrandLogo(blData.value);
    } catch (err) {
      console.error("Failed to fetch brand settings", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrand();
  }, []);

  return (
    <BrandContext.Provider value={{ brandName, brandMobile, brandEmail, brandAddress, brandUrl, brandLogo, loading }}>
      {children}
    </BrandContext.Provider>
  );
};

export const useBrand = () => useContext(BrandContext);
