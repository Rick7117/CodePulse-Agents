from src.tools.tools_definitions import tools, available_functions
import os, json
from dotenv import load_dotenv
from openai import OpenAI
import httpx
from flask import Flask, request, jsonify, send_from_directory

app = Flask(__name__, static_folder='app')

def print_code_if_exists(function_args):
    """
    如果存在代码片段，则打印代码
    """
    def convert_to_markdown(code, language):
        return f"```{language}\n{code}\n```"
    
    # 如果是SQL，则按照Markdown中SQL格式打印代码
    if function_args.get('sql_query'):
        code = function_args['sql_query']
        markdown_code = convert_to_markdown(code, 'sql')
        print("即将执行以下代码：")
        # display(Markdown(markdown_code)) # Disable display for web context

    # 如果是Python，则按照Markdown中Python格式打印代码
    elif function_args.get('py_code'):
        code = function_args['py_code']
        markdown_code = convert_to_markdown(code, 'python')
        print("即将执行以下代码：")
        # display(Markdown(markdown_code)) # Disable display for web context

def create_function_response_messages(messages, response):
    
    """
    调用外部工具，并更新消息列表
    :param messages: 原始消息列表
    :param response: 模型某次包含外部工具调用请求的响应结果
    :return：messages，追加了外部工具运行结果后的消息列表
    """
    
    # 提取function call messages
    function_call_messages = response.choices[0].message.tool_calls

    # 将function call messages追加到消息列表中
    messages.append(response.choices[0].message.model_dump())

    # 提取本次外部函数调用的每个任务请求
    for function_call_message in function_call_messages:
        
        # 提取外部函数名称
        tool_name = function_call_message.function.name
        # 提取外部函数参数
        tool_args = json.loads(function_call_message.function.arguments)       
        
        # 查找外部函数
        fuction_to_call = available_functions[tool_name]

        # 打印代码
        print_code_if_exists(function_args=tool_args)

        # 运行外部函数
        try:
            tool_args['g'] = globals()
            # 运行外部函数
            function_response = fuction_to_call(**tool_args)
        except Exception as e:
            function_response = "函数运行报错如下:" + str(e)

        # 拼接消息队列
        messages.append(
            {
                "role": "tool",
                "content": function_response,
                "tool_call_id": function_call_message.id,
            }
        )
        
    return messages     

def chat_base(messages, client, model):
    """
    获得一次模型对用户的响应。若其中需要调用外部函数，
    则会反复多次调用create_function_response_messages函数获得外部函数响应。
    """
    
    client = client
    model = model
    
    try:
        response = client.chat.completions.create(
            model=model,  
            messages=messages,
            tools=tools,
        )
        
    except Exception as e:
        print("模型调用报错" + str(e))
        return None

    if response.choices[0].finish_reason == "tool_calls":
        while True:
            messages = create_function_response_messages(messages, response)
            response = client.chat.completions.create(
                model=model,  
                messages=messages,
                tools=tools,
            )
            if response.choices[0].finish_reason != "tool_calls":
                break
    
    return response, messages

@app.route('/')
def index():
    return send_from_directory('app', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('app', path)

@app.route('/search', methods=['POST'])
def search_projects():
    data = request.json
    query = data.get('query')
    if not query:
        print("No query provided")
        return jsonify({'error': 'Query parameter is missing'}), 400
    print(f"Received query: {query}")
    results = []
    error_message = None

    # --- Temporarily read results from ./auto_search instead of calling the model ---
    # --- Temporarily read results from ./auto_search instead of calling the model ---
    # In a real application, you would call the model and process its response here.
    auto_search_dir_path = f'./auto_search/{query}'
    all_projects = []
    error_message = None

    if not os.path.isdir(auto_search_dir_path):
        error_message = f"Auto search results directory not found for query '{query}' at {auto_search_dir_path}"
        print(error_message)
    else:
        try:
            for filename in os.listdir(auto_search_dir_path):
                if filename.endswith('.json'):
                    file_path = os.path.join(auto_search_dir_path, filename)
                    try:
                        with open(file_path, 'r') as f:
                            project_data = json.load(f)
                            # Assuming each file contains a single project object
                            if isinstance(project_data, dict):
                                all_projects.append(project_data)
                            else:
                                print(f"Warning: File {file_path} does not contain a single JSON object.")
                        print(f"Successfully loaded results from {file_path}")
                    except json.JSONDecodeError:
                        print(f"Error decoding JSON from {file_path}")
                        # Optionally, add this file to a list of errors
                    except Exception as e:
                        print(f"An error occurred while reading {file_path}: {e}")
                        # Optionally, add this file to a list of errors

        except Exception as e:
            error_message = f"An error occurred while listing files in {auto_search_dir_path}: {e}"
            print(error_message)
    # --- End of temporary change ---

    if error_message:
        return jsonify({'error': error_message}), 500

    # Ensure results is a list, even if empty
    if not isinstance(all_projects, list):
        all_projects = []

    return jsonify({'results': all_projects})

@app.route('/process_selected', methods=['POST'])
def process_selected():
    data = request.json
    selected_urls = data.get('urls')

    if not selected_urls:
        print("No URLs provided")
        return jsonify({'message': 'No URLs provided'}), 400

    # *** Placeholder for processing selected URLs ***
    # Implement your logic here to integrate information from the selected projects
    print(f"Processing selected URLs: {selected_urls}")
    # Example: Fetch details for each URL, summarize, etc.

    return jsonify({'message': 'Selected URLs received and processed (placeholder)', 'processed_urls': selected_urls})

@app.route('/project_details', methods=['POST'])
def project_details():
    data = request.json
    project_id = data.get('id')
    # Assuming query is also sent in the request for now, or use a default/global query
    # In a real app, you might need to store the query associated with the project_id
    query = data.get('query', 'default_query') # Added to get query from request or use default
    print(f"Received project ID: {project_id}") # Added for debugging
    if not project_id:
        return jsonify({'error': 'Project ID is missing'}), 400

    def get_project_by_id(project_id, query):
        # Construct the path to the JSON file
        file_path = f'./auto_search/{query}/{project_id}.json'
        print(f"Attempting to read project details from: {file_path}") # Added for debugging
        project_data = None
        try:
            with open(file_path, 'r') as f:
                data = json.load(f)
                # Assuming the JSON structure has a 'content' field at the top level
                project_data = {
                    'title': data.get('title', project_id), # Use title from file if available, otherwise use id
                    'content': data.get('content', 'Content not found.'), # Read content field
                    'link': data.get('link', project_id), # Use link from file if available, otherwise use id
                    'languages': data.get('languages', 'Language not found.') # Read languages field
                }
            print(f"Successfully read project data from {file_path}") # Added for debugging
        except FileNotFoundError:
            print(f"Error: File not found at {file_path}") # Added for debugging
            project_data = None # Ensure project_data is None if file not found
        except json.JSONDecodeError:
            print(f"Error decoding JSON from {file_path}") # Added for debugging
            project_data = None
        except Exception as e:
            print(f"An error occurred while reading {file_path}: {e}") # Added for debugging
            project_data = None

        return project_data

    project_data = get_project_by_id(project_id, query) # Call the function with query

    if not project_data:
        return jsonify({'error': 'Project not found or could not be read'}), 404 # Modified error message

    return jsonify({
        'title': project_data.get('title'),
        'content': project_data.get('content'),
        'link': project_data.get('link'),
        'language': project_data.get('languages')
    })

if __name__ == "__main__":
    print("Starting Flask server...")
    # Ensure the 'app' directory exists for static files
    if not os.path.exists('app'):
        os.makedirs('app')
    app.run(debug=True, port=5000)