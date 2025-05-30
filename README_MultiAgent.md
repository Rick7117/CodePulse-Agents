# CodePulse-Agents 多智能体系统

基于 LangChain 的多智能体 GitHub 项目搜索与分析系统

## 🚀 系统概述

本系统采用多智能体架构，通过四个专门的智能体协作完成 GitHub 项目的智能搜索、分析、分类和报告生成。

### 🤖 智能体架构

```
用户查询 → 搜索专家 → 分析员 → 分类整理员 → 汇总报告员 → 结构化结果
```

#### 1. GitHub 搜索专家 (SearchAgent)
- **职责**: 根据用户查询搜索相关 GitHub 项目
- **工具**: Google Custom Search API, GitHub API
- **输出**: 原始项目列表和基础信息

#### 2. 项目分析员 (AnalysisAgent)
- **职责**: 深度解析项目内容和技术栈
- **分析内容**:
  - README 文档解析
  - 代码结构分析
  - 依赖项识别
  - 活跃度评估
- **输出**: 详细的项目分析报告

#### 3. 分类整理员 (CategorizationAgent)
- **职责**: 项目分类和标签化
- **分类维度**:
  - 技术领域 (Web开发、AI/ML、移动开发等)
  - 项目类型 (框架、工具、库等)
  - 难度等级 (初级、中级、高级)
  - 应用场景 (企业级、学习项目、开源工具等)
- **输出**: 分类标签和元数据

#### 4. 汇总报告员 (ReportingAgent)
- **职责**: 生成最终的结构化报告
- **报告内容**:
  - 项目推荐等级 (⭐⭐⭐⭐⭐)
  - 技术栈总结
  - 适用场景分析
  - 学习价值评估
  - 风险提示
- **输出**: 用户友好的最终报告

## 📋 系统要求

- Python 3.8+
- Flask 2.3+
- LangChain 0.1+
- 有效的 OpenAI API 密钥或 DeepSeek API 密钥
- Google Custom Search API 密钥 (可选)
- GitHub API Token (可选，用于提高搜索限制)

## 🛠️ 安装与配置

### 1. 克隆项目
```bash
git clone <repository-url>
cd CodePulse-Agents
```

### 2. 安装依赖
```bash
# 安装多智能体系统依赖
pip install -r requirements_multi_agent.txt

# 或者安装原系统依赖
pip install -r requirements.txt
```

### 3. 环境配置
创建 `.env` 文件并配置以下变量：

```env
# AI 模型配置
OPENAI_API_KEY=your_openai_api_key
# 或者使用 DeepSeek
DEEPSEEK_API_KEY=your_deepseek_api_key
MODEL=deepseek-chat

# Google 搜索配置 (可选)
GOOGLE_API_KEY=your_google_api_key
GOOGLE_CSE_ID=your_custom_search_engine_id

# GitHub API 配置 (可选)
GITHUB_TOKEN=your_github_token

# 系统配置
FLASK_ENV=development
FLASK_DEBUG=True
```

## 🚀 运行系统

### 启动多智能体系统
```bash
python main_multi_agent.py
```

### 启动原系统 (兼容模式)
```bash
python main.py
```

系统将在 `http://localhost:5001` (多智能体) 或 `http://localhost:5000` (原系统) 启动。

## 📖 使用指南

### Web 界面使用
1. 打开浏览器访问 `http://localhost:5001`
2. 在搜索框中输入查询关键词
3. 点击搜索按钮，系统将自动调用多智能体流程
4. 查看搜索结果和详细分析报告

### API 接口

#### 搜索项目
```bash
POST /search
Content-Type: application/json

{
  "query": "React UI components"
}
```

#### 获取智能体状态
```bash
GET /agent_status
```

#### 查看工作流程
```bash
POST /agent_workflow
```

## 🔧 系统配置

### 智能体配置
可以在 `multi_agent_system.py` 中调整各个智能体的行为：

```python
# 搜索智能体配置
SEARCH_LIMIT = 20  # 搜索结果数量限制
SEARCH_TIMEOUT = 30  # 搜索超时时间

# 分析智能体配置
ANALYSIS_DEPTH = "detailed"  # 分析深度: basic, detailed, comprehensive
CODE_ANALYSIS_ENABLED = True  # 是否启用代码分析

# 分类智能体配置
CATEGORY_TAGS = ["web", "mobile", "ai", "devtools", "library"]  # 预设分类标签
AUTO_TAGGING = True  # 自动标签生成

# 报告智能体配置
REPORT_FORMAT = "structured"  # 报告格式: simple, structured, detailed
INCLUDE_RECOMMENDATIONS = True  # 包含推荐建议
```

## 📊 系统监控

### 日志配置
系统使用 `loguru` 进行日志管理：

```python
from loguru import logger

# 配置日志级别和输出
logger.add("logs/multi_agent_{time}.log", rotation="1 day", level="INFO")
```

### 性能监控
- 每个智能体的处理时间
- API 调用次数和响应时间
- 错误率和异常统计

## 🔍 故障排除

### 常见问题

1. **API 密钥错误**
   ```
   错误: Invalid API key
   解决: 检查 .env 文件中的 API 密钥配置
   ```

2. **搜索结果为空**
   ```
   原因: Google CSE 配置问题或查询词过于具体
   解决: 检查 Google API 配置，尝试更通用的查询词
   ```

3. **智能体响应超时**
   ```
   原因: 网络延迟或 API 限制
   解决: 增加超时时间，检查 API 使用限制
   ```

### 调试模式
启用详细日志：

```python
# 在 multi_agent_system.py 中
logging.basicConfig(level=logging.DEBUG)
```

## 🔄 系统扩展

### 添加新智能体
1. 继承 `BaseAgent` 类
2. 实现必要的方法
3. 在 `MultiAgentSystem` 中注册

```python
class CustomAgent(BaseAgent):
    def __init__(self):
        super().__init__("CustomAgent", "自定义智能体描述")
    
    async def process(self, input_data):
        # 实现处理逻辑
        return processed_data
```

### 集成新工具
1. 在相应智能体中添加工具定义
2. 实现工具函数
3. 更新智能体的工具列表

## 📈 性能优化

### 缓存策略
- 搜索结果缓存 (Redis/内存)
- 分析结果缓存
- API 响应缓存

### 并发处理
- 异步 API 调用
- 智能体并行处理
- 批量数据处理

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 创建 Pull Request

## 📄 许可证

MIT License

## 📞 支持

如有问题或建议，请创建 Issue 或联系开发团队。

---

**注意**: 本系统仍在开发中，部分功能可能需要进一步完善。建议在生产环境使用前进行充分测试。