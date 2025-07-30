import { Button } from "@/components/bs-ui/button";
import { Input } from "@/components/bs-ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/bs-ui/select";
import Tip from "@/components/bs-ui/tooltip/tip";
import { ChevronDown, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from 'react-i18next';
import SelectVar from "./SelectVar";

const Item = ({ nodeId, validate, sameKey, item, index, onUpdateItem, onDeleteItem }) => {
    const { t } = useTranslation('flow');

    const handleTypeChange = (newType) => {
        onUpdateItem(index, { ...item, type: newType, label: '', value: '' });
    };

    const handleKeyChange = (e) => {
        onUpdateItem(index, { ...item, key: e.target.value });
    };

    const handleValueChange = (e) => {
        onUpdateItem(index, { ...item, value: e.target.value });
    };

    const [error, setError] = useState(false);

    useEffect(() => {
        if (!validate) return setError(false);
        if (item.key === '' || !/^[a-zA-Z_][a-zA-Z0-9_]{1,50}$/.test(item.key)) {
            setError(true);
        } else {
            setError(false);
        }
    }, [validate])

    return (
        <div className="flex gap-1 items-center mb-1">
            {/* key */}
            <Input value={item.key} placeholder={t('parameterName')} onChange={handleKeyChange} className={`${(error || sameKey === item.key) && 'border-red-500'} h-8`} />
            {/* type */}

            <Select value={item.type} onValueChange={handleTypeChange}>
                <SelectTrigger className="max-w-32 w-24 h-8">
                    <SelectValue placeholder={t('type')} />
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        <SelectItem value="ref">{t('reference')}</SelectItem>
                        <SelectItem value="input">{t('input')}</SelectItem>
                    </SelectGroup>
                </SelectContent>
            </Select>
            {/* value */}
            {item.type === 'ref' ? <SelectVar nodeId={nodeId} itemKey={''} onSelect={(E, v) => {
                onUpdateItem(index, { ...item, label: `${E.name}/${v.label}`, value: `${E.id}.${v.value}` })
            }}>
                <Tip content={item.label} side="top">
                    <div className="no-drag nowheel group flex h-8 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-search-input px-3 py-1 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 data-[placeholder]:text-gray-400">
                        {item.label ? <span className="flex items-center">
                            {item.label}
                        </span> : <span className="bisheng-label">{t('value')}</span>}
                        <ChevronDown className="h-5 w-5 min-w-5 opacity-80 group-data-[state=open]:rotate-180" />
                    </div>
                </Tip>
            </SelectVar> : <Input value={item.value} placeholder={t('value')} onChange={handleValueChange} className="h-8" />}
            <Trash2 onClick={() => onDeleteItem(index)} className="min-w-5 hover:text-red-600 cursor-pointer" />
        </div>
    );
};


export default function CodeInputItem({ nodeId, data, onValidate, onChange }) {
    const { t } = useTranslation('flow');
    const [items, setItems] = useState(data.value);

    const handleAddItem = () => {
        setError(false)
        const newItems = [...items, { key: '', type: 'ref', label: '', value: '' }];
        setItems(newItems);
        onChange(newItems);
    };

    const handleUpdateItem = (index, newItem) => {
        const newItems = items.map((item, i) => (i === index ? newItem : item));
        setItems(newItems);
        onChange(newItems);
    };

    const handleDeleteItem = (index) => {
        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems);
        onChange(newItems);
    };

    const [error, setError] = useState(false)
    const [sameKey, setSameKey] = useState('')
    useEffect(() => {
        data.required && onValidate(() => {
            setError(false)
            setTimeout(() => {
                setError(true)
            }, 100);

            let msg = ''
            const map = {}
            items.some(item => {
                if (item.key === '') {
                    msg = t('variableNameCannotBeEmpty')
                    return true
                } else if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(item.key)) {
                    msg = t('variableNameInvalid')
                    return true
                } else if (item.key.length > 50) {
                    msg = t('variableNameTooLong')
                    return true
                } else if (map[item.key]) {
                    msg = t('variableNameDuplicate')
                    setSameKey(item.key)
                    return true
                } else {
                    map[item.key] = true
                    setSameKey('-')
                }
            })
            return msg || false
        })

        return () => onValidate(() => { })
    }, [data.value])

    return (
        <div className="nowheel max-h-80 overflow-y-auto">
            {items.map((item, index) => (
                <Item
                    key={index}
                    sameKey={sameKey}
                    validate={error}
                    nodeId={nodeId}
                    item={item}
                    index={index}
                    onUpdateItem={handleUpdateItem}
                    onDeleteItem={handleDeleteItem}
                />
            ))}
            <Button onClick={handleAddItem} variant="outline" className="border-primary text-primary mt-2 h-8">
                {t('addNewParameter')}
            </Button>
        </div>
    );
}
