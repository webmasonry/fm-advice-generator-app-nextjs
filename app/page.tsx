import AdviceGenerator from "@/components/AdviceGenerator";
import { getAdvice } from "@/lib/getAdvice";

export default async function RootPage() {
  const slip = await getAdvice();

  return (
    <main className="flex flex-1 items-center justify-center px-4">
      <AdviceGenerator advice={slip.advice} id={slip.id} />
    </main>
  );
}
