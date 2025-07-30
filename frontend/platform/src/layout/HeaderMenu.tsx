import { TabIcon } from "@/components/bs-icons";
import { userContext } from "@/contexts/userContext";
import { useContext, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { NavLink, useLocation } from "react-router-dom";

export default function HeaderMenu({ }) {
    const { t } = useTranslation()
    const location = useLocation();
    console.log('location.pathname :>> ', location.pathname);

    const { user } = useContext(userContext);
    // 系统管理员(超管、组超管)
    const isAdmin = useMemo(() => {
        return ['admin', 'group_admin'].includes(user.role)
    }, [user])

    if (['/build/apps', '/build/tools', '/build/client'].includes(location.pathname)) {
        return <div className="build-tab flex justify-center h-[65px] items-center relative">
            {/* <div className="px-4">
                <NavLink to={'build/assist'} className="group flex gap-2 items-center px-8 py-2 rounded-md navlink">
                    <TabIcon className="text-muted-foreground group-hover:text-primary dark:group-hover:text-[#fff]"></TabIcon>
                    <span className="text-sm font-bold text-muted-foreground group-hover:text-primary dark:group-hover:text-[#fff]">{t('build.assistant')}</span>
                </NavLink>
            </div> */}
            <div className="px-4">
                <NavLink to={'build/apps'} className="group flex gap-2 items-center px-8 py-2 rounded-md navlink">
                    <TabIcon className="text-muted-foreground group-hover:text-primary dark:group-hover:text-[#fff]"></TabIcon>
                    <span className="text-sm font-bold text-muted-foreground group-hover:text-primary dark:group-hover:text-[#fff]">{t('build.app')}</span>
                </NavLink>
            </div>
            <div className="px-4">
                <NavLink to={'build/tools'} className="group flex gap-2 items-center px-8 py-2 rounded-md navlink">
                    <TabIcon className="text-muted-foreground group-hover:text-primary dark:group-hover:text-[#fff]"></TabIcon>
                    <span className="text-sm font-bold text-muted-foreground group-hover:text-primary dark:group-hover:text-[#fff]">{t('build.tools')}</span>
                </NavLink>
            </div>
            {user.role === 'admin' && <div className="px-4">
                <NavLink to={'build/client'} className="group flex gap-2 items-center px-8 py-2 rounded-md navlink">
                    <TabIcon className="text-muted-foreground group-hover:text-primary dark:group-hover:text-[#fff]"></TabIcon>
                    <span className="text-sm font-bold text-muted-foreground group-hover:text-primary dark:group-hover:text-[#fff]">工作台</span>
                </NavLink>
            </div>}
        </div>
    }

    if (['/model/management', '/model/finetune'].includes(location.pathname)) {
        return <div className="build-tab flex justify-center h-[65px] items-center relative">
            <div className="px-4">
                <NavLink to={'model/management'} className="group flex gap-2 items-center px-8 py-2 rounded-md navlink">
                    <TabIcon className="text-muted-foreground group-hover:text-primary dark:group-hover:text-[#fff]"></TabIcon>
                    <span className="text-sm font-bold text-muted-foreground group-hover:text-primary dark:group-hover:text-[#fff]">{t('model.modelManagement')}</span>
                </NavLink>
            </div>
            <div className="px-4">
                <NavLink to={'model/finetune'} className="group flex gap-2 items-center px-8 py-2 rounded-md navlink">
                    <TabIcon className="text-muted-foreground group-hover:text-primary dark:group-hover:text-[#fff]"></TabIcon>
                    <span className="text-sm font-bold text-muted-foreground group-hover:text-primary dark:group-hover:text-[#fff]">{t('model.modelFineTune')}</span>
                </NavLink>
            </div>
        </div>
    }

    return null;
};
