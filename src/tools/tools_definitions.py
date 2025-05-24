from .web_github_search import get_answer_github
from dotenv import load_dotenv

get_answer_github_tool = {
    "type": "function",
    "function": {
        "name": "get_answer_github",
        "description": (
            "GitHub联网搜索工具，当用户提出的问题超出你的知识库范畴时，或该问题你不知道答案的时候，请调用该函数来获得问题的答案。该函数会自动从GitHub上搜索得到问题相关文本，而后你可围绕文本内容进行总结，并回答用户提问。需要注意的是，当用户提问点名要求在GitHub进行搜索时，例如“请帮我介绍下GitHub上的Qwen2项目”，此时请调用该函数，其他情况下请调用get_answer外部函数并进行回答。"
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "q": {
                    "type": "string",
                    "description": "一个满足GitHub搜索格式的问题，往往是需要从用户问题中提出一个适合搜索的项目关键词，用字符串形式进行表示。",
                    "example": "DeepSeek-R1"
                },
                "g": {
                    "type": "string",
                    "description": "Global environment variables, default to globals().",
                    "default": "globals()"
                }
            },
            "required": ["q"]
        }
    }
}

tools = [get_answer_github_tool]

available_functions = {
    "get_answer_github": get_answer_github,
}
