import urllib.request
import json
import re

res = urllib.request.urlopen('http://localhost:3000')
html = res.read().decode('utf-8', errors='replace')

# Try to find JSON error data
m = re.search(r'"err":\{([^}]{0,600})', html)
if m:
    print("ERROR BLOCK:", m.group(1))
else:
    # Look for any error text
    m2 = re.search(r'(Cannot|Error|error)[^\n<]{0,300}', html)
    if m2:
        print("ERROR TEXT:", m2.group(0))
    else:
        print("STATUS: probably OK or different error")
        print("HTML snippet:", html[500:1000])
