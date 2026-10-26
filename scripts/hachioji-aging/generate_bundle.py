"""Build and check the fixed Issue #419 publication; standard library only."""
from __future__ import annotations
import argparse
import csv
import hashlib
import io
import json
import re
import unicodedata
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
HERE=Path(__file__).resolve().parent
BUNDLE="hachioji-aging-2026-10-26.r1.json"
SMALL=100
METRICS=(("age0_14","0〜14歳"),("age15_64","15〜64歳"),("age65plus","65歳以上"),("age75plus","75歳以上"),("age85plus","85歳以上"))

def require(condition,message):
    if not condition:
        raise ValueError(message)

def integer(value):
    require(isinstance(value,int) and not isinstance(value,bool) and value>=0,"missing/invalid population")
    return value

def normalize_name(value):
    value=unicodedata.normalize("NFKC",value).translate(dict.fromkeys(range(0xE0100,0xE01F0))).replace("ヶ","ケ").strip()
    return re.sub(r"([一二三四五六七八九十])丁目$",lambda m:str("一二三四五六七八九十".index(m[1])+1)+"丁目",value)

def groups_for_age(age):
    require(isinstance(age,int) and not isinstance(age,bool) and age>=0,"invalid age")
    return ("age0_14" if age<15 else "age15_64" if age<65 else "age65plus", age>=75, age>=85)

def percentage(numerator,denominator):
    integer(numerator); integer(denominator)
    require(numerator<=denominator,"numerator exceeds total")
    return None if denominator==0 else round(numerator*100/denominator,6)

def statistics(row):
    population=integer(row["population"])
    bins=row["bins"]
    require(len(bins)==21,"21 five-year bins required")
    list(map(integer,bins))
    require(sum(bins)==population,"age bins must sum to population")
    counts=dict.fromkeys([k for k,_ in METRICS],0)
    for i,value in enumerate(bins):
        group,over75,over85=groups_for_age(i*5)
        counts[group]+=value
        if over75: counts["age75plus"]+=value
        if over85: counts["age85plus"]+=value
    require(0<=counts["age85plus"]<=counts["age75plus"]<=counts["age65plus"]<=population,"nested ages")
    return dict(population=population,**counts,**{k.replace("age","share",1):percentage(v,population) for k,v in counts.items()})

def validate_inputs(data,exclusions):
    require(data["schemaVersion"]==1,"input schema")
    require([r["targetDate"] for r in data["city"]]==["2016-09-30","2026-09-30"],"city dates")
    previous=None
    for year in data["city"]:
        stats=statistics(year["city"])
        towns=year["towns"]
        require(len(towns)==199 and len({r["code"] for r in towns})==199,"199 unique towns")
        require(len({normalize_name(r["name"]) for r in towns})==199,"unique town names")
        for r in towns:
            require(bool(re.fullmatch(r"\d{5}",r["code"])),"town code")
            statistics(r)
        require(all(sum(r["bins"][i] for r in towns)==year["city"]["bins"][i] for i in range(21)),"town age totals differ")
        require(sum(r["population"] for r in towns)==stats["population"],"town population total")
        names={r["code"]:normalize_name(r["name"]) for r in towns}
        if previous is not None:
            require(names==previous,"town crosswalk mismatch")
        previous=names
    require(len(exclusions)==8 and set(exclusions).issubset(set(previous.values())),"8 named exclusions required")
    comparison=data["comparison"]
    require(comparison["targetDate"]=="2026-01-01","comparison date")
    require({r["code"] for r in comparison["rows"]}=={"13201","13202","13209","13212","13206","13205","13000","13200"} and len(comparison["rows"])==8,"comparison cities")
    for r in comparison["rows"]:
        statistics(r); require(r["unknown"]==0,"unknown ages need an explicit denominator review")

def comparison_rows(before,after):
    result=[]
    for key,label in METRICS:
        a,b=before[key],after[key]
        sa,sb=percentage(a,before["population"]),percentage(b,after["population"])
        result.append(dict(key=key,label=label,before=a,after=b,delta=b-a,shareBefore=sa,shareAfter=sb,points=None if sa is None or sb is None else round(b*100/after["population"]-a*100/before["population"],6)))
    return result

def csv_bytes(rows):
    stream=io.StringIO(newline="")
    writer=csv.DictWriter(stream,fieldnames=list(rows[0]),lineterminator="\n")
    writer.writeheader(); writer.writerows(rows)
    return stream.getvalue().encode("utf-8")

def encoded(value):
    return (json.dumps(value,ensure_ascii=False,indent=2)+"\n").encode("utf-8")

def digest(raw):
    return hashlib.sha256(raw).hexdigest()

def build(data,exclusions,retrieval):
    validate_inputs(data,exclusions)
    start,end=data["city"]
    first,last=statistics(start["city"]),statistics(end["city"])
    rows=[]
    start_by={r["code"]:r for r in start["towns"]}
    for town in end["towns"]:
        old=start_by[town["code"]]; current=statistics(town)
        excluded=normalize_name(town["name"]) in exclusions
        previous=None if excluded else statistics(old)
        eligible=not excluded and min(old["population"],town["population"])>=SMALL
        rows.append(dict(code=town["code"],name=town["name"],current=current,previous=previous,
                         comparisonEligible=eligible,smallPopulation=town["population"]<SMALL,
                         exclusion=exclusions.get(normalize_name(town["name"])),
                         points=None if previous is None or previous["share65plus"] is None or current["share65plus"] is None else round(current["age65plus"]*100/current["population"]-previous["age65plus"]*100/previous["population"],6),
                         delta65=None if previous is None else current["age65plus"]-previous["age65plus"]))
    cities=[dict(code=r["code"],name=r["name"],**statistics(r)) for r in data["comparison"]["rows"]]
    groups=[]
    for label,a,b in (("0〜14歳",first["age0_14"],last["age0_14"]),("15〜64歳",first["age15_64"],last["age15_64"]),("65〜74歳",first["age65plus"]-first["age75plus"],last["age65plus"]-last["age75plus"]),("75〜84歳",first["age75plus"]-first["age85plus"],last["age75plus"]-last["age85plus"]),("85歳以上",first["age85plus"],last["age85plus"])):
        groups.append(dict(label=label,before=a,after=b,delta=b-a,shareBefore=percentage(a,first["population"]),shareAfter=percentage(b,last["population"])))
    eligible=[r for r in rows if not r["smallPopulation"] and r["current"]["population"]>0]
    high=max(eligible,key=lambda r:r["current"]["age65plus"]/r["current"]["population"])
    low=min(eligible,key=lambda r:r["current"]["age65plus"]/r["current"]["population"])
    bundle=dict(schemaVersion=1,publishedDate="2026-10-26",cityDates=["2016-09-30","2026-09-30"],comparisonDate="2026-01-01",
                definition="住民基本台帳・日本人と外国人の合計。割合の分母は各時点・各地域の総人口。年齢不詳の集計残差は0人。",
                city=[dict(targetDate=s["targetDate"],**statistics(s["city"])) for s in data["city"]],
                metrics=comparison_rows(first,last),exclusiveGroups=groups,
                ageBins=[dict(label=f"{i*5}〜{i*5+4}歳" if i<20 else "100歳以上",before=a,after=b) for i,(a,b) in enumerate(zip(start["city"]["bins"],end["city"]["bins"]))],
                comparison=cities,regions=rows,smallPopulationThreshold=SMALL,
                regionalSummary=dict(count=199,comparable=191,changeEligible=sum(r["comparisonEligible"] for r in rows),
                                     small=[r["name"] for r in rows if r["smallPopulation"]],
                                     highest=dict(name=high["name"],**high["current"]),lowest=dict(name=low["name"],**low["current"])),
                mapDecision="不採用。2020年統計境界と対象期間の地理的対応が未解決。前作で区域変更関連8町丁を除く人口カバー率は94.41%で、事前95%基準に未達。",
                limitations=["2時点の比較であり同じ人々を追跡した統計ではない。","高齢化率だけから衰退、生活の質、医療需要、将来人口、因果関係は判断できない。","市内は9月末、市間は1月1日。両者を同じ時点として並べない。","既知の区域変更等8町丁を10年比較から除く。残る191町丁すべての境界不変を立証したものではない。"])
    manifest=dict(sources=retrieval,
       city=dict(title="町丁別年齢別人口（2016年・2026年9月末）",publisher="八王子市",license="CC BY 4.0",
                 licenseUrl="https://www.city.hachioji.tokyo.jp/contents/open/002/p005866.html",
                 attribution="出典：八王子市「町丁別年齢別人口」、CC BY 4.0。文字表記の正規化、年齢区分の集計、図表化を実施。"),
       tokyo=dict(title="住民基本台帳による東京都の世帯と人口 令和8年1月 第7表・第3-1表",publisher="東京都",
                  license="数値の事実を抽出・独自集計。東京都資料全体へのCCライセンス付与はしない。",
                  licenseUrl="https://www.toukei.metro.tokyo.lg.jp/homepage/site-policy.htm",
                  notesUrl="https://www.toukei.metro.tokyo.lg.jp/juukiy/2026/jy26qf0002.pdf",
                  attribution="出典：東京都「住民基本台帳による東京都の世帯と人口」2026年1月1日（2026年9月10日訂正版）を加工。文章・原表レイアウト・ロゴは転載しない。"),
       method=dict(ageUnknown=0,denominator="each date and area's total registered population",smallPopulationThreshold=SMALL,tokyoDash="公式利用上の注意に基づき、人数欄の - は皆無/該当数値なしとして0件。空欄や他の欠損はエラー。",
                   sourceProcessing="prepare_sources.py: 男女計、国籍計、町丁計、5歳階級/3区分、前作全199町丁、東京都第3-1表と突合。"),
       excludedTowns=exclusions,mapDecision=bundle["mapDecision"],codeVersion="scripts/hachioji-aging/generate_bundle.py r1")
    return bundle,manifest

def artifacts(input_dir):
    data=json.loads((input_dir/"normalized-inputs.json").read_text(encoding="utf-8"))
    exclusions=json.loads((input_dir/"region-exclusions.json").read_text(encoding="utf-8"))
    retrieval=json.loads((input_dir/"retrieval.json").read_text(encoding="utf-8"))
    bundle,manifest=build(data,exclusions,retrieval)
    manifest["processingHashes"]={f:digest((input_dir/f).read_bytes()) for f in ("normalized-inputs.json","region-exclusions.json","retrieval.json","generate_bundle.py","prepare_sources.py")}
    output={BUNDLE:encoded(bundle),"source-manifest.json":encoded(manifest),
            "city-ages.csv":csv_bytes([dict(targetDate=s["targetDate"],**{k:v for k,v in s.items() if k!="targetDate"}) for s in bundle["city"]]),
            "comparison-cities.csv":csv_bytes([dict(targetDate=bundle["comparisonDate"],**r) for r in bundle["comparison"]]),
            "town-ages.csv":csv_bytes([dict(code=r["code"],name=r["name"],targetDate=bundle["cityDates"][1],**r["current"],comparisonEligible=r["comparisonEligible"],points=r["points"],delta65=r["delta65"]) for r in bundle["regions"]])}
    for filename in ("normalized-inputs.json","region-exclusions.json","retrieval.json","generate_bundle.py","prepare_sources.py","README.txt"):
        output[filename]=(input_dir/filename).read_bytes()
    return output

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--check",action="store_true")
    parser.add_argument("--input-dir",type=Path,default=HERE)
    parser.add_argument("--output-dir",type=Path)
    args=parser.parse_args()
    outputs=artifacts(args.input_dir)
    if args.output_dir:
        destinations={args.output_dir/name:raw for name,raw in outputs.items()}
    else:
        destinations={ROOT/"public/data/hachioji-aging"/name:raw for name,raw in outputs.items()}
        destinations[ROOT/"app/(monetized)/labs/hachioji-aging/data"/BUNDLE]=outputs[BUNDLE]
    lock=dict(files={str(p.relative_to(ROOT)).replace("\\","/"):digest(raw) for p,raw in destinations.items()}) if not args.output_dir else None
    if lock:
        destinations[HERE/"publication.lock.json"]=encoded(lock)
    for path,raw in destinations.items():
        if args.check:
            require(path.exists() and path.read_bytes()==raw,f"stale output: {path}")
        else:
            path.parent.mkdir(parents=True,exist_ok=True); path.write_bytes(raw)
    print(f"Aging publication: {len(destinations)} files {'checked' if args.check else 'generated'}")

if __name__=="__main__":
    main()
