interface Props {
  params: Promise<{ section: string }>;
}

export default async function SectionPage({ params }: Props) {
  const { section } = await params;
  const titleMap: Record<string, string> = {
    sales: "영업관리",
    production: "생산관리",
    inventory: "재고관리",
    quality: "품질관리",
    equipment: "설비관리",
    analytics: "분석관리",
  };
  const title = titleMap[section] ?? section;
  return (
    <div className="bg-white rounded-lg border border-black/10 p-4">
      <div className="text-lg font-semibold mb-2">{title}</div>
      <div className="text-sm text-black/70">준비 중입니다.</div>
    </div>
  );
}


