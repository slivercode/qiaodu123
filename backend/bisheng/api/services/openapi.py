import json

from bisheng.database.models.gpts_tools import AuthMethod, AuthType


class OpenApiSchema:

    def __init__(self, contents: dict):
        self.contents = contents
        self.version = contents['openapi']
        self.info = contents['info']
        self.title = self.info['title']
        self.auth_type = 'basic'
        self.auth_method = 0 
        self.description = self.info.get('description', '')
        self.default_server = ''
        self.apis = []

    def parse_server(self) -> str:
        """
        get the default server url
        """
        if self.contents.get('servers') is None:
            raise Exception('openapi schema must have servers')
        servers = self.contents['servers']
        if isinstance(servers, list):
            self.default_server = servers[0]['url']
        else:
            self.default_server = servers['url']

        # if self.contents.get('components') and self.contents['components'].get('securitySchemes') is not None:
        #     self.auth_type = 'custom' if self.contents['components']['securitySchemes']['ApiKeyAuth']['type'] == 'apiKey' else 'basic'
        #     s = self.contents['components']['securitySchemes']['ApiKeyAuth']['schema']
        #     if self.contents['components']['securitySchemes']['ApiKeyAuth']['type'] == 'http':
        #         self.auth_type = s
        #
        #     self.auth_method= 1 if self.contents['components']['securitySchemes']['ApiKeyAuth']['type'] == 'apiKey' or 'http' else 0
        #     self.api_location= self.contents['components']['securitySchemes']['ApiKeyAuth']['in']
        #     self.parameter_name= self.contents['components']['securitySchemes']['ApiKeyAuth']['name']

        security_schemes = self.contents.get('components', {}).get('securitySchemes', {})
        api_key_auth = security_schemes.get('ApiKeyAuth', {})

        # 获取认证类型
        auth_type = api_key_auth.get('type')
        if auth_type == 'apiKey':
            self.auth_type = 'custom'
        elif auth_type == 'http':
            self.auth_type = api_key_auth.get('schema')
        else:
            self.auth_type = 'basic'

        # 设置认证方法
        self.auth_method = 1 if auth_type in ('apiKey', 'http') else 0

        # 获取 API 位置和参数名
        self.api_location = api_key_auth.get('in')
        self.parameter_name = api_key_auth.get('name')
        return self.default_server

    def parse_paths(self) -> list[dict]:
        paths = self.contents['paths']

        self.apis = []

        for path, path_info in paths.items():
            for method, method_info in path_info.items():
                one_api_info = {
                    'path': path,
                    'method': method,
                    'description': method_info.get('description', '')
                    or method_info.get('summary', ''),
                    'operationId': method_info['operationId'],
                    'parameters': [],
                }
                if method not in ['get', 'post', 'put', 'delete']:
                    continue

                if 'requestBody' in method_info:
                    for _, content in method_info['requestBody']['content'].items():
                        if '$ref' in content['schema']:
                            schema_ref = content['schema']['$ref']
                            schema_name = schema_ref.split('/')[-1]
                            schema = self.contents['components']['schemas'][schema_name]
                        else:
                            schema = content['schema']

                        if 'properties' in schema:
                            for param_name, param_info in schema['properties'].items():
                                param = {
                                    'name': param_name,
                                    'description': param_info.get('description', ''),
                                    'in': 'body',
                                    'required': param_name in schema.get('required', []),
                                    'schema': {
                                        'type': param_info.get('type', 'string'),
                                        'title': param_info.get('title', param_name),
                                        'properties': param_info.get('properties', {})
                                    },
                                }
                                one_api_info['parameters'].append(param)
                else:
                    # no request body get parameters
                    one_api_info['parameters'].extend(method_info.get('parameters', []))
                self.apis.append(one_api_info)
        return self.apis

    @staticmethod
    def parse_openapi_tool_params(name: str,
                                  description: str,
                                  extra: str,
                                  server_host: str,
                                  auth_method: int,
                                  auth_type: str = None,
                                  api_key: str = None):
        # 拼接请求头
        headers = {}
        if auth_method == AuthMethod.API_KEY.value:
            if auth_type == AuthType.CUSTOM.value:
                extra_json = json.loads(extra)
                location = extra_json["api_location"]
                parameter_name= extra_json["parameter_name"]
                if location == "header":
                    headers = {parameter_name: api_key}
            elif auth_type == AuthType.BASIC.value:
                headers = {'Authorization': f'Basic {api_key}'}
            elif auth_type == AuthType.BEARER.value:
                headers = {'Authorization': f'Bearer {api_key}'}

        # 返回初始化 openapi所需的入参
        params = {
            'params': json.loads(extra),
            'headers': headers,
            'api_key': api_key,
            'url': server_host,
            'description': name + description if description else name
        }
        return params
