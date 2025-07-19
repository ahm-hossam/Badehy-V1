'use client';

import { ApplicationLayout } from "@/components/application-layout";
import Loading from "@/components/loading";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Loading />
      <ApplicationLayout events={[]}>{children}</ApplicationLayout>
    </>
  );
} 