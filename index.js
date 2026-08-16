import Head from "next/head";
import Masthead from "../components/Masthead";
import Footer from "../components/Footer";

// Update this whenever a bill's status changes — it's the single source of
// truth for the tracker bar and drives the JSON-LD below too.
const CURRENT_STAGE = "committee"; // one of: filed | committee | floor | governor | ballot

const STAGES = [
  { key: "filed", label: "Bill Filed" },
  { key: "committee", label: "Committee" },
  { key: "floor", label: "Floor Vote" },
  { key: "governor", label: "Governor / Amendment" },
  { key: "ballot", label: "Statewide Ballot" },
];

export default function Home() {
  const currentIndex = STAGES.findIndex((s) => s.key === CURRENT_STAGE);

  return (
    <>
      <Head>
        <title>Alabama Lottery Bill Tracker &amp; News | Alabama-Lottery.com</title>
        <meta
          name="description"
          content="Live tracker for Alabama lottery and gambling legislation, the latest news, and a tool to find and contact your Alabama state legislator about it."
        />
      </Head>

      <Masthead />

      <main className="wrap">
        <h2 style={{ fontFamily: "'Source Serif 4', serif", fontSize: "1.4rem" }}>
          Where the current lottery bill stands
        </h2>
        <div className="tracker">
          {STAGES.map((s, i) => (
            <div
              key={s.key}
              className={
                "stage " +
                (i < currentIndex ? "done" : i === currentIndex ? "current" : "")
              }
            >
              {s.label}
            </div>
          ))}
        </div>

        <section>
          <h2 style={{ fontFamily: "'Source Serif 4', serif" }}>
            Why doesn&rsquo;t Alabama have a lottery?
          </h2>
          <p style={{ lineHeight: 1.6 }}>
            Alabama&rsquo;s constitution has banned lotteries since 1901.
            Voters rejected a proposed state lottery in a 1999 referendum,
            and while the Legislature has debated bringing the question back
            to voters nearly every session since, no bill has passed both
            chambers and cleared a statewide vote. Alabama remains the only
            state east of the Mississippi without one.
          </p>
          <p style={{ lineHeight: 1.6 }}>
            Any lottery would require a constitutional amendment &mdash; a
            bill passed by the Legislature that then goes to voters
            statewide. That&rsquo;s why legislative action, not just public
            opinion, is what actually moves this forward. See the{" "}
            <a href="/news">latest news</a> on where things stand, or{" "}
            <a href="/representatives">find your legislator</a> to weigh in
            directly.
          </p>
        </section>
      </main>

      <Footer />
    </>
  );
}
