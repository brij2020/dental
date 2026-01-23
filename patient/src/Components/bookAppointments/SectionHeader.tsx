const SectionHeader = ({ title, icon }: { title: string; icon: React.ReactNode }) => (
  <h2 className="text-[18px] font-semibold flex items-center gap-2 mb-4 text-cyan-800">
    {icon}
    {title}
  </h2>
);

export default SectionHeader;