import { Badge } from "@/components/bs-ui/badge";
import { Button } from "@/components/bs-ui/button";
import { Input } from "@/components/bs-ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/bs-ui/select";
import Tip from "@/components/bs-ui/tooltip/tip";
import { generateUUID } from "@/components/bs-ui/utils";
import { ChevronDown, RefreshCcw, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from 'react-i18next';
import { CustomHandle } from "..";
import SelectVar from "./SelectVar";
import useFlowStore from "../../flowStore";
import { isVarInFlow } from "@/util/flowUtils";

interface Item {
    id: string;  // UUID 类型的字符串
    left_var: string;  // 左侧变量
    left_label: string;  // 左侧标签
    comparison_operation: string;  // 比较操作符
    right_value_type: string;  // 右侧值的类型
    right_value: string;  // 右侧的具体值
    right_label: string;  // 右侧标签
    del: boolean
}


const Item = ({ nodeId, item, index, del, required, varErrors, onUpdateItem, onDeleteItem }) => {
    const { t } = useTranslation('flow');

    const handleCompTypeChange = (newType) => {
        const valuetype = newType === 'regex' ? 'input' : item.right_value_type;
        onUpdateItem(index, { ...item, comparison_operation: newType, right_value_type: valuetype });
    };

    const handleTypeChange = (newType) => {
        onUpdateItem(index, { ...item, right_value_type: newType, right_value: '', right_label: '' });
    };

    const handleValueChange = (e) => {
        onUpdateItem(index, { ...item, right_value: e.target.value });
    };

    const [leftError, rightError] = useMemo(() => {
        if (!varErrors) return [false, false];
        return varErrors;
    }, [varErrors])

    return (
        <div className="flex gap-1 items-center mb-1 hover-reveal">
            {/* key */}
            <SelectVar
                className="max-w-32"
                nodeId={nodeId}
                itemKey={item.id}
                onSelect={(E, v) => {
                    onUpdateItem(index, { ...item, left_label: `${E.name}/${v.label}`, left_var: `${E.id}.${v.value}` });
                }}
            >
                <Tip content={item.left_label} side="top">
                    <div
                        className={`${(required && !item.left_label || leftError) && 'border-red-500'
                            } no-drag nowheel group flex h-8 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-search-input px-3 py-1 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 data-[placeholder]:text-gray-400`}
                    >
                        {item.left_label ? (
                            <span className="flex items-center">{item.left_label}</span>
                        ) : (
                            <span className="text-gray-400 mt-0.5">{t('selectVariable')}</span>
                        )}
                        <ChevronDown className="h-5 w-5 min-w-5 opacity-80 group-data-[state=open]:rotate-180" />
                    </div>
                </Tip>
            </SelectVar>
            {/* condition */}
            <Select value={item.comparison_operation} onValueChange={handleCompTypeChange}>
                <SelectTrigger className={`max-w-32 w-24 h-8 ${required && !item.comparison_operation && 'border-red-500'}`}>
                    <SelectValue placeholder={t('selectCondition')} />
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        <SelectItem value="equals">{t('equals')}</SelectItem>
                        <SelectItem value="not_equals">{t('notEquals')}</SelectItem>
                        <SelectItem value="contains">{t('contains')}</SelectItem>
                        <SelectItem value="not_contains">{t('notContains')}</SelectItem>
                        <SelectItem value="is_empty">{t('isEmpty')}</SelectItem>
                        <SelectItem value="is_not_empty">{t('isNotEmpty')}</SelectItem>
                        <SelectItem value="starts_with">{t('startsWith')}</SelectItem>
                        <SelectItem value="ends_with">{t('endsWith')}</SelectItem>
                        <SelectItem value="greater_than">&gt;</SelectItem>
                        <SelectItem value="less_than">&lt;</SelectItem>
                        <SelectItem value="greater_than_or_equal">&ge;</SelectItem>
                        <SelectItem value="less_than_or_equal">&le;</SelectItem>
                        <SelectItem value="regex">{t('regex')}</SelectItem>
                    </SelectGroup>
                </SelectContent>
            </Select>
            {/* type */}
            {!['is_not_empty', 'is_empty'].includes(item.comparison_operation) && (
                <>
                    {'regex' !== item.comparison_operation && (
                        <Select value={item.right_value_type} onValueChange={handleTypeChange}>
                            <SelectTrigger className="max-w-32 w-24 h-8">
                                <SelectValue placeholder={t('selectType')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectItem value="ref">{t('reference')}</SelectItem>
                                    <SelectItem value="input">{t('input')}</SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    )}
                    {/* value */}
                    {item.right_value_type === 'ref' ? (
                        <SelectVar
                            className="max-w-40"
                            nodeId={nodeId}
                            itemKey={item.id}
                            onSelect={(E, v) => {
                                onUpdateItem(index, { ...item, right_label: `${E.name}/${v.label}`, right_value: `${E.id}.${v.value}` });
                            }}
                        >
                            <Tip content={item.right_label} side="top">
                                <div
                                    className={`${(required && !item.right_label || rightError) && 'border-red-500'
                                        } no-drag nowheel group flex h-8 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-search-input px-3 py-1 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 data-[placeholder]:text-gray-400`}
                                >
                                    <span className="flex items-center">{item.right_label}</span>
                                    <ChevronDown className="h-5 w-5 min-w-5 opacity-80 group-data-[state=open]:rotate-180" />
                                </div>
                            </Tip>
                        </SelectVar>
                    ) : (
                        <Input
                            placeholder={
                                item.comparison_operation === 'regex'
                                    ? t('inputRegexPlaceholder')
                                    : t('inputValuePlaceholder')
                            }
                            value={item.right_value}
                            onChange={handleValueChange}
                            className={`${required && !item.right_value && 'border-red-500'} h-8`}
                        />
                    )}
                    {del && (
                        <Trash2
                            size={18}
                            onClick={() => onDeleteItem(index)}
                            className="min-w-5 hover:text-red-600 cursor-pointer hover-reveal-child"
                        />
                    )}
                </>
            )}
        </div>
    );
};

export default function ConditionItem({ nodeId, node, data, onChange, onValidate, onVarEvent }) {
    const { t } = useTranslation('flow'); // 获取翻译函数
    const [value, setValue] = useState([]);
    const [required, setRequired] = useState(false);

    const handleAddCondition = () => {
        setRequired(false);
        setValue((val) => {
            const newVal = [...val, { id: generateUUID(8), operator: 'and', conditions: [] }];
            onChange(newVal);
            return newVal;
        });
    };

    useEffect(() => {
        if (data.value && data.value.length) {
            setValue(data.value);
        } else {
            handleAddCondition();
        }
    }, []);

    const deleteCondition = (id) => {
        setValue((val) => {
            const newVal = val.filter((item) => item.id !== id);
            onChange(newVal);
            return newVal;
        });
    };

    const handleAddItem = (id) => {
        setRequired(false);
        setValue((val) => {
            const newVal = val.map((item) => {
                if (item.id === id) {
                    item.conditions.push({
                        id: generateUUID(8),
                        left_var: '',
                        left_label: '',
                        comparison_operation: '',
                        right_value_type: 'input',
                        right_value: '',
                        right_label: '',
                    });
                }
                return item;
            });
            onChange(newVal);
            return newVal;
        });
    };

    const handleOperatorChange = (index) => {
        value[index].operator = value[index].operator === 'and' ? 'or' : 'and';
        setValue([...value]);
        onChange(value);
    };

    useEffect(() => {
        onValidate(() => {
            setRequired(false);
            setTimeout(() => {
                setRequired(true);
            }, 100);
            if (data.value.length === 0) return t('conditionBranchCannotBeEmpty'); // 条件分支不可为空
            const res = data.value.some((item) => {
                if (!item.conditions.length) return true;
                return item.conditions.some((cds) => {
                    if (!cds.left_label) return true;
                    if (!cds.comparison_operation) return true;
                    if (
                        !(cds.right_value || cds.right_label) &&
                        !['is_not_empty', 'is_empty'].includes(cds.comparison_operation)
                    )
                        return true;
                });
            });
            if (res) return t('conditionBranchCannotBeEmpty'); // 条件分支不可为空
            return false;
        });

        return () => onValidate(() => { });
    }, [data.value]);

    // 校验变量是否可用
    const { flow } = useFlowStore();
    const [varErrors, setVarErrors] = useState([]);
    const validateVarAvailble = () => {
        const newVarErrors = [] // 存储所有验证结果
        let errorMsg = '';
        value.forEach((item, index) => {
            const conditionErrors = []
            item.conditions.forEach((cds) => {
                const leftError = isVarInFlow(nodeId, flow.nodes, cds.left_var, cds.left_label)
                let rightError = ''

                if (cds.right_value_type === 'ref') {
                    rightError = isVarInFlow(nodeId, flow.nodes, cds.right_value, cds.right_label)
                }
                errorMsg = rightError || leftError || errorMsg;
                conditionErrors.push([!!leftError, !!rightError])
            })
            newVarErrors.push(conditionErrors)
        })
        setVarErrors(newVarErrors)
        return Promise.resolve(errorMsg);
    };
    useEffect(() => {
        onVarEvent && onVarEvent(validateVarAvailble);
        return () => onVarEvent && onVarEvent(() => { });
    }, [data, value]);

    return (
        <div>
            {value.map((val, vindex) => (
                <div className="relative group" key={val.id}>
                    <div className="flex justify-between items-center">
                        <p className="mt-2 mb-3 text-sm font-bold">{t('if')}</p> {/* 如果 */}
                        {value.length > 1 && (
                            <Trash2
                                size={14}
                                onClick={() => deleteCondition(val.id)}
                                className="hover:text-red-600 cursor-pointer group-hover:opacity-100 opacity-0"
                            />
                        )}
                    </div>
                    <div className="relative pl-6">
                        {val.conditions.map((item, index) => (
                            <Item
                                key={item.id}
                                required={required}
                                nodeId={nodeId}
                                item={item}
                                index={index}
                                varErrors={varErrors[vindex]?.[index]}
                                del={val.conditions.length > 1}
                                onUpdateItem={(index, item) => {
                                    val.conditions[index] = item;
                                    setValue([...value]);
                                    onChange(value);
                                }}
                                onDeleteItem={(index) => {
                                    val.conditions.splice(index, 1);
                                    setValue([...value]);
                                    onChange(value);
                                }}
                            />
                        ))}
                        {val.conditions.length > 1 && (
                            <div className="absolute left-1 top-0 w-4 h-full py-4">
                                <div className="h-full border border-foreground border-dashed border-r-0 rounded-l-sm">
                                    <Badge
                                        variant="outline"
                                        className="absolute top-1/2 left-0.5 -translate-x-1/2 -translate-y-1/2 px-1 py-0 text-primary bg-[#E6ECF6] cursor-pointer"
                                        onClick={() => handleOperatorChange(vindex)}
                                    >
                                        {val.operator}
                                        <RefreshCcw size={12} />
                                    </Badge>
                                </div>
                            </div>
                        )}
                    </div>
                    <Button
                        onClick={() => handleAddItem(val.id)}
                        variant="outline"
                        className="border-primary text-primary mt-2 h-8"
                    >
                        + {t('addCondition')} {/* 添加条件 */}
                    </Button>
                    <CustomHandle id={val.id} node={node} className="top-[20px] -right-[30px]" />
                </div>
            ))}

            <div className="relative">
                <p className="mt-2 mb-3 text-sm font-bold">{t('else')}</p> {/* 否则 */}
                <CustomHandle node={node} className="top-[12px] -right-[30px]" />
            </div>
            <Button
                onClick={handleAddCondition}
                variant="outline"
                className="border-primary text-primary mt-2 h-8"
            >
                + {t('addBranch')} {/* 添加分支 */}
            </Button>
        </div>
    );
}