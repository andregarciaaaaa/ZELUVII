const { useState, useMemo, useRef, useEffect } = React;

const ICON_PATHS = {
  AlertTriangle: `<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
  <path d="M12 9v4" />
  <path d="M12 17h.01" />`,
  ArrowUpDown: `<path d="m21 16-4 4-4-4" />
  <path d="M17 20V4" />
  <path d="m3 8 4-4 4 4" />
  <path d="M7 4v16" />`,
  Bell: `<path d="M10.268 21a2 2 0 0 0 3.464 0" />
  <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" />`,
  BookOpen: `<path d="M12 5v16" />
  <path d="M20.001 19A2 2 0 0022 17V5a2 2 0 00-1.999-2L16 3.002A5 5 0 0012 5a5 5 0 00-4-2H4a2 2 0 00-2 2v12a2 2 0 001.999 2H8a5 5 0 014 2 5 5 0 014-2z" />`,
  Bot: `<path d="M12 8V4H8" />
  <rect width="16" height="12" x="4" y="8" rx="2" />
  <path d="M2 14h2" />
  <path d="M20 14h2" />
  <path d="M15 13v2" />
  <path d="M9 13v2" />`,
  Building2: `<path d="M10 12h4" />
  <path d="M10 8h4" />
  <path d="M14 21v-3a2 2 0 0 0-4 0v3" />
  <path d="M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2" />
  <path d="M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" />`,
  Calendar: `<path d="M8 2v3" />
  <path d="M16 2v3" />
  <rect x="3" y="3" width="18" height="18" rx="2" />
  <path d="M3 9h18" />`,
  Check: `<path d="M20 6 9 17l-5-5" />`,
  CheckCircle2: `<path d="M21.801 10A10 10 0 1 1 17 3.335" />
  <path d="m9 11 3 3L22 4" />`,
  ChevronDown: `<path d="m6 9 6 6 6-6" />`,
  ChevronLeft: `<path d="m15 18-6-6 6-6" />`,
  ChevronRight: `<path d="m9 18 6-6-6-6" />`,
  ClipboardList: `<rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
  <path d="M12 11h4" />
  <path d="M12 16h4" />
  <path d="M8 11h.01" />
  <path d="M8 16h.01" />`,
  Clock: `<circle cx="12" cy="12" r="10" />
  <path d="M12 6v6l4 2" />`,
  DollarSign: `<line x1="12" x2="12" y1="2" y2="22" />
  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />`,
  DoorOpen: `<path d="M11 20H2" />
  <path d="M11 4.562v16.157a1 1 0 0 0 1.242.97L19 20V5.562a2 2 0 0 0-1.515-1.94l-4-1A2 2 0 0 0 11 4.561z" />
  <path d="M11 4H8a2 2 0 0 0-2 2v14" />
  <path d="M14 12h.01" />
  <path d="M22 20h-3" />`,
  Droplet: `<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" />`,
  Dumbbell: `<path d="M17.596 12.768a2 2 0 1 0 2.829-2.829l-1.768-1.767a2 2 0 0 0 2.828-2.829l-2.828-2.828a2 2 0 0 0-2.829 2.828l-1.767-1.768a2 2 0 1 0-2.829 2.829z" />
  <path d="m2.5 21.5 1.4-1.4" />
  <path d="m20.1 3.9 1.4-1.4" />
  <path d="M5.343 21.485a2 2 0 1 0 2.829-2.828l1.767 1.768a2 2 0 1 0 2.829-2.829l-6.364-6.364a2 2 0 1 0-2.829 2.829l1.768 1.767a2 2 0 0 0-2.828 2.829z" />
  <path d="m9.6 14.4 4.8-4.8" />`,
  FileText: `<path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" />
  <path d="M14 2v5a1 1 0 0 0 1 1h5" />
  <path d="M10 9H8" />
  <path d="M16 13H8" />
  <path d="M16 17H8" />`,
  Filter: `<path d="M2 5h20" />
  <path d="M6 12h12" />
  <path d="M9 19h6" />`,
  Flame: `<path d="M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4" />`,
  GitBranch: `<path d="M15 6a9 9 0 0 0-9 9V3" />
  <circle cx="18" cy="6" r="3" />
  <circle cx="6" cy="18" r="3" />`,
  Home: `<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
  <path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />`,
  Leaf: `<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
  <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />`,
  Lightbulb: `<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
  <path d="M9 18h6" />
  <path d="M10 22h4" />`,
  Loader2: `<path d="M21 12a9 9 0 1 1-6.219-8.56" />`,
  Mail: `<rect width="20" height="16" x="2" y="4" rx="2" />
  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />`,
  LogOut: `<path d="m16 17 5-5-5-5" />
  <path d="M21 12H9" />
  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />`,
  MapPin: `<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
  <circle cx="12" cy="10" r="3" />`,
  Megaphone: `<path d="M11 6a13 13 0 0 0 8.4-2.8A1 1 0 0 1 21 4v12a1 1 0 0 1-1.6.8A13 13 0 0 0 11 14H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" />
  <path d="M6 14a12 12 0 0 0 2.4 7.2 2 2 0 0 0 3.2-2.4A8 8 0 0 1 10 14" />
  <path d="M8 6v8" />`,
  Menu: `<path d="M4 5h16" />
  <path d="M4 12h16" />
  <path d="M4 19h16" />`,
  MessageSquare: `<path d="M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z" />`,
  MoreHorizontal: `<circle cx="12" cy="12" r="1" />
  <circle cx="19" cy="12" r="1" />
  <circle cx="5" cy="12" r="1" />`,
  Package: `<path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z" />
  <path d="M12 22V12" />
  <polyline points="3.29 7 12 12 20.71 7" />
  <path d="m7.5 4.27 9 5.15" />`,
  PartyPopper: `<path d="M5.8 11.3 2 22l10.7-3.79" />
  <path d="M4 3h.01" />
  <path d="M22 8h.01" />
  <path d="M15 2h.01" />
  <path d="M22 20h.01" />
  <path d="m22 2-2.24.75a2.9 2.9 0 0 0-1.96 3.12c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 10" />
  <path d="m22 13-.82-.33c-.86-.34-1.82.2-1.98 1.11c-.11.7-.72 1.22-1.43 1.22H17" />
  <path d="m11 2 .33.82c.34.86-.2 1.82-1.11 1.98C9.52 4.9 9 5.52 9 6.23V7" />
  <path d="M11 13c1.93 1.93 2.83 4.17 2 5-.83.83-3.07-.07-5-2-1.93-1.93-2.83-4.17-2-5 .83-.83 3.07.07 5 2Z" />`,
  Plus: `<path d="M5 12h14" />
  <path d="M12 5v14" />`,
  ScrollText: `<path d="M15 12h-5" />
  <path d="M15 8h-5" />
  <path d="M19 17V5a2 2 0 0 0-2-2H4" />
  <path d="M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3" />`,
  Search: `<path d="m21 21-4.34-4.34" />
  <circle cx="11" cy="11" r="8" />`,
  Send: `<path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z" />
  <path d="m21.854 2.147-10.94 10.939" />`,
  Settings: `<path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915" />
  <circle cx="12" cy="12" r="3" />`,
  Shield: `<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />`,
  ShieldAlert: `<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
  <path d="M12 8v4" />
  <path d="M12 16h.01" />`,
  Smartphone: `<rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
  <path d="M12 18h.01" />`,
  Sparkles: `<path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" />
  <path d="M20 2v4" />
  <path d="M22 4h-4" />
  <circle cx="4" cy="20" r="2" />`,
  Trees: `<path d="M10 10v.2A3 3 0 0 1 8.9 16H5a3 3 0 0 1-1-5.8V10a3 3 0 0 1 6 0Z" />
  <path d="M7 16v6" />
  <path d="M13 19v3" />
  <path d="M12 19h8.3a1 1 0 0 0 .7-1.7L18 14h.3a1 1 0 0 0 .7-1.7L16 9h.2a1 1 0 0 0 .8-1.7L13 3l-1.4 1.5" />`,
  TrendingDown: `<path d="M16 17h6v-6" />
  <path d="m22 17-8.5-8.5-5 5L2 7" />`,
  TrendingUp: `<path d="M16 7h6v6" />
  <path d="m22 7-8.5 8.5-5-5L2 17" />`,
  Truck: `<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
  <path d="M15 18H9" />
  <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
  <circle cx="17" cy="18" r="2" />
  <circle cx="7" cy="18" r="2" />`,
  UserCircle2: `<circle cx="12" cy="12" r="10" />
  <circle cx="12" cy="10" r="3" />
  <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662" />`,
  Users: `<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
  <path d="M16 3.128a4 4 0 0 1 0 7.744" />
  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
  <circle cx="9" cy="7" r="4" />`,
  UtensilsCrossed: `<path d="m16 2-2.3 2.3a3 3 0 0 0 0 4.2l1.8 1.8a3 3 0 0 0 4.2 0L22 8" />
  <path d="M15 15 3.3 3.3a4.2 4.2 0 0 0 0 6l7.3 7.3c.7.7 2 .7 2.8 0L15 15Zm0 0 7 7" />
  <path d="m2.1 21.8 6.4-6.3" />
  <path d="m19 5-7 7" />`,
  Wrench: `<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z" />`,
  X: `<path d="M18 6 6 18" />
  <path d="m6 6 12 12" />`,
  Zap: `<path d="M15.914 4a1.5 1.5 0 00-2.474-1.561l-9 9A1.5 1.5 0 005.5 14h4.002a.5.5 0 01.471.666L8.086 20a1.5 1.5 0 002.475 1.56l9-9A1.5 1.5 0 0018.5 10h-3.997a.5.5 0 01-.472-.667z" />`,
};


function Icon({ name, size = 16, color = "currentColor", style, className, strokeWidth = 2 }) {
  const markup = ICON_PATHS[name];
  if (!markup) return null;
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      style={style} className={className}
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}


function AlertTriangle(props) { return <Icon name="AlertTriangle" {...props} />; }
function ArrowUpDown(props) { return <Icon name="ArrowUpDown" {...props} />; }
function Bell(props) { return <Icon name="Bell" {...props} />; }
function BookOpen(props) { return <Icon name="BookOpen" {...props} />; }
function Bot(props) { return <Icon name="Bot" {...props} />; }
function Building2(props) { return <Icon name="Building2" {...props} />; }
function Calendar(props) { return <Icon name="Calendar" {...props} />; }
function Check(props) { return <Icon name="Check" {...props} />; }
function CheckCircle2(props) { return <Icon name="CheckCircle2" {...props} />; }
function ChevronDown(props) { return <Icon name="ChevronDown" {...props} />; }
function ChevronLeft(props) { return <Icon name="ChevronLeft" {...props} />; }
function ChevronRight(props) { return <Icon name="ChevronRight" {...props} />; }
function ClipboardList(props) { return <Icon name="ClipboardList" {...props} />; }
function Clock(props) { return <Icon name="Clock" {...props} />; }
function DollarSign(props) { return <Icon name="DollarSign" {...props} />; }
function DoorOpen(props) { return <Icon name="DoorOpen" {...props} />; }
function Droplet(props) { return <Icon name="Droplet" {...props} />; }
function Dumbbell(props) { return <Icon name="Dumbbell" {...props} />; }
function FileText(props) { return <Icon name="FileText" {...props} />; }
function Filter(props) { return <Icon name="Filter" {...props} />; }
function Flame(props) { return <Icon name="Flame" {...props} />; }
function GitBranch(props) { return <Icon name="GitBranch" {...props} />; }
function Home(props) { return <Icon name="Home" {...props} />; }
function Leaf(props) { return <Icon name="Leaf" {...props} />; }
function Lightbulb(props) { return <Icon name="Lightbulb" {...props} />; }
function Loader2(props) { return <Icon name="Loader2" {...props} />; }
function LogOut(props) { return <Icon name="LogOut" {...props} />; }
function Mail(props) { return <Icon name="Mail" {...props} />; }
function MapPin(props) { return <Icon name="MapPin" {...props} />; }
function Megaphone(props) { return <Icon name="Megaphone" {...props} />; }
function Menu(props) { return <Icon name="Menu" {...props} />; }
function MessageSquare(props) { return <Icon name="MessageSquare" {...props} />; }
function MoreHorizontal(props) { return <Icon name="MoreHorizontal" {...props} />; }
function Package(props) { return <Icon name="Package" {...props} />; }
function PartyPopper(props) { return <Icon name="PartyPopper" {...props} />; }
function Plus(props) { return <Icon name="Plus" {...props} />; }
function ScrollText(props) { return <Icon name="ScrollText" {...props} />; }
function Search(props) { return <Icon name="Search" {...props} />; }
function Send(props) { return <Icon name="Send" {...props} />; }
function Settings(props) { return <Icon name="Settings" {...props} />; }
function Shield(props) { return <Icon name="Shield" {...props} />; }
function ShieldAlert(props) { return <Icon name="ShieldAlert" {...props} />; }
function Smartphone(props) { return <Icon name="Smartphone" {...props} />; }
function Sparkles(props) { return <Icon name="Sparkles" {...props} />; }
function Trees(props) { return <Icon name="Trees" {...props} />; }
function TrendingDown(props) { return <Icon name="TrendingDown" {...props} />; }
function TrendingUp(props) { return <Icon name="TrendingUp" {...props} />; }
function Truck(props) { return <Icon name="Truck" {...props} />; }
function UserCircle2(props) { return <Icon name="UserCircle2" {...props} />; }
function Users(props) { return <Icon name="Users" {...props} />; }
function UtensilsCrossed(props) { return <Icon name="UtensilsCrossed" {...props} />; }
function Wrench(props) { return <Icon name="Wrench" {...props} />; }
function X(props) { return <Icon name="X" {...props} />; }
function Zap(props) { return <Icon name="Zap" {...props} />; }


/* ---- Lightweight hand-built charts (no external chart library) ---- */

function ChartAxisLabel({ x, y, children, anchor = "middle" }) {
  return <text x={x} y={y} textAnchor={anchor} style={{ fontSize: 11, fill: C.textFaint, fontFamily: FONT_BODY }}>{children}</text>;
}

function AreaChartSVG({ data, xKey, series, height = 220, formatValue }) {
  const [hover, setHover] = useState(null);
  const W = 640, H = height, padL = 46, padR = 12, padT = 14, padB = 26;
  const innerW = W - padL - padR, innerH = H - padT - padB;
  const allVals = data.flatMap((d) => series.map((s) => d[s.key]));
  const maxV = Math.max(...allVals) * 1.12;
  const n = data.length;
  const xFor = (i) => padL + (innerW * i) / (n - 1 || 1);
  const yFor = (v) => padT + innerH - (innerH * v) / maxV;

  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height }} onMouseLeave={() => setHover(null)}>
        <defs>
          {series.map((s) => (
            <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={s.color} stopOpacity={0.35} />
              <stop offset="95%" stopColor={s.color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <line key={t} x1={padL} x2={W - padR} y1={padT + innerH * t} y2={padT + innerH * t} stroke={C.border} strokeWidth={1} />
        ))}
        {data.map((d, i) => (
          <ChartAxisLabel key={i} x={xFor(i)} y={H - 8}>{d[xKey]}</ChartAxisLabel>
        ))}
        {series.map((s) => {
          const linePts = data.map((d, i) => `${xFor(i)},${yFor(d[s.key])}`).join(" ");
          const areaPts = `${padL},${padT + innerH} ${linePts} ${xFor(n - 1)},${padT + innerH}`;
          return (
            <g key={s.key}>
              <polygon points={areaPts} fill={`url(#grad-${s.key})`} />
              <polyline points={linePts} fill="none" stroke={s.color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
              {data.map((d, i) => (
                <circle
                  key={i} cx={xFor(i)} cy={yFor(d[s.key])} r={hover && hover.i === i ? 5 : 3.5}
                  fill="#fff" stroke={s.color} strokeWidth={2}
                  onMouseEnter={() => setHover({ i, s })}
                  style={{ cursor: "pointer" }}
                />
              ))}
            </g>
          );
        })}
        {hover && (
          <g>
            <line x1={xFor(hover.i)} x2={xFor(hover.i)} y1={padT} y2={padT + innerH} stroke={C.borderStrong} strokeDasharray="3,3" />
          </g>
        )}
      </svg>
      <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 4, flexWrap: "wrap" }}>
        {series.map((s) => (
          <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.textMuted }}>
            <span style={{ width: 9, height: 9, borderRadius: 999, background: s.color }} /> {s.label}
          </div>
        ))}
      </div>
      {hover && (
        <div style={{ textAlign: "center", fontSize: 12.5, color: C.ink, marginTop: 6 }}>
          <strong>{data[hover.i][xKey]}</strong> — {hover.s.label}: <strong>{formatValue ? formatValue(data[hover.i][hover.s.key]) : data[hover.i][hover.s.key]}</strong>
        </div>
      )}
    </div>
  );
}

function BarChartSVG({ data, xKey, series, height = 260, formatValue }) {
  const [hover, setHover] = useState(null);
  const W = 640, H = height, padL = 46, padR = 12, padT = 14, padB = 26;
  const innerW = W - padL - padR, innerH = H - padT - padB;
  const allVals = data.flatMap((d) => series.map((s) => d[s.key]));
  const maxV = Math.max(...allVals) * 1.15;
  const n = data.length;
  const groupW = innerW / n;
  const barW = Math.min(16, (groupW * 0.6) / series.length);
  const yFor = (v) => padT + innerH - (innerH * v) / maxV;

  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height }} onMouseLeave={() => setHover(null)}>
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <line key={t} x1={padL} x2={W - padR} y1={padT + innerH * t} y2={padT + innerH * t} stroke={C.border} strokeWidth={1} />
        ))}
        {data.map((d, i) => {
          const groupX = padL + groupW * i + groupW / 2 - (barW * series.length) / 2;
          return (
            <g key={i}>
              {series.map((s, si) => {
                const v = d[s.key];
                const bx = groupX + si * barW;
                const by = yFor(v);
                const active = hover && hover.i === i && hover.si === si;
                return (
                  <rect
                    key={s.key} x={bx} y={by} width={barW - 3} height={padT + innerH - by}
                    fill={s.color} rx={3} opacity={active ? 1 : 0.9}
                    onMouseEnter={() => setHover({ i, si, s })}
                    style={{ cursor: "pointer" }}
                  />
                );
              })}
              <ChartAxisLabel x={padL + groupW * i + groupW / 2} y={H - 8}>{d[xKey]}</ChartAxisLabel>
            </g>
          );
        })}
      </svg>
      <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 4, flexWrap: "wrap" }}>
        {series.map((s) => (
          <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.textMuted }}>
            <span style={{ width: 9, height: 9, borderRadius: 3, background: s.color }} /> {s.label}
          </div>
        ))}
      </div>
      {hover && (
        <div style={{ textAlign: "center", fontSize: 12.5, color: C.ink, marginTop: 6 }}>
          <strong>{data[hover.i][xKey]}</strong> — {hover.s.label}: <strong>{formatValue ? formatValue(data[hover.i][hover.s.key]) : data[hover.i][hover.s.key]}</strong>
        </div>
      )}
    </div>
  );
}

function DonutChartSVG({ data, colors, size = 200, formatValue }) {
  const [hover, setHover] = useState(null);
  const total = data.reduce((s, d) => s + d.valor, 0);
  const cx = size / 2, cy = size / 2, r = size / 2 - 14;
  let cursor = 0;
  const segments = data.map((d, i) => {
    const startAngle = (cursor / total) * 360;
    cursor += d.valor;
    const endAngle = (cursor / total) * 360;
    return { ...d, startAngle, endAngle, color: colors[i % colors.length] };
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} onMouseLeave={() => setHover(null)}>
        {segments.map((s, i) => {
          const gapDeg = 1.5;
          const active = hover === i;
          return (
            <path
              key={s.nome}
              d={arcPath(cx, cy, r, s.startAngle + gapDeg / 2, s.endAngle - gapDeg / 2)}
              stroke={s.color} strokeWidth={active ? 20 : 16} fill="none" strokeLinecap="round"
              onMouseEnter={() => setHover(i)}
              style={{ cursor: "pointer", transition: "stroke-width .12s" }}
            />
          );
        })}
        <text x={cx} y={cy - 4} textAnchor="middle" style={{ fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 600, fill: C.ink }}>
          {hover !== null ? (formatValue ? formatValue(segments[hover].valor) : segments[hover].valor) : (formatValue ? formatValue(total) : total)}
        </text>
        <text x={cx} y={cy + 16} textAnchor="middle" style={{ fontSize: 10.5, fill: C.textMuted }}>
          {hover !== null ? segments[hover].nome : "Total"}
        </text>
      </svg>
    </div>
  );
}


/* ============================================================
   DESIGN TOKENS
   ============================================================ */
const C = {
  bg: "#F5F7F5",
  surface: "#FFFFFF",
  ink: "#0F211B",
  primary: "#1B6F5C",
  primaryDark: "#124F41",
  primaryLight: "#E4F0EC",
  amber: "#C8842A",
  amberLight: "#FAEBD3",
  info: "#3B6FA0",
  infoLight: "#E4EBF3",
  danger: "#B5473A",
  dangerLight: "#F5E2DF",
  border: "#E1E6E2",
  borderStrong: "#CDD6D0",
  textMuted: "#5C6B64",
  textFaint: "#8B968F",
};

const FONT_DISPLAY = "'Fraunces', Georgia, serif";
const FONT_BODY = "'Inter', -apple-system, sans-serif";
const FONT_MONO = "'JetBrains Mono', monospace";

const LOGIN_FEATURES = [
  "Comunicação direta com moradores e portaria",
  "Ocorrências acompanhadas em tempo real",
  "Reservas de áreas comuns sem burocracia",
  "Painel financeiro sempre atualizado",
];

/* ============================================================
   MOCK DATA
   ============================================================ */
const SAUDE_CATEGORIAS = [
  { label: "Financeiro", score: 82, trend: 1 },
  { label: "Segurança", score: 91, trend: 1 },
  { label: "Comunicação", score: 76, trend: 0 },
  { label: "Manutenção", score: 68, trend: -1 },
  { label: "Sustentabilidade", score: 74, trend: 1 },
  { label: "Participação", score: 63, trend: -1 },
];

const PIE_COLORS = [C.primary, C.info, C.amber, "#7C9A8E", C.danger, C.textFaint];

const ALERTAS_IA = [
  { titulo: "AVCB próximo do vencimento", prioridade: "Alta", desc: "O Auto de Vistoria do Corpo de Bombeiros vence em 21 dias.", impacto: "Risco de multa e interdição parcial.", recomendacao: "Agendar vistoria de renovação até 30/08." },
  { titulo: "Extintor do Bloco B vencendo", prioridade: "Média", desc: "3 extintores do Bloco B vencem em 12 dias.", impacto: "Não conformidade em fiscalização.", recomendacao: "Solicitar recarga ao fornecedor contratado." },
  { titulo: "Consumo de água acima da média", prioridade: "Média", desc: "Consumo 18% acima da média dos últimos 6 meses.", impacto: "Aumento estimado de R$ 2.100 na próxima fatura.", recomendacao: "Verificar possível vazamento não visível na prumada 3." },
  { titulo: "Reclamações recorrentes — barulho", prioridade: "Baixa", desc: "6 ocorrências sobre ruído na unidade 704 em 30 dias.", impacto: "Risco de conflito entre vizinhos.", recomendacao: "Enviar notificação amigável e propor mediação." },
];

const COPILOTO_RESPOSTAS = {
  "Quais problemas precisam de atenção hoje?": {
    resumo: "Há 2 ocorrências de prioridade alta em aberto e 1 alerta crítico de conformidade que merecem atenção imediata.",
    indicadores: ["2 ocorrências de alta prioridade", "1 alerta de conformidade (AVCB)", "Tempo médio de resposta: 3h40"],
    alertas: ["Vazamento na garagem G2 (Em andamento)", "AVCB vence em 21 dias"],
    recomendacoes: ["Confirmar prazo do prestador hidráulico até amanhã.", "Agendar vistoria do AVCB esta semana."],
  },
  "Quais contratos estão próximos do vencimento?": {
    resumo: "2 contratos vencem nos próximos 45 dias: seguro predial e manutenção dos elevadores.",
    indicadores: ["Seguro predial — vence em 28 dias", "Contrato elevadores — vence em 41 dias"],
    alertas: ["Seguro predial sem renovação confirmada"],
    recomendacoes: ["Solicitar 3 cotações de seguro para comparação.", "Confirmar renovação do contrato de elevadores com o fornecedor atual."],
  },
  "Onde estamos gastando mais?": {
    resumo: "Folha de funcionários segue como maior despesa (45%), seguida por manutenção (17%) e segurança (11%).",
    indicadores: ["Folha: R$ 58.000 (45%)", "Manutenção: R$ 22.400 (17%)", "Segurança: R$ 14.300 (11%)"],
    alertas: ["Manutenção 9% acima do orçado neste mês"],
    recomendacoes: ["Revisar horas extras da equipe de manutenção.", "Comparar fornecedor de segurança com 2 alternativas do mercado."],
  },
  "Quais reclamações estão se repetindo?": {
    resumo: "Barulho excessivo é o tema mais recorrente, concentrado na unidade 704, com 6 registros em 30 dias.",
    indicadores: ["6 ocorrências de ruído em 30 dias", "4 delas na mesma unidade (704)"],
    alertas: ["Padrão recorrente pode indicar conflito não resolvido"],
    recomendacoes: ["Propor conversa de mediação com os moradores envolvidos."],
  },
  "Quais equipamentos precisam de manutenção?": {
    resumo: "3 equipamentos estão com manutenção pendente ou próxima: elevador Bloco A, bomba d'água e portão da garagem.",
    indicadores: ["Elevador Bloco A — revisão em 6 dias", "Bomba d'água — sem revisão há 95 dias", "Portão garagem — aguardando peça"],
    alertas: ["Bomba d'água ultrapassou o intervalo recomendado de revisão"],
    recomendacoes: ["Priorizar revisão da bomba d'água esta semana."],
  },
  "Como está a inadimplência?": {
    resumo: "A inadimplência está em 4,8%, estável em relação ao mês anterior e dentro da média do setor.",
    indicadores: ["Inadimplência atual: 4,8%", "Mês anterior: 5,1%", "Unidades em atraso: 6 de 124"],
    alertas: [],
    recomendacoes: ["Enviar lembrete automático 3 dias antes do vencimento.", "Oferecer parcelamento às 2 unidades com atraso superior a 60 dias."],
  },
  "Onde podemos economizar?": {
    resumo: "As maiores oportunidades de economia estão em energia das áreas comuns e renegociação do contrato de segurança.",
    indicadores: ["Potencial de economia em energia: ~R$ 1.800/mês", "Contrato de segurança 8% acima da média de mercado"],
    alertas: [],
    recomendacoes: ["Avaliar sensores de presença na iluminação da garagem.", "Solicitar recotação do contrato de segurança."],
  },
};

const QUICK_QUESTIONS = Object.keys(COPILOTO_RESPOSTAS);

/* ============================================================
   NAV STRUCTURE
   ============================================================ */
const NAV = {
  morador: [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "ocorrencias", label: "Ocorrências", icon: AlertTriangle },
    { id: "reservas", label: "Reservas", icon: Calendar },
    { id: "comunicados", label: "Avisos", icon: Megaphone },
    { id: "entregas", label: "Encomendas", icon: Package },
    { id: "visitantes", label: "Visitantes", icon: Truck },
    { id: "financeiro", label: "Financeiro", icon: DollarSign },
    { id: "comunidade", label: "Comunidade", icon: Users },
    { id: "documentos", label: "Documentos", icon: FileText },
    { id: "perfil", label: "Meu perfil", icon: UserCircle2 },
  ],
  sindico: [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "moradores", label: "Moradores", icon: Users },
    { id: "financeiro", label: "Financeiro", icon: DollarSign },
    { id: "ocorrencias", label: "Ocorrências", icon: AlertTriangle },
    { id: "reservas", label: "Reservas", icon: Calendar },
    { id: "comunicados", label: "Avisos", icon: Megaphone },
    { id: "entregas", label: "Encomendas", icon: Package },
    { id: "visitantes", label: "Visitantes", icon: Truck },
    { id: "funcionarios", label: "Funcionários", icon: ClipboardList },
    { id: "prestadores", label: "Prestadores", icon: Wrench },
    { id: "manutencao", label: "Manutenção", icon: Settings },
    { id: "digitaltwin", label: "Digital Twin", icon: Building2 },
    { id: "documentos", label: "Documentos", icon: BookOpen },
    { id: "auditoria", label: "Auditoria", icon: ScrollText },
    { id: "sustentabilidade", label: "Sustentabilidade", icon: Leaf },
    { id: "copiloto", label: "IA / Copiloto", icon: Bot },
    { id: "automacoes", label: "Automações", icon: GitBranch },
  ],
  portaria: [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "entregas", label: "Encomendas", icon: Package },
    { id: "visitantes", label: "Visitantes", icon: Truck },
    { id: "ocorrencias", label: "Ocorrências", icon: AlertTriangle },
    { id: "comunicados", label: "Avisos", icon: Megaphone },
    { id: "reservas", label: "Reservas", icon: Calendar },
  ],
};

const ROLE_LABEL = { morador: "Morador", sindico: "Síndico / Administração", portaria: "Portaria" };

// Atalhos da tela de entrada: preenchem o e-mail das contas criadas pelo seed (npm run db:seed no backend)
const DEMO_USERS = {
  morador: { email: "ana@condominio.com" },
  sindico: { email: "sindico@condominio.com" },
  portaria: { email: "portaria@condominio.com" },
};

/* ============================================================
   SHARED UI PRIMITIVES
   ============================================================ */
function Card({ children, style, className = "", padded = true }) {
  return (
    <div
      className={`fade-up ${className}`}
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 14,
        padding: padded ? 20 : 0,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Badge({ children, bg, fg, style }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontSize: 12,
        fontWeight: 600,
        padding: "3px 10px",
        borderRadius: 999,
        background: bg,
        color: fg,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {children}
    </span>
  );
}

function Button({ children, variant = "primary", onClick, style, icon: Icon, type = "button", disabled }) {
  const variants = {
    primary: { background: C.primary, color: "#fff", border: `1px solid ${C.primary}` },
    outline: { background: "transparent", color: C.ink, border: `1px solid ${C.borderStrong}` },
    ghost: { background: "transparent", color: C.textMuted, border: "1px solid transparent" },
    danger: { background: C.danger, color: "#fff", border: `1px solid ${C.danger}` },
  };
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: "9px 16px",
        borderRadius: 10,
        fontSize: 14,
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,
        transition: "opacity .15s, transform .1s",
        ...variants[variant],
        ...style,
      }}
      onMouseDown={(e) => { if (!disabled) e.currentTarget.style.transform = "scale(0.98)"; }}
      onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
    >
      {Icon && <Icon size={16} />}
      {children}
    </button>
  );
}

function EmptyState({ icon: Icon = FileText, title, desc, action }) {
  return (
    <div
      className="fade-up"
      style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        textAlign: "center", padding: "56px 24px", color: C.textMuted,
      }}
    >
      <div style={{ width: 52, height: 52, borderRadius: 14, background: C.primaryLight, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
        <Icon size={24} color={C.primary} />
      </div>
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 18, color: C.ink, fontWeight: 600, marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 14, maxWidth: 380, lineHeight: 1.5 }}>{desc}</div>
      {action}
    </div>
  );
}

function Modal({ open, onClose, title, children, width = 520 }) {
  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(15,33,27,0.45)", zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
      }}
      onClick={onClose}
    >
      <div
        className="pop-in"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: C.surface, borderRadius: 16, width: "100%", maxWidth: width,
          maxHeight: "88vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(15,33,27,0.25)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, background: C.surface, zIndex: 2 }}>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 600, color: C.ink }}>{title}</div>
          <button onClick={onClose} style={{ background: C.bg, border: "none", borderRadius: 8, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <X size={16} color={C.textMuted} />
          </button>
        </div>
        <div style={{ padding: 22 }}>{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: C.textMuted, marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "10px 12px", borderRadius: 9, border: `1px solid ${C.borderStrong}`,
  fontSize: 14, color: C.ink, background: "#FBFCFB", outline: "none",
};

function StatCard({ icon: Icon, label, value, trend, trendLabel, accent = C.primary }) {
  return (
    <Card style={{ flex: 1, minWidth: 168 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${accent}1A`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={17} color={accent} />
        </div>
        {trend !== undefined && (
          <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 12, fontWeight: 600, color: trend >= 0 ? C.primary : C.danger }}>
            {trend >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
            {trendLabel}
          </span>
        )}
      </div>
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 26, fontWeight: 600, color: C.ink, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12.5, color: C.textMuted, marginTop: 6 }}>{label}</div>
    </Card>
  );
}

function fmtBRL(n) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

/* ============================================================
   SIGNATURE ELEMENT — ANEL DE ZELO (health ring)
   ============================================================ */
function polarToCartesian(cx, cy, r, angleDeg) {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}
function arcPath(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

function AnelDeZelo({ categorias, size = 280 }) {
  const cx = size / 2, cy = size / 2, r = size / 2 - 26;
  const n = categorias.length;
  const gap = 8;
  const slice = 360 / n;
  const overall = Math.round(categorias.reduce((s, c) => s + c.score, 0) / n);
  const overallColor = overall >= 80 ? C.primary : overall >= 60 ? C.amber : C.danger;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {categorias.map((cat, i) => {
          const start = i * slice + gap / 2;
          const end = (i + 1) * slice - gap / 2;
          const filledEnd = start + ((end - start) * cat.score) / 100;
          const color = cat.score >= 80 ? C.primary : cat.score >= 60 ? C.amber : C.danger;
          return (
            <g key={cat.label}>
              <path d={arcPath(cx, cy, r, start, end)} stroke={C.bg} strokeWidth={14} fill="none" strokeLinecap="round" />
              <path d={arcPath(cx, cy, r, start, filledEnd)} stroke={color} strokeWidth={14} fill="none" strokeLinecap="round" />
            </g>
          );
        })}
        <text x={cx} y={cy - 6} textAnchor="middle" style={{ fontFamily: FONT_DISPLAY, fontSize: 42, fontWeight: 600, fill: C.ink }}>{overall}</text>
        <text x={cx} y={cy + 20} textAnchor="middle" style={{ fontFamily: FONT_BODY, fontSize: 12, fill: C.textMuted, fontWeight: 600, letterSpacing: 0.5 }}>ÍNDICE GERAL</text>
      </svg>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 20px", marginTop: 6, width: "100%" }}>
        {categorias.map((cat) => {
          const color = cat.score >= 80 ? C.primary : cat.score >= 60 ? C.amber : C.danger;
          return (
            <div key={cat.label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5 }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: color, flexShrink: 0 }} />
              <span style={{ color: C.textMuted, flex: 1 }}>{cat.label}</span>
              <span style={{ fontWeight: 700, color: C.ink }}>{cat.score}</span>
              {cat.trend > 0 && <TrendingUp size={12} color={C.primary} />}
              {cat.trend < 0 && <TrendingDown size={12} color={C.danger} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
   LOGIN SCREEN — helpers
   ============================================================ */
function AnimatedCounter({ value, suffix = "" }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let raf, start = null;
    const duration = 1200;
    function step(ts) {
      if (start === null) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress < 1) raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{display}{suffix}</>;
}

function RoleTabs({ role, setRole }) {
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 24, background: C.bg, padding: 4, borderRadius: 11 }}>
      {Object.keys(ROLE_LABEL).map((r) => (
        <button
          key={r}
          type="button"
          onClick={() => setRole(r)}
          style={{
            flex: 1, padding: "8px 6px", borderRadius: 8, border: "none", cursor: "pointer",
            fontSize: 12.5, fontWeight: 600, background: role === r ? C.surface : "transparent",
            color: role === r ? C.primary : C.textMuted,
            boxShadow: role === r ? "0 1px 4px rgba(15,33,27,0.12)" : "none",
          }}
        >
          {ROLE_LABEL[r]}
        </button>
      ))}
    </div>
  );
}

/* ============================================================
   INTERACTIVE BUILDING — real 3D model (self-hosted glTF, rendered
   with <model-viewer>) used as the login hero background.
   ============================================================ */
function InteractiveBuilding() {
  const modelRef = useRef(null);

  return (
    <div className="building-embed-shell" style={{ position: "absolute", inset: 0, zIndex: 0 }}>
      <model-viewer
        ref={modelRef}
        src="assets/predio-3d/scene.gltf"
        alt="Modelo 3D do prédio Sanzio"
        camera-controls=""
        touch-action="none"
        camera-orbit="25deg 72deg 85%"
        min-camera-orbit="auto 20deg auto"
        max-camera-orbit="auto 110deg auto"
        interaction-prompt="when-focused"
        disable-zoom=""
        environment-image="neutral"
        shadow-intensity="1"
        exposure="1"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block", "--poster-color": "transparent" }}
      />
      <p style={{ position: "absolute", right: 16, bottom: 14, zIndex: 1, fontSize: 11.5, fontWeight: 400, margin: 0, color: "rgba(255,255,255,0.45)", pointerEvents: "auto" }}>
        Modelo 3D:{" "}
        <a href="https://sketchfab.com/3d-models/sanzio-predio-0c60bb2de7d4429fa00097b4a769eb0c" target="_blank" rel="nofollow noopener noreferrer" style={{ fontWeight: 600, color: "#7BC8E8" }}>
          Sanzio - Prédio
        </a>{" "}
        por{" "}
        <a href="https://sketchfab.com/crispimrafael" target="_blank" rel="nofollow noopener noreferrer" style={{ fontWeight: 600, color: "#7BC8E8" }}>
          SrMonteiro
        </a>
        , licenciado sob{" "}
        <a href="http://creativecommons.org/licenses/by/4.0/" target="_blank" rel="nofollow noopener noreferrer" style={{ fontWeight: 600, color: "#7BC8E8" }}>
          CC-BY-4.0
        </a>
      </p>
    </div>
  );
}

const MORADOR_FEATURES = [
  { icon: MessageSquare, title: "Comunicação direta", desc: "Fale com a portaria e o síndico sem sair do app, com histórico de conversas." },
  { icon: Calendar, title: "Reserva de áreas comuns", desc: "Salão de festas, churrasqueira e quadra reservados em poucos cliques." },
  { icon: ClipboardList, title: "Ocorrências em tempo real", desc: "Registre um problema e acompanhe cada etapa até a resolução." },
  { icon: DollarSign, title: "Financeiro sempre à mão", desc: "Boletos, taxas e comprovantes organizados num só lugar." },
];

const SINDICO_FEATURES = [
  { icon: TrendingUp, title: "Painel financeiro completo", desc: "Receitas, despesas e inadimplência acompanhadas em tempo real." },
  { icon: Shield, title: "Gestão de ocorrências", desc: "Priorize, delegue e resolva chamados com total rastreabilidade." },
  { icon: Megaphone, title: "Comunicados e enquetes", desc: "Avise todo o condomínio e colha decisões em assembleia digital." },
  { icon: ScrollText, title: "Relatórios e histórico", desc: "Documentação administrativa organizada e pronta para prestação de contas." },
];

function FeatureCard({ icon: IconCmp, title, desc }) {
  return (
    <div
      style={{
        display: "flex", gap: 14, padding: "18px 20px", borderRadius: 14,
        background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.14)",
        backdropFilter: "blur(10px)",
      }}
    >
      <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(232,163,61,0.18)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <IconCmp size={18} color="#E8A33D" />
      </div>
      <div>
        <div style={{ fontSize: 14.5, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 13, lineHeight: 1.55, color: "rgba(255,255,255,0.72)" }}>{desc}</div>
      </div>
    </div>
  );
}

/* ============================================================
   FEATURES SECTION — video background, revealed as the user
   scrolls down past the hero.
   ============================================================ */
function FeaturesSection() {
  return (
    <section style={{ position: "relative", overflow: "hidden", color: "#fff", minHeight: "100vh", display: "flex", alignItems: "center" }}>
      <video
        autoPlay muted loop playsInline
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
      >
        <source src="assets/video/condominio.mp4" type="video/mp4" />
      </video>
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(8,8,9,0.88) 0%, rgba(8,8,9,0.8) 100%)" }} />

      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 1180, margin: "0 auto", padding: "88px 32px" }}>
        <div style={{ maxWidth: 620, marginBottom: 52 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12.5, fontWeight: 600, padding: "6px 12px", borderRadius: 999, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", marginBottom: 18 }}>
            <Sparkles size={13} color="#E8A33D" /> O que o Zeluvi oferece
          </div>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(26px, 3.6vw, 36px)", lineHeight: 1.2, fontWeight: 500 }}>
            Feito para o dia a dia de quem mora e de quem administra.
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: 40 }}>
          <div>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 600, marginBottom: 16, color: "#E8A33D" }}>Para moradores</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {MORADOR_FEATURES.map((f) => <FeatureCard key={f.title} {...f} />)}
            </div>
          </div>
          <div>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 600, marginBottom: 16, color: "#E8A33D" }}>Para síndicos</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {SINDICO_FEATURES.map((f) => <FeatureCard key={f.title} {...f} />)}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   LOGIN SCREEN — helpers de identidade (nome a partir do e-mail,
   máscara de telefone e logo do Google) + o componente em si
   ============================================================ */
function nameFromEmail(email) {
  const local = (email || "").split("@")[0] || "";
  const nice = local
    .replace(/[._-]+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  return nice || "Usuário";
}

function formatTelefone(value) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function GoogleG({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.8 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l5.7-5.7C34.6 6 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.8 1.1 8 3l5.7-5.7C34.6 6 29.6 4 24 4c-7.5 0-13.9 4.3-17.7 10.7z" />
      <path fill="#4CAF50" d="M24 44c5.5 0 10.4-1.9 14.2-5.1l-6.6-5.4C29.6 35.4 26.9 36 24 36c-5.3 0-9.7-3.1-11.3-7.5l-6.6 5.1C9.9 39.6 16.4 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1 3-3.1 5.5-5.7 7.1l6.6 5.4C39.9 37.6 44 31.9 44 24c0-1.3-.1-2.7-.4-3.5z" />
    </svg>
  );
}

function LoginScreen({ onLogin }) {
  const [role, setRole] = useState("morador");
  const [email, setEmail] = useState(DEMO_USERS.morador.email);
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const [authMode, setAuthMode] = useState(null); // null | "entrar" | "cadastro" | "recuperar"
  const [recEmail, setRecEmail] = useState("");
  const [recMsg, setRecMsg] = useState("");
  const [ripples, setRipples] = useState([]);
  const heroRef = useRef(null);

  useEffect(() => { setEmail(DEMO_USERS[role].email); }, [role]);

  useEffect(() => {
    const root = document.documentElement;
    function handleMove(e) {
      const relX = e.clientX / window.innerWidth;
      const relY = e.clientY / window.innerHeight;
      root.style.setProperty("--mx", relX.toFixed(4));
      root.style.setProperty("--my", relY.toFixed(4));
    }
    function handleLeave() {
      root.style.setProperty("--mx", "0.5");
      root.style.setProperty("--my", "0.5");
    }
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseleave", handleLeave);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseleave", handleLeave);
      root.style.removeProperty("--mx");
      root.style.removeProperty("--my");
    };
  }, []);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    function handleClick(e) {
      const rect = el.getBoundingClientRect();
      const id = Date.now() + Math.random();
      const x = e.clientX - rect.left, y = e.clientY - rect.top;
      setRipples((r) => [...r, { id, x, y }]);
      setTimeout(() => setRipples((r) => r.filter((rp) => rp.id !== id)), 900);
    }
    el.addEventListener("click", handleClick);
    return () => el.removeEventListener("click", handleClick);
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true); setErro("");
    try {
      const usuario = await ZeluviAPI.login(email.trim(), senha);
      onLogin(usuario);
    } catch (err) {
      setErro(ZeluviAPI.mensagemDeErro(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleRecuperar(e) {
    e.preventDefault();
    setLoading(true); setRecMsg("");
    try {
      const r = await ZeluviAPI.esqueciSenha(recEmail.trim());
      setRecMsg(r.mensagem);
    } catch (err) {
      setRecMsg(ZeluviAPI.mensagemDeErro(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: C.ink, fontFamily: FONT_BODY }}>
      {/* Cursor spotlight — fixed to the viewport so it glows behind the cursor across the whole page */}
      <div
        style={{
          position: "fixed", inset: 0, zIndex: 40, pointerEvents: "none", mixBlendMode: "screen",
          background: "radial-gradient(520px circle at calc(var(--mx, 0.5) * 100%) calc(var(--my, 0.5) * 100%), rgba(232,163,61,0.22), transparent 62%)",
        }}
      />

      <div
        ref={heroRef}
        style={{
          position: "relative", minHeight: "100vh", overflow: "hidden", color: "#fff",
        }}
      >
        <InteractiveBuilding />

        {/* Click ripples */}
        <div style={{ position: "absolute", inset: 0, zIndex: 3, pointerEvents: "none" }}>
          {ripples.map((r) => (
            <span key={r.id} className="click-ripple" style={{ left: r.x, top: r.y }} />
          ))}
        </div>

        {/* Top navbar */}
        <div style={{ position: "relative", zIndex: 5, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "22px 32px", flexWrap: "wrap", gap: 12, pointerEvents: "none" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, pointerEvents: "auto" }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: C.primary, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Building2 size={17} color="#fff" />
            </div>
            <span style={{ fontFamily: FONT_DISPLAY, fontSize: 19, fontWeight: 600, letterSpacing: 0.3 }}>Zeluvi</span>
          </div>
          <div style={{ display: "flex", gap: 10, pointerEvents: "auto" }}>
            <button className="navbtn-ghost" onClick={() => setAuthMode("entrar")} style={{ padding: "9px 18px", borderRadius: 9, fontSize: 13.5, fontWeight: 600, cursor: "pointer", background: "rgba(255,255,255,0.08)", color: "#fff", border: "1px solid rgba(255,255,255,0.25)", backdropFilter: "blur(6px)" }}>
              Entrar
            </button>
            <button className="navbtn-solid" onClick={() => setAuthMode("cadastro")} style={{ padding: "9px 18px", borderRadius: 9, fontSize: 13.5, fontWeight: 700, cursor: "pointer", background: "#E8A33D", color: "#1B1206", border: "1px solid #E8A33D" }}>
              Cadastrar-se
            </button>
          </div>
        </div>

        {/* Hero content */}
        <div style={{ position: "relative", zIndex: 5, display: "flex", justifyContent: "flex-start", padding: "40px 32px 80px", minHeight: "calc(100vh - 84px)", pointerEvents: "none" }}>
          <div style={{ flex: "0 1 560px", maxWidth: 560, display: "flex", flexDirection: "column", alignItems: "flex-start", textAlign: "left", pointerEvents: "auto" }}>
            <div className="fade-up" style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12.5, fontWeight: 600, padding: "6px 12px", borderRadius: 999, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", marginBottom: 22, textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}>
              <Sparkles size={13} color="#E8A33D" /> Gestão condominial inteligente
            </div>
            <div className="fade-up" style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(32px, 5vw, 46px)", lineHeight: 1.18, fontWeight: 500, animationDelay: "0.05s", textShadow: "0 2px 10px rgba(0,0,0,0.55)" }}>
              Tudo do seu condomínio, <span style={{ color: "#E8A33D" }}>em um só lugar.</span>
            </div>
            <div className="fade-up" style={{ fontSize: 15.5, color: "rgba(255,255,255,0.75)", marginTop: 18, maxWidth: 460, lineHeight: 1.65, animationDelay: "0.1s", textShadow: "0 1px 6px rgba(0,0,0,0.55)" }}>
              Comunicação, ocorrências, reservas e gestão administrativa organizadas num único ambiente — para moradores, síndicos e portaria.
            </div>

            <div style={{ marginTop: 26, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 11 }}>
              {LOGIN_FEATURES.map((f, i) => (
                <div key={f} className="fade-up" style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "rgba(255,255,255,0.9)", animationDelay: `${0.14 + i * 0.06}s`, textShadow: "0 1px 4px rgba(0,0,0,0.55)" }}>
                  <span style={{ width: 20, height: 20, borderRadius: 999, background: "rgba(232,163,61,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Check size={12} color="#E8A33D" />
                  </span>
                  {f}
                </div>
              ))}
            </div>

            <div className="fade-up" style={{ display: "flex", justifyContent: "flex-start", gap: 28, marginTop: 40, flexWrap: "wrap", animationDelay: "0.4s" }}>
              <div>
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: 26, fontWeight: 600, textShadow: "0 1px 6px rgba(0,0,0,0.55)" }}><AnimatedCounter value={124} /></div>
                <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.65)" }}>unidades geridas</div>
              </div>
              <div>
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: 26, fontWeight: 600, textShadow: "0 1px 6px rgba(0,0,0,0.55)" }}><AnimatedCounter value={3} /></div>
                <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.65)" }}>perfis de acesso</div>
              </div>
              <div>
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: 26, fontWeight: 600, textShadow: "0 1px 6px rgba(0,0,0,0.55)" }}><AnimatedCounter value={98} suffix="%" /></div>
                <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.65)" }}>satisfação dos síndicos</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <FeaturesSection />

      <Modal open={authMode === "entrar"} onClose={() => setAuthMode(null)} title="Entrar na plataforma" width={420}>
        <div style={{ fontSize: 13.5, color: C.textMuted, marginBottom: 16 }}>Entre com o e-mail e a senha do seu cadastro. O perfil (morador, síndico ou portaria) é reconhecido automaticamente.</div>
        <form onSubmit={handleSubmit}>
          <Field label="E-mail">
            <input style={inputStyle} value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="username" required />
          </Field>
          <Field label="Senha">
            <input style={inputStyle} type="password" value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="current-password" required />
          </Field>
          {erro && (
            <div role="alert" style={{ marginBottom: 14, padding: "10px 12px", borderRadius: 9, background: C.dangerLight, color: C.danger, fontSize: 13 }}>{erro}</div>
          )}
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 18, fontSize: 13 }}>
            <a href="#" onClick={(e) => { e.preventDefault(); setRecEmail(email); setRecMsg(""); setAuthMode("recuperar"); }} style={{ color: C.primary, fontWeight: 600, textDecoration: "none" }}>Esqueci minha senha</a>
          </div>
          <Button type="submit" style={{ width: "100%", padding: "11px 16px" }} disabled={loading}>
            {loading ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : null}
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>
        <div style={{ marginTop: 18, fontSize: 13, color: C.textMuted, textAlign: "center" }}>
          Ainda não tem conta?{" "}
          <a href="#" onClick={(e) => { e.preventDefault(); setAuthMode("cadastro"); }} style={{ color: C.primary, fontWeight: 600, textDecoration: "none" }}>
            Como me cadastro?
          </a>
        </div>
        <div style={{ marginTop: 16, padding: 14, borderRadius: 10, background: C.primaryLight, fontSize: 12.5, color: C.primaryDark, lineHeight: 1.5 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Contas de demonstração (ambiente de desenvolvimento)</div>
          <RoleTabs role={role} setRole={(r) => { setRole(r); setSenha("123456"); }} />
          <div>Clique no perfil para preencher o e-mail e a senha de teste.</div>
        </div>
      </Modal>

      <Modal open={authMode === "recuperar"} onClose={() => setAuthMode(null)} title="Recuperar senha" width={420}>
        <div style={{ fontSize: 13.5, color: C.textMuted, marginBottom: 16 }}>Informe o e-mail do seu cadastro. Se ele existir, enviaremos um link para criar uma nova senha (vale 30 minutos).</div>
        <form onSubmit={handleRecuperar}>
          <Field label="E-mail">
            <input style={inputStyle} value={recEmail} onChange={(e) => setRecEmail(e.target.value)} type="email" required />
          </Field>
          {recMsg && <div role="status" style={{ marginBottom: 14, padding: "10px 12px", borderRadius: 9, background: C.infoLight, color: C.info, fontSize: 13 }}>{recMsg}</div>}
          <Button type="submit" style={{ width: "100%", padding: "11px 16px" }} disabled={loading}>
            {loading ? "Enviando..." : "Enviar link de recuperação"}
          </Button>
        </form>
        <div style={{ marginTop: 16, fontSize: 13, textAlign: "center" }}>
          <a href="#" onClick={(e) => { e.preventDefault(); setAuthMode("entrar"); }} style={{ color: C.primary, fontWeight: 600, textDecoration: "none" }}>Voltar para o login</a>
        </div>
      </Modal>

      <Modal open={authMode === "cadastro"} onClose={() => setAuthMode(null)} title="Como criar sua conta" width={440}>
        <div style={{ fontSize: 14, color: C.ink, lineHeight: 1.6, marginBottom: 14 }}>
          No Zeluvi o cadastro <strong>não é aberto ao público</strong>: quem cadastra os moradores é o síndico do seu condomínio (e síndicos e porteiros são cadastrados por outro síndico).
        </div>
        <ol style={{ margin: "0 0 16px 18px", padding: 0, fontSize: 13.5, color: C.textMuted, lineHeight: 1.7 }}>
          <li>Peça ao síndico para cadastrar o seu e-mail e a sua unidade.</li>
          <li>Você recebe um e-mail de convite (vale 48 horas).</li>
          <li>Abra o link e crie a sua própria senha.</li>
        </ol>
        <Button variant="outline" style={{ width: "100%" }} onClick={() => setAuthMode("entrar")}>Já recebi o convite — entrar</Button>
      </Modal>
    </div>
  );
}

/* ============================================================
   TOPBAR + SIDEBAR
   ============================================================ */
function Sidebar({ role, page, setPage, collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  const items = NAV[role];
  return (
    <>
      {mobileOpen && (
        <div onClick={() => setMobileOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(15,33,27,0.4)", zIndex: 40 }} className="lg:hidden" />
      )}
      <div
        style={{
          width: collapsed ? 74 : 240, background: C.ink, color: "#fff", height: "100vh",
          position: "fixed", left: 0, top: 0, flexDirection: "column",
          display: mobileOpen ? "flex" : undefined,
          transition: "width .18s ease", zIndex: 50, flexShrink: 0,
        }}
        className={mobileOpen ? "" : "hidden lg:flex"}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "20px 18px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: C.primary, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Building2 size={16} color="#fff" />
          </div>
          {!collapsed && <span style={{ fontFamily: FONT_DISPLAY, fontSize: 17, fontWeight: 600 }}>Zeluvi</span>}
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 10px" }}>
          {items.map((item) => {
            const active = page === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setPage(item.id); setMobileOpen(false); }}
                title={item.label}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 12px", borderRadius: 10, border: "none", marginBottom: 3,
                  background: active ? "rgba(255,255,255,0.1)" : "transparent",
                  color: active ? "#fff" : "rgba(255,255,255,0.62)",
                  cursor: "pointer", fontSize: 13.5, fontWeight: active ? 600 : 500,
                  textAlign: "left", justifyContent: collapsed ? "center" : "flex-start",
                }}
              >
                <item.icon size={17} style={{ flexShrink: 0 }} />
                {!collapsed && <span>{item.label}</span>}
                {!collapsed && active && <ChevronRight size={14} style={{ marginLeft: "auto" }} />}
              </button>
            );
          })}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: 14, background: "transparent", border: "none", borderTop: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: 12 }}
          className="hidden lg:flex"
        >
          {collapsed ? <ChevronRight size={15} /> : <><ChevronLeft size={15} /> Recolher</>}
        </button>
      </div>
    </>
  );
}

function Topbar({ user, role, onLogout, setMobileOpen, notifOpen, setNotifOpen, notifs, setNotifs, pageTitle }) {
  const unread = notifs.filter((n) => !n.lida).length;
  const [userMenu, setUserMenu] = useState(false);
  return (
    <div style={{ position: "sticky", top: 0, zIndex: 30, background: C.bg, paddingBottom: 4 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "18px 24px 14px" }}>
        <button onClick={() => setMobileOpen(true)} className="lg:hidden" style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 9, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Menu size={17} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 600, color: C.ink }}>{pageTitle}</div>
        </div>
        <div style={{ position: "relative", display: "none" }} className="md:flex" >
          <Search size={15} color={C.textFaint} style={{ position: "absolute", left: 12, top: 11 }} />
          <input placeholder="Buscar no Zeluvi..." style={{ ...inputStyle, width: 220, paddingLeft: 34, background: C.surface }} />
        </div>
        <div style={{ position: "relative" }}>
          <button onClick={() => setNotifOpen(!notifOpen)} style={{ position: "relative", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 9, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <Bell size={16} color={C.ink} />
            {unread > 0 && <span style={{ position: "absolute", top: -3, right: -3, background: C.danger, color: "#fff", fontSize: 10, fontWeight: 700, width: 16, height: 16, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center" }}>{unread}</span>}
          </button>
          {notifOpen && (
            <div className="pop-in" style={{ position: "absolute", right: 0, top: 44, width: 320, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, boxShadow: "0 12px 32px rgba(15,33,27,0.15)", zIndex: 60, overflow: "hidden" }}>
              <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, fontWeight: 700, fontSize: 13.5, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                Notificações
                <button onClick={() => setNotifs(notifs.map((n) => ({ ...n, lida: true })))} style={{ background: "none", border: "none", color: C.primary, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Marcar como lidas</button>
              </div>
              <div style={{ maxHeight: 320, overflowY: "auto" }}>
                {notifs.map((n) => (
                  <div key={n.id} style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, background: n.lida ? "transparent" : C.primaryLight, display: "flex", gap: 10 }}>
                    <span style={{ width: 7, height: 7, borderRadius: 999, background: n.lida ? "transparent" : C.primary, marginTop: 5, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 13, color: C.ink, lineHeight: 1.4 }}>{n.texto}</div>
                      <div style={{ fontSize: 11.5, color: C.textFaint, marginTop: 3 }}>{n.tempo}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div style={{ position: "relative" }}>
          <button onClick={() => setUserMenu(!userMenu)} style={{ display: "flex", alignItems: "center", gap: 9, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 9, padding: "6px 10px 6px 6px", cursor: "pointer" }}>
            <div style={{ width: 26, height: 26, borderRadius: 999, background: C.primary, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11.5, fontWeight: 700 }}>
              {user.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
            </div>
            <div style={{ textAlign: "left", display: "none" }} className="sm:block">
              <div style={{ fontSize: 12.5, fontWeight: 600, color: C.ink, lineHeight: 1.2 }}>{user.name.split(" ")[0]}</div>
              <div style={{ fontSize: 10.5, color: C.textFaint }}>{ROLE_LABEL[role]}</div>
            </div>
            <ChevronDown size={13} color={C.textFaint} />
          </button>
          {userMenu && (
            <div className="pop-in" style={{ position: "absolute", right: 0, top: 46, width: 190, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, boxShadow: "0 12px 32px rgba(15,33,27,0.15)", zIndex: 60, overflow: "hidden" }}>
              <button onClick={onLogout} style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "11px 14px", background: "none", border: "none", cursor: "pointer", fontSize: 13, color: C.danger, fontWeight: 600 }}>
                <LogOut size={14} /> Sair da conta
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   PAGE: COPILOTO ZELUVI
   ============================================================ */
function CopilotoPage() {
  const [messages, setMessages] = useState([
    { from: "bot", text: "Olá! Sou o Copiloto Zeluvi. Pergunte sobre ocorrências, contratos, finanças ou manutenção — os dados abaixo são simulados para esta demonstração." },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, typing]);

  function ask(question) {
    setMessages((m) => [...m, { from: "user", text: question }]);
    setTyping(true);
    setTimeout(() => {
      const resp = COPILOTO_RESPOSTAS[question] || {
        resumo: "Ainda não tenho dados suficientes sobre esse tema nesta demonstração, mas já registrei sua pergunta para os próximos indicadores do Zeluvi.",
        indicadores: [], alertas: [], recomendacoes: ["Tente uma das perguntas sugeridas para ver o copiloto em ação."],
      };
      setMessages((m) => [...m, { from: "bot", data: resp }]);
      setTyping(false);
    }, 900);
  }

  function handleSend(e) {
    e.preventDefault();
    if (!input.trim()) return;
    ask(input.trim());
    setInput("");
  }

  return (
    <div className="fade-up grid-stack" style={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: 16 }} >
      <Card style={{ display: "flex", flexDirection: "column", height: "68vh", padding: 0 }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: C.primaryLight, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Bot size={17} color={C.primary} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: C.ink }}>Copiloto Zeluvi</div>
            <div style={{ fontSize: 11.5, color: C.textFaint }}>Assistente executivo do síndico · dados simulados</div>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: "flex", justifyContent: m.from === "user" ? "flex-end" : "flex-start" }}>
              {m.from === "user" ? (
                <div style={{ maxWidth: "72%", background: C.primary, color: "#fff", padding: "10px 14px", borderRadius: "12px 12px 2px 12px", fontSize: 13.5 }}>{m.text}</div>
              ) : m.text ? (
                <div style={{ maxWidth: "78%", background: C.bg, padding: "10px 14px", borderRadius: "12px 12px 12px 2px", fontSize: 13.5, color: C.ink, lineHeight: 1.6 }}>{m.text}</div>
              ) : (
                <div style={{ maxWidth: "84%", background: C.bg, padding: "14px 16px", borderRadius: "12px 12px 12px 2px" }}>
                  <div style={{ fontSize: 13.5, color: C.ink, lineHeight: 1.6, marginBottom: 10 }}>{m.data.resumo}</div>
                  {m.data.indicadores.length > 0 && (
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 6 }}>Indicadores</div>
                      {m.data.indicadores.map((ind) => <div key={ind} style={{ fontSize: 12.5, color: C.ink, padding: "3px 0" }}>· {ind}</div>)}
                    </div>
                  )}
                  {m.data.alertas.length > 0 && (
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: C.danger, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 6 }}>Alertas</div>
                      {m.data.alertas.map((a) => (
                        <div key={a} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: C.danger, padding: "3px 0" }}><ShieldAlert size={12} /> {a}</div>
                      ))}
                    </div>
                  )}
                  {m.data.recomendacoes.length > 0 && (
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: C.primaryDark, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 6 }}>Ações recomendadas</div>
                      {m.data.recomendacoes.map((r) => (
                        <div key={r} style={{ display: "flex", alignItems: "flex-start", gap: 6, fontSize: 12.5, color: C.ink, padding: "3px 0" }}><Sparkles size={12} color={C.primary} style={{ marginTop: 2, flexShrink: 0 }} /> {r}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {typing && <div style={{ fontSize: 12.5, color: C.textFaint, display: "flex", alignItems: "center", gap: 6 }}><Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> Copiloto está analisando os dados...</div>}
          <div ref={endRef} />
        </div>
        <form onSubmit={handleSend} style={{ display: "flex", gap: 8, padding: 16, borderTop: `1px solid ${C.border}` }}>
          <input style={{ ...inputStyle, flex: 1 }} placeholder="Pergunte ao Copiloto Zeluvi..." value={input} onChange={(e) => setInput(e.target.value)} />
          <Button type="submit" icon={Send}>Enviar</Button>
        </form>
      </Card>
      <Card>
        <div style={{ fontWeight: 700, fontSize: 13.5, color: C.ink, marginBottom: 10 }}>Perguntas sugeridas</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {QUICK_QUESTIONS.map((q) => (
            <button key={q} onClick={() => ask(q)} style={{ textAlign: "left", fontSize: 12.5, padding: "10px 12px", borderRadius: 9, border: `1px solid ${C.border}`, background: C.bg, cursor: "pointer", color: C.ink, lineHeight: 1.4 }}>{q}</button>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ============================================================
   STUB PAGE (coming soon)
   ============================================================ */
const STUB_META = {
  moradores: { icon: Users, title: "Moradores", desc: "O cadastro completo de moradores, com histórico financeiro, reservas e ocorrências por unidade (Morador 360°), está em construção." },
  funcionarios: { icon: ClipboardList, title: "Funcionários", desc: "O perfil completo de funcionários (Funcionário 360°) com escalas, treinamentos e produtividade está em construção." },
  prestadores: { icon: Wrench, title: "Prestadores de serviços", desc: "O portal de prestadores, com ordens de serviço, checklist e assinatura digital, está em construção." },
  manutencao: { icon: Settings, title: "Manutenção preditiva", desc: "O painel de manutenção preditiva com previsão de falhas por equipamento está em construção." },
  digitaltwin: { icon: Building2, title: "Gêmeo Digital do condomínio", desc: "O mapa interativo dos ativos do condomínio (elevadores, bombas, quadros elétricos) está em construção." },
  documentos: { icon: BookOpen, title: "Central de conhecimento", desc: "A busca inteligente sobre regimento interno, convenção e atas está em construção." },
  auditoria: { icon: ScrollText, title: "Auditoria", desc: "O registro auditável de ações — quem alterou, quando e o quê — está em construção." },
  sustentabilidade: { icon: Leaf, title: "Sustentabilidade", desc: "O dashboard de consumo de água, energia e metas ambientais está em construção." },
  automacoes: { icon: GitBranch, title: "Motor de Automações", desc: "A visualização de fluxos automatizados (reserva → cobrança → limpeza → notificação) está em construção." },
  comunidade: { icon: Users, title: "Comunidade", desc: "A rede social privada do condomínio — caronas, feira de usados e eventos — está em construção." },
  perfil: { icon: UserCircle2, title: "Meu perfil", desc: "A edição de dados pessoais e preferências de notificação estará disponível em breve." },
  visitantes: { icon: Truck, title: "Visitantes", desc: "O controle de entrada e saída de visitantes está em construção." },
};

function StubPage({ id }) {
  const meta = STUB_META[id] || { icon: FileText, title: "Em breve", desc: "Este módulo está em construção." };
  return (
    <Card>
      <EmptyState icon={meta.icon} title={meta.title} desc={meta.desc} action={
        <Badge bg={C.amberLight} fg={C.amber} style={{ marginTop: 16 }}>Em construção</Badge>
      } />
    </Card>
  );
}

