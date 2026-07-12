export default function Footer() {
  return (
    <footer className="w-full border-t border-white/[0.06] py-5 text-center">
      <div className="mb-3 flex items-center justify-center gap-5">
        {["Privacy", "Terms", "Help"].map((link) => (
          <span
            key={link}
            className="cursor-pointer text-xs text-text-muted transition-colors hover:text-text-secondary"
          >
            {link}
          </span>
        ))}
      </div>
      <p className="text-[11px] text-text-muted">
        © 2026 SoulScript. All rights reserved.
      </p>
    </footer>
  );
}
