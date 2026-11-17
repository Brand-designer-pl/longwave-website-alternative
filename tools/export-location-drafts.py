"""Read only the catalogue fields of production drafts; never copy the database."""
import argparse,json,subprocess,importlib.util
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('catalogue',ROOT/'tools/sync-offers.py');catalogue=importlib.util.module_from_spec(spec);spec.loader.exec_module(catalogue)
p=argparse.ArgumentParser();p.add_argument('--identity',required=True,type=Path);p.add_argument('--known-hosts',type=Path);args=p.parse_args()
command=['ssh','-i',str(args.identity),'-p','222','-o','IdentitiesOnly=yes','-o','BatchMode=yes','-o','ConnectTimeout=15']
if args.known_hosts:command+=['-o','UserKnownHostsFile='+str(args.known_hosts)]
command+=['lamitool@s26.cyber-folks.pl','python3 -']
query='''import sqlite3,json,datetime
c=sqlite3.connect('file:/home/lamitool/longwave-private/longwave.sqlite3?mode=ro',uri=True);c.row_factory=sqlite3.Row
fields='id,title,place,category,active,start_date,end_date,price,promo_price,age_min,age_max,age_unrestricted,image,terms,price_variants'
items=[]
for row in c.execute('select '+fields+' from offers where active=0 and archived=0 and deleted=0'):
 o=dict(row);o['terms']=[{k:t[k] for k in ('id','start_date','end_date')} for t in json.loads(o['terms'])];items.append(o)
print(json.dumps(dict(exportedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),offers=items),ensure_ascii=False))
'''
data=json.loads(subprocess.run(command,input=query,text=True,capture_output=True,check=True,timeout=45).stdout)
data['offers']=[o for o in data['offers'] if catalogue.location(o['place'])]
# Validate before replacing the last successful, deliberately limited snapshot.
catalogue.normalize(data['offers'],draft=True)
target=ROOT/'sources/location-drafts.json';temporary=target.with_suffix('.tmp')
temporary.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n');temporary.replace(target)
print(f"Exported {len(data['offers'])} destination drafts; no customer or booking data.")
