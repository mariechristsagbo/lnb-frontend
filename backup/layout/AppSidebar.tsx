"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import {
  BoxCubeIcon,
  CalenderIcon,
  ChevronDownIcon,
  BoltIcon,
  GridIcon,
  HorizontaLDots,
  PageIcon,
  PlugInIcon,
  TableIcon,
  UserCircleIcon,
} from "../icons/index";
import SidebarWidget from "./SidebarWidget";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

const navItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "Tableau de bord",
    subItems: [
      { name: "Accueil", path: "/admin" },
    ],
  },
  {
    icon: <CalenderIcon />,
    name: "Agendas",
    subItems: [
      { name: "Calendrier", path: "admin/calendar" },
      { name: "Horloges et Horaires", path: "/clocks" },
    ],
  },
  {
    icon: <PlugInIcon />,
    name: "Administration",
    subItems: [
      { name: "Services", path: "/services" },
      { name: "Département", path: "/departement" },
      { name: "Fonction", path: "/function" },
    ],
  },
  {
    icon: <BoltIcon />,
    name: "Applications",
    subItems: [
      { name: "Mes Applications", path: "/applications" },
    ],
  },
  {
    icon: <UserCircleIcon />,
    name: "Chats",
    subItems: [
      { name: "Conversation", path: "/chats" },
      { name: "Publications", path: "/publications" },
    ],
  },
  {
    icon: <PageIcon />,
    name: "Demandes & Requètes",
    subItems: [
      { name: "Demande Service", path: "/request-services" },
    ],
  },
  {
    icon: <UserCircleIcon />,
    name: "Gestion des Utilisateurs",
    subItems: [
      { name: "Utilisateurs", path: "/users" },
      { name: "Groupe d'utilisateurs", path: "/users-groupes" },
    ],
  },
  {
    icon: <BoxCubeIcon />,
    name: "Ressources",
    subItems: [
      { name: "Documents", path: "/mediatechDocs" },
      { name: "Fiches de paie", path: "/payslips" },
      { name: "Dossiers", path: "/mediatechFolder" },
      { name: "Media", path: "/mediatechMedia" },
    ],
  },
  {
    icon: <TableIcon />,
    name: "Workflows",
    subItems: [
      { name: "Mes Workflows", path: "/workflows" },
      { name: "Mes Tâches", path: "/taches" },
      { name: "Demandes", path: "/workflows/demandes" },
      { name: "Validation et Traitement des demandes", path: "/workflows/valide-demande" },

    ],
  },
  {
    icon: <GridIcon />,
    name: "Paramètres",
    subItems: [
      { name: "Sécurité", path: "/security" },
      { name: "Profils", path: "/admin/profile" },
    ],
  },
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();

  const renderMenuItems = (navItems: NavItem[]) => (
    <ul className="flex flex-col gap-4">
      {navItems.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index)}
              className={`menu-item group ${
                openSubmenu === index 
                  ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md" 
                  : "hover:bg-green-50 text-gray-700 dark:text-gray-300 dark:hover:bg-green-900/20"
              } cursor-pointer ${
                !isExpanded && !isHovered ? "lg:justify-center" : "lg:justify-start"
              } rounded-lg transition-all duration-200`}
            >
              <span
                className={`${
                  openSubmenu === index ? "text-white" : "text-green-600 dark:text-green-400 group-hover:text-green-700 dark:group-hover:text-green-300"
                } transition-colors duration-200`}
              >
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className={`font-medium ${openSubmenu === index ? "text-white" : ""}`}>{nav.name}</span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDownIcon
                  className={`ml-auto w-5 h-5 transition-transform duration-200 ${
                    openSubmenu === index ? "rotate-180 text-white" : "text-green-500 group-hover:text-green-700"
                  }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                href={nav.path}
                className={`menu-item group ${
                  isActive(nav.path) 
                    ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md" 
                    : "hover:bg-green-50 text-gray-700 dark:text-gray-300 dark:hover:bg-green-900/20"
                } rounded-lg transition-all duration-200`}
              >
                <span
                  className={`${
                    isActive(nav.path) 
                      ? "text-white" 
                      : "text-green-600 dark:text-green-400 group-hover:text-green-700 dark:group-hover:text-green-300"
                  } transition-colors duration-200`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className={`font-medium ${isActive(nav.path) ? "text-white" : ""}`}>{nav.name}</span>
                )}
              </Link>
            )
          )}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[index] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height: openSubmenu === index ? `${subMenuHeight[index]}px` : "0px",
              }}
            >
              <ul className="mt-2 space-y-1 ml-9">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      href={subItem.path}
                      className={`flex items-center px-4 py-2 rounded-md text-sm transition-colors duration-200 ${
                        isActive(subItem.path)
                          ? "bg-green-100 text-green-700 font-medium dark:bg-green-900/30 dark:text-green-300"
                          : "text-gray-600 hover:bg-green-50 hover:text-green-700 dark:text-gray-400 dark:hover:bg-green-900/20 dark:hover:text-green-300"
                      }`}
                    >
                      <div className="flex items-center">
                        {isActive(subItem.path) && (
                          <div className="w-1.5 h-1.5 bg-green-600 rounded-full mr-2"></div>
                        )}
                        {!isActive(subItem.path) && (
                          <div className="w-1.5 h-1.5 bg-transparent mr-2"></div>
                        )}
                        {subItem.name}
                      </div>
                      <span className="flex items-center gap-1 ml-auto">
                        {subItem.new && (
                          <span
                            className="px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"
                          >
                            new
                          </span>
                        )}
                        {subItem.pro && (
                          <span
                            className="px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"
                          >
                            pro
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  const [openSubmenu, setOpenSubmenu] = useState<number | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<number, number>>({});
  const subMenuRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const isActive = useCallback((path: string) => path === pathname, [pathname]);

  useEffect(() => {
    let submenuMatched = false;
    navItems.forEach((nav, index) => {
      if (nav.subItems) {
        nav.subItems.forEach((subItem) => {
          if (isActive(subItem.path)) {
            setOpenSubmenu(index);
            submenuMatched = true;
          }
        });
      }
    });

    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [pathname, isActive]);

  useEffect(() => {
    if (openSubmenu !== null) {
      if (subMenuRefs.current[openSubmenu]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [openSubmenu]: subMenuRefs.current[openSubmenu]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number) => {
    setOpenSubmenu((prevOpenSubmenu) => (prevOpenSubmenu === index ? null : index));
  };

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 left-0 h-screen transition-all duration-300 ease-in-out z-50
        bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800
        ${isExpanded || isMobileOpen ? "w-[290px]" : isHovered ? "w-[290px]" : "w-[90px]"}
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0
        shadow-sm`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-green-50/80 to-transparent dark:from-green-900/10 dark:to-transparent pointer-events-none"></div>
      
      <div className={`relative py-6 px-5 flex ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"}`}>
        <Link href="/" className="flex items-center">
          {isExpanded || isHovered || isMobileOpen ? (
            <div className="flex items-center space-x-2">
              <div className="rounded-full bg-gray-100 border border-gray-200 p-2 shadow-sm dark:bg-gray-800 dark:border-gray-700">
                <Image
                  src="/images/logo/logo-icon.svg"
                  alt="Logo"
                  width={24}
                  height={24}
                  className="text-gray-700 dark:text-white"
                />
              </div>
              <span className="font-bold text-xl text-gray-800 dark:text-white">
                LNBIntranet
              </span>
            </div>
          ) : (
            <div className="rounded-full bg-gray-100 border border-gray-200 p-2 shadow-sm dark:bg-gray-800 dark:border-gray-700">
              <Image
                src="/images/logo/logo-icon.svg"
                alt="Logo"
                width={24}
                height={24}
                className="text-gray-700 dark:text-white"
              />
            </div>
          )}
        </Link>
      </div>
      
      <div className="relative flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar px-4">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] font-semibold text-green-700 dark:text-green-400 ${
                  !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? "Menu principal" : <HorizontaLDots className="text-green-600" />}
              </h2>
              {renderMenuItems(navItems)}
            </div>
          </div>
        </nav>
        
        {isExpanded || isHovered || isMobileOpen ? <SidebarWidget /> : null}
      </div>
    </aside>
  );
};

export default AppSidebar;