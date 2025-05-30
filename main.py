import os
import json
import asyncio
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory
from dotenv import load_dotenv
from src.multi_agent_system import MultiAgentSystem

app = Flask(__name__, static_folder='app')

# 初始化多智能体系统
multi_agent_system = MultiAgentSystem()

@app.route('/')
def index():
    """提供主页"""
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:filename>')
def static_files(filename):
    """提供静态文件"""
    return send_from_directory(app.static_folder, filename)

@app.route('/search', methods=['POST'])
def search_projects():
    """使用多智能体系统搜索项目"""
    data = request.json
    query = data.get('query')
    
    if not query:
        print("No query provided")
        return jsonify({'error': 'Query parameter is missing'}), 400
    
    print(f"Received query: {query}")
    
    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        result = loop.run_until_complete(multi_agent_system.process_query(query))
        loop.close()
        
        # 测试代码：从本地文件读取项目数据，减少API消耗
        ########################
        # import os
        # import glob
        
        # query_dir = f"./auto_search/{query}"
        # projects = []
        
        # if os.path.exists(query_dir):
        #     # 读取目录下的所有JSON文件
        #     json_files = glob.glob(os.path.join(query_dir, "*.json"))
        #     for json_file in json_files:
        #         try:
        #             with open(json_file, 'r', encoding='utf-8') as f:
        #                 project_data = json.load(f)
        #                 projects.append(project_data)
        #         except Exception as e:
        #             print(f"Error reading {json_file}: {e}")
            
        #     result = {
        #         'projects': projects,
        #         'total_count': len(projects),
        #         'timestamp': datetime.now().isoformat()
        #     }
        # else:
        #     print(f"Directory {query_dir} not found")
        #     result = {
        #         'projects': [],
        #         'total_count': 0,
        #         'timestamp': datetime.now().isoformat()
        #     }
        ########################
        return jsonify({
            'results': result.get('projects', []),
            'total_count': result.get('total_count', 0),
            'query': query,
            'timestamp': result.get('timestamp', '')
        })
        
    except Exception as e:
        print(f"Multi-agent system error: {e}")
        return jsonify({'error': f'Multi-agent processing failed: {str(e)}'}), 500


@app.route('/project_details', methods=['POST'])
def project_details():
    """处理选中的项目 - 优先读取本地保存的结果，如果没有再调用智能体"""
    data = request.json
    repo_name = data.get('repo_name')
    query = data.get('query', '')

    # 兼容两种调用方式：通过project_data或project_id
    if not repo_name:
        print("No repo_name provided")
        return jsonify({'message': 'No repo_name provided'}), 400

    # 如果提供了repo_name，先尝试从本地文件读取
    if repo_name:
        repo_name_clean = repo_name.replace('/', '_', 1)
        file_path = f'./auto_search/{query}/{repo_name_clean}.json'
        print(f"Attempting to read cached project details from: {file_path}")
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                cached_data = json.load(f)
        except FileNotFoundError:
            print(f"Cached file not found: {file_path}")
            return jsonify({'error': 'Project not found in cache'}), 404
        except json.JSONDecodeError:
             print(f"Invalid JSON in cached file: {file_path}")
             return jsonify({'error': 'Invalid cached data'}), 500
         
         # 检查是否有完整的分析结果
        if (cached_data.get('analysis_result') and cached_data.get('report_result') and cached_data.get('category_result')):
            print(f"Found cached analysis for project: {repo_name}")
            return jsonify(cached_data)
        else:
            print(f"Cached data incomplete for project: {repo_name}, will analyze with AI")
             
            try:
                # 调用多智能体系统进行分析
                import asyncio
                result = asyncio.run(multi_agent_system.process_selected_project(query, cached_data))
                return jsonify(result)
            except Exception as e:
                print(f"Multi-agent analysis error: {e}")
                return jsonify({'error': f'Analysis failed: {str(e)}'}), 500

    # 如果没有找到缓存文件，返回错误
    return jsonify({'error': 'Project not found in cache'}), 404         

@app.route('/generate_report', methods=['POST'])
def generate_report():
    """生成选中项目的汇总报告"""
    data = request.json
    query = data.get('query')
    selected_projects = data.get('selected_projects', [])
    
    if not query:
        return jsonify({'error': 'Query parameter is missing'}), 400
    
    if not selected_projects:
        return jsonify({'error': 'No projects selected'}), 400
    
    print(f"Generating report for query: {query}, projects: {selected_projects}")
    
    try:
        # 调用多智能体系统生成报告
        import asyncio
        result = asyncio.run(multi_agent_system.generate_summary_report(query, selected_projects))
        
        return jsonify({
            'success': True,
            'message': 'Report generated successfully',
            'report_path': result.get('report_path', ''),
            'summary': result.get('summary', '')
        })
        
    except Exception as e:
        print(f"Report generation error: {e}")
        return jsonify({
            'success': False,
            'error': f'Report generation failed: {str(e)}'
        }), 500

if __name__ == "__main__":
    print("Starting Multi-Agent Flask server...")
    
    # 确保必要的目录存在
    if not os.path.exists('app'):
        os.makedirs('app')
    if not os.path.exists('auto_search'):
        os.makedirs('auto_search')
    
    app.run(debug=True, port=5001)  # 使用不同的端口避免冲突