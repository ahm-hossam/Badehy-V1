"use client";
import { useEffect, useState } from "react";
import { Input } from "@/components/input";
import { Select } from "@/components/select";
import { Switch } from "@/components/switch";
import { Button } from "@/components/button";

function PreviewField({ q, idx }: { q: any; idx: number }) {
  const label = q.question || q.customQuestion || `Question ${idx + 1}`;
  const required = q.required;
  const answerType = q.answerType;
  const description = q.description;
  return (
    <div className="mb-6">
      <label className="block text-base font-medium mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {description && <div className="text-xs text-zinc-500 mb-1">{description}</div>}
      {answerType === "short" && <Input type="text" className="w-full" placeholder="Your answer" required={required} />}
      {answerType === "long" && <textarea className="w-full border rounded p-2 min-h-[80px]" placeholder="Your answer" required={required} />}
      {answerType === "single" && (
        <Select className="w-full" required={required}>
          <option value="" disabled selected>
            Select an option
          </option>
          {q.answerOptions?.map((opt: string, i: number) => (
            <option key={i} value={opt}>
              {opt}
            </option>
          ))}
        </Select>
      )}
      {answerType === "multi" && (
        <div className="flex flex-col gap-2">
          {q.answerOptions?.map((opt: string, i: number) => (
            <label key={i} className="inline-flex items-center gap-2">
              <input type="checkbox" className="accent-blue-500" /> {opt}
            </label>
          ))}
        </div>
      )}
      {answerType === "file" && <Input type="file" className="w-full" required={required} />}
    </div>
  );
}

export default function CheckInPreviewPage() {
  const [data, setData] = useState<{ checkinName: string; questions: any[] } | null>(null);
  useEffect(() => {
    const raw = window.localStorage.getItem("checkinPreview");
    if (raw) {
      setData(JSON.parse(raw));
    }
  }, []);

  if (!data) {
    return <div className="max-w-2xl mx-auto py-8 px-4 text-center text-zinc-500">No preview data found. Please use the builder to preview a check-in form.</div>;
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-zinc-50">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-md p-6 my-8">
        <h1 className="text-2xl font-bold mb-4 text-center">{data.checkinName || "Check-in Preview"}</h1>
        <form className="w-full">
          {data.questions.map((q, idx) => (
            <PreviewField key={q.id} q={q} idx={idx} />
          ))}
          <Button type="submit" className="w-full mt-4">Submit</Button>
        </form>
      </div>
    </main>
  );
} 