export type NavChildLink = {
  label: string;
  href: string;
};

export type NavLink = {
  label: string;
  href: string;
  children?: NavChildLink[];
};

export const NAV_LINKS: NavLink[] = [
  { label: "HOME", href: "/" },
  {
    label: "ABOUT US",
    href: "#about",
    children: [
      { label: "About Institute", href: "/about-institute" },
      { label: "Director Message", href: "/director-message" },
      { label: "Our Mission", href: "/our-mission" },
      { label: "Our Vision", href: "/our-vision" },
    ],
  },
  {
    label: "STUDENTS ZONE",
    href: "/student-zone/registration-process",
    children: [
      { label: "Registration Process", href: "/student-zone/registration-process" },
      { label: "Direct Admission", href: "/direct-admission" },
      { label: "Examination Process", href: "/student-zone/examination-process" },
      { label: "Online Exam", href: "/online-exam" },
      { label: "Download Admit Card", href: "/student-zone/download-admit-card" },
      { label: "Registered Student", href: "/student-zone/registered-student" },
      { label: "Certificate Verification", href: "/student-zone/certification-verification" },
    ],
  },
  { label: "COURSES OFFERED", href: "/courses-offered" },
  {
    label: "AFFILIATION PROCESS",
    href: "/affiliation-process",
    children: [
      { label: "Affiliation Process", href: "/affiliation-process" },
      { label: "Become ATC", href: "/become-atc" },
      { label: "ALC Login", href: "/franchise-login" },
    ],
  },
  { label: "GALLERY", href: "/gallery" },
  {
    label: "LOGIN",
    href: "/web-login",
    children: [
      { label: "Web Login", href: "/web-login" },
      { label: "FMS Login", href: "/fms-login" },
    ],
  },
  { label: "CONTACT US", href: "/contact-us" },
];

export const SITE_INFO = {
  name: "Yukti Computer Institute",
  tagline: "Learn industry-ready skills from experts.",
  email: "info@yukticomputer.com",
  phone: "+91 9272638590",
  address: "Shop No 208 above Bank of Baroda Mahavir market Ostwal Empire Boisar, Boisar, Maharashtra 401501",
  hours: "Mon - Sat : 09:00 A.M. - 5:00 P.M.",
  designer: "WEBTECH IT SOLUTIONS",
  mapEmbedUrl:
    "https://www.google.com/maps?q=Yukti%20Computer%20Institute%20Boisar&z=15&output=embed",
};

export const SOCIAL_LINKS = [
  { label: "Facebook", href: "https://facebook.com" },
  { label: "Twitter", href: "https://twitter.com" },
  { label: "YouTube", href: "https://youtube.com" },
  { label: "Google", href: "https://google.com" },
];

export const FOOTER_LINKS = [
  { label: "Home", href: "#home" },
  { label: "About Us", href: "#about" },
  { label: "Courses", href: "/courses-offered" },
  { label: "Contact", href: "/contact-us" },
  { label: "Director's Message", href: "#about" },
];
