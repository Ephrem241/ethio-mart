function AuthDivider() {
  return (
    <div className="flex items-center gap-3 text-xs text-muted-text" role="separator" aria-label="or">
      <span className="h-px flex-1 bg-border" />
      or
      <span className="h-px flex-1 bg-border" />
    </div>
  )
}

export { AuthDivider }
