// Line icons — stroke-based, 24px grid
const Icon = ({ name, size = 22, color = 'currentColor', stroke = 2 }) => {
  const s = { width: size, height: size, display: 'block' };
  const p = { fill: 'none', stroke: color, strokeWidth: stroke, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (name) {
    case 'home': return <svg style={s} viewBox="0 0 24 24"><path {...p} d="M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-6h-6v6H4a1 1 0 01-1-1v-9z"/></svg>;
    case 'home-fill': return <svg style={s} viewBox="0 0 24 24"><path fill={color} d="M3 11.2L12 4l9 7.2V20a1 1 0 01-1 1h-5v-6h-6v6H4a1 1 0 01-1-1v-8.8z"/></svg>;
    case 'chart': return <svg style={s} viewBox="0 0 24 24"><path {...p} d="M4 20V10M10 20V4M16 20v-8M22 20H2"/></svg>;
    case 'chart-fill': return <svg style={s} viewBox="0 0 24 24"><path fill={color} d="M3 10h3v11H3zM9 3h3v18H9zM15 11h3v10h-3z"/><path stroke={color} strokeWidth="2" strokeLinecap="round" d="M22 21H2"/></svg>;
    case 'users': return <svg style={s} viewBox="0 0 24 24"><path {...p} d="M9 11a4 4 0 100-8 4 4 0 000 8zM17 11a3 3 0 100-6 3 3 0 000 6zM2 21v-1a5 5 0 015-5h4a5 5 0 015 5v1M16 15h2a4 4 0 014 4v1"/></svg>;
    case 'users-fill': return <svg style={s} viewBox="0 0 24 24"><path fill={color} d="M9 11a4 4 0 100-8 4 4 0 000 8zM17 11a3 3 0 100-6 3 3 0 000 6zM2 21v-1a5 5 0 015-5h4a5 5 0 015 5v1H2zM17 13a5 5 0 014 2 4 4 0 013 3.87V21h-6v-1a6.97 6.97 0 00-1.6-4.46A3 3 0 0117 13z"/></svg>;
    case 'user': return <svg style={s} viewBox="0 0 24 24"><path {...p} d="M12 12a4 4 0 100-8 4 4 0 000 8zM4 21v-1a6 6 0 016-6h4a6 6 0 016 6v1"/></svg>;
    case 'user-fill': return <svg style={s} viewBox="0 0 24 24"><path fill={color} d="M12 12a4 4 0 100-8 4 4 0 000 8zM4 21v-1a6 6 0 016-6h4a6 6 0 016 6v1H4z"/></svg>;
    case 'plus': return <svg style={s} viewBox="0 0 24 24"><path {...p} d="M12 5v14M5 12h14"/></svg>;
    case 'arrow-up-right': return <svg style={s} viewBox="0 0 24 24"><path {...p} d="M7 17L17 7M8 7h9v9"/></svg>;
    case 'arrow-down-left': return <svg style={s} viewBox="0 0 24 24"><path {...p} d="M17 7L7 17M16 17H7v-9"/></svg>;
    case 'arrow-up': return <svg style={s} viewBox="0 0 24 24"><path {...p} d="M12 19V5M5 12l7-7 7 7"/></svg>;
    case 'arrow-down': return <svg style={s} viewBox="0 0 24 24"><path {...p} d="M12 5v14M19 12l-7 7-7-7"/></svg>;
    case 'chevron-right': return <svg style={s} viewBox="0 0 24 24"><path {...p} d="M9 6l6 6-6 6"/></svg>;
    case 'chevron-down': return <svg style={s} viewBox="0 0 24 24"><path {...p} d="M6 9l6 6 6-6"/></svg>;
    case 'close': return <svg style={s} viewBox="0 0 24 24"><path {...p} d="M6 6l12 12M6 18L18 6"/></svg>;
    case 'search': return <svg style={s} viewBox="0 0 24 24"><circle {...p} cx="11" cy="11" r="7"/><path {...p} d="M21 21l-4.3-4.3"/></svg>;
    case 'filter': return <svg style={s} viewBox="0 0 24 24"><path {...p} d="M3 5h18M6 12h12M10 19h4"/></svg>;
    case 'calendar': return <svg style={s} viewBox="0 0 24 24"><rect {...p} x="3" y="5" width="18" height="16" rx="2"/><path {...p} d="M3 10h18M8 3v4M16 3v4"/></svg>;
    case 'moon': return <svg style={s} viewBox="0 0 24 24"><path {...p} d="M21 13A9 9 0 1111 3a7 7 0 0010 10z"/></svg>;
    case 'sun': return <svg style={s} viewBox="0 0 24 24"><circle {...p} cx="12" cy="12" r="4"/><path {...p} d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>;
    case 'settings': return <svg style={s} viewBox="0 0 24 24"><circle {...p} cx="12" cy="12" r="3"/><path {...p} d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1A1.7 1.7 0 004.6 9a1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9A1.7 1.7 0 0010 3.1V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/></svg>;
    case 'bell': return <svg style={s} viewBox="0 0 24 24"><path {...p} d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0"/></svg>;
    case 'wallet': return <svg style={s} viewBox="0 0 24 24"><path {...p} d="M20 12V7a2 2 0 00-2-2H5a2 2 0 000 4h15a1 1 0 011 1v3M20 12v5a2 2 0 01-2 2H5a2 2 0 01-2-2V7"/><circle fill={color} cx="17" cy="14" r="1.3"/></svg>;
    case 'credit-card': return <svg style={s} viewBox="0 0 24 24"><rect {...p} x="2" y="5" width="20" height="14" rx="2"/><path {...p} d="M2 10h20M6 15h4"/></svg>;
    case 'tag': return <svg style={s} viewBox="0 0 24 24"><path {...p} d="M20.6 13.4L13 21a2 2 0 01-2.8 0l-7-7A2 2 0 012.5 12V5a2 2 0 012-2H12a2 2 0 011.4.6l7.2 7.2a2 2 0 010 2.6z"/><circle {...p} cx="7.5" cy="7.5" r="1.2"/></svg>;
    case 'download': return <svg style={s} viewBox="0 0 24 24"><path {...p} d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>;
    case 'lock': return <svg style={s} viewBox="0 0 24 24"><rect {...p} x="4" y="11" width="16" height="10" rx="2"/><path {...p} d="M8 11V7a4 4 0 018 0v4"/></svg>;
    case 'globe': return <svg style={s} viewBox="0 0 24 24"><circle {...p} cx="12" cy="12" r="9"/><path {...p} d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18"/></svg>;
    case 'cart': return <svg style={s} viewBox="0 0 24 24"><circle {...p} cx="9" cy="20" r="1.5"/><circle {...p} cx="18" cy="20" r="1.5"/><path {...p} d="M2 3h3l2.7 12.4a2 2 0 002 1.6h8.6a2 2 0 002-1.5L22 7H6"/></svg>;
    case 'coffee': return <svg style={s} viewBox="0 0 24 24"><path {...p} d="M3 8h13v7a5 5 0 01-10 0V8zM16 11h2a3 3 0 010 6h-2M7 2v3M11 2v3"/></svg>;
    case 'car': return <svg style={s} viewBox="0 0 24 24"><path {...p} d="M5 17h14l-1.5-6a2 2 0 00-2-1.5H8.5A2 2 0 006.5 11L5 17zM3 17h18v3H3zM7.5 17v2M16.5 17v2"/></svg>;
    case 'home-icon': return <svg style={s} viewBox="0 0 24 24"><path {...p} d="M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-6h-6v6H4a1 1 0 01-1-1v-9z"/></svg>;
    case 'briefcase': return <svg style={s} viewBox="0 0 24 24"><rect {...p} x="2" y="7" width="20" height="14" rx="2"/><path {...p} d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>;
    case 'gift': return <svg style={s} viewBox="0 0 24 24"><rect {...p} x="3" y="8" width="18" height="4"/><path {...p} d="M12 8v13M5 12h14v8a1 1 0 01-1 1H6a1 1 0 01-1-1v-8zM12 8a3 3 0 10-3-3 3 3 0 003 3 3 3 0 103-3 3 3 0 00-3 3z"/></svg>;
    case 'phone': return <svg style={s} viewBox="0 0 24 24"><path {...p} d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3 19.5 19.5 0 01-6-6 19.8 19.8 0 01-3-8.7A2 2 0 014.1 2h3a2 2 0 012 1.7c.1.9.3 1.8.6 2.7a2 2 0 01-.5 2.1L8 9.8a16 16 0 006 6l1.3-1.3a2 2 0 012.1-.5c.9.3 1.8.5 2.7.6a2 2 0 011.7 2z"/></svg>;
    case 'check': return <svg style={s} viewBox="0 0 24 24"><path {...p} d="M20 6L9 17l-5-5"/></svg>;
    case 'dots': return <svg style={s} viewBox="0 0 24 24"><circle fill={color} cx="5" cy="12" r="2"/><circle fill={color} cx="12" cy="12" r="2"/><circle fill={color} cx="19" cy="12" r="2"/></svg>;
    case 'trending-up': return <svg style={s} viewBox="0 0 24 24"><path {...p} d="M3 17l6-6 4 4 8-8M14 7h7v7"/></svg>;
    case 'eye': return <svg style={s} viewBox="0 0 24 24"><path {...p} d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle {...p} cx="12" cy="12" r="3"/></svg>;
    case 'eye-off': return <svg style={s} viewBox="0 0 24 24"><path {...p} d="M17.94 17.94A10.1 10.1 0 0112 20c-6.5 0-10-8-10-8a18.4 18.4 0 014.22-5.22M9.9 4.24A9.1 9.1 0 0112 4c6.5 0 10 8 10 8a18.4 18.4 0 01-2.16 3.19M14.12 14.12a3 3 0 11-4.24-4.24M2 2l20 20"/></svg>;
    default: return <svg style={s} viewBox="0 0 24 24"><circle {...p} cx="12" cy="12" r="8"/></svg>;
  }
};

window.Icon = Icon;
