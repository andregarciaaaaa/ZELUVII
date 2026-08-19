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

/* ============================================================
   LOGIN SCREEN BACKGROUND
   Troque aqui para usar uma imagem ou um vídeo no painel do login.
   - type: "none"  -> usa só a cor sólida C.ink (padrão atual)
   - type: "image" -> coloque seu arquivo em assets/ e ajuste "src"
   - type: "video" -> coloque seu arquivo em assets/ e ajuste "src"
   ============================================================ */
const LOGIN_BACKGROUND = {
  type: "video", // "none" | "image" | "video"
  src: "assets/condominio.mp4", // ex: "assets/login-bg.jpg" ou "assets/login-bg.mp4"
};

/* ============================================================
   MOCK DATA
   ============================================================ */
const CATEGORIAS_OCORRENCIA = [
  { id: "manutencao", label: "Manutenção", icon: Wrench },
  { id: "limpeza", label: "Limpeza", icon: Sparkles },
  { id: "elevador", label: "Elevador", icon: ArrowUpDown },
  { id: "iluminacao", label: "Iluminação", icon: Lightbulb },
  { id: "portoes", label: "Portões", icon: DoorOpen },
  { id: "hidraulica", label: "Hidráulica", icon: Droplet },
  { id: "seguranca", label: "Segurança", icon: ShieldAlert },
  { id: "outras", label: "Outras", icon: MoreHorizontal },
];

const STATUS_FLOW = ["Aberta", "Recebida", "Em análise", "Em andamento", "Aguardando", "Resolvida", "Cancelada"];

const STATUS_STYLE = {
  "Aberta": { bg: C.amberLight, fg: C.amber },
  "Recebida": { bg: C.infoLight, fg: C.info },
  "Em análise": { bg: C.infoLight, fg: C.info },
  "Em andamento": { bg: C.primaryLight, fg: C.primary },
  "Aguardando": { bg: C.amberLight, fg: C.amber },
  "Resolvida": { bg: C.primaryLight, fg: C.primaryDark },
  "Cancelada": { bg: "#EDEFEC", fg: C.textFaint },
};

let OCORRENCIAS = [
  { id: "OC-1042", title: "Vazamento no teto da garagem G2", categoria: "hidraulica", descricao: "Infiltração próxima à vaga 34, piorando após chuva.", local: "Garagem - Nível 2", prioridade: "Alta", status: "Em andamento", data: "2026-08-10", morador: "Renata Bittencourt", unidade: "302", timeline: [
    { status: "Aberta", data: "10/08 09:12", nota: "Ocorrência registrada pelo morador." },
    { status: "Recebida", data: "10/08 09:40", nota: "Recebida pela administração." },
    { status: "Em andamento", data: "11/08 14:00", nota: "Equipe hidráulica acionada." },
  ]},
  { id: "OC-1041", title: "Lâmpada queimada no corredor do 5º andar", categoria: "iluminacao", descricao: "Corredor ficando escuro à noite.", local: "5º andar - Bloco A", prioridade: "Média", status: "Resolvida", data: "2026-08-08", morador: "Diego Assunção", unidade: "504", timeline: [
    { status: "Aberta", data: "08/08 18:22", nota: "Ocorrência registrada." },
    { status: "Em andamento", data: "09/08 08:00", nota: "Manutenção agendada." },
    { status: "Resolvida", data: "09/08 11:30", nota: "Lâmpada substituída." },
  ]},
  { id: "OC-1040", title: "Portão da garagem travando", categoria: "portoes", descricao: "Motor faz ruído estranho ao abrir.", local: "Entrada de veículos", prioridade: "Alta", status: "Aguardando", data: "2026-08-07", morador: "Renata Bittencourt", unidade: "302", timeline: [
    { status: "Aberta", data: "07/08 07:55", nota: "Ocorrência registrada." },
    { status: "Recebida", data: "07/08 09:00", nota: "Encaminhada ao prestador." },
    { status: "Aguardando", data: "07/08 09:05", nota: "Aguardando peça de reposição." },
  ]},
  { id: "OC-1039", title: "Interfone da portaria sem áudio", categoria: "manutencao", descricao: "Chamadas caem sem som.", local: "Portaria principal", prioridade: "Média", status: "Recebida", data: "2026-08-12", morador: "Portaria", unidade: "-", timeline: [
    { status: "Aberta", data: "12/08 07:00", nota: "Registrado pela portaria." },
    { status: "Recebida", data: "12/08 07:20", nota: "Administração notificada." },
  ]},
  { id: "OC-1038", title: "Câmera da piscina fora do ar", categoria: "seguranca", descricao: "Sem sinal desde ontem à noite.", local: "Área da piscina", prioridade: "Alta", status: "Em análise", data: "2026-08-12", morador: "Zeluvi IA", unidade: "-", timeline: [
    { status: "Aberta", data: "12/08 06:10", nota: "Alerta automático do sistema de câmeras." },
    { status: "Em análise", data: "12/08 08:00", nota: "Equipe de TI verificando." },
  ]},
];

const AREAS_COMUNS = [
  { id: "salao", nome: "Salão de Festas", icon: PartyPopper, capacidade: "80 pessoas", regras: "Uso até 22h. Limpeza por conta do morador." },
  { id: "churrasqueira", nome: "Churrasqueira", icon: Flame, capacidade: "30 pessoas", regras: "Reserva mínima de 3h. Levar carvão próprio." },
  { id: "gourmet", nome: "Espaço Gourmet", icon: UtensilsCrossed, capacidade: "20 pessoas", regras: "Cozinha equipada. Reserva com 48h de antecedência." },
  { id: "quadra", nome: "Quadra Poliesportiva", icon: Dumbbell, capacidade: "14 pessoas", regras: "Uso de calçado apropriado obrigatório." },
  { id: "lazer", nome: "Área de Lazer", icon: Trees, capacidade: "40 pessoas", regras: "Silêncio após 21h." },
  { id: "elevador_servico", nome: "Elevador de Serviço", icon: ArrowUpDown, capacidade: "Mudanças", regras: "Reservar com 24h de antecedência para mudanças." },
];

const HORARIOS = ["09:00–12:00", "12:00–15:00", "15:00–18:00", "18:00–21:00"];

let RESERVAS = [
  { id: "R-501", area: "salao", data: "2026-08-15", horario: "18:00–21:00", morador: "Renata Bittencourt", unidade: "302", status: "Confirmada" },
  { id: "R-502", area: "churrasqueira", data: "2026-08-16", horario: "12:00–15:00", morador: "Diego Assunção", unidade: "504", status: "Confirmada" },
  { id: "R-503", area: "quadra", data: "2026-08-14", horario: "15:00–18:00", morador: "Fábio Nakamura", unidade: "101", status: "Confirmada" },
];

let COMUNICADOS = [
  { id: "CM-88", titulo: "Manutenção preventiva dos elevadores", corpo: "Na quinta-feira, das 9h às 12h, os elevadores do Bloco A passarão por manutenção preventiva. Pedimos que utilizem o Bloco B durante o período.", segmento: "Bloco A", data: "2026-08-12", autor: "Administração", importante: true },
  { id: "CM-87", titulo: "Assembleia geral ordinária — convocação", corpo: "Convocamos todos os condôminos para a assembleia geral ordinária, dia 30/08 às 19h, no salão de festas, para deliberar sobre o orçamento de 2027.", segmento: "Todos", data: "2026-08-10", autor: "Síndico", importante: true },
  { id: "CM-86", titulo: "Campanha de descarte consciente", corpo: "A partir deste mês, o condomínio conta com pontos de coleta seletiva no térreo. Participe e ganhe pontos no programa Zeluvi.", segmento: "Todos", data: "2026-08-05", autor: "Administração", importante: false },
];

let ENTREGAS = [
  { id: "EN-231", destinatario: "Renata Bittencourt", unidade: "302", transportadora: "Correios", codigo: "BR384710225", recebidoEm: "12/08 14:32", status: "Aguardando retirada", retiradoEm: null },
  { id: "EN-230", destinatario: "Diego Assunção", unidade: "504", transportadora: "Mercado Envios", codigo: "ME998213", recebidoEm: "12/08 11:05", status: "Aguardando retirada", retiradoEm: null },
  { id: "EN-229", destinatario: "Fábio Nakamura", unidade: "101", transportadora: "Amazon", codigo: "AMZ00219873", recebidoEm: "11/08 16:40", status: "Retirada", retiradoEm: "11/08 19:12" },
];

const NOTIFICACOES = [
  { id: 1, tipo: "ocorrencia", texto: "Ocorrência OC-1040 aguardando peça de reposição.", tempo: "há 2h", lida: false },
  { id: 2, tipo: "comunicado", texto: "Novo comunicado: Manutenção preventiva dos elevadores.", tempo: "há 5h", lida: false },
  { id: 3, tipo: "entrega", texto: "Encomenda recebida na portaria — unidade 302.", tempo: "há 1 dia", lida: true },
  { id: 4, tipo: "reserva", texto: "Reserva do Salão de Festas confirmada para 15/08.", tempo: "há 1 dia", lida: true },
];

const SAUDE_CATEGORIAS = [
  { label: "Financeiro", score: 82, trend: 1 },
  { label: "Segurança", score: 91, trend: 1 },
  { label: "Comunicação", score: 76, trend: 0 },
  { label: "Manutenção", score: 68, trend: -1 },
  { label: "Sustentabilidade", score: 74, trend: 1 },
  { label: "Participação", score: 63, trend: -1 },
];

const FINANCEIRO_MENSAL = [
  { mes: "Mar", receitas: 148000, despesas: 121000 },
  { mes: "Abr", receitas: 151000, despesas: 133000 },
  { mes: "Mai", receitas: 149500, despesas: 128000 },
  { mes: "Jun", receitas: 153200, despesas: 141000 },
  { mes: "Jul", receitas: 155800, despesas: 137500 },
  { mes: "Ago", receitas: 154000, despesas: 129800 },
];

const DESPESAS_CATEGORIA = [
  { nome: "Folha / Funcionários", valor: 58000 },
  { nome: "Manutenção", valor: 22400 },
  { nome: "Água e energia", valor: 18200 },
  { nome: "Limpeza", valor: 11600 },
  { nome: "Segurança", valor: 14300 },
  { nome: "Administrativo", valor: 5300 },
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
    { id: "comunicados", label: "Comunicados", icon: Megaphone },
    { id: "entregas", label: "Entregas", icon: Package },
    { id: "financeiro", label: "Financeiro", icon: DollarSign },
    { id: "documentos", label: "Documentos", icon: FileText },
    { id: "comunidade", label: "Comunidade", icon: Users },
    { id: "perfil", label: "Meu perfil", icon: UserCircle2 },
  ],
  sindico: [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "moradores", label: "Moradores", icon: Users },
    { id: "financeiro", label: "Financeiro", icon: DollarSign },
    { id: "ocorrencias", label: "Ocorrências", icon: AlertTriangle },
    { id: "reservas", label: "Reservas", icon: Calendar },
    { id: "comunicados", label: "Comunicados", icon: Megaphone },
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
    { id: "entregas", label: "Entregas", icon: Package },
    { id: "visitantes", label: "Visitantes", icon: Truck },
    { id: "ocorrencias", label: "Ocorrências", icon: AlertTriangle },
    { id: "comunicados", label: "Avisos", icon: Megaphone },
    { id: "reservas", label: "Reservas", icon: Calendar },
  ],
};

const ROLE_LABEL = { morador: "Morador", sindico: "Síndico / Administração", portaria: "Portaria" };

const DEMO_USERS = {
  morador: { name: "Renata Bittencourt", unidade: "302", email: "renata@email.com" },
  sindico: { name: "Marcelo Vieira", unidade: "-", email: "marcelo@zeluvi.com" },
  portaria: { name: "José Carlos", unidade: "-", email: "portaria@zeluvi.com" },
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
   LOGIN SCREEN
   ============================================================ */
function LoginScreen({ onLogin }) {
  const [role, setRole] = useState("morador");
  const [email, setEmail] = useState(DEMO_USERS.morador.email);
  const [loading, setLoading] = useState(false);

  useEffect(() => { setEmail(DEMO_USERS[role].email); }, [role]);

  function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      onLogin(role);
      setLoading(false);
    }, 600);
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: C.bg, fontFamily: FONT_BODY }}>
      {/* Brand panel */}
      <div style={{ flex: 1, background: C.ink, color: "#fff", padding: "56px 56px", flexDirection: "column", justifyContent: "space-between", position: "relative", overflow: "hidden", minWidth: 0 }} className="hidden md:flex">
        {LOGIN_BACKGROUND.type === "image" && (
          <div style={{ position: "absolute", inset: 0, zIndex: 0, backgroundImage: `url('${LOGIN_BACKGROUND.src}')`, backgroundSize: "cover", backgroundPosition: "center" }} />
        )}
        {LOGIN_BACKGROUND.type === "video" && (
          <video autoPlay muted loop playsInline style={{ position: "absolute", inset: 0, zIndex: 0, width: "100%", height: "100%", objectFit: "cover" }}>
            <source src={LOGIN_BACKGROUND.src} />
          </video>
        )}
        {/*<svg width="520" height="520" viewBox="0 0 520 520" style={{ position: "absolute", top: -120, right: -140, opacity: 0.5, zIndex: 1 }}>
          {SAUDE_CATEGORIAS.map((cat, i) => {
            const cx = 260, cy = 260, r = 200;
            const n = SAUDE_CATEGORIAS.length, gap = 10, slice = 360 / n;
            const start = i * slice + gap / 2, end = (i + 1) * slice - gap / 2;
            const filledEnd = start + ((end - start) * cat.score) / 100;
            return (
              <g key={cat.label}>
                <path d={arcPath(cx, cy, r, start, end)} stroke="rgba(255,255,255,0.08)" strokeWidth={22} fill="none" strokeLinecap="round" />
                <path d={arcPath(cx, cy, r, start, filledEnd)} stroke="rgba(232,163,61,0.55)" strokeWidth={22} fill="none" strokeLinecap="round" />
              </g>
            );
          })}
        </svg>*/}
        {LOGIN_BACKGROUND.type !== "none" && (
          <div style={{ position: "absolute", inset: 0, zIndex: 2, background: "linear-gradient(160deg, rgba(15,33,27,0.90) 0%, rgba(15,33,27,0.72) 55%, rgba(15,33,27,0.90) 100%)" }} />
        )}
        <div style={{ position: "relative", zIndex: 3 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 64 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: C.primary, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Building2 size={18} color="#fff" />
            </div>
            <span style={{ fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 600, letterSpacing: 0.3 }}>Zeluvi</span>
          </div>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 38, lineHeight: 1.25, fontWeight: 500, maxWidth: 420 }}>
            Tudo do seu condomínio, <span style={{ color: "#E8A33D" }}>em um só lugar.</span>
          </div>
          <div style={{ fontSize: 15, color: "rgba(255,255,255,0.65)", marginTop: 18, maxWidth: 380, lineHeight: 1.6 }}>
            Comunicação, ocorrências, reservas e gestão administrativa organizadas num único ambiente — para moradores, síndicos e portaria.
          </div>
        </div>
        <div style={{ position: "relative", zIndex: 3, display: "flex", gap: 28, fontSize: 13, color: "rgba(255,255,255,0.55)" }}>
          <div>124 unidades</div>
          <div>3 perfis de acesso</div>
          <div>Índice de saúde em tempo real</div>
        </div>
      </div>

      {/* Form panel */}
      <div style={{ width: 440, maxWidth: "100%", background: C.surface, padding: "56px 40px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 36 }} className="md:hidden">
          <div style={{ width: 30, height: 30, borderRadius: 8, background: C.primary, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Building2 size={16} color="#fff" />
          </div>
          <span style={{ fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 600, color: C.ink }}>Zeluvi</span>
        </div>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 24, fontWeight: 600, color: C.ink, marginBottom: 4 }}>Entrar na plataforma</div>
        <div style={{ fontSize: 13.5, color: C.textMuted, marginBottom: 28 }}>Selecione seu perfil de demonstração para explorar o Zeluvi.</div>

        <div style={{ display: "flex", gap: 8, marginBottom: 24, background: C.bg, padding: 4, borderRadius: 11 }}>
          {Object.keys(ROLE_LABEL).map((r) => (
            <button
              key={r}
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

        <form onSubmit={handleSubmit}>
          <Field label="E-mail">
            <input style={inputStyle} value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
          </Field>
          <Field label="Senha">
            <input style={inputStyle} type="password" defaultValue="••••••••" />
          </Field>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22, fontSize: 13 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 7, color: C.textMuted, cursor: "pointer" }}>
              <input type="checkbox" defaultChecked /> Lembrar acesso
            </label>
            <a href="#" onClick={(e) => e.preventDefault()} style={{ color: C.primary, fontWeight: 600, textDecoration: "none" }}>Esqueci minha senha</a>
          </div>
          <Button type="submit" style={{ width: "100%", padding: "11px 16px" }} disabled={loading}>
            {loading ? <Loader2 size={16} className="" style={{ animation: "spin 1s linear infinite" }} /> : null}
            {loading ? "Entrando..." : `Entrar como ${ROLE_LABEL[role]}`}
          </Button>
        </form>
        <div style={{ marginTop: 22, padding: 14, borderRadius: 10, background: C.primaryLight, fontSize: 12.5, color: C.primaryDark, lineHeight: 1.5 }}>
          Ambiente de demonstração — os dados exibidos são fictícios e servem apenas para ilustrar a experiência do Zeluvi.
        </div>
      </div>
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
   PAGE: DASHBOARD — MORADOR
   ============================================================ */
function DashboardMorador({ user, setPage, ocorrencias, reservas, comunicados }) {
  const minhasOcorrencias = ocorrencias.filter((o) => o.morador === user.name);
  const minhasReservas = reservas.filter((r) => r.morador === user.name);
  const emAndamento = minhasOcorrencias.filter((o) => !["Resolvida", "Cancelada"].includes(o.status));

  return (
    <div className="fade-up">
      <Card style={{ background: C.ink, color: "#fff", marginBottom: 20, border: "none" }}>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 600 }}>Olá, {user.name.split(" ")[0]} 👋</div>
        <div style={{ fontSize: 13.5, color: "rgba(255,255,255,0.65)", marginTop: 4 }}>Unidade {user.unidade} · Bloco A</div>
      </Card>

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 20 }}>
        <StatCard icon={AlertTriangle} label="Solicitações em andamento" value={emAndamento.length} accent={C.amber} />
        <StatCard icon={Calendar} label="Próxima reserva" value={minhasReservas[0] ? minhasReservas[0].data.slice(8, 10) + "/" + minhasReservas[0].data.slice(5, 7) : "—"} accent={C.primary} />
        <StatCard icon={Package} label="Encomendas aguardando" value={ENTREGAS.filter((e) => e.unidade === user.unidade && e.status !== "Retirada").length} accent={C.info} />
        <StatCard icon={DollarSign} label="Situação financeira" value="Em dia" accent={C.primary} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }} className="grid-stack">
        <Card>
          <div style={{ fontWeight: 700, fontSize: 15, color: C.ink, marginBottom: 4 }}>Acesso rápido</div>
          <div style={{ fontSize: 12.5, color: C.textMuted, marginBottom: 16 }}>O que você precisa está a um clique.</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }} className="quick-grid">
            {[
              { label: "Nova ocorrência", icon: AlertTriangle, page: "ocorrencias" },
              { label: "Reservar área", icon: Calendar, page: "reservas" },
              { label: "Ver comunicados", icon: Megaphone, page: "comunicados" },
              { label: "Entregas", icon: Package, page: "entregas" },
              { label: "Financeiro", icon: DollarSign, page: "financeiro" },
              { label: "Documentos", icon: FileText, page: "documentos" },
              { label: "Comunidade", icon: Users, page: "comunidade" },
              { label: "Meu perfil", icon: UserCircle2, page: "perfil" },
            ].map((a) => (
              <button key={a.label} onClick={() => setPage(a.page)} style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 10, padding: 14, borderRadius: 12, border: `1px solid ${C.border}`, background: C.bg, cursor: "pointer", textAlign: "left" }}>
                <a.icon size={18} color={C.primary} />
                <span style={{ fontSize: 12.5, fontWeight: 600, color: C.ink }}>{a.label}</span>
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <div style={{ fontWeight: 700, fontSize: 15, color: C.ink, marginBottom: 12 }}>Últimos comunicados</div>
          {comunicados.slice(0, 3).map((c) => (
            <div key={c.id} style={{ paddingBottom: 12, marginBottom: 12, borderBottom: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}>
                {c.importante && <Badge bg={C.dangerLight} fg={C.danger}>Importante</Badge>}
                <span style={{ fontSize: 11, color: C.textFaint }}>{c.data.slice(8, 10)}/{c.data.slice(5, 7)}</span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{c.titulo}</div>
            </div>
          ))}
          <Button variant="ghost" style={{ padding: "6px 0" }} onClick={() => setPage("comunicados")}>Ver todos <ChevronRight size={14} /></Button>
        </Card>
      </div>

      <div style={{ marginTop: 16 }}>
        <Card>
          <div style={{ fontWeight: 700, fontSize: 15, color: C.ink, marginBottom: 12 }}>Minhas solicitações em andamento</div>
          {emAndamento.length === 0 ? (
            <EmptyState icon={CheckCircle2} title="Nenhuma solicitação em andamento" desc="Você não possui ocorrências ou solicitações pendentes no momento." />
          ) : (
            emAndamento.map((o) => (
              <div key={o.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: `1px solid ${C.border}` }}>
                <Badge bg={STATUS_STYLE[o.status].bg} fg={STATUS_STYLE[o.status].fg}>{o.status}</Badge>
                <div style={{ flex: 1, fontSize: 13.5, color: C.ink, fontWeight: 500 }}>{o.title}</div>
                <span style={{ fontSize: 11.5, color: C.textFaint, fontFamily: FONT_MONO }}>{o.id}</span>
              </div>
            ))
          )}
        </Card>
      </div>
    </div>
  );
}

/* ============================================================
   PAGE: DASHBOARD — SÍNDICO
   ============================================================ */
function DashboardSindico({ setPage, ocorrencias }) {
  const abertas = ocorrencias.filter((o) => o.status === "Aberta").length;
  const andamento = ocorrencias.filter((o) => o.status === "Em andamento").length;

  return (
    <div className="fade-up">
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 16 }}>
        <StatCard icon={Users} label="Total de moradores" value="124" trend={1} trendLabel="+2" accent={C.info} />
        <StatCard icon={AlertTriangle} label="Ocorrências abertas" value={abertas} accent={C.amber} />
        <StatCard icon={Wrench} label="Em andamento" value={andamento} accent={C.primary} />
        <StatCard icon={Calendar} label="Reservas hoje" value={RESERVAS.filter((r) => r.data === "2026-08-14").length} accent={C.info} />
        <StatCard icon={Package} label="Entregas pendentes" value={ENTREGAS.filter((e) => e.status !== "Retirada").length} accent={C.amber} />
        <StatCard icon={DollarSign} label="Inadimplência" value="4,8%" trend={-1} trendLabel="-0,3pp" accent={C.primary} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1.4fr", gap: 16, marginBottom: 16 }} className="grid-stack">
        <Card>
          <div style={{ fontWeight: 700, fontSize: 15, color: C.ink, marginBottom: 2 }}>Índice de Saúde do Condomínio</div>
          <div style={{ fontSize: 12.5, color: C.textMuted, marginBottom: 8 }}>O "Anel de Zelo" resume 6 dimensões da gestão.</div>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <AnelDeZelo categorias={SAUDE_CATEGORIAS} size={260} />
          </div>
        </Card>
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: C.ink }}>Receitas x Despesas</div>
            <Badge bg={C.primaryLight} fg={C.primaryDark}>Últimos 6 meses</Badge>
          </div>
          <div style={{ marginTop: 12 }}>
            <AreaChartSVG
              data={FINANCEIRO_MENSAL}
              xKey="mes"
              height={220}
              formatValue={fmtBRL}
              series={[
                { key: "receitas", label: "Receitas", color: C.primary },
                { key: "despesas", label: "Despesas", color: C.amber },
              ]}
            />
          </div>
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1.1fr", gap: 16 }} className="grid-stack">
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: C.ink }}>Alertas da IA Gestora</div>
            <Badge bg={C.dangerLight} fg={C.danger}>{ALERTAS_IA.filter((a) => a.prioridade === "Alta").length} críticos</Badge>
          </div>
          {ALERTAS_IA.map((a) => {
            const pStyle = a.prioridade === "Alta" ? { bg: C.dangerLight, fg: C.danger } : a.prioridade === "Média" ? { bg: C.amberLight, fg: C.amber } : { bg: C.infoLight, fg: C.info };
            return (
              <div key={a.titulo} style={{ padding: "12px 0", borderBottom: `1px solid ${C.border}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: C.ink }}>{a.titulo}</div>
                  <Badge bg={pStyle.bg} fg={pStyle.fg} style={{ flexShrink: 0 }}>{a.prioridade}</Badge>
                </div>
                <div style={{ fontSize: 12.5, color: C.textMuted, marginTop: 4, lineHeight: 1.5 }}>{a.desc}</div>
                <div style={{ fontSize: 12, color: C.primaryDark, marginTop: 6, display: "flex", gap: 6, alignItems: "flex-start" }}>
                  <Sparkles size={13} style={{ marginTop: 2, flexShrink: 0 }} /> {a.recomendacao}
                </div>
              </div>
            );
          })}
        </Card>

        <Card style={{ background: `linear-gradient(160deg, ${C.ink} 0%, #17352B 100%)`, color: "#fff", border: "none", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Bot size={17} />
            </div>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 600 }}>Copiloto Zeluvi</div>
          </div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.6, marginBottom: 16 }}>
            Pergunte sobre ocorrências, contratos, finanças ou manutenção e receba um resumo executivo com recomendações.
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
            {QUICK_QUESTIONS.slice(0, 3).map((q) => (
              <div key={q} style={{ fontSize: 12.5, padding: "9px 12px", borderRadius: 9, background: "rgba(255,255,255,0.08)" }}>{q}</div>
            ))}
          </div>
          <Button onClick={() => setPage("copiloto")} style={{ background: "#fff", color: C.ink, marginTop: "auto" }} icon={MessageSquare}>Abrir copiloto</Button>
        </Card>
      </div>
    </div>
  );
}

/* ============================================================
   PAGE: DASHBOARD — PORTARIA
   ============================================================ */
function DashboardPortaria({ setPage, entregas }) {
  const pendentes = entregas.filter((e) => e.status !== "Retirada");
  return (
    <div className="fade-up">
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 16 }}>
        <StatCard icon={Package} label="Encomendas aguardando retirada" value={pendentes.length} accent={C.amber} />
        <StatCard icon={Truck} label="Visitantes hoje" value="9" accent={C.info} />
        <StatCard icon={AlertTriangle} label="Ocorrências abertas" value={OCORRENCIAS.filter((o) => o.status === "Aberta" || o.status === "Recebida").length} accent={C.danger} />
        <StatCard icon={Calendar} label="Reservas hoje" value={RESERVAS.filter((r) => r.data === "2026-08-14").length} accent={C.primary} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 16 }} className="grid-stack">
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: C.ink }}>Encomendas recentes</div>
            <Button icon={Plus} onClick={() => setPage("entregas")}>Registrar</Button>
          </div>
          {entregas.slice(0, 5).map((e) => (
            <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: C.infoLight, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Package size={16} color={C.info} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{e.destinatario} · Un. {e.unidade}</div>
                <div style={{ fontSize: 11.5, color: C.textFaint }}>{e.transportadora} · {e.recebidoEm}</div>
              </div>
              <Badge bg={e.status === "Retirada" ? C.primaryLight : C.amberLight} fg={e.status === "Retirada" ? C.primaryDark : C.amber}>{e.status}</Badge>
            </div>
          ))}
        </Card>
        <Card>
          <div style={{ fontWeight: 700, fontSize: 15, color: C.ink, marginBottom: 12 }}>Reservas de hoje</div>
          {RESERVAS.filter((r) => r.data === "2026-08-14").length === 0 ? (
            <EmptyState icon={Calendar} title="Sem reservas hoje" desc="Nenhuma área comum foi reservada para hoje." />
          ) : (
            RESERVAS.filter((r) => r.data === "2026-08-14").map((r) => {
              const area = AREAS_COMUNS.find((a) => a.id === r.area);
              return (
                <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
                  {area && <area.icon size={16} color={C.primary} />}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{area?.nome}</div>
                    <div style={{ fontSize: 11.5, color: C.textFaint }}>{r.horario} · Un. {r.unidade}</div>
                  </div>
                </div>
              );
            })
          )}
        </Card>
      </div>
    </div>
  );
}

/* ============================================================
   PAGE: OCORRÊNCIAS
   ============================================================ */
function OcorrenciasPage({ role, user, ocorrencias, setOcorrencias, showToast }) {
  const [filtro, setFiltro] = useState("Todas");
  const [novaOpen, setNovaOpen] = useState(false);
  const [detalhe, setDetalhe] = useState(null);
  const [form, setForm] = useState({ title: "", categoria: "manutencao", descricao: "", local: "", prioridade: "Média" });

  const visiveis = role === "morador" ? ocorrencias.filter((o) => o.morador === user.name) : ocorrencias;
  const filtradas = filtro === "Todas" ? visiveis : visiveis.filter((o) => o.status === filtro);

  function criarOcorrencia(e) {
    e.preventDefault();
    const id = "OC-" + (1043 + ocorrencias.length);
    const nova = {
      id, title: form.title, categoria: form.categoria, descricao: form.descricao, local: form.local,
      prioridade: form.prioridade, status: "Aberta", data: "2026-08-14", morador: user.name, unidade: user.unidade,
      timeline: [{ status: "Aberta", data: "14/08 " + new Date().toTimeString().slice(0, 5), nota: "Ocorrência registrada pelo morador." }],
    };
    setOcorrencias([nova, ...ocorrencias]);
    setNovaOpen(false);
    setForm({ title: "", categoria: "manutencao", descricao: "", local: "", prioridade: "Média" });
    showToast("Ocorrência registrada com sucesso.");
  }

  function avancarStatus(oc) {
    const idx = STATUS_FLOW.indexOf(oc.status);
    const proximo = STATUS_FLOW[Math.min(idx + 1, STATUS_FLOW.length - 2)];
    const atualizado = {
      ...oc, status: proximo,
      timeline: [...oc.timeline, { status: proximo, data: "14/08 " + new Date().toTimeString().slice(0, 5), nota: `Status atualizado para "${proximo}" pela administração.` }],
    };
    setOcorrencias(ocorrencias.map((o) => (o.id === oc.id ? atualizado : o)));
    setDetalhe(atualizado);
    showToast(`Status de ${oc.id} atualizado para "${proximo}".`);
  }

  return (
    <div className="fade-up">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["Todas", ...STATUS_FLOW].map((s) => (
            <button key={s} onClick={() => setFiltro(s)} style={{
              padding: "7px 13px", borderRadius: 999, fontSize: 12.5, fontWeight: 600, cursor: "pointer",
              border: `1px solid ${filtro === s ? C.primary : C.border}`,
              background: filtro === s ? C.primary : C.surface, color: filtro === s ? "#fff" : C.textMuted,
            }}>{s}</button>
          ))}
        </div>
        {role !== "portaria" && <Button icon={Plus} onClick={() => setNovaOpen(true)}>Nova ocorrência</Button>}
      </div>

      {filtradas.length === 0 ? (
        <Card><EmptyState icon={CheckCircle2} title="Nenhuma ocorrência encontrada" desc="Não há ocorrências para este filtro no momento." /></Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtradas.map((o) => {
            const cat = CATEGORIAS_OCORRENCIA.find((c) => c.id === o.categoria);
            return (
              <Card key={o.id} style={{ cursor: "pointer" }}>
                <div onClick={() => setDetalhe(o)} style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: C.primaryLight, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {cat && <cat.icon size={17} color={C.primary} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>{o.title}</span>
                      {o.prioridade === "Alta" && <Badge bg={C.dangerLight} fg={C.danger}>Prioridade alta</Badge>}
                    </div>
                    <div style={{ fontSize: 12.5, color: C.textMuted, display: "flex", gap: 14, flexWrap: "wrap" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}><MapPin size={12} /> {o.local}</span>
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Clock size={12} /> {o.data.slice(8, 10)}/{o.data.slice(5, 7)}</span>
                      {role !== "morador" && <span>{o.morador} · Un. {o.unidade}</span>}
                    </div>
                  </div>
                  <Badge bg={STATUS_STYLE[o.status].bg} fg={STATUS_STYLE[o.status].fg}>{o.status}</Badge>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={novaOpen} onClose={() => setNovaOpen(false)} title="Nova ocorrência">
        <form onSubmit={criarOcorrencia}>
          <Field label="Título">
            <input required style={inputStyle} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex: Vazamento no corredor" />
          </Field>
          <Field label="Categoria">
            <select style={inputStyle} value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}>
              {CATEGORIAS_OCORRENCIA.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </Field>
          <Field label="Localização">
            <input required style={inputStyle} value={form.local} onChange={(e) => setForm({ ...form, local: e.target.value })} placeholder="Ex: 3º andar, corredor" />
          </Field>
          <Field label="Prioridade">
            <select style={inputStyle} value={form.prioridade} onChange={(e) => setForm({ ...form, prioridade: e.target.value })}>
              <option>Baixa</option><option>Média</option><option>Alta</option>
            </select>
          </Field>
          <Field label="Descrição">
            <textarea required style={{ ...inputStyle, minHeight: 90, resize: "vertical" }} value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Descreva o problema com detalhes..." />
          </Field>
          <div style={{ fontSize: 12, color: C.textFaint, marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}>
            <FileText size={13} /> Anexar fotos estará disponível em breve.
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Button variant="outline" onClick={() => setNovaOpen(false)} type="button">Cancelar</Button>
            <Button type="submit">Registrar ocorrência</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!detalhe} onClose={() => setDetalhe(null)} title={detalhe?.id} width={560}>
        {detalhe && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 12 }}>
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 600, color: C.ink }}>{detalhe.title}</div>
              <Badge bg={STATUS_STYLE[detalhe.status].bg} fg={STATUS_STYLE[detalhe.status].fg}>{detalhe.status}</Badge>
            </div>
            <div style={{ fontSize: 13.5, color: C.textMuted, lineHeight: 1.6, marginBottom: 16 }}>{detalhe.descricao}</div>
            <div style={{ display: "flex", gap: 18, flexWrap: "wrap", fontSize: 12.5, color: C.textMuted, marginBottom: 20 }}>
              <span><strong style={{ color: C.ink }}>Local:</strong> {detalhe.local}</span>
              <span><strong style={{ color: C.ink }}>Prioridade:</strong> {detalhe.prioridade}</span>
              <span><strong style={{ color: C.ink }}>Morador:</strong> {detalhe.morador} (Un. {detalhe.unidade})</span>
            </div>
            <div style={{ fontWeight: 700, fontSize: 13.5, color: C.ink, marginBottom: 10 }}>Linha do tempo</div>
            <div style={{ marginBottom: 20 }}>
              {detalhe.timeline.map((t, i) => (
                <div key={i} style={{ display: "flex", gap: 12 }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{ width: 9, height: 9, borderRadius: 999, background: C.primary, marginTop: 4 }} />
                    {i < detalhe.timeline.length - 1 && <div style={{ width: 1.5, flex: 1, background: C.border, minHeight: 24 }} />}
                  </div>
                  <div style={{ paddingBottom: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{t.status} <span style={{ color: C.textFaint, fontWeight: 400, fontSize: 11.5 }}>· {t.data}</span></div>
                    <div style={{ fontSize: 12.5, color: C.textMuted, marginTop: 2 }}>{t.nota}</div>
                  </div>
                </div>
              ))}
            </div>
            {role !== "morador" && !["Resolvida", "Cancelada"].includes(detalhe.status) && (
              <Button onClick={() => avancarStatus(detalhe)} icon={CheckCircle2}>Avançar status</Button>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

/* ============================================================
   PAGE: RESERVAS
   ============================================================ */
function ReservasPage({ role, user, reservas, setReservas, showToast }) {
  const [areaModal, setAreaModal] = useState(null);
  const [data, setData] = useState("2026-08-15");
  const [horario, setHorario] = useState(HORARIOS[0]);

  const listaBase = role === "morador" ? reservas.filter((r) => r.morador === user.name) : reservas;

  function ocupado(areaId, d, h) {
    return reservas.some((r) => r.area === areaId && r.data === d && r.horario === h);
  }

  function confirmarReserva() {
    if (ocupado(areaModal.id, data, horario)) { showToast("Este horário já está reservado."); return; }
    const nova = { id: "R-" + Math.floor(500 + Math.random() * 400), area: areaModal.id, data, horario, morador: user.name, unidade: user.unidade, status: "Confirmada" };
    setReservas([nova, ...reservas]);
    setAreaModal(null);
    showToast(`Reserva de ${areaModal.nome} confirmada para ${data.slice(8, 10)}/${data.slice(5, 7)}.`);
  }

  return (
    <div className="fade-up">
      <div style={{ fontWeight: 700, fontSize: 15, color: C.ink, marginBottom: 12 }}>Áreas comuns</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 24 }} className="area-grid">
        {AREAS_COMUNS.map((a) => (
          <Card key={a.id} style={{ cursor: role !== "portaria" ? "pointer" : "default" }}>
            <div onClick={() => role !== "portaria" && setAreaModal(a)}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: C.primaryLight, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                <a.icon size={18} color={C.primary} />
              </div>
              <div style={{ fontWeight: 700, fontSize: 14, color: C.ink, marginBottom: 4 }}>{a.nome}</div>
              <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 10 }}>{a.capacidade}</div>
              <div style={{ fontSize: 11.5, color: C.textFaint, lineHeight: 1.5 }}>{a.regras}</div>
              {role !== "portaria" && <Button variant="outline" style={{ marginTop: 12, width: "100%" }} icon={Calendar}>Reservar</Button>}
            </div>
          </Card>
        ))}
      </div>

      <div style={{ fontWeight: 700, fontSize: 15, color: C.ink, marginBottom: 12 }}>{role === "morador" ? "Minhas reservas" : "Todas as reservas"}</div>
      {listaBase.length === 0 ? (
        <Card><EmptyState icon={Calendar} title="Nenhuma reserva encontrada" desc="Ainda não há reservas registradas para este perfil." /></Card>
      ) : (
        <Card padded={false}>
          {listaBase.map((r, i) => {
            const area = AREAS_COMUNS.find((a) => a.id === r.area);
            return (
              <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", borderBottom: i < listaBase.length - 1 ? `1px solid ${C.border}` : "none" }}>
                {area && <area.icon size={18} color={C.primary} />}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: C.ink }}>{area?.nome}</div>
                  <div style={{ fontSize: 12, color: C.textMuted }}>{r.data.slice(8, 10)}/{r.data.slice(5, 7)}/{r.data.slice(0, 4)} · {r.horario}{role !== "morador" ? ` · ${r.morador} (Un. ${r.unidade})` : ""}</div>
                </div>
                <Badge bg={C.primaryLight} fg={C.primaryDark}>{r.status}</Badge>
              </div>
            );
          })}
        </Card>
      )}

      <Modal open={!!areaModal} onClose={() => setAreaModal(null)} title={`Reservar ${areaModal?.nome || ""}`}>
        <Field label="Data">
          <input type="date" style={inputStyle} value={data} onChange={(e) => setData(e.target.value)} min="2026-08-14" />
        </Field>
        <Field label="Horário">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {HORARIOS.map((h) => {
              const occ = areaModal && ocupado(areaModal.id, data, h);
              return (
                <button key={h} disabled={occ} onClick={() => setHorario(h)} style={{
                  padding: "10px 8px", borderRadius: 9, fontSize: 12.5, fontWeight: 600, cursor: occ ? "not-allowed" : "pointer",
                  border: `1px solid ${horario === h ? C.primary : C.borderStrong}`,
                  background: occ ? "#F1F1EF" : horario === h ? C.primaryLight : "#fff",
                  color: occ ? C.textFaint : horario === h ? C.primaryDark : C.ink,
                  textDecoration: occ ? "line-through" : "none",
                }}>{h}{occ ? " · ocupado" : ""}</button>
              );
            })}
          </div>
        </Field>
        {areaModal && <div style={{ fontSize: 12, color: C.textMuted, background: C.bg, padding: 12, borderRadius: 9, marginBottom: 16, lineHeight: 1.5 }}>{areaModal.regras}</div>}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Button variant="outline" onClick={() => setAreaModal(null)}>Cancelar</Button>
          <Button onClick={confirmarReserva}>Confirmar reserva</Button>
        </div>
      </Modal>
    </div>
  );
}

/* ============================================================
   PAGE: COMUNICADOS
   ============================================================ */
function ComunicadosPage({ role, comunicados, setComunicados, showToast }) {
  const [novoOpen, setNovoOpen] = useState(false);
  const [form, setForm] = useState({ titulo: "", corpo: "", segmento: "Todos", importante: false });

  function publicar(e) {
    e.preventDefault();
    const novo = { id: "CM-" + Math.floor(89 + Math.random() * 10), titulo: form.titulo, corpo: form.corpo, segmento: form.segmento, data: "2026-08-14", autor: role === "sindico" ? "Síndico" : "Portaria", importante: form.importante };
    setComunicados([novo, ...comunicados]);
    setNovoOpen(false);
    setForm({ titulo: "", corpo: "", segmento: "Todos", importante: false });
    showToast("Comunicado publicado.");
  }

  return (
    <div className="fade-up">
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        {(role === "sindico" || role === "portaria") && <Button icon={Plus} onClick={() => setNovoOpen(true)}>Novo comunicado</Button>}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {comunicados.map((c) => (
          <Card key={c.id}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                {c.importante && <Badge bg={C.dangerLight} fg={C.danger}>Importante</Badge>}
                <Badge bg={C.infoLight} fg={C.info}>{c.segmento}</Badge>
              </div>
              <span style={{ fontSize: 12, color: C.textFaint }}>{c.data.slice(8, 10)}/{c.data.slice(5, 7)}/{c.data.slice(0, 4)} · {c.autor}</span>
            </div>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 600, color: C.ink, marginBottom: 6 }}>{c.titulo}</div>
            <div style={{ fontSize: 13.5, color: C.textMuted, lineHeight: 1.6 }}>{c.corpo}</div>
          </Card>
        ))}
      </div>

      <Modal open={novoOpen} onClose={() => setNovoOpen(false)} title="Novo comunicado">
        <form onSubmit={publicar}>
          <Field label="Título">
            <input required style={inputStyle} value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
          </Field>
          <Field label="Mensagem">
            <textarea required style={{ ...inputStyle, minHeight: 100, resize: "vertical" }} value={form.corpo} onChange={(e) => setForm({ ...form, corpo: e.target.value })} />
          </Field>
          <Field label="Enviar para">
            <select style={inputStyle} value={form.segmento} onChange={(e) => setForm({ ...form, segmento: e.target.value })}>
              <option>Todos</option><option>Bloco A</option><option>Bloco B</option><option>Torre 1</option><option>Torre 2</option><option>Unidade específica</option><option>Grupo específico</option>
            </select>
          </Field>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: C.textMuted, marginBottom: 18 }}>
            <input type="checkbox" checked={form.importante} onChange={(e) => setForm({ ...form, importante: e.target.checked })} /> Marcar como importante
          </label>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Button variant="outline" type="button" onClick={() => setNovoOpen(false)}>Cancelar</Button>
            <Button type="submit">Publicar comunicado</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

/* ============================================================
   PAGE: ENTREGAS
   ============================================================ */
function EntregasPage({ role, user, entregas, setEntregas, showToast }) {
  const [novoOpen, setNovoOpen] = useState(false);
  const [form, setForm] = useState({ destinatario: "", unidade: "", transportadora: "", codigo: "" });

  const lista = role === "morador" ? entregas.filter((e) => e.unidade === user.unidade) : entregas;

  function registrar(e) {
    e.preventDefault();
    const nova = { id: "EN-" + Math.floor(232 + Math.random() * 90), ...form, recebidoEm: "14/08 " + new Date().toTimeString().slice(0, 5), status: "Aguardando retirada", retiradoEm: null };
    setEntregas([nova, ...entregas]);
    setNovoOpen(false);
    setForm({ destinatario: "", unidade: "", transportadora: "", codigo: "" });
    showToast("Encomenda registrada. Morador notificado.");
  }

  function marcarRetirada(id) {
    setEntregas(entregas.map((e) => e.id === id ? { ...e, status: "Retirada", retiradoEm: "14/08 " + new Date().toTimeString().slice(0, 5) } : e));
    showToast("Encomenda marcada como retirada.");
  }

  return (
    <div className="fade-up">
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        {role === "portaria" && <Button icon={Plus} onClick={() => setNovoOpen(true)}>Registrar encomenda</Button>}
      </div>
      {lista.length === 0 ? (
        <Card><EmptyState icon={Package} title="Nenhuma encomenda registrada" desc="Não há encomendas para exibir no momento." /></Card>
      ) : (
        <Card padded={false} style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 640 }}>
            <thead>
              <tr style={{ background: C.bg, textAlign: "left" }}>
                {["Destinatário", "Unidade", "Transportadora", "Código", "Recebido em", "Status", ""].map((h) => (
                  <th key={h} style={{ padding: "11px 16px", fontSize: 11.5, color: C.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.3 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lista.map((e) => (
                <tr key={e.id} style={{ borderTop: `1px solid ${C.border}` }}>
                  <td style={{ padding: "12px 16px", fontWeight: 600, color: C.ink }}>{e.destinatario}</td>
                  <td style={{ padding: "12px 16px", color: C.textMuted }}>{e.unidade}</td>
                  <td style={{ padding: "12px 16px", color: C.textMuted }}>{e.transportadora}</td>
                  <td style={{ padding: "12px 16px", color: C.textMuted, fontFamily: FONT_MONO, fontSize: 12 }}>{e.codigo}</td>
                  <td style={{ padding: "12px 16px", color: C.textMuted }}>{e.recebidoEm}</td>
                  <td style={{ padding: "12px 16px" }}><Badge bg={e.status === "Retirada" ? C.primaryLight : C.amberLight} fg={e.status === "Retirada" ? C.primaryDark : C.amber}>{e.status}</Badge></td>
                  <td style={{ padding: "12px 16px" }}>
                    {role === "portaria" && e.status !== "Retirada" && <Button variant="outline" style={{ padding: "6px 10px", fontSize: 12 }} onClick={() => marcarRetirada(e.id)}>Marcar retirada</Button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Modal open={novoOpen} onClose={() => setNovoOpen(false)} title="Registrar encomenda">
        <form onSubmit={registrar}>
          <Field label="Destinatário">
            <input required style={inputStyle} value={form.destinatario} onChange={(e) => setForm({ ...form, destinatario: e.target.value })} />
          </Field>
          <Field label="Unidade">
            <input required style={inputStyle} value={form.unidade} onChange={(e) => setForm({ ...form, unidade: e.target.value })} placeholder="Ex: 302" />
          </Field>
          <Field label="Transportadora">
            <input required style={inputStyle} value={form.transportadora} onChange={(e) => setForm({ ...form, transportadora: e.target.value })} />
          </Field>
          <Field label="Código de rastreio">
            <input style={inputStyle} value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} />
          </Field>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Button variant="outline" type="button" onClick={() => setNovoOpen(false)}>Cancelar</Button>
            <Button type="submit">Registrar</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

/* ============================================================
   PAGE: FINANCEIRO
   ============================================================ */
function FinanceiroPage({ role }) {
  return (
    <div className="fade-up">
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 16 }}>
        <StatCard icon={TrendingUp} label="Receita do mês" value={fmtBRL(154000)} accent={C.primary} />
        <StatCard icon={TrendingDown} label="Despesa do mês" value={fmtBRL(129800)} accent={C.amber} />
        <StatCard icon={DollarSign} label="Saldo do mês" value={fmtBRL(24200)} accent={C.primary} />
        <StatCard icon={AlertTriangle} label="Inadimplência" value="4,8%" trend={-1} trendLabel="-0,3pp" accent={C.info} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16 }} className="grid-stack">
        <Card>
          <div style={{ fontWeight: 700, fontSize: 15, color: C.ink, marginBottom: 12 }}>Receitas x Despesas</div>
          <div>
            <BarChartSVG
              data={FINANCEIRO_MENSAL}
              xKey="mes"
              height={260}
              formatValue={fmtBRL}
              series={[
                { key: "receitas", label: "Receitas", color: C.primary },
                { key: "despesas", label: "Despesas", color: C.amber },
              ]}
            />
          </div>
        </Card>
        <Card>
          <div style={{ fontWeight: 700, fontSize: 15, color: C.ink, marginBottom: 12 }}>Despesas por categoria</div>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <DonutChartSVG data={DESPESAS_CATEGORIA} colors={PIE_COLORS} size={200} formatValue={fmtBRL} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
            {DESPESAS_CATEGORIA.map((d, i) => (
              <div key={d.nome} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                <span style={{ width: 8, height: 8, borderRadius: 999, background: PIE_COLORS[i % PIE_COLORS.length] }} />
                <span style={{ flex: 1, color: C.textMuted }}>{d.nome}</span>
                <span style={{ fontWeight: 600, color: C.ink }}>{fmtBRL(d.valor)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
      {role !== "sindico" && (
        <Card style={{ marginTop: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: C.ink, marginBottom: 4 }}>Minha situação — Unidade</div>
          <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 12 }}>Cota condominial de agosto</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <CheckCircle2 size={18} color={C.primary} />
            <span style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>Pagamento em dia — vencimento dia 10</span>
          </div>
        </Card>
      )}
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

/* ============================================================
   ROOT APP
   ============================================================ */
function App() {
  const [session, setSession] = useState(null); // { role, user }
  const [page, setPage] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState(NOTIFICACOES);
  const [toast, setToast] = useState(null);

  const [ocorrencias, setOcorrencias] = useState(OCORRENCIAS);
  const [reservas, setReservas] = useState(RESERVAS);
  const [comunicados, setComunicados] = useState(COMUNICADOS);
  const [entregas, setEntregas] = useState(ENTREGAS);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function handleLogin(role) {
    setSession({ role, user: DEMO_USERS[role] });
    setPage("dashboard");
  }

  function handleLogout() {
    setSession(null);
    setPage("dashboard");
  }

  if (!session) return <LoginScreen onLogin={handleLogin} />;

  const { role, user } = session;
  const navItems = NAV[role];
  const pageTitle = page === "dashboard" ? `Olá, ${user.name.split(" ")[0]}` : (navItems.find((n) => n.id === page)?.label || "Zeluvi");

  let content;
  if (page === "dashboard") {
    content = role === "morador" ? <DashboardMorador user={user} setPage={setPage} ocorrencias={ocorrencias} reservas={reservas} comunicados={comunicados} />
      : role === "sindico" ? <DashboardSindico setPage={setPage} ocorrencias={ocorrencias} />
      : <DashboardPortaria setPage={setPage} entregas={entregas} />;
  } else if (page === "ocorrencias") {
    content = <OcorrenciasPage role={role} user={user} ocorrencias={ocorrencias} setOcorrencias={setOcorrencias} showToast={showToast} />;
  } else if (page === "reservas") {
    content = <ReservasPage role={role} user={user} reservas={reservas} setReservas={setReservas} showToast={showToast} />;
  } else if (page === "comunicados") {
    content = <ComunicadosPage role={role} comunicados={comunicados} setComunicados={setComunicados} showToast={showToast} />;
  } else if (page === "entregas") {
    content = <EntregasPage role={role} user={user} entregas={entregas} setEntregas={setEntregas} showToast={showToast} />;
  } else if (page === "financeiro") {
    content = <FinanceiroPage role={role} />;
  } else if (page === "copiloto") {
    content = <CopilotoPage />;
  } else {
    content = <StubPage id={page} />;
  }

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: FONT_BODY, "--sidebar-width": (collapsed ? 74 : 240) + "px" }}>
      <Sidebar role={role} page={page} setPage={setPage} collapsed={collapsed} setCollapsed={setCollapsed} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <div className="content-area">
        <Topbar user={user} role={role} onLogout={handleLogout} setMobileOpen={setMobileOpen} notifOpen={notifOpen} setNotifOpen={setNotifOpen} notifs={notifs} setNotifs={setNotifs} pageTitle={pageTitle} />
        <div style={{ padding: "0 24px 40px", maxWidth: 1280 }}>
          {content}
        </div>
      </div>
      {toast && (
        <div className="pop-in" style={{ position: "fixed", bottom: 24, right: 24, background: C.ink, color: "#fff", padding: "12px 18px", borderRadius: 11, fontSize: 13.5, display: "flex", alignItems: "center", gap: 8, boxShadow: "0 12px 32px rgba(15,33,27,0.3)", zIndex: 200, maxWidth: 320 }}>
          <CheckCircle2 size={16} color={C.amber} /> {toast}
        </div>
      )}
    </div>
  );
}

const rootEl = document.getElementById("root");
rootEl.innerHTML = "";
ReactDOM.createRoot(rootEl).render(<App />);
