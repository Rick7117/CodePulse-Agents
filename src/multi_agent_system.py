import os
import json
import asyncio
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from pydantic import BaseModel, Field
import requests
from urllib.parse import urlparse
import re

# LangChain imports
from langchain.agents import AgentExecutor, create_openai_functions_agent
from langchain.tools import Tool
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.schema import HumanMessage, SystemMessage
from langchain.output_parsers import PydanticOutputParser

# 尝试导入 GoogleSearchAPIWrapper，如果失败则使用备用方案
try:
    from langchain_community.tools import GoogleSearchAPIWrapper
except ImportError:
    try:
        from langchain_community.utilities import GoogleSearchAPIWrapper
    except ImportError:
        print("Warning: GoogleSearchAPIWrapper not available, using fallback implementation")
        GoogleSearchAPIWrapper = None
from langchain.tools import tool
from dotenv import load_dotenv

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 加载环境变量
load_dotenv()

# 加载提示词配置
def load_prompts():
    """从prompts.json文件加载提示词配置"""
    try:
        prompts_path = os.path.join(os.path.dirname(__file__), 'prompts.json')
        with open(prompts_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"加载提示词配置失败: {e}")
        return {}

# 全局提示词配置
PROMPTS = load_prompts()

@dataclass
class ProjectData:
    """项目数据结构"""
    repo_name: str
    url: str
    stars: int
    forks: int
    watchers: int
    last_commit: str
    description: str
    languages: Dict[str, int]  # 修改为字典类型，存储语言名称和对应的代码行数
    license: str
    topics: List[str]
    size: int = 0  # 仓库大小（KB）
    created_at: str = ""  # 创建时间
    has_requirements_txt: bool = False
    has_dockerfile: bool = False
    has_readme: bool = False
    readme_content: str = ""

class SearchResult(BaseModel):
    """搜索结果模型"""
    projects: List[Dict[str, Any]] = Field(description="搜索到的项目列表")
    total_count: int = Field(description="总项目数量")
    search_query: str = Field(description="搜索查询")

class AnalysisResult(BaseModel):
    """分析结果模型"""
    repo_name: str = Field(description="仓库名称")
    activity_score: float = Field(description="活跃度评分 (0-10)")
    code_quality_score: float = Field(description="代码质量评分 (0-10)")
    tech_stack: List[str] = Field(description="技术栈")
    complexity_level: str = Field(description="复杂度等级: 简单/中等/复杂")
    maintenance_status: str = Field(description="维护状态: 活跃/一般/停滞")

class CategoryResult(BaseModel):
    """分类结果模型"""
    repo_name: str = Field(description="仓库名称")
    primary_category: str = Field(description="主要分类")
    secondary_categories: List[str] = Field(description="次要分类")
    tags: List[str] = Field(description="标签")

class ReportResult(BaseModel):
    """报告结果模型"""
    repo_name: str = Field(description="仓库名称")
    rating: str = Field(description="评分 (⭐️格式)")
    summary: str = Field(description="项目总结")
    recommendation_reason: str = Field(description="推荐理由")

class MultiAgentSystem:
    """多智能体系统主类"""
    
    def __init__(self):
        self.llm = self._init_llm()
        self.search_agent = SearchAgent(self.llm)
        self.analysis_agent = AnalysisAgent(self.llm)
        self.categorization_agent = CategorizationAgent(self.llm)
        self.reporting_agent = ReportingAgent(self.llm)
        
    def _init_llm(self):
        """初始化语言模型"""
        api_key = os.getenv("API_KEY")
        base_url = os.getenv("BASE_URL")
        model = os.getenv("MODEL", "deepseek-chat")
        
        return ChatOpenAI(
            api_key=api_key,
            base_url=base_url,
            model=model,
            temperature=0.1
        )
    
    async def _update_project_file_with_all_results(self, query: str, project_data: Dict[str, Any], 
                                                   analysis_result: AnalysisResult, 
                                                   category_result: CategoryResult,
                                                   report_result: ReportResult):
        """更新项目文件，添加分析、分类和报告结果"""
        try:
            import json
            import os
            
            # 构建文件路径（与保存时相同的逻辑）
            safe_query = query.replace('/', '_').replace('\\', '_').replace(':', '_')
            safe_repo_name = project_data['repo_name'].replace('/', '_')
            
            file_path = f"./auto_search/{safe_query}/{safe_repo_name}.json"
            
            # 检查文件是否存在
            if os.path.exists(file_path):
                # 读取现有数据
                with open(file_path, 'r', encoding='utf-8') as f:
                    existing_data = json.load(f)
                
                # 添加分析结果
                existing_data['analysis_result'] = {
                    'activity_score': analysis_result.activity_score,
                    'code_quality_score': analysis_result.code_quality_score,
                    'tech_stack': analysis_result.tech_stack,
                    'complexity_level': analysis_result.complexity_level,
                    'maintenance_status': analysis_result.maintenance_status
                }
                
                # 添加分类结果
                existing_data['category_result'] = {
                    'primary_category': category_result.primary_category,
                    'secondary_categories': category_result.secondary_categories,
                    'tags': category_result.tags
                }
                
                # 添加报告结果
                existing_data['report_result'] = {
                    'repo_name': report_result.repo_name,
                    'rating': report_result.rating,
                    'summary': report_result.summary,
                    'recommendation_reason': report_result.recommendation_reason
                }
                
                # 保存更新后的数据
                with open(file_path, 'w', encoding='utf-8') as f:
                    json.dump(existing_data, f, ensure_ascii=False, indent=2)
                
                logger.info(f"已更新项目文件（所有结果）: {file_path}")
            else:
                logger.warning(f"项目文件不存在: {file_path}")
                
        except Exception as e:
            logger.error(f"更新项目文件（所有结果）失败 {project_data.get('repo_name', '')}: {e}")
    
    async def process_query(self, query: str) -> Dict[str, Any]:
        """处理查询的主要流程 - 只执行搜索步骤"""
        print(f"开始处理查询: {query}")
        
        # 步骤1: 搜索项目
        print("步骤1: 搜索GitHub项目...")
        search_results = await self.search_agent.search_projects(query)
        
        # 返回搜索结果，不进行后续的分析、分类和报告
        return {
            'projects': search_results.projects,
            'total_count': search_results.total_count,
            'search_query': search_results.search_query,
            'timestamp': datetime.now().isoformat()
        }
    
    async def process_selected_project(self, query: str, project_data: Dict[str, Any]) -> Dict[str, Any]:
        """处理选中的项目 - 执行分析、分类和报告"""
        print(f"开始处理选中的项目: {project_data.get('repo_name', '')}")
        
        # 步骤2: 分析项目
        print("步骤2: 分析项目详情...")
        analysis = await self.analysis_agent.analyze_project(project_data)
        
        # 步骤3: 分类整理
        print("步骤3: 分类整理项目...")
        category = await self.categorization_agent.categorize_project(project_data, analysis)
        
        # 步骤4: 生成报告
        print("步骤4: 生成最终报告...")
        report = await self.reporting_agent.generate_report(project_data, analysis, category)
        
        # 将所有结果（分析、分类、报告）保存到对应的文件中
        await self._update_project_file_with_all_results(query, project_data, analysis, category, report)
        
        return {
            **project_data,
            'analysis_result': analysis.dict() if analysis else None,
            'category_result': category.dict() if category else None,
            'report_result': report.dict() if report else None
        }
    
    async def generate_summary_report(self, query: str, selected_projects: List[str]) -> Dict[str, Any]:
        """生成选中项目的汇总报告"""
        print(f"开始生成汇总报告: {query}, 选中项目: {selected_projects}")
        
        try:
            # 读取选中项目的数据
            projects_data = []
            for project_name in selected_projects:
                safe_query = query.replace('/', '_').replace('\\', '_').replace(':', '_')
                safe_repo_name = project_name.replace('/', '_')
                file_path = f"./auto_search/{safe_query}/{safe_repo_name}.json"
                
                if os.path.exists(file_path):
                    with open(file_path, 'r', encoding='utf-8') as f:
                        project_data = json.load(f)
                        projects_data.append(project_data)
                        print(f"已读取项目数据: {project_data}")
                else:
                    logger.warning(f"项目文件不存在: {file_path}")
            
            if not projects_data:
                raise Exception("没有找到有效的项目数据")
            
            # 使用报告智能体生成汇总报告
            summary_report = await self.reporting_agent.generate_summary_report(query, projects_data)
            
            # 保存报告到文件
            report_path = await self._save_summary_report(query, summary_report)
            
            return {
                'report_path': report_path,
                'summary': summary_report,
                'projects_count': len(projects_data)
            }
            
        except Exception as e:
            logger.error(f"生成汇总报告失败: {e}")
            raise e
    
    async def _save_summary_report(self, query: str, summary_report: str) -> str:
        """保存汇总报告到文件"""
        try:
            import os
            from datetime import datetime
            
            # 创建报告目录
            safe_query = query.replace('/', '_').replace('\\', '_').replace(':', '_')
            report_dir = f"./report/{safe_query}"
            os.makedirs(report_dir, exist_ok=True)
            
            # 生成报告文件名
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            report_filename = f"summary_report_{timestamp}.md"
            report_path = os.path.join(report_dir, report_filename)
            
            # 保存报告
            with open(report_path, 'w', encoding='utf-8') as f:
                f.write(summary_report)
            
            logger.info(f"汇总报告已保存到: {report_path}")
            return report_path
            
        except Exception as e:
            logger.error(f"保存汇总报告失败: {e}")
            raise e

class SearchAgent:
    """GitHub搜索专家智能体 - 直接API搜索"""
    
    def __init__(self, llm=None):
        self.github_token = os.getenv('GITHUB_TOKEN')
        self.headers = {}
        if self.github_token:
            self.headers['Authorization'] = f'token {self.github_token}'
    
    async def search_projects(self, query: str) -> SearchResult:
        """直接使用GitHub API搜索项目"""
        try:
            # 搜索仓库
            repos = await self._search_repositories(query)
            
            # 获取详细信息
            projects = []
            for repo in repos[:10]:  
                project_data = await self._get_project_details(repo)
                if project_data:
                    projects.append(project_data)
                    # 保存项目数据到文件
                    await self._save_project_data(query, project_data)
            
            return SearchResult(
                projects=projects,
                total_count=len(projects),
                search_query=query
            )
        except Exception as e:
            logger.error(f"搜索出错: {e}")
            return SearchResult(projects=[], total_count=0, search_query=query)
    
    async def _search_repositories(self, query: str) -> List[Dict[str, Any]]:
        """搜索GitHub仓库"""
        url = 'https://api.github.com/search/repositories'
        params = {
            'q': query,
            'sort': 'stars',
            'order': 'desc',
            'per_page': 20
        }
        
        response = requests.get(url, headers=self.headers, params=params, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        return data.get('items', [])
    
    async def _get_project_details(self, repo: Dict[str, Any]) -> Dict[str, Any]:
        """获取项目详细信息"""
        try:
            # 基本信息
            repo_name = repo.get('full_name', '')
            
            # 获取语言信息
            languages = await self._get_languages(repo_name)
            
            # 获取文件信息
            files = await self._get_repository_files(repo_name)
            
            # 获取README内容
            readme_content = await self._get_readme_content(repo_name)
            
            return {
                'repo_name': repo_name,
                'url': repo.get('html_url', ''),
                'stars': repo.get('stargazers_count', 0),
                'forks': repo.get('forks_count', 0),
                'watchers': repo.get('watchers_count', 0),
                'last_commit': repo.get('updated_at', ''),
                'description': repo.get('description', ''),
                'languages': languages,
                'license': repo.get('license', {}).get('name', '') if repo.get('license') else '',
                'topics': repo.get('topics', []),
                'size': repo.get('size', 0),
                'created_at': repo.get('created_at', ''),
                'has_requirements_txt': 'requirements.txt' in files,
                'has_dockerfile': 'Dockerfile' in files,
                'has_readme': any('readme' in f.lower() for f in files),
                'readme_content': readme_content
            }
        except Exception as e:
            logger.error(f"获取项目详情失败 {repo.get('full_name', '')}: {e}")
            return None
    
    async def _get_languages(self, repo_name: str) -> Dict[str, int]:
        """获取仓库语言信息"""
        try:
            url = f'https://api.github.com/repos/{repo_name}/languages'
            response = requests.get(url, headers=self.headers, timeout=10)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"获取语言信息失败 {repo_name}: {e}")
            return {}
    
    async def _get_repository_files(self, repo_name: str) -> List[str]:
        """获取仓库根目录文件列表"""
        try:
            url = f'https://api.github.com/repos/{repo_name}/contents'
            response = requests.get(url, headers=self.headers, timeout=10)
            response.raise_for_status()
            
            contents = response.json()
            files = [item['name'] for item in contents if item['type'] == 'file']
            return files
        except Exception as e:
            logger.error(f"获取文件列表失败 {repo_name}: {e}")
            return []
    
    async def _get_readme_content(self, repo_name: str) -> str:
        """获取README文件内容"""
        try:
            # 尝试常见的README文件名
            readme_files = ['README.md', 'README.rst', 'README.txt', 'README']
            
            for readme_file in readme_files:
                try:
                    url = f'https://api.github.com/repos/{repo_name}/contents/{readme_file}'
                    response = requests.get(url, headers=self.headers, timeout=10)
                    
                    if response.status_code == 200:
                        content_data = response.json()
                        if content_data.get('encoding') == 'base64':
                            import base64
                            content = base64.b64decode(content_data['content']).decode('utf-8')
                            # 限制README内容长度
                            return content[:2000] if len(content) > 2000 else content
                except:
                    continue
            
            return ""
        except Exception as e:
            logger.error(f"获取README内容失败 {repo_name}: {e}")
            return ""
    
    async def _save_project_data(self, query: str, project_data: Dict[str, Any]):
        """保存项目数据到文件"""
        try:
            import json
            import os
            
            # 创建目录结构
            safe_query = query.replace('/', '_').replace('\\', '_').replace(':', '_')
            safe_repo_name = project_data['repo_name'].replace('/', '_')
            
            dir_path = f"./auto_search/{safe_query}"
            os.makedirs(dir_path, exist_ok=True)
            
            # 保存文件
            file_path = f"{dir_path}/{safe_repo_name}.json"
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(project_data, f, ensure_ascii=False, indent=2)
            
            logger.info(f"项目数据已保存到: {file_path}")
        except Exception as e:
            logger.error(f"保存项目数据失败 {project_data.get('repo_name', '')}: {e}")

class AnalysisAgent:
    """项目分析员智能体 - 直接分析搜索结果"""
    
    def __init__(self, llm):
        self.llm = llm
        self.parser = PydanticOutputParser(pydantic_object=AnalysisResult)
    
    async def analyze_project(self, project_data: Dict[str, Any]) -> AnalysisResult:
        """直接分析项目数据"""
        
        # 确保project_data是字典类型
        if not isinstance(project_data, dict):
            print(f"分析项目出错: 期望字典类型，但收到 {type(project_data)}")
            return AnalysisResult(
                repo_name="unknown",
                activity_score=5.0,
                code_quality_score=5.0,
                tech_stack=[],
                complexity_level="中等",
                maintenance_status="一般"
            )
        
        analysis_template = PROMPTS.get('analysis_agent', {}).get('analysis_prompt_template', 
            "请分析GitHub项目: {repo_name}，基于项目信息进行评分和分类。{format_instructions}")
        
        prompt = ChatPromptTemplate.from_template(analysis_template)
        chain = prompt | self.llm | self.parser
        
        try:
            # 安全地获取languages字段
            languages = project_data.get("languages", {})
            if isinstance(languages, dict):
                languages_str = ", ".join(languages.keys())
                tech_stack_list = list(languages.keys())
            elif isinstance(languages, list):
                languages_str = ", ".join(languages)
                tech_stack_list = languages
            else:
                languages_str = str(languages) if languages else ""
                tech_stack_list = []
            
            # 安全地获取topics字段
            topics = project_data.get("topics", [])
            if isinstance(topics, list):
                topics_str = ", ".join(topics)
            else:
                topics_str = str(topics) if topics else ""
            
            # 截取README内容前500字符用于分析
            readme_content = project_data.get("readme_content", "")
            readme_summary = readme_content[:500] + "..." if len(readme_content) > 500 else readme_content
            
            result = await chain.ainvoke({
                "repo_name": project_data.get("repo_name", ""),
                "url": project_data.get("url", ""),
                "description": project_data.get("description", ""),
                "stars": project_data.get("stars", 0),
                "forks": project_data.get("forks", 0),
                "watchers": project_data.get("watchers", 0),
                "size": project_data.get("size", 0),
                "created_at": project_data.get("created_at", ""),
                "last_commit": project_data.get("last_commit", ""),
                "languages": languages_str,
                "license": project_data.get("license", ""),
                "topics": topics_str,
                "has_requirements_txt": project_data.get("has_requirements_txt", False),
                "has_dockerfile": project_data.get("has_dockerfile", False),
                "has_readme": project_data.get("has_readme", False),
                "readme_content": readme_summary,
                "format_instructions": self.parser.get_format_instructions()
            })
            return result
        except Exception as e:
            print(f"分析项目出错: {e}")
            return AnalysisResult(
                repo_name=project_data.get("repo_name", ""),
                activity_score=5.0,
                code_quality_score=5.0,
                tech_stack=tech_stack_list if 'tech_stack_list' in locals() else [],
                complexity_level="中等",
                maintenance_status="一般"
            )

class CategorizationAgent:
    """分类整理员智能体"""
    
    def __init__(self, llm):
        self.llm = llm
        self.parser = PydanticOutputParser(pydantic_object=CategoryResult)
    
    async def categorize_project(self, project_data: Dict[str, Any], 
                               analysis_result: AnalysisResult) -> CategoryResult:
        """对项目进行分类"""
        categorization_template = PROMPTS.get('categorization_agent', {}).get('categorization_prompt_template', 
            "请对以下项目进行分类: {repo_name}")
        prompt = ChatPromptTemplate.from_template(categorization_template)
        
        chain = prompt | self.llm | self.parser
        
        try:
            result = await chain.ainvoke({
                "repo_name": project_data.get("repo_name", ""),
                "description": project_data.get("description", ""),
                "stars": project_data.get("stars", 0),
                "forks": project_data.get("forks", 0),
                "watchers": project_data.get("watchers", 0),
                "last_commit": project_data.get("last_commit", ""),
                "languages": ", ".join(project_data.get("languages", [])) if isinstance(project_data.get("languages"), list) else project_data.get("languages", ""),
                "license": project_data.get("license", ""),
                "topics": ", ".join(project_data.get("topics", [])),
                "tech_stack": ", ".join(analysis_result.tech_stack),
                "complexity_level": analysis_result.complexity_level,
                "maintenance_status": analysis_result.maintenance_status,
                "format_instructions": self.parser.get_format_instructions()
            })
            return result
        except Exception as e:
            print(f"分类项目出错: {e}")
            return CategoryResult(
                repo_name=project_data.get("repo_name", ""),
                primary_category="其他",
                secondary_categories=[],
                tags=project_data.get("topics", [])
            )

class ReportingAgent:
    """汇总报告员智能体"""
    
    def __init__(self, llm):
        self.llm = llm
        self.parser = PydanticOutputParser(pydantic_object=ReportResult)
    
    async def generate_report(self, project_data: Dict[str, Any],
                            analysis_result: AnalysisResult,
                            category_result: CategoryResult) -> ReportResult:
        """生成项目报告"""
        report_template = PROMPTS.get('reporting_agent', {}).get('report_prompt_template', 
            "请为以下项目生成结构化报告: {repo_name}")
        prompt = ChatPromptTemplate.from_template(report_template)
        
        chain = prompt | self.llm | self.parser
        
        # 计算综合评分
        overall_score = (analysis_result.activity_score + analysis_result.code_quality_score) / 2
        star_rating = "⭐️" * min(5, max(1, int(overall_score / 2)))
        
        try:
            result = await chain.ainvoke({
                "repo_name": project_data.get("repo_name", ""),
                "url": project_data.get("url", ""),
                "description": project_data.get("description", ""),
                "stars": project_data.get("stars", 0),
                "forks": project_data.get("forks", 0),
                "watchers": project_data.get("watchers", 0),
                "activity_score": analysis_result.activity_score,
                "code_quality_score": analysis_result.code_quality_score,
                "tech_stack": ", ".join(analysis_result.tech_stack),
                "maintenance_status": analysis_result.maintenance_status,
                "primary_category": category_result.primary_category,
                "tags": ", ".join(category_result.tags),
                "format_instructions": self.parser.get_format_instructions()
            })
            return result
        except Exception as e:
            print(f"生成报告出错: {e}")
            return ReportResult(
                repo_name=project_data.get("repo_name", ""),
                rating=star_rating,
                summary=project_data.get("description", "")[:100] if project_data.get("description") else "暂无描述",
                recommendation_reason=f"基于活跃度评分{analysis_result.activity_score}和代码质量评分{analysis_result.code_quality_score}的综合推荐"
            )
    
    async def generate_summary_report(self, query: str, projects_data: List[Dict[str, Any]]) -> str:
        """生成多个项目的汇总报告"""
        summary_template = PROMPTS.get('reporting_agent', {}).get('summary_report_template', 
            "请为以下搜索查询生成项目汇总报告: {query}")
        prompt = ChatPromptTemplate.from_template(summary_template)
        
        chain = prompt | self.llm
        
        try:
            # 准备项目数据摘要
            projects_summary = []
            for project in projects_data:
                project_info = {
                    'repo_name': project.get('repo_name', ''),
                    'description': project.get('description', ''),
                    'stars': project.get('stars', 0),
                    'forks': project.get('forks', 0),
                    'languages': project.get('languages', {}),
                    'topics': project.get('topics', []),
                    'analysis_result': project.get('analysis_result', {}),
                    'category_result': project.get('category_result', {}),
                    'report_result': project.get('report_result', {})
                }
                projects_summary.append(project_info)
            
            result = await chain.ainvoke({
                "query": query,
                "projects_count": len(projects_data),
                "projects_data": json.dumps(projects_summary, ensure_ascii=False, indent=2)
            })
            
            return result.content if hasattr(result, 'content') else str(result)
            
        except Exception as e:
            logger.error(f"生成汇总报告出错: {e}")
            # 生成简单的备用报告
            fallback_report = f"# {query} 项目汇总报告\n\n"
            fallback_report += f"本次搜索共找到 {len(projects_data)} 个相关项目：\n\n"
            
            for i, project in enumerate(projects_data, 1):
                fallback_report += f"{i}. **{project.get('repo_name', '未知项目')}**\n"
                fallback_report += f"   - 描述: {project.get('description', '暂无描述')}\n"
                fallback_report += f"   - 星标数: {project.get('stars', 0)}\n"
                fallback_report += f"   - 分叉数: {project.get('forks', 0)}\n\n"
            
            return fallback_report

# 使用示例
if __name__ == "__main__":
    async def main():
        system = MultiAgentSystem()
        result = await system.process_query("LLM框架")
        # print(json.dumps(result, indent=2, ensure_ascii=False))
    
    asyncio.run(main())