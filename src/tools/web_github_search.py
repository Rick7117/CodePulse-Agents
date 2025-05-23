import os 
import requests
from dotenv import load_dotenv
import base64
import json
import tiktoken


def google_search(query, num_results=10, site_url=None):
    
    api_key = os.getenv("GOOGLE_SEARCH_API_KEY")
    cse_id = os.getenv("CSE_ID")
    
    url = "https://www.googleapis.com/customsearch/v1"

    # API 请求参数
    if site_url == None:
        params = {
        'q': query,          
        'key': api_key,      
        'cx': cse_id,        
        'num': num_results   
        }
    else:
        params = {
        'q': query,         
        'key': api_key,      
        'cx': cse_id,        
        'num': num_results,  
        'siteSearch': site_url
        }

    # 发送请求
    response = requests.get(url, params=params)
    response.raise_for_status()

    # 解析响应
    search_results = response.json().get('items', [])

    # 提取所需信息
    results = [{
        'title': item['title'],
        'link': item['link'],
        'snippet': item['snippet']
    } for item in search_results]

    return results

def windows_compatible_name(s, max_length=255):
    """
    将字符串转化为符合Windows文件/文件夹命名规范的名称。
    
    参数:
    - s (str): 输入的字符串。
    - max_length (int): 输出字符串的最大长度，默认为255。
    
    返回:
    - str: 一个可以安全用作Windows文件/文件夹名称的字符串。
    """

    # Windows文件/文件夹名称中不允许的字符列表
    forbidden_chars = ['<', '>', ':', '"', '/', '\\', '|', '?', '*']

    # 使用下划线替换不允许的字符
    for char in forbidden_chars:
        s = s.replace(char, '_')

    # 删除尾部的空格或点
    s = s.rstrip(' .')

    # 检查是否存在以下不允许被用于文档名称的关键词，如果有的话则替换为下划线
    reserved_names = ["CON", "PRN", "AUX", "NUL", "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9", 
                      "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9"]
    if s.upper() in reserved_names:
        s += '_'

    # 如果字符串过长，进行截断
    if len(s) > max_length:
        s = s[:max_length]

    return s

def get_github_readme(dic):
    
    github_token = os.getenv('GITHUB_TOKEN')
    user_agent = os.getenv('search_user_agent')
    
    owner = dic['owner']
    repo = dic['repo']

    headers = {
        "Authorization": github_token,
        "User-Agent": user_agent
    }

    response = requests.get(f"https://api.github.com/repos/{owner}/{repo}/readme", headers=headers)

    readme_data = response.json()
    encoded_content = readme_data.get('content', '')
    decoded_content = base64.b64decode(encoded_content).decode('utf-8')
    
    return decoded_content

def extract_github_repos(search_results):
    # 使用列表推导式筛选出项目主页链接
    repo_links = [result['link'] for result in search_results if '/issues/' not in result['link'] and '/blob/' not in result['link'] and 'github.com' in result['link'] and len(result['link'].split('/')) == 5]

    # 从筛选后的链接中提取owner和repo
    repos_info = [{'owner': link.split('/')[3], 'repo': link.split('/')[4]} for link in repo_links]

    return repos_info

def get_search_text_github(q, dic):
    
    title = dic['owner'] + '_' + dic['repo']
    title = windows_compatible_name(title)

    # 创建问题答案正文
    text = get_github_readme(dic)

    # 写入本地json文件
    encoding = tiktoken.encoding_for_model("gpt-3.5-turbo")     
    json_data = {
            "title": title,
            "content": text,
            "tokens": len(encoding.encode(text))
        }
    
    # 自动创建目录，如果不存在的话
    dir_path = f'../auto_search/{q}'
    os.makedirs(dir_path, exist_ok=True)
    
    with open('../auto_search/%s/%s.json' % (q, title), 'w') as f:
        json.dump(json_data, f)

    return title

def get_answer_github(q):
    """
    当你无法回答某个问题时，调用该函数，能够获得答案
    :param q: 必选参数，询问的问题，字符串类型对象
    :return：某问题的答案，以字符串形式呈现
    """
    # 调用转化函数，将用户的问题转化为更适合在GitHub上搜索的关键词
    # q = convert_keyword_github(q)
    
    # 默认搜索返回5个答案
    print('正在接入谷歌搜索，查找和问题相关的答案...')
    search_results = google_search(query=q, num_results=5, site_url='https://github.com/')
    results = extract_github_repos(search_results)

    # 创建对应问题的子文件夹
    folder_path = '../auto_search/%s' % q
    if not os.path.exists(folder_path):
        os.makedirs(folder_path)
    
    print('正在读取搜索的到的相关答案...')
    num_tokens = 0
    content = ''
    
    for dic in results:
        title = get_search_text_github(q, dic)
        with open('../auto_search/%s/%s.json' % (q, title), 'r') as f:
            jd = json.load(f)
        num_tokens += jd['tokens']
        if num_tokens <= 12000:
            content += jd['content']
        else:
            break
    print('正在进行最后的整理...')
    return(content)

if __name__ == "__main__":
    load_dotenv()
    results = get_answer_github('Slay the spire')
    print(results)