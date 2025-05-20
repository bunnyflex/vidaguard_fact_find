import { cn } from "@/lib/utils";

type AdminSidebarProps = {
  activeView: string;
  onChangeView: (view: any) => void;
};

export default function AdminSidebar({ activeView, onChangeView }: AdminSidebarProps) {
  const menuItems = [
    { id: "questions", label: "Questions", icon: "fas fa-list-ul" },
    { id: "ai", label: "AI Settings", icon: "fas fa-robot" },
    { id: "email", label: "Email Setup", icon: "fas fa-envelope" },
    { id: "excel", label: "Excel Config", icon: "fas fa-file-excel" },
    { id: "submissions", label: "Submissions", icon: "fas fa-folder-open" },
  ];

  return (
    <div className="lg:w-64 shrink-0">
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="font-semibold">Admin Controls</h2>
        </div>
        <nav className="p-2">
          {menuItems.map((item) => (
            <a
              key={item.id}
              href="#"
              className={cn(
                "flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-blue-50 hover:text-primary",
                activeView === item.id && "bg-blue-50 text-primary"
              )}
              onClick={(e) => {
                e.preventDefault();
                onChangeView(item.id);
              }}
            >
              <i className={item.icon}></i>
              <span>{item.label}</span>
            </a>
          ))}
        </nav>
      </div>
    </div>
  );
}
