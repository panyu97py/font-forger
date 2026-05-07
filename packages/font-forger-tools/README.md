```bash
pex fonttools brotli zopfli -o pyftsubset.pex -m fontTools.subset
```

```python pyftschars.py
from fontTools.ttLib import TTFont
import sys

font = TTFont(sys.argv[1], lazy=True)

print(''.join(chr(cp) for cp in font.getBestCmap().keys()))
```

```bash
pex fonttools -D . -m pyftschars -o pyftschars.pex
```
