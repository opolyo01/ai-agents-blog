import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-semibold">
          Engineering Systems Notes
        </Link>
        <nav className="flex gap-6 text-sm">
          <Link href="/">Posts</Link>
          <Link href="/about">About</Link>
        </nav>
      </div>
    </header>
  );
}
