# 生成 PEX 文件

`pex/` 目录下包含一些用于字体处理的 Python 可执行文件（PEX），用于快速运行字体相关工具，无需单独安装环境。

---

## 安装 PEX

```bash
pip install pex
```

## 生成 pyftsubset.pex

用于字体子集化（裁剪字体，只保留指定字符）。

### 构建 PEX

```bash
pex fonttools brotli zopfli -o pyftsubset.pex -m fontTools.subset
```

### 依赖说明
* `fonttools`：字体处理核心库
* `brotli`：提供 WOFF2 压缩支持
* `zopfli`：更高压缩率的 gzip 实现

### 使用方式
```bash
python ./pyftsubset.pex font.ttf --text="Hello World" --output-file=subset.ttf
```



## 生成 pyftschars.pex

用于读取字体文件中包含的所有字符。

### 创建 pyftschars.py

```python pyftschars.py
from fontTools.ttLib import TTFont

import sys

font = TTFont(sys.argv[1], lazy=True)

print(''.join(chr(cp) for cp in font.getBestCmap().keys()))
```

### 构建 PEX

```bash
pex fonttools -D . -m pyftschars -o pyftschars.pex
```

### 使用方式

```bash
python ./pyftschars.pex ./font.ttf
```
