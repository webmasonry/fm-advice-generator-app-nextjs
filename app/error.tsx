"use client";

export default function ErrorPage({
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  return (
    <main className="text-light-cyan m-auto px-4 text-center">
      <p>Couldn't load advice right now.</p>
      <button onClick={() => retry()} type="button">
        Try again
      </button>
    </main>
  );
}
