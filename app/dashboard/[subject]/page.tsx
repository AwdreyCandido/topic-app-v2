import { SubjectView } from "@/src/features/LibraryViews";
export default async function Page({
  params,
}: {
  params: Promise<{
    subject: string;
  }>;
}) {
  const { subject } = await params;
  return <SubjectView path={subject} />;
}
