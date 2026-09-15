import re

emoji_pattern = re.compile(r'[\U00010000-\U0010ffff\u2600-\u27bf\u2300-\u23ff\u2b50-\u2b55\u200d]')
with open(r'c:\Users\nttga\OneDrive\Documents\Desktop\Sahayata\Frontend\src\App.jsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

with open('app_emojis.txt', 'w', encoding='utf-8') as out:
    for idx, line in enumerate(lines):
        if emoji_pattern.search(line):
            out.write(f"L{idx+1}: {line.strip()}\n")
print('Saved app_emojis.txt')
