import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../../../components/bs-ui/button";
import { SearchInput } from "../../../components/bs-ui/input";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "../../../components/bs-ui/select";
import { ToggleGroup, ToggleGroupItem } from "../../../components/bs-ui/toggle-group";
import { getAllServicesApi } from "../../../controllers/API";
import { useDebounce } from "../../../util/hook";

interface IProps {
    onSearch: (searchkey) => void,
    onFilter: ({ type, rt }) => void,
    rtClick: () => void,
    onCreate: () => void,
}
export default function FinetuneHead({ onSearch, onFilter, rtClick, onCreate }: IProps) {
    const { t } = useTranslation()

    const [type, setType] = useState('all')
    const [rt, setRt] = useState('all')
    const inputRef = useRef(null)

    const handleTypeChange = (val) => {
        setType(val)
        onFilter({ type: val, rt })
    }

    const handleRtChange = (val) => {
        setRt(val)
        onFilter({ type, rt: val })
    }

    // rts
    const [services, setServices] = useState([])
    useEffect(() => {
        getAllServicesApi().then(res => {
            setServices(res.map(el => ({
                id: el.id,
                name: el.server_name
            })))
        })

        onFilter({ type, rt })
    }, [])

    const handleSearch = () => {
        onSearch(inputRef.current.value)
    }

    return <div className="flex justify-between pb-4 border-b ml-2">
        <div className="flex gap-4">
            <ToggleGroup type="single" defaultValue={type} onValueChange={handleTypeChange} className="border rounded-md">
                <ToggleGroupItem value="all">{t('finetune.all')}</ToggleGroupItem>
                <ToggleGroupItem value="4">{t('finetune.successful')}</ToggleGroupItem>
                <ToggleGroupItem value="1">{t('finetune.inProgress')}</ToggleGroupItem>
                <ToggleGroupItem value="2">{t('finetune.failedAborted')}</ToggleGroupItem>
            </ToggleGroup>
            <Select defaultValue={rt} onValueChange={handleRtChange}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        <SelectItem value="all">{t('finetune.all')}</SelectItem>
                        {
                            services.map(service => <SelectItem key={service.id} value={service.id}>{service.name}</SelectItem>)
                        }
                    </SelectGroup>
                </SelectContent>
            </Select>
            <SearchInput ref={inputRef} placeholder={t('finetune.modelName')} onChange={useDebounce(handleSearch, 600, false)}></SearchInput>
        </div>
        <div className="flex gap-4 mr-2">
            <Button className="dark:text-[#ECECEC]" onClick={onCreate}>{t('finetune.createTrainingTask')}</Button>
            <Button variant="black" className="dark:text-[#ECECEC] dark:bg-[#34353A]" onClick={rtClick}>{t('finetune.rtServiceManagement')}</Button>
        </div>
    </div>
};
