import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;

export const getToken = async (request?: Request) => {
  const cookieStore = await cookies();
  // Check multiple cookie names
  let token = cookieStore.get("atc_token")?.value || 
              cookieStore.get("admin_token")?.value || 
              cookieStore.get("auth_token")?.value || "";
  
  if (!token && request) {
    const auth = request.headers.get("Authorization") ?? "";
    token = auth.replace("Bearer ", "");
  }

  return token;
};

export const verifyAdmin = async (request?: Request) => {
  const token = await getToken(request);
  if (!token) return null;
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
    if (decoded.role !== "admin") return null;
    return decoded;
  } catch {
    return null;
  }
};

export const verifyAtc = async (request?: Request) => {
  const token = await getToken(request);
  if (!token) return null;
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string; tpCode: string };
    if (decoded.role !== "atc") return null;
    return decoded;
  } catch {
    return null;
  }
};

