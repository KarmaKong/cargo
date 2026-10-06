import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const domain='https://cargoirantruck.com';
const mainDomain='https://chinairantrucks.com';
const uniqueSlugs=new Set(['aprin','chemicals','damage-claims','mashhad','packing','textiles','tracking','winter-trucking']);
const articleRoots=['articles','en/articles','zh/articles'];
const checkOnly=process.argv.includes('--check');
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?walk(path.join(dir,entry.name)):[path.join(dir,entry.name)]);
const routeFor=file=>{
  const rel=path.relative(root,file).replaceAll(path.sep,'/');
  if(rel==='index.html')return '/';
  if(rel.endsWith('/index.html'))return '/'+rel.slice(0,-'index.html'.length);
  return '/'+rel;
};
const articleInfo=file=>{
  const rel=path.relative(root,file).replaceAll(path.sep,'/');
  const match=rel.match(/^(?:en\/|zh\/)?articles\/([^/]+)\/index\.html$/);
  return match?{slug:match[1],duplicate:!uniqueSlugs.has(match[1])}:null;
};
const setRobots=(html,content)=>{
  html=html.replace(/\s*<meta\s+name=["']robots["'][^>]*>/gi,'');
  return html.replace(/(<meta\s+name=["']viewport["'][^>]*>)/i,`$1\n<meta name="robots" content="${content}">`);
};
const setCanonical=(html,url)=>html.replace(/<link\s+rel=["']canonical["'][^>]*>/i,`<link rel="canonical" href="${url}">`);

const htmlFiles=walk(root).filter(file=>file.endsWith('.html')&&!file.includes(`${path.sep}.git${path.sep}`));
for(const file of htmlFiles){
  const route=routeFor(file),info=articleInfo(file);
  let html=fs.readFileSync(file,'utf8'),next=html;
  if(info?.duplicate){
    next=setRobots(next,'noindex,follow');
    next=setCanonical(next,mainDomain+route);
    next=next.replace(/\s*<link\s+rel=["']alternate["'][^>]*>/gi,'');
  }
  if(/(^|\/)404(?:\/index)?\.html$/.test(path.relative(root,file).replaceAll(path.sep,'/'))){
    next=setRobots(next,'noindex');
    next=next.replace(/\s*<link\s+rel=["'](?:canonical|alternate)["'][^>]*>/gi,'');
  }
  if(next!==html){
    if(checkOnly)throw new Error(`SEO boundary is not applied: ${path.relative(root,file)}`);
    fs.writeFileSync(file,next);
  }
}

for(const articleRoot of articleRoots){
  const file=path.join(root,articleRoot,'index.html');
  const html=fs.readFileSync(file,'utf8');
  const next=html.replace(/<a class="way-row" href="([^"]+)">[\s\S]*?<\/a>/g,(card,href)=>{
    const slug=href.match(/\/articles\/([^/]+)\//)?.[1];
    return uniqueSlugs.has(slug)?card:'';
  });
  if(next!==html){
    if(checkOnly)throw new Error(`Article index contains duplicate topics: ${path.relative(root,file)}`);
    fs.writeFileSync(file,next);
  }
}

for(const relative of ['en/index.html','zh.html']){
  const file=path.join(root,relative),html=fs.readFileSync(file,'utf8');
  const responsiveHero='<img src="/assets/site/hero-xinjiang.jpg" srcset="/assets/site/hero-xinjiang-800.jpg 800w, /assets/site/hero-xinjiang.jpg 1672w" sizes="(max-width: 760px) 100vw, 60vw" width="1672" height="941"';
  const next=html.includes(responsiveHero)?html:html.replace(/<img src="\/assets\/site\/hero-xinjiang\.jpg"(?: width="1672" height="941")?/,responsiveHero);
  if(next!==html){
    if(checkOnly)throw new Error(`Hero dimensions are not applied: ${relative}`);
    fs.writeFileSync(file,next);
  }
}

const sitemapRoutes=htmlFiles.flatMap(file=>{
  const rel=path.relative(root,file).replaceAll(path.sep,'/'),route=routeFor(file),info=articleInfo(file);
  const html=fs.readFileSync(file,'utf8');
  if(rel==='404.html'||rel.includes('/404/')||rel.startsWith('google')||/<meta\s+http-equiv=["']refresh["']/i.test(html)||info?.duplicate)return [];
  return [route];
}).sort();
const sitemap='<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+sitemapRoutes.map(route=>`  <url><loc>${domain}${route}</loc></url>`).join('\n')+'\n</urlset>\n';
const currentSitemap=fs.readFileSync(path.join(root,'sitemap.xml'),'utf8');
if(currentSitemap!==sitemap){
  if(checkOnly)throw new Error('sitemap.xml does not match the indexable URL set');
  fs.writeFileSync(path.join(root,'sitemap.xml'),sitemap);
}

for(const articleRoot of articleRoots){
  const html=fs.readFileSync(path.join(root,articleRoot,'index.html'),'utf8');
  const links=[...html.matchAll(/<a class="way-row" href="[^"]*\/articles\/([^/]+)\//g)].map(match=>match[1]);
  if(links.length!==uniqueSlugs.size||links.some(slug=>!uniqueSlugs.has(slug)))throw new Error(`Unexpected article index boundary: ${articleRoot}`);
}
for(const file of htmlFiles){
  const route=routeFor(file),info=articleInfo(file),html=fs.readFileSync(file,'utf8');
  if(info?.duplicate){
    if(!/<meta\s+name="robots"\s+content="noindex,follow">/i.test(html))throw new Error(`Missing noindex: ${route}`);
    if(!html.includes(`<link rel="canonical" href="${mainDomain+route}">`))throw new Error(`Wrong canonical: ${route}`);
  }
}
for(const relative of ['en/index.html','zh.html']){
  const html=fs.readFileSync(path.join(root,relative),'utf8');
  if(!html.includes('srcset="/assets/site/hero-xinjiang-800.jpg 800w, /assets/site/hero-xinjiang.jpg 1672w"'))throw new Error(`Missing responsive hero: ${relative}`);
}
console.log(`PASS: ${sitemapRoutes.length} indexable URLs; ${uniqueSlugs.size} unique article topics per language; duplicate articles noindex with main-site canonical.`);
