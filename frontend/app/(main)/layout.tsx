'use client';

import { ApplicationLayout } from "@/components/application-layout";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return <ApplicationLayout events={[]}>{children}</ApplicationLayout>;
} 