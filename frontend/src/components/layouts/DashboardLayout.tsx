import React, { useEffect, useState } from "react";
import { FiArchive, FiChevronLeft, FiChevronRight, FiHome, FiLayers, FiTag, FiUsers } from "react-icons/fi";
import { useLocation, useNavigate } from "react-router-dom";

type DashboardLayoutProps = {
    children: React.ReactNode,
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const items = [
        { icon: <FiHome size={18} />, label: "Overview", href: "/dashboard" },
        { icon: <FiArchive size={18} />, label: "My Properties", href: "/lands/user" },
        { icon: <FiLayers size={18} />, label: "Properties For Sale", href: "/listings" },
        { icon: <FiTag size={18} />, label: "Register Land", href: "/register" },
        { icon: <FiUsers size={18} />, label: "All Properties", href: "/lands/all" },
    ];

    useEffect(() => {
        const stored = window.localStorage.getItem("delar_sidebar_collapsed");
        if (stored === "true") {
            setIsCollapsed(true);
        }
    }, []);

    useEffect(() => {
        window.localStorage.setItem("delar_sidebar_collapsed", String(isCollapsed));
    }, [isCollapsed]);

    return (
        <>
            <div className="flex min-h-screen flex-col gap-6 lg:gap-10 lg:flex-row">
                <div className={`w-full transition-[width] duration-300 ${isCollapsed ? "lg:w-24" : "lg:w-72"}`}>
                    <div className="rounded-[1.25rem] border border-[rgba(180,140,90,0.14)] bg-[#111827]/95 p-4 shadow-lg lg:p-5">
                        <div className={`border-b border-[rgba(180,140,90,0.1)] pb-5 ${isCollapsed ? "flex justify-center lg:pb-4" : "flex items-center justify-between gap-3"}`}>
                            {!isCollapsed && <h2 className="text-lg font-semibold text-white">Land Records</h2>}
                            <button
                                type="button"
                                onClick={() => setIsCollapsed((prev) => !prev)}
                                className="hidden rounded-[0.8rem] border border-[rgba(180,140,90,0.16)] bg-white/5 p-2 text-[rgba(255,255,255,0.72)] transition hover:bg-white/10 hover:text-white lg:inline-flex"
                                aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                                title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                            >
                                {isCollapsed ? <FiChevronRight size={18} /> : <FiChevronLeft size={18} />}
                            </button>
                        </div>

                        <nav className="mt-5 space-y-2">
                            {items.map((item) => (
                                <SidebarItem
                                    key={item.href}
                                    icon={item.icon}
                                    label={item.label}
                                    active={location.pathname === item.href}
                                    collapsed={isCollapsed}
                                    onClick={() => navigate(item.href)}
                                />
                            ))}
                        </nav>
                    </div>
                </div>

                <div className="flex-1 overflow-x-hidden lg:pl-1 xl:pl-2">
                    <div className="rounded-[1.25rem] border border-[rgba(180,140,90,0.1)] bg-[#0f1726]/82 p-4 shadow-lg md:p-6">
                        {children}
                    </div>
                </div>
            </div>
        </>
    )
}


interface SidebarItemProps {
    icon: React.ReactNode;
    label: string;
    collapsed?: boolean;
    active?: boolean;
    onClick?: () => void;
}

const SidebarItem = ({
    icon,
    label,
    collapsed = false,
    active = false,
    onClick,
}: SidebarItemProps) => {
    return (
        <div
            className={`mb-1 flex cursor-pointer items-center rounded-[0.9rem] px-4 py-2.5 ${active
                    ? "bg-primary text-white"
                    : "text-[rgba(255,255,255,0.72)] transition hover:bg-white/5 hover:text-white"
                } ${collapsed ? "justify-center px-2" : ""}`}
            onClick={onClick}
            title={collapsed ? label : undefined}
        >
            <span className={collapsed ? "" : "mr-3"}>{icon}</span>
            {!collapsed && <span>{label}</span>}
        </div>
    );
};


export default DashboardLayout;
