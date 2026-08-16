import Link from "next/link";
import { useRouter } from "next/router";

export default function Masthead() {
  const router = useRouter();

  const tabs = [
    { href: "/", label: "Overview" },
    { href: "/news", label: "Latest News" },
    { href: "/representatives", label: "Find Your Rep" },
  ];

  return (
    <header className="masthead">
      <div className="wrap">
        <div className="eyebrow">Tracking Alabama&rsquo;s lottery legislation</div>
        <h1>Alabama-Lottery.com</h1>
        <p className="tagline">
          Alabama is one of the last states without a lottery. Here&rsquo;s what&rsquo;s
          happening in the Legislature right now &mdash; and who to contact about it.
        </p>
        <nav className="tabs">
          {tabs.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className={router.pathname === t.href ? "active" : ""}
            >
              {t.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
