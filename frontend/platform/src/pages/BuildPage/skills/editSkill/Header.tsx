import AlertDropdown from "@/alerts/alertDropDown";
import TipPng from "@/assets/tip.jpg";
import { DelIcon } from "@/components/bs-icons/del";
import { LoadIcon } from "@/components/bs-icons/loading";
import { SaveIcon } from "@/components/bs-icons/save";
import { bsConfirm } from "@/components/bs-ui/alertDialog/useConfirm";
import { Button } from "@/components/bs-ui/button";
import ActionButton from "@/components/bs-ui/button/actionButton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/bs-ui/dialog";
import TextInput from "@/components/bs-ui/input/textInput";
import { RadioGroup, RadioGroupItem } from "@/components/bs-ui/radio";
import { useToast } from "@/components/bs-ui/toast/use-toast";
import { alertContext } from "@/contexts/alertContext";
import { PopUpContext } from "@/contexts/popUpContext";
import { TabsContext } from "@/contexts/tabsContext";
import { typesContext } from "@/contexts/typesContext";
import { undoRedoContext } from "@/contexts/undoRedoContext";
import { createFlowVersion, deleteVersion, getFlowVersions, getVersionDetails, updateVersion } from "@/controllers/API/flow";
import { captureAndAlertRequestErrorHoc } from "@/controllers/request";
import L2ParamsModal from "@/modals/L2ParamsModal";
import ExportModal from "@/modals/exportModal";
import { FlowVersionItem } from "@/types/flow";
import { t } from "i18next";
import { isEqual } from "lodash-es";
import { ArrowDown, ArrowUp, Bell, Layers, Layers2, LogOut } from "lucide-react";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { unstable_useBlocker as useBlocker, useNavigate } from "react-router-dom";

export default function Header({ flow, preFlow, onTabChange }) {
    const navgate = useNavigate()
    const { t } = useTranslation()
    const { message } = useToast()
    const [open, setOpen] = useState(false)
    const AlertWidth = 384;
    const { notificationCenter, setNotificationCenter } = useContext(alertContext);
    const { uploadFlow, setFlow, tabsState, saveFlow } = useContext(TabsContext);
    const { reactFlowInstance } = useContext(typesContext);

    const isPending = tabsState[flow.id]?.isPending;
    const { openPopUp } = useContext(PopUpContext);
    // 记录快照
    const { takeSnapshot } = useContext(undoRedoContext);

    const handleSaveNewVersion = async () => {
        // 累加版本 vx ++
        const maxNo = lastVersionIndexRef.current + 1
        // versions.forEach(v => {
        //     const match = v.name.match(/[vV](\d+)/)
        //     maxNo = match ? Math.max(Number(match[1]), maxNo) : maxNo
        // })
        // maxNo++
        // save
        const res = await captureAndAlertRequestErrorHoc(
            createFlowVersion(flow.id, { name: `v${maxNo}`, description: '', data: flow.data, original_version_id: version.id })
        )
        message({
            variant: "success",
            title: `${t('skills.version')} v${maxNo} ${t('skills.saveSuccessful')}`,
            description: ""
        })
        // 更新版本列表
        await refrenshVersions()
        // 切换到最新版本

        setVersionId(res.id)
    }
    // 
    const [saveVersionId, setVersionId] = useState('')
    useEffect(() => {
        saveVersionId && handleChangeVersion(saveVersionId)
    }, [saveVersionId])

    // 版本管理
    const [loading, setLoading] = useState(false)
    const { versions, version, isOnlineVersion, lastVersionIndexRef, changeName, deleteVersion, refrenshVersions, setCurrentVersion } = useVersion(flow)
    // 切换版本
    const handleChangeVersion = async (versionId) => {
        setLoading(true)
        reactFlowInstance.setNodes([]) // 便于重新渲染节点
        // 保存当前版本
        // updateVersion(version.id, { name: version.name, description: '', data: flow.data })
        // 切换版本UI
        setCurrentVersion(Number(versionId))
        // 加载选中版本data
        const res = await getVersionDetails(versionId)
        // 自动触发 page的 clone flow
        setFlow('versionChange', { ...flow, data: res.data })
        message({
            variant: "success",
            title: `${t('skills.switchTo')} ${res.name}`,
            description: ""
        })
        setLoading(false)
    }
    // 保存版本
    const handleSaveVersion = async () => {
        // 保存当前版本
        captureAndAlertRequestErrorHoc(updateVersion(version.id, { name: version.name, description: '', data: flow.data }).then(_ => {
            setFlow('versionChange', { ...flow }) // 更新clone flow，避免触发diff不同

            _ && message({
                variant: "success",
                title: t('saved'),
                description: ""
            })
        }))
    }

    const blocker = useBeforeUnload(flow, preFlow)
    // 离开并保存
    const handleSaveAndClose = async () => {
        setFlow('leave and save', { ...flow })
        if (isOnlineVersion) {
            handleSaveNewVersion()
            blocker.reset?.()
        } else {
            await captureAndAlertRequestErrorHoc(updateVersion(version.id, { name: version.name, description: '', data: flow.data }))
            blocker.proceed?.()
        }
    }

    const [tabType, setTabType] = useState('edit')
    return <div className="flex justify-between items-center border-b px-4">
        {
            loading && <div className=" fixed left-0 top-0 w-full h-screen bg-background/60 z-50 flex items-center justify-center">
                <LoadIcon className="mr-2 text-gray-600" />
                <span>{t('skills.switchTo')} {version.name}</span>
            </div>
        }
        <div className="flex items-center gap-2 py-4">
            <Button
                variant="outline"
                size="icon"
                onClick={() => navgate('/build/apps', { replace: true })}
            ><LogOut className="h-4 w-4 rotate-180" /></Button>
            <Button variant="outline" onClick={() => { takeSnapshot(); uploadFlow() }} >
                <ArrowUp className="h-4 w-4 mr-1" />{t('skills.import')}
            </Button>
            <Button variant="outline" onClick={() => { openPopUp(<ExportModal />) }}>
                <ArrowDown className="h-4 w-4 mr-1" />{t('skills.export')}
            </Button>
            {/* <Button variant="outline" onClick={() => { openPopUp(<ApiModal flow={flow} />) }} >
                <CodeXml className="h-4 w-4 mr-1" />{t('skills.code')}
            </Button> */}
            <Button variant="outline" onClick={() => setOpen(true)} >
                <Layers2 className="h-4 w-4 mr-1" />{t('skills.simplify')}
            </Button>
        </div>
        {/* api */}
        <div className="flex gap-4 items-center">
            <div
                className={`${tabType === 'edit' ? 'text-primary' : ''} hover:bg-border px-4 py-1 rounded-md cursor-pointer`}
                onClick={() => { setTabType('edit'); onTabChange('edit') }}
            >{t('api.skillOrchestration')}</div>
            <div
                className={`${tabType === 'api' ? 'text-primary' : ''} hover:bg-border px-4 py-1 rounded-md cursor-pointer`}
                onClick={() => { setTabType('api'); onTabChange('api') }}
            >{t('api.externalPublishing')}
            </div>
        </div>
        {
            version && <div className="flex gap-4">
                <Button className="px-6 flex gap-2" type="button" onClick={handleSaveVersion}
                    disabled={!isPending}><SaveIcon />{t('skills.save')}</Button>
                <ActionButton
                    className="px-6 flex gap-2"
                    align="end"
                    variant="outline"
                    onClick={handleSaveNewVersion}
                    delayDuration={200}
                    buttonTipContent={(
                        <div>
                            <img src={TipPng} alt="" className="w-80" />
                            <p className="mt-4 text-sm">{t('skills.supportVersions')}</p>
                        </div>
                    )}
                    dropDown={(
                        <div className=" overflow-y-auto max-h-96 max-h">
                            <RadioGroup value={version.id + ''} onValueChange={(vid) => {
                                updateVersion(version.id, { name: version.name, description: '', data: flow.data })
                                handleChangeVersion(vid)
                            }} className="gap-0">
                                {versions.map((vers, index) => (
                                    <div key={vers.id} className="group flex items-center gap-4 px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 border-b">
                                        <RadioGroupItem value={vers.id + ''} />
                                        <div className="w-[198px]">
                                            <TextInput
                                                className="h-[30px]"
                                                type="hover"
                                                value={vers.name}
                                                maxLength={30}
                                                onSave={val => changeName(vers.id, val)}
                                            ></TextInput>
                                            <p className="text-sm text-muted-foreground mt-2">{vers.update_time.replace('T', ' ').substring(0, 16)}</p>
                                        </div>
                                        {
                                            // 最后一个 V0 版本和当前选中版本不允许删除
                                            !(version.id === vers.id)
                                            && <Button
                                                className="group-hover:flex hidden"
                                                type="button"
                                                size="icon"
                                                variant="outline"
                                                onClick={() => deleteVersion(vers, index)}
                                            ><DelIcon /></Button>
                                        }

                                    </div>
                                ))}
                            </RadioGroup>
                        </div>
                    )}
                ><Layers className="size-4" />{t('skills.saveVersion')}</ActionButton>
                <Button variant="outline" className="relative"
                    onClick={(event: React.MouseEvent<HTMLElement>) => {
                        setNotificationCenter(false);
                        const { top, left } = (event.target as Element).getBoundingClientRect();
                        openPopUp(
                            <>
                                <div className="absolute z-10" style={{ top: top + 40, left: left - AlertWidth }} ><AlertDropdown /></div>
                                <div className="header-notifications-box"></div>
                            </>
                        );
                    }}
                >
                    <Bell className="h-4 w-4" />
                    {notificationCenter && <div className="header-notifications"></div>}
                </Button>
            </div>
        }

        {/* 高级配置l2配置 */}
        <L2ParamsModal data={flow} open={open} setOpen={setOpen} onSave={handleSaveVersion}></L2ParamsModal>

        <Dialog open={blocker.state === "blocked"}>
            <DialogContent className="sm:max-w-[425px]" close={false}>
                <DialogHeader>
                    <DialogTitle>{t('prompt')}</DialogTitle>
                    <DialogDescription>{isOnlineVersion ? '当前版本已上线不可修改，可另存为新版本保存修改内容' : '您有未保存的更改,确定要离开吗?'}</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button className="leave h-8" onClick={handleSaveAndClose}>
                        {isOnlineVersion ? '另存为新版本' : t('flow.leaveAndSave')}
                    </Button>
                    <Button className="h-8" variant="destructive" onClick={() => blocker.proceed?.()}>
                        不保存,直接退出
                    </Button>
                    <Button className="h-8" variant="outline" onClick={() => {
                        const dom = document.getElementById("flow-page") as HTMLElement;
                        blocker.reset?.()
                        if (dom) dom.className = dom.className.replace('report-hidden', '');
                    }}>
                        {t('cancel')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
};

// 技能版本管理
const useVersion = (flow) => {
    const [versions, setVersions] = useState<FlowVersionItem[]>([])
    const { version, setVersion } = useContext(TabsContext)
    const lastVersionIndexRef = useRef(0)
    const { toast } = useToast()
    const [onlineVid, setOnlineVid] = useState(0);
    const updateOnlineVid = (vid: number) => {
        setOnlineVid(flow.status === 2 ? vid : 0);
    }
    const refrenshVersions = () => {
        return getFlowVersions(flow.id).then(({ data, total }) => {
            setVersions(data)
            lastVersionIndexRef.current = total - 1
            const currentV = data.find(el => el.is_current === 1)
            if (!currentV) {
                toast({
                    description: '无法对应当前版本',
                    variant: 'error'
                })
            }
            setVersion(currentV)
            // 记录上线的版本
            updateOnlineVid(currentV?.id)
        })
    }

    useEffect(() => {
        refrenshVersions()
    }, [])

    // 修改名字
    const handleChangName = (id, name) => {
        captureAndAlertRequestErrorHoc(updateVersion(id, { name, description: '', data: null }))
        // 乐观更新
        setVersions(versions.map(version => {
            if (version.id === id) {
                version.name = name;
            }
            return version;
        }))
    }

    const handleDeleteVersion = (version, index) => {
        bsConfirm({
            title: t('prompt'),
            desc: `${t('skills.deleteOrNot')} ${version.name} ${t('skills.version')}?`,
            onOk: (next) => {
                captureAndAlertRequestErrorHoc(deleteVersion(version.id)).then(res => {
                    if (res === null) {
                        // 乐观更新
                        setVersions(versions.filter((_, i) => i !== index))
                    }
                })
                next()
            }
        })
    }

    return {
        versions,
        version,
        lastVersionIndexRef,
        isOnlineVersion: version?.id === onlineVid,
        setCurrentVersion(versionId) {
            const currentV = versions.find(el => el.id === versionId)
            setVersion(currentV)
            return currentV
        },
        refrenshVersions,
        deleteVersion: handleDeleteVersion,
        changeName: handleChangName,
    }
}


// 离开页面保存提示
const useBeforeUnload = (flow, preFlow) => {
    const { t } = useTranslation()

    // 离开提示保存
    useEffect(() => {
        const fun = (e) => {
            var confirmationMessage = `${t('flow.unsavedChangesConfirmation')}`;
            (e || window.event).returnValue = confirmationMessage; // Compatible with different browsers
            return confirmationMessage;
        }
        window.addEventListener('beforeunload', fun);
        return () => { window.removeEventListener('beforeunload', fun) }
    }, [])

    const hasChange = useMemo(() => {
        if (!flow.data) return false
        const oldFlowData = JSON.parse(preFlow)
        if (!oldFlowData) return true
        // 比较新旧
        const { edges, nodes } = flow.data
        const { edges: oldEdges, nodes: oldNodes } = oldFlowData
        return !(isEqual(edges, oldEdges) && isEqual(nodes, oldNodes))
    }, [preFlow, flow.data])

    return useBlocker(hasChange);
}