export default function Avatar({ name, initials, color, size = 'md' }) {
  const sizes = { sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-11 h-11 text-base' }
  const bg = color + '22'  // 13% opacity hex
  const textColor = color
  return (
    <div
      className={`${sizes[size]} rounded-full flex items-center justify-center font-medium flex-shrink-0`}
      style={{ background: bg, color: textColor }}
      title={name}
    >
      {initials}
    </div>
  )
}
