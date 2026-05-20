export function CanvasArea() {
  return (
    <main className="relative flex-1 overflow-hidden bg-stone-50">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(to right, #e7e5e4 1px, transparent 1px), linear-gradient(to bottom, #e7e5e4 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />
      <div className="absolute inset-0 grid place-items-center">
        <p className="rounded-md bg-white/80 px-3 py-1.5 text-xs text-stone-500 ring-1 ring-stone-200 backdrop-blur">
          Canvas placeholder — Konva stage lands here next
        </p>
      </div>
    </main>
  )
}
