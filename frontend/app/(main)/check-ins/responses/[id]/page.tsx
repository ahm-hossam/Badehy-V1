"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/button";

export default function ResponseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    fetch(`/api/checkins/responses/${id}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to fetch response");
        const data = await res.json();
        setResponse(data);
      })
      .catch((err) => setError(err.message || "Failed to fetch response"))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <Button outline onClick={() => router.push('/check-ins/responses')} className="mb-6">&larr; Back to Responses</Button>
      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : error ? (
        <div className="text-center text-red-500 py-12">{error}</div>
      ) : !response ? (
        <div className="text-center py-12">Response not found.</div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-2">{response.form?.name || "Check-in Response"}</h1>
          <div className="mb-4 text-zinc-600 text-sm">
            <div><b>Client:</b> {response.client?.fullName || "-"} ({response.client?.email || "-"})</div>
            <div><b>Submitted:</b> {response.submittedAt ? new Date(response.submittedAt).toLocaleString() : "-"}</div>
          </div>
          <div className="border-t pt-4 mt-4">
            <h2 className="text-lg font-semibold mb-2">Answers</h2>
            {Array.isArray(response.form?.questions) && response.form.questions.length > 0 ? (
              <ul className="space-y-4">
                {response.form.questions.map((q: any, idx: number) => (
                  <li key={q.id} className="">
                    <div className="font-medium text-zinc-800 mb-1">{q.label}</div>
                    <div className="bg-zinc-50 rounded px-3 py-2 text-zinc-700">
                      {renderAnswer(response.answers, q)}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-zinc-500">No questions found for this form.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function renderAnswer(answers: any, q: any) {
  if (!answers || typeof answers !== 'object') return <span className="text-zinc-400">No answer</span>;
  const val = answers[q.id] ?? answers[q.label] ?? "";
  if (val === undefined || val === null || val === "") return <span className="text-zinc-400">No answer</span>;
  if (Array.isArray(val)) return val.length > 0 ? val.join(", ") : <span className="text-zinc-400">No answer</span>;
  if (typeof val === 'boolean') return val ? "Yes" : "No";
  return String(val);
} 