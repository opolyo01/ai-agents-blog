import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-gray-200/90 bg-white/88 backdrop-blur-sm dark:border-white/10 dark:bg-[#0a0a0a]/88">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
        <Link href="/" className="max-w-[180px] text-sm font-semibold leading-tight sm:max-w-none sm:text-base">
          Engineering Systems Notes
        </Link>
        <nav className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300 sm:gap-6">
          <Link
            href="/"
            className="rounded-full px-3 py-2 transition-colors hover:text-gray-900 dark:hover:text-white"
          >
            Posts
          </Link>
          <Link
            href="/about"
            className="rounded-full px-3 py-2 transition-colors hover:text-gray-900 dark:hover:text-white"
          >
            About
          </Link>
        </nav>
      </div>
    </header>
  );
}
