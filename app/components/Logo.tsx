export function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
      </defs>
      
      {/* Cerebro estilizado con paths de aprendizaje */}
      <path
        d="M50 10 C30 10, 15 25, 15 45 C15 55, 20 63, 25 67 L25 75 C25 80, 28 85, 33 87 L33 90 L67 90 L67 87 C72 85, 75 80, 75 75 L75 67 C80 63, 85 55, 85 45 C85 25, 70 10, 50 10 Z"
        fill="url(#logoGradient)"
        opacity="0.2"
      />
      
      {/* Paths/rutas de aprendizaje */}
      <path
        d="M35 35 Q40 25, 50 30 T65 35"
        stroke="url(#logoGradient)"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M30 50 Q40 45, 50 50 T70 50"
        stroke="url(#logoGradient)"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M35 65 Q45 60, 50 65 T65 65"
        stroke="url(#logoGradient)"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      
      {/* Puntos de checkpoint */}
      <circle cx="35" cy="35" r="5" fill="#6366f1" />
      <circle cx="50" cy="30" r="5" fill="#8b5cf6" />
      <circle cx="65" cy="35" r="5" fill="#a855f7" />
      
      <circle cx="30" cy="50" r="5" fill="#6366f1" />
      <circle cx="50" cy="50" r="6" fill="#8b5cf6" />
      <circle cx="70" cy="50" r="5" fill="#a855f7" />
      
      <circle cx="35" cy="65" r="5" fill="#6366f1" />
      <circle cx="50" cy="65" r="5" fill="#8b5cf6" />
      <circle cx="65" cy="65" r="5" fill="#a855f7" />
    </svg>
  )
}
