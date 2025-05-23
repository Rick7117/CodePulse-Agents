import argparse
import subprocess
import os
import sys
from pathlib import Path

def _find_drawio_executable():
    """
    尝试在常见的安装路径和 PATH 环境变量中查找 Drawio 可执行文件。
    """
    # 常见的 Drawio 安装路径 (跨平台)
    common_paths = [
        '/Applications/draw.io.app/Contents/MacOS/draw.io',  # macOS
        'C:\\Program Files\\draw.io\\draw.io.exe',      # Windows
        '/usr/bin/drawio',                                  # Linux/macOS (PATH)
        '/usr/local/bin/drawio'                             # Linux/macOS (PATH)
    ]

    # 检查 PATH 环境变量
    # 检查常见的安装路径
    for path in common_paths:
        if Path(path).exists():
            print(f"在常见路径中找到 Drawio 可执行文件: {path}")
            return path

    # 检查 PATH 环境变量
    for path_dir in os.environ.get('PATH', '').split(os.pathsep):
        executable_path = os.path.join(path_dir, 'drawio')
        if os.path.isfile(executable_path) and os.access(executable_path, os.X_OK):
            print(f"在 PATH 中找到 Drawio 可执行文件: {executable_path}")
            return executable_path

    print("未找到 Drawio 可执行文件。请确保 Drawio 桌面应用已安装且 'drawio' 命令已添加到系统 PATH 中，或位于常见的安装路径下。")
    return None

def convert_xml_to_drawio(input_xml_path, output_format='drawio', output_path=None):
    """
    将特定格式的 XML 文件转换为 Drawio 图形并导出。

    Args:
        input_xml_path (str): 输入 XML 文件的路径。
        output_format (str): 输出格式 ('drawio', 'pdf', 'png')。
        output_path (str, optional): 输出文件的路径。如果为 None，则默认为输入文件同名但扩展名不同的文件。

    Returns:
        str: 输出文件的路径。
    """
    if not os.path.exists(input_xml_path):
        print(f"错误：输入文件不存在 - {input_xml_path}")
        return None

    # 确定输出文件路径
    if output_path is None:
        base, _ = os.path.splitext(input_xml_path)
        output_path = f"{base}.{output_format}"

    # TODO: 根据特定的输入 XML 格式解析内容并生成 Drawio 兼容的 XML 字符串
    # 这部分需要根据实际的输入 XML 结构来实现。
    # 假设我们已经有了 Drawio 格式的 XML 内容，存储在 drawio_xml_content 变量中
    drawio_xml_content = "" # Placeholder for generated Drawio XML

    # 将生成的 Drawio XML 内容写入一个临时文件，或者直接传递给 Drawio 命令行工具
    # 对于简单的转换，直接使用 Drawio 命令行工具导出可能是最直接的方式。
    # Drawio 命令行工具 (drawio) 需要安装并添加到 PATH 中。
    # 示例命令: drawio --export --format pdf --output output.pdf input.drawio

    # 注意：直接从任意 XML 生成 Drawio XML 需要深入理解 Drawio 的 mxGraphModel 格式。
    # 更实际的方法可能是：
    # 1. 将输入 XML 转换为一个中间格式。
    # 2. 编写代码将中间格式转换为 Drawio XML。
    # 3. 使用 Drawio 命令行工具导出。

    # 假设我们已经将输入 XML 转换并保存为临时的 .drawio 文件
    temp_drawio_path = f"{input_xml_path}.temp.drawio"
    with open(temp_drawio_path, 'w', encoding='utf-8') as f:
        # 在这里写入实际生成的 Drawio XML 内容
        # 为了示例，我们假设输入 XML 就是 Drawio XML
        with open(input_xml_path, 'r', encoding='utf-8') as infile:
             drawio_xml_content = infile.read()
        f.write(drawio_xml_content)

    # 根据输出格式决定是直接写入文件还是使用 Drawio 命令行工具导出
    if output_format == 'drawio':
        try:
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(drawio_xml_content)
            print(f"内容写入文件成功: {output_path}")
            os.remove(temp_drawio_path)
            return output_path
        except Exception as e:
            print(f"写入文件失败：{e}")
            os.remove(temp_drawio_path)
            return None
    else:
        # 使用 Drawio 命令行工具进行导出 (pdf, png)
        # 查找 Drawio 可执行文件路径
        drawio_executable = _find_drawio_executable()

        if not drawio_executable:
            os.remove(temp_drawio_path)
            return None

        # 使用找到的可执行文件路径构建命令
        command = [
            drawio_executable,
            '--export',
            '--crop', # 添加裁剪参数
            f'--format', output_format,
            f'--output', output_path,
            temp_drawio_path
        ]

        try:
            print(f"执行导出命令: {' '.join(command)}")
            result = subprocess.run(command, capture_output=True, text=True, check=True)
            print("导出成功！")
            print("标准输出:", result.stdout)
            print("标准错误:", result.stderr)

            os.remove(temp_drawio_path)
            return output_path

        except FileNotFoundError:
            print("错误：找不到 'drawio' 命令。请确保 Drawio 桌面应用已安装且 'drawio' 命令已添加到系统 PATH 中。")
            os.remove(temp_drawio_path)
            return None
        except subprocess.CalledProcessError as e:
            print(f"导出失败：{e}")
            print("标准输出:", e.stdout)
            print("标准错误:", e.stderr)
            os.remove(temp_drawio_path)
            return None
        except Exception as e:
            print(f"发生未知错误：{e}")
            os.remove(temp_drawio_path)
            return None

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='将特定 XML 文件转换为 Drawio 图形并导出。')
    parser.add_argument('input_xml_path', help='输入 XML 文件的路径。')
    parser.add_argument('--format', dest='output_format', default='drawio', choices=['drawio', 'pdf', 'png'],
                        help='输出格式 (默认为 drawio)。')
    parser.add_argument('--output', dest='output_path', help='输出文件的路径 (默认为输入文件同名但扩展名不同)。')

    args = parser.parse_args()

    output_file = convert_xml_to_drawio(args.input_xml_path, args.output_format, args.output_path)

    if output_file:
        print(f"转换完成，输出文件位于: {output_file}")
    else:
        print("转换失败。")