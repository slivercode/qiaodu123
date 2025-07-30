import contextlib
import json
from typing import Any, Dict, List

import orjson
from bisheng.database.models.base import orjson_dumps
from langchain.agents import ZeroShotAgent
from langchain.schema import BaseOutputParser, Document


def langchain_bug_openv1(params):
    '''兼容openai v1'''
    client_params = {
        'api_key': params.get('openai_api_key') or params.get('api_key'),
        'organization': params.get('openai_organization'),
        'base_url': params.get('openai_api_base'),
        'timeout': params.get('request_timeout', 30),
        'max_retries': params.get('max_retries', 1),
        'default_headers': params.get('default_headers'),
        'default_query': params.get('default_query')
    }
    return client_params


def handle_node_type(node_type, class_object, params: Dict):
    if node_type == 'ZeroShotPrompt':
        params = check_tools_in_params(params)
        prompt = ZeroShotAgent.create_prompt(**params)
    elif 'MessagePromptTemplate' in node_type:
        prompt = instantiate_from_template(class_object, params)
    elif node_type == 'ChatPromptTemplate':
        prompt = class_object.from_messages(**params)
    elif hasattr(class_object, 'from_template') and params.get('template'):
        prompt = class_object.from_template(template=params.pop('template'),
                                            output_parser=params.get('output_parser'))
    else:
        prompt = class_object(**params)
    return params, prompt


def check_tools_in_params(params: Dict):
    if 'tools' not in params:
        params['tools'] = []
    return params


def instantiate_from_template(class_object, params: Dict):
    from_template_params = {'template': params.pop('prompt', params.pop('template', ''))}
    from_template_params.update(params)
    if not from_template_params.get('template'):
        raise ValueError('Prompt template is required')
    if class_object.__name__ in ('HumanMessagePromptTemplate', 'SystemMessagePromptTemplate'):
        from_template_params['template'] = from_template_params['template'][0].template
    return class_object.from_template(**from_template_params)


def handle_format_kwargs(prompt, params: Dict):
    format_kwargs: Dict[str, Any] = {}
    for input_variable in prompt.input_variables:
        if input_variable in params:
            format_kwargs = handle_variable(params, input_variable, format_kwargs)

    return format_kwargs


def handle_partial_variables(prompt, format_kwargs: Dict):
    partial_variables = format_kwargs.copy()
    partial_variables = {key: value for key, value in partial_variables.items() if value}
    # Remove handle_keys otherwise LangChain raises an error
    partial_variables.pop('handle_keys', None)
    if partial_variables and hasattr(prompt, 'partial'):
        return prompt.partial(**partial_variables)
    return prompt


def handle_variable(params: Dict, input_variable: str, format_kwargs: Dict):
    variable = params[input_variable]
    if isinstance(variable, str):
        format_kwargs[input_variable] = variable
    elif isinstance(variable, dict):
        # variable node 特殊处理
        if len(variable) == 0:
            format_kwargs[input_variable] = ''
        elif len(variable) != 1:
            raise ValueError(f'VariableNode contains multi-key {variable.keys()}')
        else:
            format_kwargs[input_variable] = list(variable.values())[0]
    elif isinstance(variable, BaseOutputParser) and hasattr(variable, 'get_format_instructions'):
        format_kwargs[input_variable] = variable.get_format_instructions()
    elif is_instance_of_list_or_document(variable):
        format_kwargs = format_document(variable, input_variable, format_kwargs)
    if needs_handle_keys(variable):
        format_kwargs = add_handle_keys(input_variable, format_kwargs)
    return format_kwargs


def is_instance_of_list_or_document(variable):
    return (isinstance(variable, List) and all(isinstance(item, Document) for item in variable)
            or isinstance(variable, Document))


def format_document(variable, input_variable: str, format_kwargs: Dict):
    variable = variable if isinstance(variable, List) else [variable]
    content = format_content(variable)
    format_kwargs[input_variable] = content
    return format_kwargs


def format_content(variable):
    if len(variable) > 1:
        return '\n'.join([item.page_content for item in variable if item.page_content])
    elif len(variable) == 1:
        content = variable[0].page_content
        return try_to_load_json(content)
    return ''


def try_to_load_json(content):
    with contextlib.suppress(json.JSONDecodeError):
        content = orjson.loads(content)
        if isinstance(content, list):
            content = ','.join([str(item) for item in content])
        else:
            content = orjson_dumps(content)
    return content


def needs_handle_keys(variable):
    return is_instance_of_list_or_document(variable) or (isinstance(
        variable, BaseOutputParser) and hasattr(variable, 'get_format_instructions'))


def add_handle_keys(input_variable: str, format_kwargs: Dict):
    if 'handle_keys' not in format_kwargs:
        format_kwargs['handle_keys'] = []
    format_kwargs['handle_keys'].append(input_variable)
    return format_kwargs
