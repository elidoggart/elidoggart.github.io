from html.parser import HTMLParser
from pathlib import Path
import sys
class Parser(HTMLParser):
 def __init__(self):super().__init__();self.nodes=[]
 def handle_starttag(self,t,a):
  # Loading/decoding scheduling intentionally changed after the migration.
  # Keep every content, sizing, accessibility and structural attribute exact.
  if t=='img':a=[(k,v) for k,v in a if k not in ('loading','decoding')]
  self.nodes.append(('open',t,sorted(a)))
 def handle_endtag(self,t):self.nodes.append(('end',t))
 def handle_startendtag(self,t,a):self.handle_starttag(t,a);self.handle_endtag(t)
 def handle_data(self,d):self.nodes.append(('text',d))
a,b=Parser(),Parser();a.feed(Path(sys.argv[1]).read_text());b.feed(Path(sys.argv[2]).read_text())
assert a.nodes==b.nodes,'Parsed HTML changed: text, structure, attributes, assets or IDs differ.'
print(f'Content/structure parity: {len(a.nodes)} parsed nodes (image scheduling excluded)')
