import { TopicView } from "@/src/features/TopicView";
export default async function Page({
  params,
}: {
  params: Promise<{
    subject: string;
    topic: string;
  }>;
}) {
  const { subject, topic } = await params;
  return <TopicView subjectPath={subject} topicPath={topic} />;
}
