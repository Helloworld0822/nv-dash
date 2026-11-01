const PATHS: Record<string, string> = {
  dashboard: 'M4 13h7V4H4zM13 20h7v-9h-7zM4 20h7v-5H4zM13 9h7V4h-7z',
  orders: 'M7 3h10l2 4v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7zM5 7h14M9 12h6M9 16h4',
  products: 'M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5zM3.5 7.5 12 12l8.5-4.5M12 12v9',
  bell: 'M18 9a6 6 0 1 0-12 0c0 5-2 6-2 6h16s-2-1-2-6M10.5 20a2 2 0 0 0 3 0',
  help: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18M9.6 9.3a2.5 2.5 0 0 1 4.86.83c0 1.67-2.46 2.5-2.46 2.5M12 17h.01',
  logout: 'M9 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3M16 17l5-5-5-5M21 12H9',
  refresh: 'M3 12a9 9 0 0 1 15.3-6.4L21 8M21 4v4h-4M21 12a9 9 0 0 1-15.3 6.4L3 16M3 20v-4h4',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16M21 21l-4.3-4.3',
  plus: 'M12 5v14M5 12h14',
  image: 'M4 5h16v14H4zM4 15l4.5-4.5 4 4L16 11l4 4M9 9.5h.01',
  chevronRight: 'M9 18l6-6-6-6',
  chevronDown: 'M6 9l6 6 6-6',
  chevronLeft: 'M15 18l-6-6 6-6',
  check: 'M4 12.5 9 17.5 20 6.5',
  edit: 'M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16zM14.5 5.5l4 4',
  save: 'M5 4h11l3 3v13H5zM8 4v6h8V4M8 20v-6h8v6',
  alert: 'M12 3 2.5 20h19zM12 10v4M12 17.5h.01',
  battery: 'M3 8h14v8H3zM17 11h3v2h-3M6 11v2',
  calendar: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
  download: 'M12 4v11M7.5 11 12 15.5 16.5 11M4 20h16',
  eye: 'M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12M12 14.8a2.8 2.8 0 1 0 0-5.6 2.8 2.8 0 0 0 0 5.6',
  eyeOff: 'M4 4l16 16M9.6 5.9A9.6 9.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-3.3 4M6.3 8.2A17 17 0 0 0 2.5 12S6 18.5 12 18.5c1 0 1.9-.2 2.7-.4M9.6 9.9a2.8 2.8 0 0 0 3.9 3.9',
  store: 'M4 9h16l-1-5H5zM5 9v11h14V9M9 20v-6h6v6',
  filter: 'M3 5h18l-7 8v6l-4 2v-8z',
  sort: 'M7 4v16M7 20l-3-3M7 4l3 3M17 20V4M17 4l-3 3M17 20l3-3',
  arrowRight: 'M5 12h14M14 7l5 5-5 5',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18M12 7v5l3 2',
  pin: 'M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11M12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5',
  x: 'M6 6l12 12M18 6 6 18',
  list: 'M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01',
  wrench: 'M15.5 3.5a5.5 5.5 0 0 0-5 7.6L3.5 18l2.5 2.5 6.9-7a5.5 5.5 0 0 0 7.1-5.1c0-.6-.1-1.2-.3-1.7l-3 3-2.4-2.4 3-3a5.4 5.4 0 0 0-1.8-.8',
  drone: 'M8.5 8.5h7v7h-7zM8.5 8.5 5 5M15.5 8.5 19 5M8.5 15.5 5 19M15.5 15.5 19 19M5 5m-2 0a2 2 0 1 0 4 0 2 2 0 1 0-4 0M19 5m-2 0a2 2 0 1 0 4 0 2 2 0 1 0-4 0M5 19m-2 0a2 2 0 1 0 4 0 2 2 0 1 0-4 0M19 19m-2 0a2 2 0 1 0 4 0 2 2 0 1 0-4 0',
}

export type IconName = keyof typeof PATHS

export function Icon({
  name,
  size = 18,
  className,
}: {
  name: IconName
  size?: number
  className?: string
}) {
  return (
    <svg
      className={className ? `i ${className}` : 'i'}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={PATHS[name]} />
    </svg>
  )
}
